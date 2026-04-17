/**
 * Pre-defined house rules for short-term rental properties.
 * Owners select from this list during property setup — NO free text.
 *
 * Each rule has a unique key (stored in Property.houseRules[]),
 * a category, an icon hint, and labels per locale.
 */

export type HouseRuleCategory =
  | 'GENERAL'
  | 'SMOKING_PETS'
  | 'NOISE'
  | 'CHECK_IN_OUT'
  | 'SPACES'
  | 'SAFETY'
  | 'POOL'

type Labels = Record<string, string>

export type HouseRule = {
  key: string
  category: HouseRuleCategory
  icon: string
  labels: Labels
}

export const HOUSE_RULES: HouseRule[] = [
  // ── General ──
  { key: 'MAX_GUESTS', category: 'GENERAL', icon: '👥', labels: {
    en: 'Maximum occupancy must be respected', pt: 'A capacidade máxima deve ser respeitada', es: 'Respetar la capacidad máxima', de: 'Maximale Belegung beachten', nl: 'Maximale bezetting respecteren', fr: 'Capacité maximale à respecter', sv: 'Maximal beläggning måste respekteras', da: 'Maksimal kapacitet skal overholdes' } },
  { key: 'RESPECT_NEIGHBOURS', category: 'GENERAL', icon: '🏘️', labels: {
    en: 'Respect neighbours and surroundings', pt: 'Respeitar os vizinhos e o ambiente', es: 'Respetar a los vecinos y el entorno', de: 'Nachbarn und Umgebung respektieren', nl: 'Buren en omgeving respecteren', fr: 'Respecter les voisins et l\'environnement', sv: 'Respektera grannar och omgivning', da: 'Respektér naboer og omgivelser' } },
  { key: 'NO_EVENTS', category: 'GENERAL', icon: '🎉', labels: {
    en: 'No parties or events', pt: 'Sem festas ou eventos', es: 'No se permiten fiestas ni eventos', de: 'Keine Partys oder Veranstaltungen', nl: 'Geen feesten of evenementen', fr: 'Pas de fêtes ni d\'événements', sv: 'Inga fester eller evenemang', da: 'Ingen fester eller arrangementer' } },
  { key: 'NO_COMMERCIAL_USE', category: 'GENERAL', icon: '🚫', labels: {
    en: 'No commercial or professional use', pt: 'Sem uso comercial ou profissional', es: 'Sin uso comercial o profesional', de: 'Keine gewerbliche Nutzung', nl: 'Geen commercieel gebruik', fr: 'Pas d\'usage commercial ou professionnel', sv: 'Ingen kommersiell användning', da: 'Ingen kommerciel brug' } },
  { key: 'ID_REQUIRED', category: 'GENERAL', icon: '🪪', labels: {
    en: 'Valid ID required at check-in', pt: 'Documento de identificação obrigatório no check-in', es: 'DNI/pasaporte obligatorio al hacer check-in', de: 'Gültiger Ausweis beim Check-in erforderlich', nl: 'Geldig ID vereist bij check-in', fr: 'Pièce d\'identité obligatoire au check-in', sv: 'Giltig ID krävs vid incheckning', da: 'Gyldigt ID påkrævet ved check-in' } },

  // ── Smoking & Pets ──
  { key: 'NO_SMOKING', category: 'SMOKING_PETS', icon: '🚭', labels: {
    en: 'No smoking inside the property', pt: 'Proibido fumar no interior', es: 'Prohibido fumar en el interior', de: 'Rauchen im Gebäude verboten', nl: 'Niet roken binnen', fr: 'Interdiction de fumer à l\'intérieur', sv: 'Rökning förbjuden inomhus', da: 'Rygning forbudt indendørs' } },
  { key: 'SMOKING_TERRACE', category: 'SMOKING_PETS', icon: '🚬', labels: {
    en: 'Smoking allowed on terrace only', pt: 'Fumar permitido apenas no terraço', es: 'Fumar solo en la terraza', de: 'Rauchen nur auf der Terrasse', nl: 'Roken alleen op het terras', fr: 'Fumer uniquement sur la terrasse', sv: 'Rökning tillåten på terrassen', da: 'Rygning kun på terrassen' } },
  { key: 'NO_PETS', category: 'SMOKING_PETS', icon: '🐾', labels: {
    en: 'No pets allowed', pt: 'Animais não permitidos', es: 'No se admiten mascotas', de: 'Keine Haustiere erlaubt', nl: 'Geen huisdieren toegestaan', fr: 'Animaux non admis', sv: 'Inga husdjur tillåtna', da: 'Ingen kæledyr tilladt' } },
  { key: 'PETS_ALLOWED', category: 'SMOKING_PETS', icon: '🐕', labels: {
    en: 'Pets allowed (prior approval required)', pt: 'Animais permitidos (aprovação prévia necessária)', es: 'Mascotas permitidas (aprobación previa)', de: 'Haustiere erlaubt (Vorabgenehmigung)', nl: 'Huisdieren toegestaan (vooraf goedkeuring)', fr: 'Animaux acceptés (accord préalable)', sv: 'Husdjur tillåtna (förhandsgodkännande)', da: 'Kæledyr tilladt (forhåndsgodkendelse)' } },

  // ── Noise ──
  { key: 'QUIET_22_08', category: 'NOISE', icon: '🤫', labels: {
    en: 'Quiet hours: 22:00 – 08:00', pt: 'Horas de silêncio: 22:00 – 08:00', es: 'Horas de silencio: 22:00 – 08:00', de: 'Ruhezeiten: 22:00 – 08:00', nl: 'Stilteperiode: 22:00 – 08:00', fr: 'Heures calmes : 22h00 – 08h00', sv: 'Tysta timmar: 22:00 – 08:00', da: 'Stille timer: 22:00 – 08:00' } },
  { key: 'QUIET_23_08', category: 'NOISE', icon: '🤫', labels: {
    en: 'Quiet hours: 23:00 – 08:00', pt: 'Horas de silêncio: 23:00 – 08:00', es: 'Horas de silencio: 23:00 – 08:00', de: 'Ruhezeiten: 23:00 – 08:00', nl: 'Stilteperiode: 23:00 – 08:00', fr: 'Heures calmes : 23h00 – 08h00', sv: 'Tysta timmar: 23:00 – 08:00', da: 'Stille timer: 23:00 – 08:00' } },
  { key: 'NO_LOUD_MUSIC', category: 'NOISE', icon: '🔇', labels: {
    en: 'No loud music at any time', pt: 'Sem música alta a qualquer hora', es: 'Sin música alta en ningún momento', de: 'Keine laute Musik zu keiner Zeit', nl: 'Geen luide muziek op elk moment', fr: 'Pas de musique forte à aucun moment', sv: 'Ingen hög musik någon gång', da: 'Ingen høj musik på noget tidspunkt' } },
  { key: 'MUSIC_POOL_AREA', category: 'NOISE', icon: '🎵', labels: {
    en: 'Music only at low volume in pool area', pt: 'Música apenas em volume baixo na zona da piscina', es: 'Música solo a bajo volumen en zona de piscina', de: 'Musik nur leise im Poolbereich', nl: 'Muziek alleen zacht bij het zwembad', fr: 'Musique à faible volume uniquement près de la piscine', sv: 'Musik bara på låg volym vid poolen', da: 'Musik kun ved lav lydstyrke ved poolen' } },

  // ── Check-in / Check-out ──
  { key: 'CHECKIN_15', category: 'CHECK_IN_OUT', icon: '🕐', labels: {
    en: 'Check-in after 15:00', pt: 'Check-in após as 15:00', es: 'Check-in a partir de las 15:00', de: 'Check-in ab 15:00', nl: 'Check-in na 15:00', fr: 'Check-in à partir de 15h00', sv: 'Incheckning efter 15:00', da: 'Check-in efter 15:00' } },
  { key: 'CHECKIN_16', category: 'CHECK_IN_OUT', icon: '🕐', labels: {
    en: 'Check-in after 16:00', pt: 'Check-in após as 16:00', es: 'Check-in a partir de las 16:00', de: 'Check-in ab 16:00', nl: 'Check-in na 16:00', fr: 'Check-in à partir de 16h00', sv: 'Incheckning efter 16:00', da: 'Check-in efter 16:00' } },
  { key: 'CHECKOUT_10', category: 'CHECK_IN_OUT', icon: '🕙', labels: {
    en: 'Check-out before 10:00', pt: 'Check-out antes das 10:00', es: 'Check-out antes de las 10:00', de: 'Check-out vor 10:00', nl: 'Check-out voor 10:00', fr: 'Check-out avant 10h00', sv: 'Utcheckning före 10:00', da: 'Check-out før 10:00' } },
  { key: 'CHECKOUT_11', category: 'CHECK_IN_OUT', icon: '🕙', labels: {
    en: 'Check-out before 11:00', pt: 'Check-out antes das 11:00', es: 'Check-out antes de las 11:00', de: 'Check-out vor 11:00', nl: 'Check-out voor 11:00', fr: 'Check-out avant 11h00', sv: 'Utcheckning före 11:00', da: 'Check-out før 11:00' } },
  { key: 'SELF_CHECKIN', category: 'CHECK_IN_OUT', icon: '🔑', labels: {
    en: 'Self check-in via Smart Lock / key box', pt: 'Self check-in via Smart Lock / caixa de chaves', es: 'Self check-in con Smart Lock / caja de llaves', de: 'Self Check-in per Smart Lock / Schlüsselbox', nl: 'Zelf inchecken via Smart Lock / sleutelkluis', fr: 'Check-in autonome via Smart Lock / boîte à clés', sv: 'Självincheckning via Smart Lock / nyckellåda', da: 'Selv-check-in via Smart Lock / nøgleboks' } },
  { key: 'KEY_RETURN', category: 'CHECK_IN_OUT', icon: '🗝️', labels: {
    en: 'Keys must be returned at check-out', pt: 'Chaves devem ser devolvidas no check-out', es: 'Llaves deben ser devueltas al hacer check-out', de: 'Schlüssel beim Check-out zurückgeben', nl: 'Sleutels inleveren bij check-out', fr: 'Clés à rendre au check-out', sv: 'Nycklar ska lämnas vid utcheckning', da: 'Nøgler skal returneres ved check-out' } },

  // ── Spaces ──
  { key: 'SHOES_OFF', category: 'SPACES', icon: '👟', labels: {
    en: 'Remove shoes inside the property', pt: 'Tirar sapatos no interior', es: 'Quitarse los zapatos en el interior', de: 'Schuhe im Haus ausziehen', nl: 'Schoenen uit binnen', fr: 'Retirer les chaussures à l\'intérieur', sv: 'Ta av skor inomhus', da: 'Tag sko af indendørs' } },
  { key: 'NO_KITCHEN_AFTER_23', category: 'SPACES', icon: '🍳', labels: {
    en: 'No cooking after 23:00', pt: 'Sem cozinhar após as 23:00', es: 'No cocinar después de las 23:00', de: 'Kein Kochen nach 23:00', nl: 'Niet koken na 23:00', fr: 'Pas de cuisine après 23h00', sv: 'Ingen matlagning efter 23:00', da: 'Ingen madlavning efter 23:00' } },
  { key: 'GARBAGE_SEPARATION', category: 'SPACES', icon: '♻️', labels: {
    en: 'Separate garbage for recycling', pt: 'Separar lixo para reciclagem', es: 'Separar basura para reciclaje', de: 'Müll trennen', nl: 'Afval scheiden voor recycling', fr: 'Trier les déchets pour le recyclage', sv: 'Sopsortera för återvinning', da: 'Sortér affald til genbrug' } },
  { key: 'NO_WASHING_MACHINE', category: 'SPACES', icon: '🧺', labels: {
    en: 'No use of washing machine', pt: 'Proibido usar máquina de lavar', es: 'No usar la lavadora', de: 'Waschmaschine nicht benutzen', nl: 'Geen gebruik van wasmachine', fr: 'Ne pas utiliser la machine à laver', sv: 'Använd inte tvättmaskinen', da: 'Brug ikke vaskemaskinen' } },
  { key: 'TERRACE_CLEAN', category: 'SPACES', icon: '🪴', labels: {
    en: 'Leave terrace clean and tidy', pt: 'Deixar o terraço limpo e arrumado', es: 'Dejar la terraza limpia y ordenada', de: 'Terrasse sauber hinterlassen', nl: 'Terras schoon achterlaten', fr: 'Laisser la terrasse propre et rangée', sv: 'Lämna terrassen ren och städad', da: 'Efterlad terrassen ren og ryddelig' } },
  { key: 'AC_WINDOWS_CLOSED', category: 'SPACES', icon: '❄️', labels: {
    en: 'Close windows when using air conditioning', pt: 'Fechar janelas ao usar ar condicionado', es: 'Cerrar ventanas al usar el aire acondicionado', de: 'Fenster schließen bei Klimaanlage', nl: 'Ramen sluiten bij airconditioning', fr: 'Fermer les fenêtres avec la climatisation', sv: 'Stäng fönster vid luftkonditionering', da: 'Luk vinduer ved brug af aircondition' } },

  // ── Safety ──
  { key: 'NO_CANDLES', category: 'SAFETY', icon: '🕯️', labels: {
    en: 'No candles or open flames inside', pt: 'Sem velas ou chamas no interior', es: 'Sin velas ni llamas abiertas en el interior', de: 'Keine Kerzen oder offenes Feuer', nl: 'Geen kaarsen of open vuur binnen', fr: 'Pas de bougies ni flammes nues', sv: 'Inga ljus eller öppen eld inomhus', da: 'Ingen stearinlys eller åben ild indendørs' } },
  { key: 'CHILDREN_SUPERVISED', category: 'SAFETY', icon: '👶', labels: {
    en: 'Children must be supervised at all times', pt: 'Crianças devem ser supervisionadas a todo o momento', es: 'Niños supervisados en todo momento', de: 'Kinder müssen beaufsichtigt werden', nl: 'Kinderen altijd onder toezicht', fr: 'Enfants sous surveillance en permanence', sv: 'Barn måste övervakas hela tiden', da: 'Børn skal overvåges hele tiden' } },
  { key: 'LOCK_DOORS', category: 'SAFETY', icon: '🔒', labels: {
    en: 'Lock doors and windows when leaving', pt: 'Trancar portas e janelas ao sair', es: 'Cerrar puertas y ventanas al salir', de: 'Türen und Fenster beim Verlassen schließen', nl: 'Deuren en ramen afsluiten bij vertrek', fr: 'Verrouiller portes et fenêtres en partant', sv: 'Lås dörrar och fönster vid avfärd', da: 'Lås døre og vinduer ved afgang' } },
  { key: 'EMERGENCY_NUMBERS', category: 'SAFETY', icon: '📞', labels: {
    en: 'Emergency numbers posted in the property', pt: 'Números de emergência afixados na propriedade', es: 'Números de emergencia visibles en la propiedad', de: 'Notfallnummern im Haus ausgehängt', nl: 'Noodtelefoonnummers in de woning', fr: 'Numéros d\'urgence affichés dans le logement', sv: 'Nödnummer anslagna i fastigheten', da: 'Nødnumre opsat i ejendommen' } },

  // ── Pool ──
  { key: 'POOL_HOURS', category: 'POOL', icon: '🏊', labels: {
    en: 'Pool hours: 09:00 – 21:00', pt: 'Horário da piscina: 09:00 – 21:00', es: 'Horario de piscina: 09:00 – 21:00', de: 'Poolzeiten: 09:00 – 21:00', nl: 'Zwembadtijden: 09:00 – 21:00', fr: 'Heures de piscine : 09h00 – 21h00', sv: 'Pooltider: 09:00 – 21:00', da: 'Pooltider: 09:00 – 21:00' } },
  { key: 'SHOWER_BEFORE_POOL', category: 'POOL', icon: '🚿', labels: {
    en: 'Shower before entering the pool', pt: 'Tomar duche antes de entrar na piscina', es: 'Ducharse antes de entrar en la piscina', de: 'Vor dem Schwimmen duschen', nl: 'Douchen voor het zwemmen', fr: 'Douche obligatoire avant la piscine', sv: 'Duscha innan pool', da: 'Bad inden pool' } },
  { key: 'NO_GLASS_POOL', category: 'POOL', icon: '🥂', labels: {
    en: 'No glass containers in pool area', pt: 'Sem recipientes de vidro na zona da piscina', es: 'Sin recipientes de cristal en zona de piscina', de: 'Kein Glas im Poolbereich', nl: 'Geen glazen bij het zwembad', fr: 'Pas de verre près de la piscine', sv: 'Inget glas vid poolen', da: 'Ingen glas ved poolen' } },
  { key: 'POOL_CHILDREN', category: 'POOL', icon: '👶', labels: {
    en: 'Children under 12 supervised in pool area', pt: 'Crianças até 12 anos supervisionadas na piscina', es: 'Niños menores de 12 supervisados en la piscina', de: 'Kinder unter 12 am Pool beaufsichtigen', nl: 'Kinderen onder 12 onder toezicht bij zwembad', fr: 'Enfants de moins de 12 ans surveillés à la piscine', sv: 'Barn under 12 övervakade vid poolen', da: 'Børn under 12 overvåget ved poolen' } },
  { key: 'NO_DIVING', category: 'POOL', icon: '🚫', labels: {
    en: 'No diving', pt: 'Proibido mergulhar', es: 'Prohibido tirarse de cabeza', de: 'Kein Springen ins Becken', nl: 'Niet duiken', fr: 'Plongeons interdits', sv: 'Dykning förbjuden', da: 'Udspring forbudt' } },
]

