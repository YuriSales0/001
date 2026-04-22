/**
 * SMS dispatch layer — Twilio-based.
 *
 * When TWILIO_* env vars are set, sends via Twilio API.
 * When not configured, logs the message for dev visibility.
 */

export interface SmsPayload {
  to: string       // E.164 format recommended (+34...)
  body: string
  from?: string    // Optional — defaults to TWILIO_PHONE_NUMBER
}

export async function sendSms(payload: SmsPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = payload.from ?? process.env.TWILIO_PHONE_NUMBER

  // Normalise phone number
  const toNumber = payload.to.replace(/[^\d+]/g, '')

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(`[SMS] Twilio not configured — would send to ${toNumber}: ${payload.body.slice(0, 80)}...`)
    return { ok: false, error: 'Twilio not configured' }
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: payload.body,
      }).toString(),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[SMS] Twilio error:', res.status, err)
      return { ok: false, error: `Twilio ${res.status}` }
    }

    const data = await res.json()
    return { ok: true, id: data.sid }
  } catch (err) {
    console.error('[SMS] Send failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown' }
  }
}

/** Localized SMS templates for stay chat welcome. */
const STAY_CHAT_TEMPLATES: Record<string, (name: string, property: string, url: string) => string> = {
  en: (n, p, u) => `Hi ${n}! Welcome to ${p}. Your HostMasters AI assistant is ready 24/7 to help with WiFi, door code, local tips, anything: ${u}`,
  pt: (n, p, u) => `Olá ${n}! Bem-vindo ao ${p}. O teu assistente IA HostMasters está pronto 24/7 para ajudar com WiFi, código da porta, dicas locais: ${u}`,
  es: (n, p, u) => `¡Hola ${n}! Bienvenido a ${p}. Tu asistente IA HostMasters está listo 24/7 para ayudarte con WiFi, código de puerta, consejos locales: ${u}`,
  de: (n, p, u) => `Hallo ${n}! Willkommen in ${p}. Ihr HostMasters KI-Assistent ist 24/7 bereit — WLAN, Türcode, lokale Tipps: ${u}`,
  nl: (n, p, u) => `Hallo ${n}! Welkom in ${p}. Uw HostMasters AI-assistent is 24/7 beschikbaar voor WiFi, deurcode, lokale tips: ${u}`,
  fr: (n, p, u) => `Bonjour ${n} ! Bienvenue à ${p}. Votre assistant IA HostMasters est prêt 24/7 pour WiFi, code de porte, conseils locaux : ${u}`,
  sv: (n, p, u) => `Hej ${n}! Välkommen till ${p}. Din HostMasters AI-assistent är redo dygnet runt — WiFi, dörrkod, lokala tips: ${u}`,
  da: (n, p, u) => `Hej ${n}! Velkommen til ${p}. Din HostMasters AI-assistent er klar 24/7 — WiFi, dørkode, lokale tips: ${u}`,
}

export function stayChatWelcomeSms(language: string, guestName: string, propertyName: string, url: string): string {
  const tpl = STAY_CHAT_TEMPLATES[language] ?? STAY_CHAT_TEMPLATES.en
  return tpl(guestName, propertyName, url)
}
