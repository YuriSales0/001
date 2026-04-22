import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AlertSeverity } from '@prisma/client'
import { ALL_CHECKS, type CheckResult } from '@/lib/ai-monitor/checks'
import { analyzeAlert } from '@/lib/ai-monitor/ai-analysis'
import { autoFix } from '@/lib/ai-monitor/auto-fix'
import { sendAlertEmail, sendWebhook, shouldNotify } from '@/lib/ai-monitor/notifier'
import { notify, notifyMany, tForUser } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * AI Monitor cron — bug evaluator com 3 tiers:
 *
 * TIER 1 — Foundation
 *   - 21 checks em 7 categorias (reservations, payouts, properties,
 *     users, tasks, tax, CRM)
 *   - 4 severity levels: CRITICAL, HIGH, MEDIUM, LOW
 *
 * TIER 2 — Intelligence
 *   - Claude Haiku analisa cada alerta HIGH/CRITICAL e sugere fix concreto
 *   - Alert suppression: não re-envia mesmo alerta em <24h
 *
 * TIER 3 — Actions
 *   - Self-healing: auto-fix para checks seguros (commission sync, paidAt backfill)
 *   - Webhook Slack/Discord além de email
 *
 * Scheduled: "0 7 * * *" (07:00 UTC daily).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()

  // ═══════════════════════════════════════════════════════════════
  // TIER 1: RUN ALL CHECKS IN PARALLEL
  // ═══════════════════════════════════════════════════════════════
  const settled = await Promise.allSettled(ALL_CHECKS.map(check => check(now)))
  const detected: CheckResult[] = settled
    .filter((r): r is PromiseFulfilledResult<CheckResult | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((r): r is CheckResult => r !== null)

  // Log failed checks separately (don't fail the cron)
  settled.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[AI Monitor] Check #${i} failed:`, r.reason)
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // TIER 3: AUTO-FIX safe issues BEFORE persisting alerts
  // ═══════════════════════════════════════════════════════════════
  const enrichedAlerts: (CheckResult & { aiAnalysis?: string | null; autoFixNotes?: string | null })[] = []

  for (const check of detected) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched: any = { ...check }

    if (check.canAutoFix) {
      try {
        const fixResult = await autoFix(check)
        if (fixResult.fixed) {
          enriched.autoFixNotes = fixResult.notes
          console.log(`[AI Monitor] Auto-fixed ${check.checkType}: ${fixResult.notes}`)
        }
      } catch (err) {
        console.error(`[AI Monitor] Auto-fix failed for ${check.checkType}:`, err)
      }
    }

    enrichedAlerts.push(enriched)
  }

  // ═══════════════════════════════════════════════════════════════
  // TIER 2: AI ANALYSIS for CRITICAL/HIGH alerts (not auto-fixed)
  // Dedupe: skip alerts whose existing SystemAlert already has an AI analysis
  // (saves Claude API calls when checks keep triggering daily).
  // ═══════════════════════════════════════════════════════════════
  const existingAnalyses = await prisma.systemAlert.findMany({
    where: {
      resolvedAt: null,
      aiAnalysis: { not: null },
      checkType: { in: enrichedAlerts.map(a => a.checkType) },
    },
    select: { checkType: true, aiAnalysis: true },
  })
  const cachedAnalyses = new Map(existingAnalyses.map(a => [a.checkType, a.aiAnalysis]))

  const needsAnalysis = enrichedAlerts.filter(a => {
    if (a.severity !== 'CRITICAL' && a.severity !== 'HIGH') return false
    if (a.autoFixNotes) return false
    if (cachedAnalyses.has(a.checkType)) {
      // Reuse existing analysis
      a.aiAnalysis = cachedAnalyses.get(a.checkType) ?? null
      return false
    }
    return true
  })

  // Run AI analyses in parallel (up to 5 concurrent to avoid rate limits)
  const BATCH_SIZE = 5
  for (let i = 0; i < needsAnalysis.length; i += BATCH_SIZE) {
    const batch = needsAnalysis.slice(i, i + BATCH_SIZE)
    const analyses = await Promise.all(batch.map(a => analyzeAlert(a)))
    batch.forEach((alert, idx) => {
      alert.aiAnalysis = analyses[idx]
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // PERSIST: create new, update existing, auto-resolve obsolete
  // ═══════════════════════════════════════════════════════════════
  const detectedTypes = enrichedAlerts.map(d => d.checkType)

  // Auto-resolve alerts that no longer apply
  await prisma.systemAlert.updateMany({
    where: {
      resolvedAt: null,
      checkType: { notIn: detectedTypes.length > 0 ? detectedTypes : ['__none__'] },
    },
    data: { resolvedAt: now },
  })

  // Upsert each detected alert
  let created = 0
  let updated = 0
  const persisted: { alert: CheckResult & { aiAnalysis?: string | null; autoFixNotes?: string | null }; notifiedAt: Date | null }[] = []

  for (const item of enrichedAlerts) {
    const existing = await prisma.systemAlert.findFirst({
      where: { checkType: item.checkType, resolvedAt: null },
    })

    if (!existing) {
      await prisma.systemAlert.create({
        data: {
          checkType: item.checkType,
          severity: item.severity as AlertSeverity,
          message: item.message,
          details: { count: item.count, detectedAt: now.toISOString(), ...(item.details ?? {}) },
          aiAnalysis: item.aiAnalysis ?? null,
          autoFixedAt: item.autoFixNotes ? now : null,
          autoFixNotes: item.autoFixNotes ?? null,
        },
      })
      created++
      persisted.push({ alert: item, notifiedAt: null })
    } else {
      const updatedRecord = await prisma.systemAlert.update({
        where: { id: existing.id },
        data: {
          message: item.message,
          severity: item.severity as AlertSeverity,
          details: { count: item.count, detectedAt: now.toISOString(), ...(item.details ?? {}) },
          ...(item.aiAnalysis ? { aiAnalysis: item.aiAnalysis } : {}),
          ...(item.autoFixNotes ? { autoFixedAt: now, autoFixNotes: item.autoFixNotes } : {}),
        },
      })
      updated++
      persisted.push({ alert: item, notifiedAt: updatedRecord.notifiedAt })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NOTIFY: email + webhook (with suppression)
  // ═══════════════════════════════════════════════════════════════
  const toNotify = persisted
    .filter(p => p.alert.severity === 'CRITICAL' || p.alert.severity === 'HIGH')
    .filter(p => shouldNotify(p.notifiedAt))
    .map(p => p.alert)

  if (toNotify.length > 0) {
    // In-app notifications for all Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    const adminIds = admins.map(a => a.id)
    for (const alert of toNotify) {
      notifyMany(adminIds, {
        type: 'AI_ALERT',
        title: `🤖 ${alert.severity}: ${alert.checkType.replace(/_/g, ' ')}`,
        body: alert.message,
        link: '/ai-monitor',
      }).catch(() => {})
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) await sendAlertEmail(adminEmail, toNotify, now)

    const webhookUrl = process.env.MONITOR_WEBHOOK_URL
    if (webhookUrl) await sendWebhook(webhookUrl, toNotify)

    // Mark as notified
    await prisma.systemAlert.updateMany({
      where: {
        checkType: { in: toNotify.map(a => a.checkType) },
        resolvedAt: null,
      },
      data: { notifiedAt: now },
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // Gap #8: TAX DEADLINE — notify affected clients (not just admins)
  // ═══════════════════════════════════════════════════════════════
  const taxAlerts = enrichedAlerts.filter(a =>
    a.checkType === 'TAX_DUE_SOON' || a.checkType === 'TAX_OVERDUE',
  )

  if (taxAlerts.length > 0) {
    const in7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000)
    const taxObligations = await prisma.taxObligation.findMany({
      where: {
        status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'ACTION_REQUIRED'] },
        dueDate: { lte: in7Days },
      },
      select: { userId: true, type: true, dueDate: true },
    })

    const clientIds = Array.from(new Set(taxObligations.map(t => t.userId)))
    for (const clientId of clientIds) {
      tForUser(clientId, 'notifications.taxDeadlineTitle')
        .then(title =>
          tForUser(clientId, 'notifications.taxDeadlineBody')
            .then(body =>
              notify({ userId: clientId, type: 'TAX_DEADLINE', title, body, link: '/client/tax' })
            )
        )
        .catch(() => {})
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RESPONSE SUMMARY
  // ═══════════════════════════════════════════════════════════════
  const summary = {
    checkedAt: now.toISOString(),
    totalChecks: ALL_CHECKS.length,
    detected: enrichedAlerts.length,
    critical: enrichedAlerts.filter(a => a.severity === 'CRITICAL').length,
    high: enrichedAlerts.filter(a => a.severity === 'HIGH').length,
    medium: enrichedAlerts.filter(a => a.severity === 'MEDIUM').length,
    low: enrichedAlerts.filter(a => a.severity === 'LOW').length,
    autoFixed: enrichedAlerts.filter(a => a.autoFixNotes).length,
    aiAnalyzed: enrichedAlerts.filter(a => a.aiAnalysis).length,
    created,
    updated,
    notified: toNotify.length,
    issues: enrichedAlerts.map(a => ({
      type: a.checkType,
      severity: a.severity,
      message: a.message,
      count: a.count,
      autoFixed: !!a.autoFixNotes,
      aiAnalyzed: !!a.aiAnalysis,
    })),
  }

  console.log('[AI Monitor] Cron complete:', JSON.stringify(summary))

  // Piggyback other daily jobs (Hobby plan only allows 2 crons)
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  const headers: Record<string, string> = {}
  if (cronSecret) headers['authorization'] = `Bearer ${cronSecret}`

  const jobs = [
    '/api/cron/crew-confirmation-timeout',
    '/api/cron/notification-cleanup',
    '/api/cron/partner-payout-approval',
  ]
  // Crew payout only on Wednesdays
  if (new Date().getUTCDay() === 3) jobs.push('/api/cron/crew-payout')
  // Market scrape only on Sundays
  if (new Date().getUTCDay() === 0) jobs.push('/api/cron/scrape-market')
  // Monthly score decay on the 1st of every month
  if (new Date().getUTCDate() === 1) {
    jobs.push('/api/cron/crew-score-decay')
  }
  // Manager monthly commission payout on the 5th of every month
  if (new Date().getUTCDate() === 5) {
    jobs.push('/api/cron/manager-payout')
  }
  // VAGF: process scheduled guest feedback calls (10:00-18:00 UTC window)
  const hour = new Date().getUTCHours()
  if (hour >= 9 && hour <= 18) {
    jobs.push('/api/cron/vagf-calls')
  }

  await Promise.allSettled(
    jobs.map(path => fetch(`${baseUrl}${path}`, { method: 'POST', headers }).catch(() => {}))
  )

  return NextResponse.json(summary)
}
