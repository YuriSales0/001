/**
 * Guest-facing i18n strings (used in /stay/[token] and /feedback/[token]).
 * These pages are public (token-based) so cannot use the NextAuth-backed
 * useLocale hook — they get language from the API response.
 */

type GuestLang = 'en' | 'pt' | 'es' | 'de' | 'nl' | 'fr' | 'sv' | 'da'

export const GUEST_STRINGS = {
  // /stay/[token]
  stay: {
    greeting: {
      en: "Hi {name}! I'm HostMasters' AI assistant. I'm here to help during your stay.",
      pt: "Olá {name}! Sou o assistente IA da HostMasters. Estou aqui para te ajudar durante a estadia.",
      es: "¡Hola {name}! Soy el asistente IA de HostMasters. Estoy aquí para ayudarte durante tu estancia.",
      de: "Hallo {name}! Ich bin der KI-Assistent von HostMasters. Ich helfe Ihnen während Ihres Aufenthalts.",
      nl: "Hallo {name}! Ik ben de AI-assistent van HostMasters. Ik help u tijdens uw verblijf.",
      fr: "Bonjour {name} ! Je suis l'assistant IA de HostMasters. Je suis là pour vous aider durant votre séjour.",
      sv: "Hej {name}! Jag är HostMasters AI-assistent. Jag hjälper dig under din vistelse.",
      da: "Hej {name}! Jeg er HostMasters AI-assistent. Jeg hjælper dig under dit ophold.",
    },
    greetingSub: {
      en: 'Ask me about WiFi, amenities, local tips, or anything else.',
      pt: 'Pergunta-me sobre WiFi, amenities, dicas locais ou qualquer coisa.',
      es: 'Pregúntame sobre WiFi, servicios, consejos locales o cualquier cosa.',
      de: 'Fragen Sie mich nach WLAN, Annehmlichkeiten, lokalen Tipps oder allem anderen.',
      nl: 'Vraag me over WiFi, voorzieningen, lokale tips of wat dan ook.',
      fr: 'Demandez-moi sur le WiFi, les services, les conseils locaux ou autre.',
      sv: 'Fråga mig om WiFi, bekvämligheter, lokala tips eller vad som helst.',
      da: 'Spørg mig om WiFi, faciliteter, lokale tips eller hvad som helst.',
    },
    placeholder: {
      en: 'Type a message...',
      pt: 'Escreve uma mensagem...',
      es: 'Escribe un mensaje...',
      de: 'Nachricht eingeben...',
      nl: 'Typ een bericht...',
      fr: 'Écrivez un message...',
      sv: 'Skriv ett meddelande...',
      da: 'Skriv en besked...',
    },
    humanButton: {
      en: 'Human', pt: 'Pessoa', es: 'Humano', de: 'Mensch',
      nl: 'Mens', fr: 'Humain', sv: 'Människa', da: 'Menneske',
    },
    escalationBanner: {
      en: 'A person from HostMasters is reviewing your conversation and will reply shortly.',
      pt: 'Uma pessoa da HostMasters está a rever a conversa e responderá em breve.',
      es: 'Una persona de HostMasters está revisando tu conversación y responderá en breve.',
      de: 'Ein Mitarbeiter von HostMasters prüft Ihre Unterhaltung und antwortet in Kürze.',
      nl: 'Een medewerker van HostMasters bekijkt uw gesprek en reageert zo spoedig mogelijk.',
      fr: 'Une personne de HostMasters examine votre conversation et répondra sous peu.',
      sv: 'En person från HostMasters granskar ditt samtal och svarar snart.',
      da: 'En person fra HostMasters gennemgår din samtale og svarer snart.',
    },
    footerNote: {
      en: 'AI responses are generated instantly. A human is available via the Human button.',
      pt: 'Respostas IA são geradas instantaneamente. Uma pessoa está disponível via o botão.',
      es: 'Las respuestas IA son instantáneas. Una persona está disponible via el botón.',
      de: 'KI-Antworten werden sofort generiert. Ein Mensch ist über die Schaltfläche erreichbar.',
      nl: 'AI-antwoorden zijn direct. Een mens is beschikbaar via de knop.',
      fr: "Les réponses IA sont instantanées. Une personne est disponible via le bouton.",
      sv: 'AI-svar är direkta. En person är tillgänglig via knappen.',
      da: 'AI-svar er øjeblikkelige. En person er tilgængelig via knappen.',
    },
    expired: {
      en: 'This chat has expired.',
      pt: 'Este chat expirou.',
      es: 'Este chat ha expirado.',
      de: 'Dieser Chat ist abgelaufen.',
      nl: 'Deze chat is verlopen.',
      fr: 'Ce chat a expiré.',
      sv: 'Chatten har upphört.',
      da: 'Denne chat er udløbet.',
    },
    rateLimit: {
      en: 'Too many messages. Please wait a few minutes before sending again.',
      pt: 'Demasiadas mensagens. Aguarda alguns minutos antes de enviar novamente.',
      es: 'Demasiados mensajes. Espera unos minutos antes de enviar otra vez.',
      de: 'Zu viele Nachrichten. Bitte warten Sie ein paar Minuten.',
      nl: 'Te veel berichten. Wacht een paar minuten voordat u opnieuw verzendt.',
      fr: 'Trop de messages. Attendez quelques minutes avant de renvoyer.',
      sv: 'För många meddelanden. Vänta några minuter innan du skickar igen.',
      da: 'For mange beskeder. Vent et par minutter før du sender igen.',
    },
  },
  // /feedback/[token]
  feedback: {
    title: {
      en: 'Feedback',
      pt: 'Opinião',
      es: 'Opinión',
      de: 'Feedback',
      nl: 'Feedback',
      fr: 'Avis',
      sv: 'Återkoppling',
      da: 'Feedback',
    },
    intro: {
      en: 'Hi {name}, thank you for staying with us. A few quick questions take about 2 minutes.',
      pt: 'Olá {name}, obrigado por ficares connosco. Algumas perguntas rápidas, cerca de 2 minutos.',
      es: 'Hola {name}, gracias por quedarte. Unas preguntas rápidas, unos 2 minutos.',
      de: 'Hallo {name}, danke für Ihren Aufenthalt. Ein paar Fragen, ca. 2 Minuten.',
      nl: 'Hallo {name}, bedankt voor uw verblijf. Een paar vragen, ongeveer 2 minuten.',
      fr: 'Bonjour {name}, merci pour votre séjour. Quelques questions, environ 2 minutes.',
      sv: 'Hej {name}, tack för ditt besök. Några frågor, cirka 2 minuter.',
      da: 'Hej {name}, tak for dit ophold. Nogle spørgsmål, cirka 2 minutter.',
    },
    propertySection: { en: 'About the property', pt: 'Sobre a propriedade', es: 'Sobre la propiedad', de: 'Über die Immobilie', nl: 'Over het pand', fr: 'À propos du logement', sv: 'Om fastigheten', da: 'Om ejendommen' },
    propertyDesc: {
      en: 'Structure, amenities, location, value — what the owner provides.',
      pt: 'Estrutura, amenities, localização, valor — o que o proprietário oferece.',
      es: 'Estructura, servicios, ubicación, valor — lo que el propietario proporciona.',
      de: 'Struktur, Ausstattung, Lage, Wert — was der Eigentümer bietet.',
      nl: 'Structuur, voorzieningen, locatie, waarde — wat de eigenaar biedt.',
      fr: 'Structure, équipements, emplacement, valeur — ce que le propriétaire fournit.',
      sv: 'Struktur, bekvämligheter, plats, värde — vad ägaren erbjuder.',
      da: 'Struktur, faciliteter, placering, værdi — hvad ejeren tilbyder.',
    },
    crewSection: { en: 'How you received it', pt: 'Como recebeste', es: 'Cómo la recibiste', de: 'Wie Sie es erhalten haben', nl: 'Hoe u het aantrof', fr: 'Comment vous l\'avez reçu', sv: 'Hur du mottog den', da: 'Hvordan du modtog det' },
    crewDesc: {
      en: 'Cleanliness and condition on arrival.',
      pt: 'Limpeza e estado à chegada.',
      es: 'Limpieza y estado a la llegada.',
      de: 'Sauberkeit und Zustand bei Ankunft.',
      nl: 'Netheid en staat bij aankomst.',
      fr: 'Propreté et état à l\'arrivée.',
      sv: 'Renlighet och skick vid ankomst.',
      da: 'Renlighed og tilstand ved ankomst.',
    },
    platformSection: { en: 'HostMasters management', pt: 'Gestão HostMasters', es: 'Gestión HostMasters', de: 'HostMasters-Verwaltung', nl: 'HostMasters-beheer', fr: 'Gestion HostMasters', sv: 'HostMasters-hantering', da: 'HostMasters-administration' },
    platformDesc: {
      en: 'Communication, check-in, check-out, support.',
      pt: 'Comunicação, check-in, check-out, suporte.',
      es: 'Comunicación, check-in, check-out, soporte.',
      de: 'Kommunikation, Check-in, Check-out, Support.',
      nl: 'Communicatie, check-in, check-out, support.',
      fr: 'Communication, check-in, check-out, support.',
      sv: 'Kommunikation, check-in, check-out, support.',
      da: 'Kommunikation, check-in, check-out, support.',
    },
    tellUsMore: { en: 'Tell us more', pt: 'Conta-nos mais', es: 'Cuéntanos más', de: 'Erzählen Sie mehr', nl: 'Vertel ons meer', fr: 'Dites-nous en plus', sv: 'Berätta mer', da: 'Fortæl os mere' },
    positive: { en: 'What stood out positively?', pt: 'O que se destacou positivamente?', es: '¿Qué destacó positivamente?', de: 'Was war besonders positiv?', nl: 'Wat viel positief op?', fr: 'Qu\'est-ce qui a été positif ?', sv: 'Vad utmärkte sig positivt?', da: 'Hvad skilte sig positivt ud?' },
    improvement: { en: 'What could we improve?', pt: 'O que podemos melhorar?', es: '¿Qué podríamos mejorar?', de: 'Was können wir verbessern?', nl: 'Wat kunnen we verbeteren?', fr: 'Que pourrions-nous améliorer ?', sv: 'Vad kan vi förbättra?', da: 'Hvad kan vi forbedre?' },
    recommendation: { en: 'What would you tell a friend about staying here?', pt: 'O que dirias a um amigo sobre ficar aqui?', es: '¿Qué le dirías a un amigo?', de: 'Was würden Sie einem Freund erzählen?', nl: 'Wat zou u een vriend vertellen?', fr: 'Que diriez-vous à un ami ?', sv: 'Vad skulle du säga till en vän?', da: 'Hvad ville du fortælle en ven?' },
    reviewOptIn: { en: 'Send me a link to leave a review on Airbnb/Booking.com', pt: 'Envia-me um link para deixar review no Airbnb/Booking', es: 'Envíame un enlace para dejar reseña en Airbnb/Booking', de: 'Senden Sie mir einen Link für eine Bewertung auf Airbnb/Booking', nl: 'Stuur me een link voor een review op Airbnb/Booking', fr: 'Envoyez-moi un lien pour laisser un avis sur Airbnb/Booking', sv: 'Skicka mig en länk för recension på Airbnb/Booking', da: 'Send mig et link til anmeldelse på Airbnb/Booking' },
    submit: { en: 'Send feedback', pt: 'Enviar opinião', es: 'Enviar opinión', de: 'Feedback senden', nl: 'Feedback verzenden', fr: 'Envoyer l\'avis', sv: 'Skicka feedback', da: 'Send feedback' },
    sending: { en: 'Sending…', pt: 'A enviar…', es: 'Enviando…', de: 'Senden…', nl: 'Verzenden…', fr: 'Envoi…', sv: 'Skickar…', da: 'Sender…' },
    thankYou: { en: 'Thank you!', pt: 'Obrigado!', es: '¡Gracias!', de: 'Danke!', nl: 'Dank u!', fr: 'Merci !', sv: 'Tack!', da: 'Tak!' },
    thankYouDesc: {
      en: 'Your feedback has been received. It helps us improve.',
      pt: 'Recebemos a tua opinião. Ajuda-nos a melhorar.',
      es: 'Hemos recibido tu opinión. Nos ayuda a mejorar.',
      de: 'Wir haben Ihr Feedback erhalten. Es hilft uns, besser zu werden.',
      nl: 'We hebben uw feedback ontvangen. Het helpt ons verbeteren.',
      fr: 'Nous avons reçu votre avis. Il nous aide à nous améliorer.',
      sv: 'Vi har mottagit din feedback. Den hjälper oss att bli bättre.',
      da: 'Vi har modtaget din feedback. Den hjælper os med at forbedre os.',
    },
    notFound: { en: 'Feedback link not found or expired.', pt: 'Link não encontrado ou expirado.', es: 'Enlace no encontrado o caducado.', de: 'Link nicht gefunden oder abgelaufen.', nl: 'Link niet gevonden of verlopen.', fr: 'Lien introuvable ou expiré.', sv: 'Länk hittades inte eller har utgått.', da: 'Link ikke fundet eller udløbet.' },
    alreadyDone: { en: 'This feedback form has already been completed.', pt: 'Esta opinião já foi enviada.', es: 'Esta opinión ya ha sido enviada.', de: 'Dieses Feedback wurde bereits abgegeben.', nl: 'Deze feedback is al ingediend.', fr: 'Cet avis a déjà été envoyé.', sv: 'Denna feedback har redan skickats.', da: 'Denne feedback er allerede sendt.' },
  },
} as const

export function gt<
  Section extends keyof typeof GUEST_STRINGS,
  Key extends keyof typeof GUEST_STRINGS[Section],
>(section: Section, key: Key, lang: string, vars?: Record<string, string>): string {
  const normLang = (['en','pt','es','de','nl','fr','sv','da'].includes(lang) ? lang : 'en') as GuestLang
  const sec = GUEST_STRINGS[section] as Record<string, Record<GuestLang, string>>
  const template = sec[key as string]?.[normLang] ?? sec[key as string]?.en ?? ''
  if (!vars) return template
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), template)
}