export const HOUSE_RULE_CATEGORIES: { key: HouseRuleCategory; labels: Labels }[] = [
  { key: 'GENERAL',      labels: { en: 'General', pt: 'Geral', es: 'General', de: 'Allgemein', nl: 'Algemeen', fr: 'Général', sv: 'Allmänt', da: 'Generelt' } },
  { key: 'SMOKING_PETS', labels: { en: 'Smoking & Pets', pt: 'Tabaco e Animais', es: 'Tabaco y Mascotas', de: 'Rauchen & Haustiere', nl: 'Roken & Huisdieren', fr: 'Tabac & Animaux', sv: 'Rökning & Husdjur', da: 'Rygning & Kæledyr' } },
  { key: 'NOISE',        labels: { en: 'Noise', pt: 'Ruído', es: 'Ruido', de: 'Lärm', nl: 'Geluid', fr: 'Bruit', sv: 'Ljud', da: 'Støj' } },
  { key: 'CHECK_IN_OUT', labels: { en: 'Check-in / Check-out', pt: 'Check-in / Check-out', es: 'Check-in / Check-out', de: 'Check-in / Check-out', nl: 'Check-in / Check-out', fr: 'Check-in / Check-out', sv: 'In/utcheckning', da: 'Check-in / Check-out' } },
  { key: 'SPACES',       labels: { en: 'Spaces & Maintenance', pt: 'Espaços e Manutenção', es: 'Espacios y Mantenimiento', de: 'Räume & Pflege', nl: 'Ruimtes & Onderhoud', fr: 'Espaces & Entretien', sv: 'Utrymmen & Underhåll', da: 'Rum & Vedligeholdelse' } },
  { key: 'SAFETY',       labels: { en: 'Safety', pt: 'Segurança', es: 'Seguridad', de: 'Sicherheit', nl: 'Veiligheid', fr: 'Sécurité', sv: 'Säkerhet', da: 'Sikkerhed' } },
  { key: 'POOL',         labels: { en: 'Pool', pt: 'Piscina', es: 'Piscina', de: 'Pool', nl: 'Zwembad', fr: 'Piscine', sv: 'Pool', da: 'Pool' } },
]

/** Get the translated label for a rule */
export function ruleLabel(rule: HouseRule, locale: string): string {
  return rule.labels[locale] ?? rule.labels.en
}

/** Get the translated label for a category */
export function categoryLabel(cat: typeof HOUSE_RULE_CATEGORIES[number], locale: string): string {
  return cat.labels[locale] ?? cat.labels.en
}

/** Get rules grouped by category */
export function getRulesByCategory(): Map<HouseRuleCategory, HouseRule[]> {
  const map = new Map<HouseRuleCategory, HouseRule[]>()
  for (const rule of HOUSE_RULES) {
    if (!map.has(rule.category)) map.set(rule.category, [])
    map.get(rule.category)!.push(rule)
  }
  return map
}

/** Get labels for selected rules in a given locale */
export function getSelectedRuleLabels(keys: string[], locale = 'en'): { key: string; icon: string; label: string }[] {
  return keys
    .map(k => HOUSE_RULES.find(r => r.key === k))
    .filter((r): r is HouseRule => !!r)
    .map(r => ({ key: r.key, icon: r.icon, label: ruleLabel(r, locale) }))
}
