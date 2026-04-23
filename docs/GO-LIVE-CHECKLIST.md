# HostMasters — Go-Live Checklist

## Stripe (Payments)
- [ ] Create live mode products: Basic (€89/mo), Mid (€159/mo), Premium (€269/mo)
- [ ] Set env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- [ ] Set price IDs: `STRIPE_BASIC_PRICE_ID`, `STRIPE_MID_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`
- [ ] Create webhook endpoint: `https://hostmasters.es/api/webhooks/stripe`
- [ ] Subscribe events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Set `STRIPE_WEBHOOK_SECRET` from webhook dashboard
- [ ] Enable Stripe Connect for manager/crew payouts
- [ ] Test: create checkout → pay → verify webhook fires → verify plan updated in DB

## Resend (Email)
- [ ] Verify domain `hostmasters.es` in Resend dashboard
- [ ] Add DNS records: SPF, DKIM, DMARC
- [ ] Set `RESEND_API_KEY` in Vercel
- [ ] Set `EMAIL_FROM="HostMasters <noreply@hostmasters.es>"`
- [ ] Test: register a user → verification email arrives in inbox (not spam)
- [ ] Test: trigger a monthly statement email → check formatting

## Sentry (Error Tracking)
- [ ] Create Sentry project (Next.js, EU region)
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` in Vercel
- [ ] Set `SENTRY_ORG` and `SENTRY_PROJECT`
- [ ] Deploy → trigger a test error → verify it appears in Sentry dashboard
- [ ] Set up Slack/email alerts for new errors

## Twilio (SMS)
- [ ] Create Twilio account, buy Spanish number (+34)
- [ ] Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- [ ] Test: send a test SMS via `/api/sms/test` or manual trigger
- [ ] Verify Guest Stay Chat SMS delivery works

## Anthropic (AI)
- [ ] Set `ANTHROPIC_API_KEY` with production key
- [ ] Verify API usage limits are sufficient (Haiku 4.5 — ~€1/day at 1000 msgs)
- [ ] Test: AI Assistant chat, Guest Stay Chat, VAGF analysis, AI Monitor

## Vercel (Hosting)
- [ ] Confirm project region is `eu-west-1` (GDPR)
- [ ] Custom domain `hostmasters.es` configured with SSL
- [ ] Environment variables set (all from .env.example)
- [ ] Cron jobs configured in vercel.json (or Vercel dashboard)
- [ ] Set `CRON_SECRET` and configure cron Authorization headers

## Cloudflare (optional but recommended)
- [ ] DNS proxy enabled (orange cloud)
- [ ] WAF rules: rate limiting, bot protection
- [ ] SSL mode: Full (strict)
- [ ] Page rules: cache static assets

## Database (Neon)
- [ ] Confirm region is EU (Frankfurt or Amsterdam)
- [ ] Connection pooling enabled
- [ ] SSL enforced
- [ ] Backup schedule confirmed (Neon auto-backups)
- [ ] Run `npm run seed` to create admin user
- [ ] Run `npm run seed:demo-clients` for test accounts

## Legal
- [ ] Privacy Policy page published (`/privacy`)
- [ ] Cookie consent banner live
- [ ] Terms of Use page published (`/terms`)
- [ ] DPA template ready for subprocessors (Stripe, Resend, Anthropic, Vercel, Neon)

## SES / Registro de Viajeros
- [ ] Process documented (manual or API integration)
- [ ] Guest data fields captured: name, nationality, ID number, dates

## Final Smoke Test
- [ ] Register as CLIENT → verify email → complete onboarding → sign master contract
- [ ] Add property → admin approves → property becomes ACTIVE
- [ ] Create reservation → tasks auto-generated → crew assigned
- [ ] Crew accepts task → submits photos → Captain approves
- [ ] Payout generated → mark paid → owner receives email + receipt
- [ ] Manager commission calculated → visible in /manager/commission
- [ ] Guest Stay Chat works via SMS link
- [ ] Landing page loads with revenue simulator
- [ ] All 4 roles can login and see their dashboards
