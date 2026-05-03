/**
 * Server-side i18n for transactional emails.
 *
 * Server-only — does NOT use the client-side i18n provider (which depends on
 * cookies/session). Each email subject/body is a function that takes the
 * user's locale and returns the localized string.
 *
 * Add new strings here when you add new email templates. To keep things
 * simple we co-locate per-template strings in this file rather than scattering
 * across the messages JSON files (which would inflate the client bundle).
 */

export type EmailLocale = 'en' | 'pt' | 'es' | 'de' | 'nl' | 'fr' | 'sv' | 'da'

const LOCALES: EmailLocale[] = ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da']

export function normalizeEmailLocale(input?: string | null): EmailLocale {
  if (!input) return 'en'
  const lower = input.toLowerCase().slice(0, 2)
  return (LOCALES as string[]).includes(lower) ? (lower as EmailLocale) : 'en'
}

// ─── Forgot Password ────────────────────────────────────────────────────────

export const forgotPasswordSubject: Record<EmailLocale, string> = {
  en: 'Reset your HostMasters password',
  pt: 'Redefinir a tua palavra-passe HostMasters',
  es: 'Restablece tu contraseña de HostMasters',
  de: 'HostMasters-Passwort zurücksetzen',
  nl: 'Stel uw HostMasters-wachtwoord opnieuw in',
  fr: 'Réinitialisez votre mot de passe HostMasters',
  sv: 'Återställ ditt HostMasters-lösenord',
  da: 'Nulstil din HostMasters-adgangskode',
}

export const forgotPasswordBody = {
  title: (loc: EmailLocale, name: string) => {
    const greeting: Record<EmailLocale, string> = {
      en: `Reset your password${name ? `, ${name}` : ''}`,
      pt: `Redefine a tua palavra-passe${name ? `, ${name}` : ''}`,
      es: `Restablece tu contraseña${name ? `, ${name}` : ''}`,
      de: `Passwort zurücksetzen${name ? `, ${name}` : ''}`,
      nl: `Stel uw wachtwoord opnieuw in${name ? `, ${name}` : ''}`,
      fr: `Réinitialisez votre mot de passe${name ? `, ${name}` : ''}`,
      sv: `Återställ ditt lösenord${name ? `, ${name}` : ''}`,
      da: `Nulstil din adgangskode${name ? `, ${name}` : ''}`,
    }
    return greeting[loc]
  },
  intro: (loc: EmailLocale) => ({
    en: 'We received a request to reset the password for your HostMasters account. Click the button below to choose a new password. This link expires in 1 hour.',
    pt: 'Recebemos um pedido para redefinir a palavra-passe da tua conta HostMasters. Clica no botão abaixo para escolher uma nova. Este link expira em 1 hora.',
    es: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta HostMasters. Haz clic en el botón abajo para elegir una nueva. Este enlace caduca en 1 hora.',
    de: 'Wir haben eine Anfrage zum Zurücksetzen Ihres HostMasters-Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues zu wählen. Dieser Link ist 1 Stunde gültig.',
    nl: 'We hebben een verzoek ontvangen om het wachtwoord van uw HostMasters-account opnieuw in te stellen. Klik op de knop hieronder om een nieuw wachtwoord te kiezen. Deze link verloopt over 1 uur.',
    fr: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte HostMasters. Cliquez sur le bouton ci-dessous pour choisir un nouveau. Ce lien expire dans 1 heure.',
    sv: 'Vi har fått en begäran om att återställa lösenordet för ditt HostMasters-konto. Klicka på knappen nedan för att välja ett nytt. Den här länken upphör om 1 timme.',
    da: 'Vi har modtaget en anmodning om at nulstille adgangskoden til din HostMasters-konto. Klik på knappen nedenfor for at vælge en ny. Linket udløber om 1 time.',
  }[loc]),
  cta: (loc: EmailLocale) => ({
    en: 'Reset my password →',
    pt: 'Redefinir palavra-passe →',
    es: 'Restablecer contraseña →',
    de: 'Passwort zurücksetzen →',
    nl: 'Wachtwoord opnieuw instellen →',
    fr: 'Réinitialiser mon mot de passe →',
    sv: 'Återställ mitt lösenord →',
    da: 'Nulstil adgangskode →',
  }[loc]),
  footer: (loc: EmailLocale) => ({
    en: "If you didn't request this, ignore this email — your password will not change.",
    pt: 'Se não foste tu a pedir, ignora este email — a tua palavra-passe não muda.',
    es: 'Si no solicitaste esto, ignora este correo — tu contraseña no cambiará.',
    de: 'Wenn Sie das nicht angefordert haben, ignorieren Sie diese E-Mail — Ihr Passwort bleibt unverändert.',
    nl: 'Als u dit niet hebt aangevraagd, negeer deze e-mail — uw wachtwoord verandert niet.',
    fr: "Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe ne sera pas modifié.",
    sv: 'Om du inte begärde detta, ignorera detta e-post — ditt lösenord ändras inte.',
    da: 'Hvis du ikke har anmodet om dette, kan du ignorere denne e-mail — din adgangskode ændres ikke.',
  }[loc]),
}

