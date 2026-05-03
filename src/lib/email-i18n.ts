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

// ─── Locale helpers ─────────────────────────────────────────────────────────

const INTL_LOCALE: Record<EmailLocale, string> = {
  en: 'en-IE', pt: 'pt-PT', es: 'es-ES', de: 'de-DE',
  nl: 'nl-NL', fr: 'fr-FR', sv: 'sv-SE', da: 'da-DK',
}

export function fmtMoney(n: number, locale: EmailLocale, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}

export function fmtDate(d: Date | string, locale: EmailLocale): string {
  const date = d instanceof Date ? d : new Date(d)
  try {
    return date.toLocaleDateString(INTL_LOCALE[locale], { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

const MONTH_NAMES: Record<EmailLocale, string[]> = {
  en: ['', 'January','February','March','April','May','June','July','August','September','October','November','December'],
  pt: ['', 'Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  es: ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  de: ['', 'Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  nl: ['', 'Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'],
  fr: ['', 'Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  sv: ['', 'Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'],
  da: ['', 'Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'],
}

/** month: 1-12 */
export function monthName(month: number, locale: EmailLocale): string {
  return MONTH_NAMES[locale][month] || ''
}

// ─── Common email shell strings ─────────────────────────────────────────────

export const wrapperFooter: Record<EmailLocale, string> = {
  en: 'This is an automated message — please do not reply directly to this email.',
  pt: 'Esta é uma mensagem automática — por favor não respondas directamente a este email.',
  es: 'Este es un mensaje automático — por favor no respondas directamente a este correo.',
  de: 'Dies ist eine automatische Nachricht — bitte antworten Sie nicht direkt auf diese E-Mail.',
  nl: 'Dit is een automatisch bericht — antwoord niet rechtstreeks op deze e-mail.',
  fr: 'Ceci est un message automatique — merci de ne pas répondre directement à cet email.',
  sv: 'Detta är ett automatiskt meddelande — vänligen svara inte direkt på det här e-postmeddelandet.',
  da: 'Dette er en automatisk besked — venligst svar ikke direkte på denne e-mail.',
}

export const teamSignoff: Record<EmailLocale, string> = {
  en: '— The HostMasters Team',
  pt: '— A equipa HostMasters',
  es: '— El equipo HostMasters',
  de: '— Das HostMasters-Team',
  nl: '— Het HostMasters-team',
  fr: '— L\'équipe HostMasters',
  sv: '— HostMasters-teamet',
  da: '— HostMasters-teamet',
}

export const dearLabel: Record<EmailLocale, string> = {
  en: 'Dear',
  pt: 'Olá',
  es: 'Estimado/a',
  de: 'Hallo',
  nl: 'Beste',
  fr: 'Cher / Chère',
  sv: 'Hej',
  da: 'Hej',
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

// ─── Monthly Statement (cron) ───────────────────────────────────────────────

export const monthlyStatementI18n = {
  subject: (loc: EmailLocale, month: string, year: number, propertyName: string) => ({
    en: `Your HostMasters statement — ${month} ${year} · ${propertyName}`,
    pt: `Extracto HostMasters — ${month} ${year} · ${propertyName}`,
    es: `Tu informe HostMasters — ${month} ${year} · ${propertyName}`,
    de: `Ihre HostMasters-Abrechnung — ${month} ${year} · ${propertyName}`,
    nl: `Uw HostMasters-overzicht — ${month} ${year} · ${propertyName}`,
    fr: `Votre relevé HostMasters — ${month} ${year} · ${propertyName}`,
    sv: `Din HostMasters-rapport — ${month} ${year} · ${propertyName}`,
    da: `Din HostMasters-opgørelse — ${month} ${year} · ${propertyName}`,
  }[loc]),
  title: { en: 'Monthly Statement', pt: 'Extracto Mensal', es: 'Informe Mensual', de: 'Monatsabrechnung', nl: 'Maandelijks Overzicht', fr: 'Relevé Mensuel', sv: 'Månadsrapport', da: 'Månedlig Opgørelse' } as Record<EmailLocale, string>,
  introHere: (loc: EmailLocale, propertyName: string, monthYear: string) => ({
    en: `Here is your financial summary for <strong>${propertyName}</strong> in <strong>${monthYear}</strong>.`,
    pt: `Aqui está o resumo financeiro de <strong>${propertyName}</strong> em <strong>${monthYear}</strong>.`,
    es: `Aquí está tu resumen financiero de <strong>${propertyName}</strong> en <strong>${monthYear}</strong>.`,
    de: `Hier ist Ihre Finanzübersicht für <strong>${propertyName}</strong> im <strong>${monthYear}</strong>.`,
    nl: `Hier is uw financieel overzicht voor <strong>${propertyName}</strong> in <strong>${monthYear}</strong>.`,
    fr: `Voici votre résumé financier pour <strong>${propertyName}</strong> en <strong>${monthYear}</strong>.`,
    sv: `Här är din ekonomiska sammanfattning för <strong>${propertyName}</strong> i <strong>${monthYear}</strong>.`,
    da: `Her er din økonomiske oversigt for <strong>${propertyName}</strong> i <strong>${monthYear}</strong>.`,
  }[loc]),
  summary: { en: 'Monthly Summary', pt: 'Resumo Mensal', es: 'Resumen Mensual', de: 'Monatsübersicht', nl: 'Maandoverzicht', fr: 'Résumé mensuel', sv: 'Månadsöversikt', da: 'Månedlig oversigt' } as Record<EmailLocale, string>,
  reservations: { en: 'Reservations', pt: 'Reservas', es: 'Reservas', de: 'Buchungen', nl: 'Boekingen', fr: 'Réservations', sv: 'Bokningar', da: 'Reservationer' } as Record<EmailLocale, string>,
  grossRental: { en: 'Gross rental income', pt: 'Receita bruta de aluguer', es: 'Ingresos brutos de alquiler', de: 'Bruttomieteinnahmen', nl: 'Bruto huurinkomsten', fr: 'Revenus locatifs bruts', sv: 'Bruttohyresintäkter', da: 'Bruttolejeindtægter' } as Record<EmailLocale, string>,
  expenses: { en: 'Expenses', pt: 'Despesas', es: 'Gastos', de: 'Ausgaben', nl: 'Uitgaven', fr: 'Dépenses', sv: 'Utgifter', da: 'Udgifter' } as Record<EmailLocale, string>,
  hmCommission: (loc: EmailLocale, rate: number) => ({
    en: `HostMasters commission (${rate}%)`,
    pt: `Comissão HostMasters (${rate}%)`,
    es: `Comisión HostMasters (${rate}%)`,
    de: `HostMasters-Provision (${rate}%)`,
    nl: `HostMasters-commissie (${rate}%)`,
    fr: `Commission HostMasters (${rate}%)`,
    sv: `HostMasters-provision (${rate}%)`,
    da: `HostMasters-provision (${rate}%)`,
  }[loc]),
  netPayout: { en: 'Net payout to you', pt: 'Pagamento líquido para ti', es: 'Pago neto para ti', de: 'Nettoauszahlung an Sie', nl: 'Netto-uitbetaling aan u', fr: 'Paiement net pour vous', sv: 'Nettoutbetalning till dig', da: 'Nettoudbetaling til dig' } as Record<EmailLocale, string>,
  noReservations: { en: 'No reservations recorded for this period.', pt: 'Sem reservas registadas neste período.', es: 'Sin reservas registradas en este período.', de: 'Keine Buchungen in diesem Zeitraum.', nl: 'Geen boekingen geregistreerd in deze periode.', fr: 'Aucune réservation enregistrée pour cette période.', sv: 'Inga bokningar registrerade för denna period.', da: 'Ingen reservationer registreret for denne periode.' } as Record<EmailLocale, string>,
  cta: { en: 'View full report in portal', pt: 'Ver relatório completo no portal', es: 'Ver informe completo en el portal', de: 'Vollständigen Bericht im Portal ansehen', nl: 'Volledig rapport bekijken in portaal', fr: 'Voir le rapport complet dans le portail', sv: 'Visa fullständig rapport i portalen', da: 'Se fuld rapport i portalen' } as Record<EmailLocale, string>,
  thanks: { en: 'Thank you for trusting us with your property.', pt: 'Obrigado por confiar a tua propriedade a nós.', es: 'Gracias por confiar tu propiedad a nosotros.', de: 'Vielen Dank, dass Sie uns Ihre Immobilie anvertrauen.', nl: 'Bedankt dat u uw woning aan ons toevertrouwt.', fr: 'Merci de nous confier votre bien.', sv: 'Tack för att du anförtror oss din fastighet.', da: 'Tak fordi du betror os din ejendom.' } as Record<EmailLocale, string>,
}

// ─── Owner Statement (per-payout) ───────────────────────────────────────────

export const ownerStatementI18n = {
  subject: (loc: EmailLocale, propertyName: string) => ({
    en: `Owner Statement — ${propertyName}`,
    pt: `Extracto do proprietário — ${propertyName}`,
    es: `Estado de cuenta del propietario — ${propertyName}`,
    de: `Eigentümer-Abrechnung — ${propertyName}`,
    nl: `Eigenaarsoverzicht — ${propertyName}`,
    fr: `Relevé propriétaire — ${propertyName}`,
    sv: `Ägaröversikt — ${propertyName}`,
    da: `Ejeropgørelse — ${propertyName}`,
  }[loc]),
  title: { en: 'Owner Statement', pt: 'Extracto do Proprietário', es: 'Estado de Cuenta del Propietario', de: 'Eigentümer-Abrechnung', nl: 'Eigenaarsoverzicht', fr: 'Relevé Propriétaire', sv: 'Ägaröversikt', da: 'Ejeropgørelse' } as Record<EmailLocale, string>,
  issued: (loc: EmailLocale, id: string, date: string) => ({
    en: `Statement #${id} · Issued ${date}`,
    pt: `Extracto #${id} · Emitido em ${date}`,
    es: `Estado #${id} · Emitido el ${date}`,
    de: `Abrechnung #${id} · Ausgestellt am ${date}`,
    nl: `Overzicht #${id} · Uitgegeven op ${date}`,
    fr: `Relevé n°${id} · Émis le ${date}`,
    sv: `Rapport #${id} · Utfärdad ${date}`,
    da: `Opgørelse #${id} · Udstedt ${date}`,
  }[loc]),
  intro: (loc: EmailLocale, propertyName: string) => ({
    en: `Your payout for <strong>${propertyName}</strong> has been processed. Please find the breakdown below.`,
    pt: `O teu pagamento para <strong>${propertyName}</strong> foi processado. O detalhe está abaixo.`,
    es: `Tu pago para <strong>${propertyName}</strong> ha sido procesado. El detalle está abajo.`,
    de: `Ihre Auszahlung für <strong>${propertyName}</strong> wurde verarbeitet. Die Aufschlüsselung finden Sie unten.`,
    nl: `Uw uitbetaling voor <strong>${propertyName}</strong> is verwerkt. Hieronder vindt u de details.`,
    fr: `Votre paiement pour <strong>${propertyName}</strong> a été traité. Vous trouverez le détail ci-dessous.`,
    sv: `Din utbetalning för <strong>${propertyName}</strong> har behandlats. Detaljerna finns nedan.`,
    da: `Din udbetaling for <strong>${propertyName}</strong> er behandlet. Detaljerne findes nedenfor.`,
  }[loc]),
  reservationDetails: { en: 'Reservation Details', pt: 'Detalhes da Reserva', es: 'Detalles de la Reserva', de: 'Buchungsdetails', nl: 'Boekingsdetails', fr: 'Détails de la Réservation', sv: 'Bokningsdetaljer', da: 'Bookingdetaljer' } as Record<EmailLocale, string>,
  property: { en: 'Property', pt: 'Propriedade', es: 'Propiedad', de: 'Immobilie', nl: 'Woning', fr: 'Bien', sv: 'Fastighet', da: 'Ejendom' } as Record<EmailLocale, string>,
  guest: { en: 'Guest', pt: 'Hóspede', es: 'Huésped', de: 'Gast', nl: 'Gast', fr: 'Invité', sv: 'Gäst', da: 'Gæst' } as Record<EmailLocale, string>,
  checkIn: { en: 'Check-in', pt: 'Check-in', es: 'Check-in', de: 'Check-in', nl: 'Check-in', fr: 'Arrivée', sv: 'Incheckning', da: 'Check-in' } as Record<EmailLocale, string>,
  checkOut: { en: 'Check-out', pt: 'Check-out', es: 'Check-out', de: 'Check-out', nl: 'Check-out', fr: 'Départ', sv: 'Utcheckning', da: 'Check-out' } as Record<EmailLocale, string>,
  platform: { en: 'Platform', pt: 'Plataforma', es: 'Plataforma', de: 'Plattform', nl: 'Platform', fr: 'Plateforme', sv: 'Plattform', da: 'Platform' } as Record<EmailLocale, string>,
  platformDirect: { en: 'Direct booking', pt: 'Reserva directa', es: 'Reserva directa', de: 'Direktbuchung', nl: 'Directe boeking', fr: 'Réservation directe', sv: 'Direktbokning', da: 'Direkte booking' } as Record<EmailLocale, string>,
  platformOther: { en: 'Other', pt: 'Outro', es: 'Otro', de: 'Sonstige', nl: 'Andere', fr: 'Autre', sv: 'Övrigt', da: 'Andet' } as Record<EmailLocale, string>,
  financialSummary: { en: 'Financial Summary', pt: 'Resumo Financeiro', es: 'Resumen Financiero', de: 'Finanzübersicht', nl: 'Financieel Overzicht', fr: 'Résumé Financier', sv: 'Ekonomisk översikt', da: 'Økonomisk oversigt' } as Record<EmailLocale, string>,
  grossRental: { en: 'Gross rental income', pt: 'Receita bruta de aluguer', es: 'Ingresos brutos de alquiler', de: 'Bruttomieteinnahmen', nl: 'Bruto huurinkomsten', fr: 'Revenus locatifs bruts', sv: 'Bruttohyresintäkter', da: 'Bruttolejeindtægter' } as Record<EmailLocale, string>,
  hmCommission: (loc: EmailLocale, rate: number) => ({
    en: `HostMasters commission (${rate}%)`,
    pt: `Comissão HostMasters (${rate}%)`,
    es: `Comisión HostMasters (${rate}%)`,
    de: `HostMasters-Provision (${rate}%)`,
    nl: `HostMasters-commissie (${rate}%)`,
    fr: `Commission HostMasters (${rate}%)`,
    sv: `HostMasters-provision (${rate}%)`,
    da: `HostMasters-provision (${rate}%)`,
  }[loc]),
  netPayout: { en: 'Net payout to you', pt: 'Pagamento líquido para ti', es: 'Pago neto para ti', de: 'Nettoauszahlung an Sie', nl: 'Netto-uitbetaling aan u', fr: 'Paiement net pour vous', sv: 'Nettoutbetalning till dig', da: 'Nettoudbetaling til dig' } as Record<EmailLocale, string>,
  paymentProcessed: (loc: EmailLocale, date: string) => ({
    en: `Payment was processed on <strong>${date}</strong>. Funds should appear in your account within 1–3 business days depending on your bank.`,
    pt: `O pagamento foi processado em <strong>${date}</strong>. Os fundos devem aparecer na tua conta dentro de 1–3 dias úteis, dependendo do banco.`,
    es: `El pago se procesó el <strong>${date}</strong>. Los fondos aparecerán en tu cuenta en 1–3 días hábiles según tu banco.`,
    de: `Die Zahlung wurde am <strong>${date}</strong> verarbeitet. Das Geld sollte je nach Bank in 1–3 Werktagen auf Ihrem Konto erscheinen.`,
    nl: `De betaling is verwerkt op <strong>${date}</strong>. Het geld komt binnen 1–3 werkdagen op uw rekening, afhankelijk van uw bank.`,
    fr: `Le paiement a été traité le <strong>${date}</strong>. Les fonds devraient apparaître sur votre compte dans 1–3 jours ouvrables selon votre banque.`,
    sv: `Betalningen behandlades den <strong>${date}</strong>. Pengarna ska synas på ditt konto inom 1–3 bankdagar beroende på din bank.`,
    da: `Betalingen blev behandlet den <strong>${date}</strong>. Pengene bør være på din konto inden for 1–3 bankdage afhængigt af din bank.`,
  }[loc]),
  cta: { en: 'View in portal', pt: 'Ver no portal', es: 'Ver en el portal', de: 'Im Portal ansehen', nl: 'Bekijken in portaal', fr: 'Voir dans le portail', sv: 'Visa i portalen', da: 'Se i portalen' } as Record<EmailLocale, string>,
  thanks: { en: 'Thank you for entrusting us with your property.', pt: 'Obrigado por confiares a tua propriedade a nós.', es: 'Gracias por confiarnos tu propiedad.', de: 'Vielen Dank, dass Sie uns Ihre Immobilie anvertrauen.', nl: 'Bedankt dat u uw woning aan ons toevertrouwt.', fr: 'Merci de nous confier votre bien.', sv: 'Tack för att du anförtror oss din fastighet.', da: 'Tak fordi du betror os din ejendom.' } as Record<EmailLocale, string>,
}

// ─── Subscription Receipt (Stripe) ──────────────────────────────────────────

export const subscriptionReceiptI18n = {
  subject: (loc: EmailLocale, plan: string) => ({
    en: `Thank you — HostMasters ${plan} subscription`,
    pt: `Obrigado — Subscrição HostMasters ${plan}`,
    es: `Gracias — Suscripción HostMasters ${plan}`,
    de: `Vielen Dank — HostMasters ${plan}-Abonnement`,
    nl: `Bedankt — HostMasters ${plan}-abonnement`,
    fr: `Merci — Abonnement HostMasters ${plan}`,
    sv: `Tack — HostMasters ${plan}-prenumeration`,
    da: `Tak — HostMasters ${plan}-abonnement`,
  }[loc]),
  title: { en: 'Thank you for your subscription', pt: 'Obrigado pela tua subscrição', es: 'Gracias por tu suscripción', de: 'Vielen Dank für Ihr Abonnement', nl: 'Bedankt voor uw abonnement', fr: 'Merci pour votre abonnement', sv: 'Tack för din prenumeration', da: 'Tak for dit abonnement' } as Record<EmailLocale, string>,
  paymentConfirmed: (loc: EmailLocale, name: string) => ({
    en: `Payment confirmed, ${name}`,
    pt: `Pagamento confirmado, ${name}`,
    es: `Pago confirmado, ${name}`,
    de: `Zahlung bestätigt, ${name}`,
    nl: `Betaling bevestigd, ${name}`,
    fr: `Paiement confirmé, ${name}`,
    sv: `Betalning bekräftad, ${name}`,
    da: `Betaling bekræftet, ${name}`,
  }[loc]),
  invoiceLabel: (loc: EmailLocale, id: string) => ({
    en: `Invoice #${id}`,
    pt: `Factura #${id}`,
    es: `Factura #${id}`,
    de: `Rechnung #${id}`,
    nl: `Factuur #${id}`,
    fr: `Facture n°${id}`,
    sv: `Faktura #${id}`,
    da: `Faktura #${id}`,
  }[loc]),
  plan: { en: 'Plan', pt: 'Plano', es: 'Plan', de: 'Tarif', nl: 'Plan', fr: 'Plan', sv: 'Plan', da: 'Plan' } as Record<EmailLocale, string>,
  period: { en: 'Period', pt: 'Período', es: 'Período', de: 'Zeitraum', nl: 'Periode', fr: 'Période', sv: 'Period', da: 'Periode' } as Record<EmailLocale, string>,
  amountPaid: { en: 'Amount paid', pt: 'Valor pago', es: 'Importe pagado', de: 'Bezahlter Betrag', nl: 'Betaald bedrag', fr: 'Montant payé', sv: 'Betalat belopp', da: 'Betalt beløb' } as Record<EmailLocale, string>,
  active: { en: 'Your property management subscription is active. You have full access to your owner portal, reports, and our management team.', pt: 'A tua subscrição de gestão imobiliária está activa. Tens acesso total ao portal, relatórios e à nossa equipa.', es: 'Tu suscripción de gestión inmobiliaria está activa. Tienes acceso completo al portal, informes y a nuestro equipo.', de: 'Ihr Immobilienverwaltungs-Abonnement ist aktiv. Sie haben vollen Zugriff auf das Portal, Berichte und unser Team.', nl: 'Uw vastgoedbeheerabonnement is actief. U heeft volledige toegang tot het portaal, rapporten en ons team.', fr: 'Votre abonnement de gestion immobilière est actif. Vous avez un accès complet au portail, aux rapports et à notre équipe.', sv: 'Din fastighetsförvaltningsprenumeration är aktiv. Du har full tillgång till portalen, rapporter och vårt team.', da: 'Dit ejendomsadministrationsabonnement er aktivt. Du har fuld adgang til portalen, rapporter og vores team.' } as Record<EmailLocale, string>,
  cta: { en: 'Go to my portal', pt: 'Ir para o meu portal', es: 'Ir a mi portal', de: 'Zu meinem Portal', nl: 'Naar mijn portaal', fr: 'Aller au portail', sv: 'Till min portal', da: 'Til min portal' } as Record<EmailLocale, string>,
  closing: { en: 'We look forward to another great month.', pt: 'Esperamos outro mês excelente.', es: 'Esperamos otro gran mes.', de: 'Wir freuen uns auf einen weiteren großartigen Monat.', nl: 'Wij kijken uit naar een volgende geweldige maand.', fr: 'Nous attendons avec impatience un autre mois exceptionnel.', sv: 'Vi ser fram emot en till bra månad.', da: 'Vi ser frem til en ny god måned.' } as Record<EmailLocale, string>,
}

// ─── Receipt (invoice) Created ──────────────────────────────────────────────

export const receiptCreatedI18n = {
  subject: { en: 'Invoice from HostMasters', pt: 'Factura HostMasters', es: 'Factura HostMasters', de: 'HostMasters-Rechnung', nl: 'Factuur van HostMasters', fr: 'Facture HostMasters', sv: 'Faktura från HostMasters', da: 'Faktura fra HostMasters' } as Record<EmailLocale, string>,
  title: { en: 'New payment receipt from HostMasters', pt: 'Novo recibo da HostMasters', es: 'Nuevo recibo de HostMasters', de: 'Neuer Zahlungsbeleg von HostMasters', nl: 'Nieuwe factuur van HostMasters', fr: 'Nouveau reçu HostMasters', sv: 'Nytt kvitto från HostMasters', da: 'Ny kvittering fra HostMasters' } as Record<EmailLocale, string>,
  intro: { en: 'Please find your invoice details below.', pt: 'Aqui estão os detalhes da tua factura.', es: 'Aquí están los detalles de tu factura.', de: 'Bitte finden Sie unten die Details Ihrer Rechnung.', nl: 'Hieronder vindt u de details van uw factuur.', fr: 'Veuillez trouver ci-dessous les détails de votre facture.', sv: 'Här är detaljerna för din faktura.', da: 'Her er detaljerne for din faktura.' } as Record<EmailLocale, string>,
  invoiceCol: { en: 'Invoice #', pt: 'Factura #', es: 'Factura #', de: 'Rechnung #', nl: 'Factuur #', fr: 'Facture n°', sv: 'Faktura #', da: 'Faktura #' } as Record<EmailLocale, string>,
  descriptionCol: { en: 'Description', pt: 'Descrição', es: 'Descripción', de: 'Beschreibung', nl: 'Omschrijving', fr: 'Description', sv: 'Beskrivning', da: 'Beskrivelse' } as Record<EmailLocale, string>,
  amountCol: { en: 'Amount', pt: 'Valor', es: 'Importe', de: 'Betrag', nl: 'Bedrag', fr: 'Montant', sv: 'Belopp', da: 'Beløb' } as Record<EmailLocale, string>,
  dueDate: { en: 'Due date', pt: 'Data de vencimento', es: 'Fecha de vencimiento', de: 'Fälligkeitsdatum', nl: 'Vervaldatum', fr: 'Date d\'échéance', sv: 'Förfallodatum', da: 'Forfaldsdato' } as Record<EmailLocale, string>,
  portalAccess: { en: 'You can view your account and invoices at any time through your owner portal.', pt: 'Podes consultar a tua conta e facturas a qualquer momento no portal.', es: 'Puedes ver tu cuenta y facturas en cualquier momento desde el portal.', de: 'Sie können Ihr Konto und Rechnungen jederzeit über Ihr Eigentümerportal einsehen.', nl: 'U kunt uw account en facturen op elk moment in het portaal bekijken.', fr: 'Vous pouvez consulter votre compte et vos factures à tout moment dans le portail.', sv: 'Du kan se ditt konto och fakturor när som helst via portalen.', da: 'Du kan se din konto og fakturaer når som helst via portalen.' } as Record<EmailLocale, string>,
  cta: { en: 'View in portal', pt: 'Ver no portal', es: 'Ver en el portal', de: 'Im Portal ansehen', nl: 'Bekijken in portaal', fr: 'Voir dans le portail', sv: 'Visa i portalen', da: 'Se i portalen' } as Record<EmailLocale, string>,
  thanks: { en: 'Thank you for your trust.', pt: 'Obrigado pela tua confiança.', es: 'Gracias por tu confianza.', de: 'Vielen Dank für Ihr Vertrauen.', nl: 'Bedankt voor uw vertrouwen.', fr: 'Merci pour votre confiance.', sv: 'Tack för ditt förtroende.', da: 'Tak for din tillid.' } as Record<EmailLocale, string>,
}

// ─── Receipt Paid ───────────────────────────────────────────────────────────

export const receiptPaidI18n = {
  subject: (loc: EmailLocale, propertyOrService: string) => ({
    en: `Payment confirmed — ${propertyOrService}`,
    pt: `Pagamento confirmado — ${propertyOrService}`,
    es: `Pago confirmado — ${propertyOrService}`,
    de: `Zahlung bestätigt — ${propertyOrService}`,
    nl: `Betaling bevestigd — ${propertyOrService}`,
    fr: `Paiement confirmé — ${propertyOrService}`,
    sv: `Betalning bekräftad — ${propertyOrService}`,
    da: `Betaling bekræftet — ${propertyOrService}`,
  }[loc]),
  title: { en: 'Payment confirmed', pt: 'Pagamento confirmado', es: 'Pago confirmado', de: 'Zahlung bestätigt', nl: 'Betaling bevestigd', fr: 'Paiement confirmé', sv: 'Betalning bekräftad', da: 'Betaling bekræftet' } as Record<EmailLocale, string>,
  thanksName: (loc: EmailLocale, name: string) => ({
    en: `Thank you, ${name}`, pt: `Obrigado, ${name}`, es: `Gracias, ${name}`, de: `Vielen Dank, ${name}`, nl: `Bedankt, ${name}`, fr: `Merci, ${name}`, sv: `Tack, ${name}`, da: `Tak, ${name}`,
  }[loc]),
  amountPaid: { en: 'Amount paid', pt: 'Valor pago', es: 'Importe pagado', de: 'Bezahlter Betrag', nl: 'Betaald bedrag', fr: 'Montant payé', sv: 'Betalat belopp', da: 'Betalt beløb' } as Record<EmailLocale, string>,
  invoiceLabel: (loc: EmailLocale, id: string) => ({
    en: `Invoice #${id}`, pt: `Factura #${id}`, es: `Factura #${id}`, de: `Rechnung #${id}`, nl: `Factuur #${id}`, fr: `Facture n°${id}`, sv: `Faktura #${id}`, da: `Faktura #${id}`,
  }[loc]),
  service: { en: 'Service:', pt: 'Serviço:', es: 'Servicio:', de: 'Leistung:', nl: 'Service:', fr: 'Service :', sv: 'Tjänst:', da: 'Service:' } as Record<EmailLocale, string>,
  appreciation: { en: 'We appreciate your continued partnership. Your property is in good hands.', pt: 'Agradecemos a tua confiança. A tua propriedade está em boas mãos.', es: 'Agradecemos tu confianza. Tu propiedad está en buenas manos.', de: 'Wir schätzen Ihre fortwährende Partnerschaft. Ihre Immobilie ist in guten Händen.', nl: 'We waarderen uw voortdurende samenwerking. Uw woning is in goede handen.', fr: 'Nous apprécions votre confiance continue. Votre bien est entre de bonnes mains.', sv: 'Vi uppskattar ditt fortsatta samarbete. Din fastighet är i goda händer.', da: 'Vi sætter pris på dit fortsatte samarbejde. Din ejendom er i gode hænder.' } as Record<EmailLocale, string>,
  cta: { en: 'View your portal', pt: 'Ver portal', es: 'Ver portal', de: 'Portal ansehen', nl: 'Portaal bekijken', fr: 'Voir le portail', sv: 'Visa portal', da: 'Se portal' } as Record<EmailLocale, string>,
  warmRegards: { en: 'Warm regards,', pt: 'Cumprimentos,', es: 'Saludos cordiales,', de: 'Mit freundlichen Grüßen,', nl: 'Met vriendelijke groet,', fr: 'Cordialement,', sv: 'Vänliga hälsningar,', da: 'Med venlig hilsen,' } as Record<EmailLocale, string>,
}

// ─── Task / Visit Completed ─────────────────────────────────────────────────

export const taskCompletedI18n = {
  subject: (loc: EmailLocale, propertyName: string) => ({
    en: `Visit completed at ${propertyName}`,
    pt: `Visita concluída em ${propertyName}`,
    es: `Visita completada en ${propertyName}`,
    de: `Besuch abgeschlossen bei ${propertyName}`,
    nl: `Bezoek voltooid bij ${propertyName}`,
    fr: `Visite terminée à ${propertyName}`,
    sv: `Besök slutfört vid ${propertyName}`,
    da: `Besøg afsluttet på ${propertyName}`,
  }[loc]),
  titlePrefix: { en: 'Visit completed at', pt: 'Visita concluída em', es: 'Visita completada en', de: 'Besuch abgeschlossen bei', nl: 'Bezoek voltooid bij', fr: 'Visite terminée à', sv: 'Besök slutfört vid', da: 'Besøg afsluttet på' } as Record<EmailLocale, string>,
  status: { en: 'Status:', pt: 'Estado:', es: 'Estado:', de: 'Status:', nl: 'Status:', fr: 'Statut :', sv: 'Status:', da: 'Status:' } as Record<EmailLocale, string>,
  conditionGood: { en: 'Good condition', pt: 'Boas condições', es: 'Buen estado', de: 'Guter Zustand', nl: 'Goede staat', fr: 'Bon état', sv: 'Gott skick', da: 'God stand' } as Record<EmailLocale, string>,
  conditionMinor: { en: 'Minor issues observed', pt: 'Pequenos problemas observados', es: 'Problemas menores observados', de: 'Kleine Probleme festgestellt', nl: 'Kleine problemen opgemerkt', fr: 'Problèmes mineurs observés', sv: 'Mindre problem upptäckta', da: 'Mindre problemer observeret' } as Record<EmailLocale, string>,
  conditionMajor: { en: 'Major issues — follow-up required', pt: 'Problemas maiores — necessita seguimento', es: 'Problemas mayores — requiere seguimiento', de: 'Größere Probleme — Nachverfolgung erforderlich', nl: 'Grote problemen — opvolging nodig', fr: 'Problèmes majeurs — suivi requis', sv: 'Större problem — uppföljning krävs', da: 'Større problemer — opfølgning påkrævet' } as Record<EmailLocale, string>,
  notesLabel: { en: 'Notes from our team:', pt: 'Notas da nossa equipa:', es: 'Notas de nuestro equipo:', de: 'Hinweise unseres Teams:', nl: 'Opmerkingen van ons team:', fr: 'Notes de notre équipe :', sv: 'Anteckningar från vårt team:', da: 'Bemærkninger fra vores team:' } as Record<EmailLocale, string>,
  fullReport: { en: 'You can view the full report in your dashboard at any time.', pt: 'Podes ver o relatório completo no painel a qualquer momento.', es: 'Puedes ver el informe completo en tu panel en cualquier momento.', de: 'Den vollständigen Bericht finden Sie jederzeit in Ihrem Dashboard.', nl: 'U kunt het volledige rapport op elk moment in uw dashboard bekijken.', fr: 'Vous pouvez consulter le rapport complet dans votre tableau de bord à tout moment.', sv: 'Du kan se den fullständiga rapporten i din panel när som helst.', da: 'Du kan se den fulde rapport i dit dashboard når som helst.' } as Record<EmailLocale, string>,
}

// ─── Email Verification (registration) ─────────────────────────────────────

export const verificationI18n = {
  subject: { en: 'Confirm your HostMasters account', pt: 'Confirma a tua conta HostMasters', es: 'Confirma tu cuenta de HostMasters', de: 'Bestätigen Sie Ihr HostMasters-Konto', nl: 'Bevestig uw HostMasters-account', fr: 'Confirmez votre compte HostMasters', sv: 'Bekräfta ditt HostMasters-konto', da: 'Bekræft din HostMasters-konto' } as Record<EmailLocale, string>,
  title: { en: 'Confirm your email', pt: 'Confirma o teu email', es: 'Confirma tu email', de: 'E-Mail bestätigen', nl: 'Bevestig uw e-mailadres', fr: 'Confirmez votre email', sv: 'Bekräfta din e-post', da: 'Bekræft din e-mail' } as Record<EmailLocale, string>,
  greeting: (loc: EmailLocale, name: string) => ({
    en: `Hi ${name}`, pt: `Olá ${name}`, es: `Hola ${name}`, de: `Hallo ${name}`, nl: `Hallo ${name}`, fr: `Bonjour ${name}`, sv: `Hej ${name}`, da: `Hej ${name}`,
  }[loc]),
  intro: { en: 'Welcome to HostMasters! Click the button below to confirm your email and activate your account.', pt: 'Bem-vindo à HostMasters! Clica no botão abaixo para confirmar o teu email e activar a conta.', es: '¡Bienvenido a HostMasters! Haz clic en el botón abajo para confirmar tu correo y activar tu cuenta.', de: 'Willkommen bei HostMasters! Klicken Sie unten, um Ihre E-Mail zu bestätigen und Ihr Konto zu aktivieren.', nl: 'Welkom bij HostMasters! Klik op de knop hieronder om uw e-mail te bevestigen en uw account te activeren.', fr: 'Bienvenue chez HostMasters ! Cliquez sur le bouton ci-dessous pour confirmer votre email et activer votre compte.', sv: 'Välkommen till HostMasters! Klicka på knappen nedan för att bekräfta din e-post och aktivera ditt konto.', da: 'Velkommen til HostMasters! Klik på knappen nedenfor for at bekræfte din e-mail og aktivere din konto.' } as Record<EmailLocale, string>,
  cta: { en: 'Confirm my email', pt: 'Confirmar email', es: 'Confirmar email', de: 'E-Mail bestätigen', nl: 'E-mail bevestigen', fr: 'Confirmer mon email', sv: 'Bekräfta min e-post', da: 'Bekræft min e-mail' } as Record<EmailLocale, string>,
  pasteFallback: { en: 'Or paste this link into your browser:', pt: 'Ou cola este link no navegador:', es: 'O pega este enlace en tu navegador:', de: 'Oder fügen Sie diesen Link in Ihren Browser ein:', nl: 'Of plak deze link in uw browser:', fr: 'Ou collez ce lien dans votre navigateur :', sv: 'Eller klistra in denna länk i din webbläsare:', da: 'Eller indsæt dette link i din browser:' } as Record<EmailLocale, string>,
  expires: { en: 'This link expires in 24 hours. If you didn\'t create an account, ignore this email.', pt: 'Este link expira em 24 horas. Se não criaste uma conta, ignora este email.', es: 'Este enlace caduca en 24 horas. Si no creaste una cuenta, ignora este correo.', de: 'Dieser Link ist 24 Stunden gültig. Wenn Sie kein Konto erstellt haben, ignorieren Sie diese E-Mail.', nl: 'Deze link verloopt over 24 uur. Als u geen account heeft aangemaakt, negeer deze e-mail.', fr: 'Ce lien expire dans 24 heures. Si vous n\'avez pas créé de compte, ignorez cet email.', sv: 'Denna länk upphör om 24 timmar. Om du inte skapat ett konto, ignorera detta e-postmeddelande.', da: 'Linket udløber om 24 timer. Hvis du ikke oprettede en konto, kan du ignorere denne e-mail.' } as Record<EmailLocale, string>,
}

// ─── Recruit / Admin Invite ─────────────────────────────────────────────────

export const inviteI18n = {
  subject: (loc: EmailLocale, role: string) => ({
    en: `Welcome to HostMasters — ${role}`,
    pt: `Bem-vindo à HostMasters — ${role}`,
    es: `Bienvenido a HostMasters — ${role}`,
    de: `Willkommen bei HostMasters — ${role}`,
    nl: `Welkom bij HostMasters — ${role}`,
    fr: `Bienvenue chez HostMasters — ${role}`,
    sv: `Välkommen till HostMasters — ${role}`,
    da: `Velkommen til HostMasters — ${role}`,
  }[loc]),
  greeting: (loc: EmailLocale, name: string) => ({
    en: `Welcome ${name}`, pt: `Bem-vindo ${name}`, es: `Bienvenido ${name}`, de: `Willkommen ${name}`, nl: `Welkom ${name}`, fr: `Bienvenue ${name}`, sv: `Välkommen ${name}`, da: `Velkommen ${name}`,
  }[loc]),
  introRecruit: (loc: EmailLocale, role: string) => ({
    en: `Your ${role} application has been approved. Set your password to complete your setup.`,
    pt: `A tua candidatura como ${role} foi aprovada. Define a tua palavra-passe para completar o registo.`,
    es: `Tu solicitud como ${role} ha sido aprobada. Establece tu contraseña para completar tu registro.`,
    de: `Ihre Bewerbung als ${role} wurde genehmigt. Legen Sie Ihr Passwort fest, um die Einrichtung abzuschließen.`,
    nl: `Uw aanvraag als ${role} is goedgekeurd. Stel uw wachtwoord in om de installatie te voltooien.`,
    fr: `Votre candidature en tant que ${role} a été approuvée. Définissez votre mot de passe pour terminer la configuration.`,
    sv: `Din ansökan som ${role} har godkänts. Ange ditt lösenord för att slutföra registreringen.`,
    da: `Din ansøgning som ${role} er godkendt. Vælg din adgangskode for at fuldføre opsætningen.`,
  }[loc]),
  introAdminInvite: (loc: EmailLocale, role: string) => ({
    en: `You've been invited to HostMasters as a <strong>${role}</strong>.`,
    pt: `Foste convidado para a plataforma HostMasters como <strong>${role}</strong>.`,
    es: `Has sido invitado a la plataforma HostMasters como <strong>${role}</strong>.`,
    de: `Sie wurden zu HostMasters als <strong>${role}</strong> eingeladen.`,
    nl: `U bent uitgenodigd voor HostMasters als <strong>${role}</strong>.`,
    fr: `Vous avez été invité chez HostMasters en tant que <strong>${role}</strong>.`,
    sv: `Du har bjudits in till HostMasters som <strong>${role}</strong>.`,
    da: `Du er blevet inviteret til HostMasters som <strong>${role}</strong>.`,
  }[loc]),
  cta: { en: 'Set my password →', pt: 'Definir palavra-passe →', es: 'Establecer contraseña →', de: 'Passwort festlegen →', nl: 'Wachtwoord instellen →', fr: 'Définir mon mot de passe →', sv: 'Ange mitt lösenord →', da: 'Vælg adgangskode →' } as Record<EmailLocale, string>,
  expires24h: { en: 'This link is exclusive to you and expires in 24 hours. After setting your password you\'ll review and sign your service agreement.', pt: 'Este link é exclusivo para ti e expira em 24 horas. Depois de definires a palavra-passe, vais rever e assinar o contrato de serviço.', es: 'Este enlace es exclusivo para ti y caduca en 24 horas. Después de establecer tu contraseña, revisarás y firmarás el contrato de servicio.', de: 'Dieser Link ist exklusiv für Sie und 24 Stunden gültig. Nach dem Festlegen Ihres Passworts werden Sie Ihren Servicevertrag prüfen und unterzeichnen.', nl: 'Deze link is exclusief voor u en verloopt over 24 uur. Na het instellen van uw wachtwoord beoordeelt en ondertekent u uw serviceovereenkomst.', fr: 'Ce lien vous est exclusif et expire dans 24 heures. Après avoir défini votre mot de passe, vous examinerez et signerez votre contrat de service.', sv: 'Den här länken är exklusiv för dig och upphör om 24 timmar. Efter att ha angett ditt lösenord kommer du att granska och underteckna ditt serviceavtal.', da: 'Linket er kun til dig og udløber om 24 timer. Efter at have valgt din adgangskode vil du gennemgå og underskrive din serviceaftale.' } as Record<EmailLocale, string>,
}

// ─── Legacy Notifications (booking + checkout reminder + monthly report ready) ────

export const newBookingI18n = {
  subject: (loc: EmailLocale, propertyName: string) => ({
    en: `New Booking: ${propertyName}`, pt: `Nova reserva: ${propertyName}`, es: `Nueva reserva: ${propertyName}`, de: `Neue Buchung: ${propertyName}`, nl: `Nieuwe boeking: ${propertyName}`, fr: `Nouvelle réservation : ${propertyName}`, sv: `Ny bokning: ${propertyName}`, da: `Ny booking: ${propertyName}`,
  }[loc]),
  title: { en: 'New Booking Received', pt: 'Nova reserva recebida', es: 'Nueva reserva recibida', de: 'Neue Buchung erhalten', nl: 'Nieuwe boeking ontvangen', fr: 'Nouvelle réservation reçue', sv: 'Ny bokning mottagen', da: 'Ny booking modtaget' } as Record<EmailLocale, string>,
  intro: { en: 'A new reservation has been made:', pt: 'Foi feita uma nova reserva:', es: 'Se ha realizado una nueva reserva:', de: 'Eine neue Reservierung wurde vorgenommen:', nl: 'Er is een nieuwe boeking gemaakt:', fr: 'Une nouvelle réservation a été effectuée :', sv: 'En ny bokning har gjorts:', da: 'En ny reservation er foretaget:' } as Record<EmailLocale, string>,
  property: { en: 'Property:', pt: 'Propriedade:', es: 'Propiedad:', de: 'Immobilie:', nl: 'Woning:', fr: 'Bien :', sv: 'Fastighet:', da: 'Ejendom:' } as Record<EmailLocale, string>,
  guest: { en: 'Guest:', pt: 'Hóspede:', es: 'Huésped:', de: 'Gast:', nl: 'Gast:', fr: 'Invité :', sv: 'Gäst:', da: 'Gæst:' } as Record<EmailLocale, string>,
  checkIn: { en: 'Check-in:', pt: 'Check-in:', es: 'Check-in:', de: 'Check-in:', nl: 'Check-in:', fr: 'Arrivée :', sv: 'Incheckning:', da: 'Check-in:' } as Record<EmailLocale, string>,
  checkOut: { en: 'Check-out:', pt: 'Check-out:', es: 'Check-out:', de: 'Check-out:', nl: 'Check-out:', fr: 'Départ :', sv: 'Utcheckning:', da: 'Check-out:' } as Record<EmailLocale, string>,
}

export const checkoutReminderI18n = {
  subject: (loc: EmailLocale, propertyName: string) => ({
    en: `Checkout Tomorrow: ${propertyName}`, pt: `Check-out amanhã: ${propertyName}`, es: `Check-out mañana: ${propertyName}`, de: `Check-out morgen: ${propertyName}`, nl: `Check-out morgen: ${propertyName}`, fr: `Départ demain : ${propertyName}`, sv: `Utcheckning imorgon: ${propertyName}`, da: `Check-out i morgen: ${propertyName}`,
  }[loc]),
  title: { en: 'Checkout Tomorrow', pt: 'Check-out amanhã', es: 'Check-out mañana', de: 'Check-out morgen', nl: 'Check-out morgen', fr: 'Départ demain', sv: 'Utcheckning imorgon', da: 'Check-out i morgen' } as Record<EmailLocale, string>,
  body: (loc: EmailLocale, guest: string, property: string, date: string) => ({
    en: `<strong>${guest}</strong> is checking out of <strong>${property}</strong> tomorrow (${date}).`,
    pt: `<strong>${guest}</strong> faz check-out de <strong>${property}</strong> amanhã (${date}).`,
    es: `<strong>${guest}</strong> hace check-out de <strong>${property}</strong> mañana (${date}).`,
    de: `<strong>${guest}</strong> checkt morgen aus <strong>${property}</strong> aus (${date}).`,
    nl: `<strong>${guest}</strong> checkt morgen uit <strong>${property}</strong> uit (${date}).`,
    fr: `<strong>${guest}</strong> quitte <strong>${property}</strong> demain (${date}).`,
    sv: `<strong>${guest}</strong> checkar ut från <strong>${property}</strong> imorgon (${date}).`,
    da: `<strong>${guest}</strong> tjekker ud af <strong>${property}</strong> i morgen (${date}).`,
  }[loc]),
  ensure: { en: 'Please ensure cleaning and inspection tasks are scheduled.', pt: 'Garante que limpeza e inspecção estão agendadas.', es: 'Asegura que la limpieza y la inspección están programadas.', de: 'Bitte stellen Sie sicher, dass Reinigung und Inspektion geplant sind.', nl: 'Zorg ervoor dat schoonmaak en inspectie zijn ingepland.', fr: 'Veuillez vous assurer que le ménage et l\'inspection sont planifiés.', sv: 'Säkerställ att städning och inspektion är schemalagda.', da: 'Sørg for at rengøring og inspektion er planlagt.' } as Record<EmailLocale, string>,
}

export const monthlyReportReadyI18n = {
  subject: (loc: EmailLocale, propertyName: string, month: string, year: number) => ({
    en: `Monthly Report: ${propertyName} - ${month} ${year}`,
    pt: `Relatório mensal: ${propertyName} - ${month} ${year}`,
    es: `Informe mensual: ${propertyName} - ${month} ${year}`,
    de: `Monatsbericht: ${propertyName} - ${month} ${year}`,
    nl: `Maandrapport: ${propertyName} - ${month} ${year}`,
    fr: `Rapport mensuel : ${propertyName} - ${month} ${year}`,
    sv: `Månadsrapport: ${propertyName} - ${month} ${year}`,
    da: `Månedsrapport: ${propertyName} - ${month} ${year}`,
  }[loc]),
  title: { en: 'Monthly Report Available', pt: 'Relatório mensal disponível', es: 'Informe mensual disponible', de: 'Monatsbericht verfügbar', nl: 'Maandrapport beschikbaar', fr: 'Rapport mensuel disponible', sv: 'Månadsrapport tillgänglig', da: 'Månedsrapport tilgængelig' } as Record<EmailLocale, string>,
  body: (loc: EmailLocale, propertyName: string, month: string, year: number) => ({
    en: `Your monthly report for <strong>${propertyName}</strong> (${month} ${year}) is now available.`,
    pt: `O teu relatório mensal de <strong>${propertyName}</strong> (${month} ${year}) está disponível.`,
    es: `Tu informe mensual para <strong>${propertyName}</strong> (${month} ${year}) ya está disponible.`,
    de: `Ihr Monatsbericht für <strong>${propertyName}</strong> (${month} ${year}) ist verfügbar.`,
    nl: `Uw maandrapport voor <strong>${propertyName}</strong> (${month} ${year}) is nu beschikbaar.`,
    fr: `Votre rapport mensuel pour <strong>${propertyName}</strong> (${month} ${year}) est désormais disponible.`,
    sv: `Din månadsrapport för <strong>${propertyName}</strong> (${month} ${year}) är nu tillgänglig.`,
    da: `Din månedsrapport for <strong>${propertyName}</strong> (${month} ${year}) er nu tilgængelig.`,
  }[loc]),
  cta: { en: 'Log in to your dashboard to view and download the full report.', pt: 'Entra no painel para ver e descarregar o relatório completo.', es: 'Inicia sesión en tu panel para ver y descargar el informe completo.', de: 'Melden Sie sich in Ihrem Dashboard an, um den vollständigen Bericht zu sehen und herunterzuladen.', nl: 'Log in op uw dashboard om het volledige rapport te bekijken en downloaden.', fr: 'Connectez-vous à votre tableau de bord pour consulter et télécharger le rapport complet.', sv: 'Logga in på din panel för att se och ladda ner den fullständiga rapporten.', da: 'Log ind på dit dashboard for at se og downloade den fulde rapport.' } as Record<EmailLocale, string>,
}
