/**
 * Notifier — sends alerts via email and/or webhook (Slack/Discord).
 * Implements suppression: don't re-notify same alert within 24h.
 */
import { sendEmail } from '@/lib/email'
import type { CheckResult } from './checks'

const SUPPRESSION_WINDOW_MS = 24 * 60 * 60 * 1000 // 24h

export function shouldNotify(alertNotifiedAt: Date | null): boolean {
  if (!alertNotifiedAt) return true
  return Date.now() - alertNotifiedAt.getTime() > SUPPRESSION_WINDOW_MS
}

/** Send Slack/Discord webhook (detects format by URL). */
export async function sendWebhook(
  url: string,
  alerts: (CheckResult & { aiAnalysis?: string | null; autoFixNotes?: string | null })[],
): Promise<void> {
  if (!url) return

  const isSlack = url.includes('slack.com')
  const critical = alerts.filter(a => a.severity === 'CRITICAL')
  const high = alerts.filter(a => a.severity === 'HIGH')

  const title = critical.length > 0
    ? `🚨 ${critical.length} critical + ${high.length} high alert(s)`
    : `⚠️ ${alerts.length} alert(s) detected`

  if (isSlack) {
    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: `HostMasters AI Monitor — ${title}` } },
      ...alerts.slice(0, 10).map(a => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*[${a.severity}]* ${a.checkType}\n${a.message}${a.aiAnalysis ? `\n_AI: ${a.aiAnalysis.slice(0, 200)}..._` : ''}${a.autoFixNotes ? `\n✅ Auto-fixed: ${a.autoFixNotes}` : ''}`,
        },
      })),
    ]
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, text: title }),
      })
    } catch (err) {
      console.error('[AI Monitor] Slack webhook failed:', err)
    }
    return
  }

  // Discord format
  const discordPayload = {
    username: 'HostMasters Monitor',
    content: title,
    embeds: alerts.slice(0, 10).map(a => ({
      title: `[${a.severity}] ${a.checkType}`,
      description: a.message,
      color: a.severity === 'CRITICAL' ? 0xdc2626 : a.severity === 'HIGH' ? 0xf59e0b : 0x3b82f6,
      fields: [
        ...(a.aiAnalysis ? [{ name: 'AI Analysis', value: a.aiAnalysis.slice(0, 1000) }] : []),
        ...(a.autoFixNotes ? [{ name: 'Auto-fix', value: a.autoFixNotes.slice(0, 500) }] : []),
      ],
    })),
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    })
  } catch (err) {
    console.error('[AI Monitor] Discord webhook failed:', err)
  }
}

/** Send email summary of alerts. */
export async function sendAlertEmail(
  adminEmail: string,
  alerts: (CheckResult & { aiAnalysis?: string | null; autoFixNotes?: string | null })[],
  now: Date,
): Promise<void> {
  const critical = alerts.filter(a => a.severity === 'CRITICAL')
  const high = alerts.filter(a => a.severity === 'HIGH')
  const medium = alerts.filter(a => a.severity === 'MEDIUM')
  const low = alerts.filter(a => a.severity === 'LOW')

  const badge = (sev: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'background:#7f1d1d;color:#fff;',
      HIGH:     'background:#fef2f2;color:#dc2626;',
      MEDIUM:   'background:#fffbeb;color:#d97706;',
      LOW:      'background:#f0fdf4;color:#16a34a;',
    }
    return `<span style="${colors[sev] || ''}padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${sev}</span>`
  }

  const renderRow = (a: typeof alerts[number]) => `
    <tr>
      <td style="padding:10px 16px;font-size:13px;vertical-align:top;">${badge(a.severity)}</td>
      <td style="padding:10px 16px;font-size:13px;color:#333;">
        <strong>${a.checkType}</strong><br/>
        ${a.message}
        ${a.aiAnalysis ? `<div style="margin-top:8px;padding:8px;background:#f9fafb;border-left:3px solid #C9A84C;font-size:12px;color:#555;">💡 ${a.aiAnalysis.replace(/\n/g, '<br/>').slice(0, 800)}</div>` : ''}
        ${a.autoFixNotes ? `<div style="margin-top:8px;padding:8px;background:#f0fdf4;border-left:3px solid #16a34a;font-size:12px;color:#14532d;">✅ Auto-fixed: ${a.autoFixNotes}</div>` : ''}
      </td>
    </tr>
  `

  const sectionTable = (label: string, items: typeof alerts) => items.length === 0 ? '' : `
    <h3 style="margin:24px 0 8px;font-size:14px;color:#111;font-weight:700;">${label} (${items.length})</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      ${items.map(renderRow).join('')}
    </table>
  `

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
    <tr><td align="center">
      <table width="720" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#111827;padding:24px 32px;">
          <span style="font-size:20px;font-weight:700;color:#fff;">Host<span style="color:#C9A84C;">Masters</span></span>
          <span style="margin-left:8px;background:rgba(220,38,38,0.15);color:#fca5a5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:2px 8px;border-radius:4px;">AI Monitor</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">${alerts.length} anomalia(s) detectada(s)</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#666;">${now.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })} — ${critical.length} crítico, ${high.length} alto, ${medium.length} médio, ${low.length} baixo</p>
          ${sectionTable('🚨 CRITICAL', critical)}
          ${sectionTable('⚠️ HIGH', high)}
          ${sectionTable('📊 MEDIUM', medium)}
          ${sectionTable('ℹ️ LOW', low)}
          ${process.env.NEXT_PUBLIC_APP_URL ? `<p style="margin:32px 0 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/ai-monitor" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:6px;text-decoration:none;">Ver no AI Monitor</a></p>` : ''}
          <p style="margin:24px 0 0;font-size:12px;color:#999;">Este email é gerado automaticamente. Alertas repetidos são suprimidos por 24h.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  try {
    await sendEmail({
      to: adminEmail,
      subject: `[HM Monitor] ${critical.length > 0 ? `🚨 ${critical.length} CRITICAL · ` : ''}${alerts.length} alerta(s)`,
      html,
    })
  } catch (err) {
    console.error('[AI Monitor] Failed to send alert email:', err)
  }
}