// ─── 2FA Code ───────────────────────────────────────────────────────────────

export const twoFASubject = (loc: EmailLocale, code: string) => ({
  en: `Your HostMasters verification code: ${code}`,
  pt: `O teu código HostMasters: ${code}`,
  es: `Tu código de verificación HostMasters: ${code}`,
  de: `Ihr HostMasters-Bestätigungscode: ${code}`,
  nl: `Uw HostMasters-verificatiecode: ${code}`,
  fr: `Votre code de vérification HostMasters : ${code}`,
  sv: `Din HostMasters-verifieringskod: ${code}`,
  da: `Din HostMasters-verifikationskode: ${code}`,
}[loc])

export const twoFABody = {
  title: (loc: EmailLocale) => ({
    en: 'Verification code',
    pt: 'Código de verificação',
    es: 'Código de verificación',
    de: 'Bestätigungscode',
    nl: 'Verificatiecode',
    fr: 'Code de vérification',
    sv: 'Verifieringskod',
    da: 'Verifikationskode',
  }[loc]),
  intro: (loc: EmailLocale) => ({
    en: 'Use this code to complete your sign-in. It expires in 10 minutes.',
    pt: 'Usa este código para concluir o login. Expira em 10 minutos.',
    es: 'Usa este código para completar tu inicio de sesión. Caduca en 10 minutos.',
    de: 'Verwenden Sie diesen Code, um die Anmeldung abzuschließen. Er ist 10 Minuten gültig.',
    nl: 'Gebruik deze code om uw aanmelding te voltooien. Hij verloopt over 10 minuten.',
    fr: 'Utilisez ce code pour terminer votre connexion. Il expire dans 10 minutes.',
    sv: 'Använd den här koden för att slutföra din inloggning. Den upphör om 10 minuter.',
    da: 'Brug denne kode for at fuldføre din login. Den udløber om 10 minutter.',
  }[loc]),
  footer: (loc: EmailLocale) => ({
    en: "If you didn't try to sign in, ignore this email and consider changing your password.",
    pt: 'Se não foste tu a tentar entrar, ignora este email e considera mudar a tua palavra-passe.',
    es: 'Si no intentaste iniciar sesión, ignora este correo y considera cambiar tu contraseña.',
    de: 'Wenn Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail und ändern Sie Ihr Passwort.',
    nl: 'Als u niet probeerde in te loggen, negeer deze e-mail en overweeg uw wachtwoord te wijzigen.',
    fr: "Si vous n'avez pas essayé de vous connecter, ignorez cet email et envisagez de changer votre mot de passe.",
    sv: 'Om du inte försökte logga in, ignorera detta e-post och överväg att ändra ditt lösenord.',
    da: 'Hvis du ikke forsøgte at logge ind, kan du ignorere denne e-mail og overveje at skifte adgangskode.',
  }[loc]),
}
