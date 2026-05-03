import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail, subscriptionReceiptEmail } from '@/lib/email'
import { normalizeEmailLocale, subscriptionReceiptI18n } from '@/lib/email-i18n'
import { notify } from '@/lib/notifications'
import { ensureClientMasterContract } from '@/lib/contracts'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const DASHBOARD_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_BASIC_PRICE_ID   || 'price_basic']:   'BASIC',
  [process.env.STRIPE_MID_PRICE_ID     || 'price_mid']:     'MID',
  [process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium']: 'PREMIUM',
}

const VALID_PLANS = ['STARTER', 'BASIC', 'MID', 'PREMIUM'] as const
type Plan = typeof VALID_PLANS[number]

function resolvePlan(priceId: string | undefined | null, fallback: string): Plan {
  if (!priceId) return (fallback as Plan) || 'BASIC'
  const mapped = PRICE_TO_PLAN[priceId]
  return (mapped && VALID_PLANS.includes(mapped as Plan)) ? mapped as Plan : (fallback as Plan) || 'BASIC'
}

async function findUserByCustomerId(customerId: string) {
  return prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = headers().get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ═══════════════════════════════════════════════════════════
      // SUBSCRIPTIONS
      // ═══════════════════════════════════════════════════════════

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const customerId = session.customer as string | null
        const subscriptionId = session.subscription as string | null
        if (!customerId || !subscriptionId) {
          console.warn('[Stripe] checkout.session.completed missing customer or subscription', session.id)
          break
        }
        const user = await findUserByCustomerId(customerId)
        if (!user) break

        const sub = await getStripe().subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price?.id
        const plan = resolvePlan(priceId, user.subscriptionPlan as string)

        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: plan, subscriptionStatus: 'active' },
        })
        await ensureClientMasterContract({ userId: user.id, plan, ownerName: user.name })
        break
      }

      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const user = await findUserByCustomerId(customerId)
        if (!user) break

        const priceId = sub.items.data[0]?.price?.id
        const plan = resolvePlan(priceId, user.subscriptionPlan as string)

        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: plan, subscriptionStatus: sub.status },
        })
        await ensureClientMasterContract({ userId: user.id, plan, ownerName: user.name })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const user = await findUserByCustomerId(customerId)
        if (!user) break

        const priceId = sub.items.data[0]?.price?.id
        const plan = resolvePlan(priceId, user.subscriptionPlan as string)

        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: plan, subscriptionStatus: sub.status },
        })
        await ensureClientMasterContract({ userId: user.id, plan, ownerName: user.name })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const user = await findUserByCustomerId(sub.customer as string)
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionPlan: 'STARTER', subscriptionStatus: 'cancelled' },
          })
          await ensureClientMasterContract({ userId: user.id, plan: 'STARTER', ownerName: user.name })
        }
        break
      }

      case 'customer.subscription.paused': {
        const sub = event.data.object as Stripe.Subscription
        const user = await findUserByCustomerId(sub.customer as string)
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'paused' },
          })
        }
        break
      }

      case 'customer.subscription.resumed': {
        const sub = event.data.object as Stripe.Subscription
        const user = await findUserByCustomerId(sub.customer as string)
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'active' },
          })
        }
        break
      }

      // ═══════════════════════════════════════════════════════════
      // INVOICES & PAYMENTS
      // ═══════════════════════════════════════════════════════════

      case 'invoice.payment_succeeded': {
        const stripeInvoice = event.data.object as Stripe.Invoice
        const customerId = stripeInvoice.customer as string
        const subscriptionId = (stripeInvoice as any).subscription as string | null
        const amountPaid = (stripeInvoice.amount_paid ?? 0) / 100
        const currency = (stripeInvoice.currency ?? 'eur').toUpperCase()
        const periodStart = stripeInvoice.period_start ? new Date(stripeInvoice.period_start * 1000).toISOString() : new Date().toISOString()
        const periodEnd   = stripeInvoice.period_end   ? new Date(stripeInvoice.period_end   * 1000).toISOString() : new Date().toISOString()

        if (amountPaid <= 0) break

        const user = await findUserByCustomerId(customerId)
        if (!user) { console.warn(`No user for customer ${customerId}`); break }

        let planName: Plan = (user.subscriptionPlan as Plan) ?? 'BASIC'
        if (subscriptionId) {
          try {
            const sub = await getStripe().subscriptions.retrieve(subscriptionId)
            planName = resolvePlan(sub.items.data[0]?.price?.id, planName)
          } catch { /* subscription may be deleted */ }
        }

        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
        const { generateReceiptNumber, vatFromTotal } = await import('@/lib/receipts')
        const vat = vatFromTotal(amountPaid)

        const receipt = await prisma.paymentReceipt.create({
          data: {
            receiptNumber: await generateReceiptNumber(),
            type: 'SUBSCRIPTION',
            clientId: user.id,
            createdById: admin?.id ?? user.id,
            description: `HostMasters ${planName} — ${new Date(periodStart).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
            grossAmount: vat.net,
            netAmount: vat.net,
            vatRate: vat.rate,
            vatAmount: vat.vat,
            totalAmount: vat.total,
            currency,
            status: 'PAID',
            isAutoGenerated: true,
            paidAt: new Date(),
            paymentMethod: 'STRIPE_CARD',
            stripePaymentIntentId: (stripeInvoice as any).payment_intent as string ?? undefined,
            notes: `Stripe invoice ${stripeInvoice.id}`,
          },
        })

        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: planName, subscriptionStatus: 'active' },
        })
        await ensureClientMasterContract({
          userId: user.id,
          plan: planName as 'STARTER' | 'BASIC' | 'MID' | 'PREMIUM',
          ownerName: user.name,
        })

        if (user.email) {
          const userLocale = normalizeEmailLocale(user.language)
          sendEmail({
            to: user.email,
            subject: subscriptionReceiptI18n.subject(userLocale, planName),
            html: subscriptionReceiptEmail({
              clientName: user.name || user.email,
              plan: planName,
              amount: amountPaid,
              currency,
              periodStart,
              periodEnd,
              invoiceId: receipt.id,
              dashboardUrl: `${DASHBOARD_URL}/client/payouts`,
              locale: userLocale,
            }),
          }).catch(e => console.error('Subscription email error:', e))
        }
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const user = await findUserByCustomerId(inv.customer as string)
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'past_due' },
          })
          notify({
            userId: user.id,
            type: 'GENERAL',
            title: 'Payment failed',
            body: 'Your subscription payment could not be processed. Please update your payment method.',
            link: '/client/plan',
          }).catch(() => {})
        }
        break
      }

      case 'invoice.payment_action_required': {
        const inv = event.data.object as Stripe.Invoice
        const user = await findUserByCustomerId(inv.customer as string)
        if (user) {
          notify({
            userId: user.id,
            type: 'GENERAL',
            title: 'Action required for payment',
            body: 'Your bank requires additional verification (3D Secure). Please complete the payment.',
            link: (inv as any).hosted_invoice_url || '/client/plan',
          }).catch(() => {})
        }
        break
      }

      // ═══════════════════════════════════════════════════════════
      // CUSTOMER
      // ═══════════════════════════════════════════════════════════

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        if (customer.email) {
          // Only claim users that don't already have a Stripe customer.
          // Prevents overwriting an existing linkage when two users share email.
          await prisma.user.updateMany({
            where: { email: customer.email, stripeCustomerId: null },
            data: { stripeCustomerId: customer.id },
          })
        }
        break
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer
        if (customer.id) {
          const user = await findUserByCustomerId(customer.id)
          if (user && customer.email && customer.email !== user.email) {
            console.log(`[Stripe] Customer ${customer.id} email changed: ${user.email} → ${customer.email}`)
          }
        }
        break
      }

      // ═══════════════════════════════════════════════════════════
      // STRIPE CONNECT
      // ═══════════════════════════════════════════════════════════

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const user = await prisma.user.findFirst({ where: { stripeConnectId: account.id } })
        if (user) {
          const ready = account.charges_enabled && account.payouts_enabled
          console.log(`[Stripe Connect] Account ${account.id} (${user.email}): ready=${ready}, charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`)
          if (ready) {
            notify({
              userId: user.id,
              type: 'GENERAL',
              title: 'Stripe account ready',
              body: 'Your Stripe account is verified and ready to receive payouts.',
              link: user.role === 'CREW' ? '/crew' : '/manager/profile',
            }).catch(() => {})
          }
        }
        break
      }

      case 'account.application.deauthorized': {
        const account = event.data.object as unknown as { id: string }
        const user = await prisma.user.findFirst({ where: { stripeConnectId: account.id } })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeConnectId: null },
          })
          console.warn(`[Stripe Connect] Account ${account.id} deauthorized by ${user.email}`)

          const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
          for (const admin of admins) {
            notify({
              userId: admin.id,
              type: 'AI_ALERT',
              title: `Connect account disconnected: ${user.name || user.email}`,
              body: `${user.role} ${user.name || user.email} disconnected their Stripe account. Payouts to this user are suspended.`,
              link: '/team',
            }).catch(() => {})
          }
        }
        break
      }

      case 'transfer.created':
      case 'transfer.updated': {
        const transfer = event.data.object as Stripe.Transfer
        console.log(`[Stripe Connect] Transfer ${transfer.id}: amount=${transfer.amount / 100} EUR, destination=${transfer.destination}, reversed=${transfer.reversed}`)

        if (transfer.metadata?.crewPayoutId) {
          await prisma.crewPayout.update({
            where: { id: transfer.metadata.crewPayoutId },
            data: { stripeTransferId: transfer.id, status: transfer.reversed ? 'FAILED' : 'PROCESSING' },
          }).catch(() => {})
        }
        if (transfer.metadata?.managerPayoutId) {
          await prisma.managerPayout.update({
            where: { id: transfer.metadata.managerPayoutId },
            data: { stripeTransferId: transfer.id },
          }).catch(() => {})
        }
        break
      }

      case 'transfer.reversed': {
        const transfer = event.data.object as Stripe.Transfer
        console.error(`[Stripe Connect] Transfer REVERSED: ${transfer.id}, amount=${transfer.amount / 100} EUR`)

        if (transfer.metadata?.crewPayoutId) {
          await prisma.crewPayout.update({
            where: { id: transfer.metadata.crewPayoutId },
            data: { status: 'FAILED', failedReason: 'Transfer reversed by Stripe' },
          }).catch(() => {})
        }

        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
        for (const admin of admins) {
          notify({
            userId: admin.id,
            type: 'AI_ALERT',
            title: 'Transfer reversed',
            body: `Transfer ${transfer.id} of €${(transfer.amount / 100).toFixed(2)} was reversed. Check the connected account.`,
            link: '/payouts',
          }).catch(() => {})
        }
        break
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout
        console.log(`[Stripe Connect] Payout arrived: ${payout.id}, amount=${(payout.amount / 100).toFixed(2)} ${payout.currency}`)
        break
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout
        console.error(`[Stripe Connect] Payout FAILED: ${payout.id}, reason=${payout.failure_code}/${payout.failure_message}`)

        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
        for (const admin of admins) {
          notify({
            userId: admin.id,
            type: 'AI_ALERT',
            title: 'Payout to bank failed',
            body: `Payout ${payout.id} failed: ${payout.failure_message || payout.failure_code || 'Unknown error'}. The connected account may need to update their bank details.`,
            link: '/team',
          }).catch(() => {})
        }
        break
      }

      // ═══════════════════════════════════════════════════════════
      // DISPUTES & REFUNDS
      // ═══════════════════════════════════════════════════════════

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        console.error(`[Stripe] DISPUTE CREATED: ${dispute.id}, amount=${(dispute.amount / 100).toFixed(2)}, reason=${dispute.reason}`)

        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
        for (const admin of admins) {
          notify({
            userId: admin.id,
            type: 'AI_ALERT',
            title: 'CHARGEBACK — Immediate action required',
            body: `Dispute ${dispute.id} for €${(dispute.amount / 100).toFixed(2)} (${dispute.reason}). Respond within the deadline to avoid automatic loss.`,
            link: '/payouts',
          }).catch(() => {})
        }
        break
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute
        console.log(`[Stripe] Dispute closed: ${dispute.id}, status=${dispute.status}`)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log(`[Stripe] Charge refunded: ${charge.id}, amount_refunded=${(charge.amount_refunded / 100).toFixed(2)}`)

        if (charge.payment_intent) {
          await prisma.paymentReceipt.updateMany({
            where: { stripePaymentIntentId: charge.payment_intent as string },
            data: { status: 'REFUNDED' },
          }).catch(() => {})
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const error = pi.last_payment_error
        console.warn(`[Stripe] PaymentIntent failed: ${pi.id}, code=${error?.code}, message=${error?.message}`)
        break
      }

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
