/**
 * Broadcast email helpers.
 * - Renders markdown to safe HTML
 * - Wraps content in HostMasters branded shell
 * - Translates broadcast content to target locales via Claude
 */

const SUPPORTED_LOCALES = ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da'] as const
export type Locale = typeof SUPPORTED_LOCALES[number]
export const isSupportedLocale = (l: string): l is Locale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(l)

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  pt: 'Portuguese (European)',
  es: 'Spanish',
  de: 'German',
  nl: 'Dutch',
  fr: 'French',
  sv: 'Swedish',
  da: 'Danish',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Minimal markdown → HTML for broadcast bodies.
 * Supports: paragraphs, **bold**, *italic*, [link](url), - bullets, ## headings.
 * Strips raw HTML to enforce branding consistency.
 */
export function mdToHtml(md: string): string {
  // First, escape any raw HTML the user typed.
  const escaped = escapeHtml(md.trim())

  const lines = escaped.split(/\n/)
  const out: string[] = []
  let inList = false

  const flushList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  const inlineMd = (line: string): string => {
    return line
      // bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // italic
      .replace(/(^|\W)\*(?!\s)([^*]+?)\*(?!\w)/g, '$1<em>$2</em>')
      // links: [text](url) — only allow http(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) =>
        `<a href="${url}" style="color:#B08A3E;text-decoration:underline;">${text}</a>`,
      )
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushList()
      continue
    }
    if (/^##\s+/.test(line)) {
      flushList()
      out.push(`<h3 style="margin:24px 0 8px;font-size:18px;color:#0B1E3A;font-weight:700;">${inlineMd(line.replace(/^##\s+/, ''))}</h3>`)
      continue
    }
    if (/^[-•]\s+/.test(line)) {
      if (!inList) {
        out.push('<ul style="margin:8px 0 16px;padding-left:20px;color:#444;font-size:15px;line-height:1.65;">')
        inList = true
      }
      out.push(`<li style="margin:4px 0;">${inlineMd(line.replace(/^[-•]\s+/, ''))}</li>`)
      continue
    }
    flushList()
    out.push(`<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#444;">${inlineMd(line)}</p>`)
  }
  flushList()

  return out.join('\n')
}

/**
 * Wrap broadcast content in HostMasters branded email shell.
 * Same layout used for transactional emails (statements, etc).
 */
export function broadcastEmailHtml(opts: {
  recipientName: string
  subject: string
  bodyMarkdown: string
  ctaText?: string | null
  ctaUrl?: string | null
  senderName: string
}): string {
  const greeting = opts.recipientName
    ? `<p style="margin:0 0 16px;font-size:15px;color:#444;">Hi ${escapeHtml(opts.recipientName.split(' ')[0])},</p>`
    : ''

  const bodyHtml = mdToHtml(opts.bodyMarkdown)

  const safeUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    try {
      const u = new URL(url)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
      return url
    } catch {
      return null
    }
  }

  const ctaUrl = safeUrl(opts.ctaUrl)
  const ctaButton = opts.ctaText && ctaUrl
    ? `<p style="margin:24px 0;text-align:center;">
         <a href="${ctaUrl}" style="display:inline-block;background:#B08A3E;color:#0B1E3A;font-weight:700;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none;">
           ${escapeHtml(opts.ctaText)}
         </a>
       </p>`
    : ''

  const signature = `
    <p style="margin:32px 0 0;font-size:14px;color:#666;line-height:1.5;">
      — ${escapeHtml(opts.senderName)}<br>
      <span style="color:#999;font-size:12px;">Founder, HostMasters</span>
    </p>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#0B1E3A;padding:24px 32px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Host<span style="color:#B08A3E;">Masters</span>
            </span>
            <span style="display:inline-block;margin-left:8px;background:rgba(176,138,62,0.18);color:#B08A3E;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:2px 8px;border-radius:4px;">
              From the founder
            </span>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          ${greeting}
          ${bodyHtml}
          ${ctaButton}
          ${signature}
        </td></tr>
        <tr>
          <td style="background:#FAF8F4;padding:20px 32px;border-top:1px solid #eee2c8;">
            <p style="margin:0;font-size:12px;color:#999;">HostMasters · Property Management · Costa Tropical, Spain</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Translation pipeline ────────────────────────────────────────────────────

interface TranslatedContent {
  subject: string
  bodyMarkdown: string
  ctaText: string | null
}

/**
 * Translate broadcast content into the target locale using Claude.
 * Preserves markdown structure (**bold**, [links](url), bullets).
 */
export async function translateBroadcast(
  source: { subject: string; bodyMarkdown: string; ctaText?: string | null },
  targetLocale: Locale,
  sourceLocale: Locale = 'pt',
): Promise<TranslatedContent> {
  if (targetLocale === sourceLocale) {
    return {
      subject: source.subject,
      bodyMarkdown: source.bodyMarkdown,
      ctaText: source.ctaText ?? null,
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set')
  }

  const targetName = LOCALE_NAMES[targetLocale]
  const sourceName = LOCALE_NAMES[sourceLocale]

  const prompt = `You are translating an email from a SaaS founder to short-term rental property owners.

Translate the following email content from ${sourceName} into ${targetName}. Keep the warm, direct, professional tone of a founder writing personally.

Strict rules:
- Preserve all markdown formatting (**bold**, *italic*, [text](url), bullets with -, ## headings).
- Keep brand and product names in original form: "HostMasters", "Costa Tropical", "Airbnb", "Booking.com", "VRBO", "Stripe", "Vercel", "Anthropic".
- Keep numbers, percentages, currencies (€, $) as written.
- Do not add anything not present in the original.
- Output strictly valid JSON, no preamble.

Input:
SUBJECT: ${source.subject}
BODY:
${source.bodyMarkdown}
${source.ctaText ? `CTA: ${source.ctaText}` : ''}

Return JSON exactly in this shape:
{"subject": "...", "bodyMarkdown": "...", "ctaText": ${source.ctaText ? '"..."' : 'null'}}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Anthropic translation failed (${res.status}): ${errBody.slice(0, 200)}`)
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  const text = data.content?.find(c => c.type === 'text')?.text ?? ''
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error('No JSON in translation response')
  }

  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Partial<TranslatedContent>

  if (typeof parsed.subject !== 'string' || typeof parsed.bodyMarkdown !== 'string') {
    throw new Error('Invalid translation shape')
  }

  return {
    subject: parsed.subject,
    bodyMarkdown: parsed.bodyMarkdown,
    ctaText: typeof parsed.ctaText === 'string' ? parsed.ctaText : null,
  }
}
