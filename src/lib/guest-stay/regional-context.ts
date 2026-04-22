/**
 * Costa Tropical regional knowledge — permanent context for the AI assistant.
 * Injected into every conversation so the AI can answer questions about
 * markets, tours, trails, restaurants, services across all 5 zones.
 *
 * Source: curated by HostMasters operations team.
 * Update this file as new tips, seasonal events, or services are added.
 */

export interface ZoneInfo {
  code: 'ALMUNECAR' | 'LA_HERRADURA' | 'SALOBRENA' | 'MOTRIL' | 'NERJA'
  name: string
  description: string
  markets: Array<{ day: string; where: string; notes?: string }>
  mustSeeTours: string[]
  trails: Array<{ name: string; difficulty: 'easy' | 'moderate' | 'hard'; duration: string; notes?: string }>
  beaches: string[]
  restaurants: Array<{ name: string; type: string; notes?: string }>
  services: string[]
}

export const COSTA_TROPICAL_ZONES: ZoneInfo[] = [
  {
    code: 'ALMUNECAR',
    name: 'Almuñécar',
    description: 'Main hub of Costa Tropical. Beaches, old town, castle, Punic-Roman heritage. Year-round tourism.',
    markets: [
      { day: 'Friday', where: 'Av. Juan Carlos I', notes: 'Large weekly market — 8h to 14h' },
      { day: 'Sunday', where: 'Velilla Taramay area', notes: 'Fruit and crafts' },
    ],
    mustSeeTours: [
      'San Miguel Castle (Castillo de San Miguel) — panoramic view of coast',
      'Parque El Majuelo (botanical gardens + Roman ruins)',
      'Cueva de Siete Palacios (underground Roman aqueduct museum)',
      'Playa de San Cristóbal promenade at sunset',
    ],
    trails: [
      { name: 'Peñón del Santo coastal walk', difficulty: 'easy', duration: '30min', notes: 'Short, sunset view' },
      { name: 'Ruta del Agua del Altillo', difficulty: 'moderate', duration: '2h', notes: 'Follows old aqueduct' },
    ],
    beaches: ['Playa San Cristóbal', 'Playa Puerta del Mar', 'Playa de Velilla', 'Cotobro (family, quieter)'],
    restaurants: [
      { name: 'El Chaleco', type: 'Traditional Spanish', notes: 'Book ahead' },
      { name: 'Tiki Beach Club', type: 'Beach bar', notes: 'Sunset cocktails' },
      { name: 'La Última Ola', type: 'Seafood', notes: 'Fresh catch, local' },
    ],
    services: [
      'Pharmacy 24h: Farmacia Juan Carlos I',
      'Medical centre: Centro de Salud Almuñécar',
      'Taxi: +34 958 63 00 00',
      'Police (local): 092 · National: 091 · EU emergency: 112',
    ],
  },
  {
    code: 'LA_HERRADURA',
    name: 'La Herradura',
    description: 'Horseshoe bay west of Almuñécar. Calm waters, diving, snorkelling, quieter than main town.',
    markets: [
      { day: 'Thursday', where: 'Plaza de la Iglesia', notes: 'Small weekly market' },
    ],
    mustSeeTours: [
      'Cerro Gordo cliffs viewpoint (sunset)',
      'Maro-Cerro Gordo natural park (coast reserve)',
      'Boat trips to caves and hidden coves',
      'Scuba diving with Buceo La Herradura',
    ],
    trails: [
      { name: 'Cerro Gordo lighthouse walk', difficulty: 'easy', duration: '1h', notes: 'Asphalt, kid-friendly' },
      { name: 'Maro cliffs coastal trail', difficulty: 'moderate', duration: '3h', notes: 'Dramatic views, bring water' },
    ],
    beaches: ['Playa de La Herradura (main)', 'Marina del Este', 'Cala de los Berengueles (hidden, snorkel)'],
    restaurants: [
      { name: 'El Capricho', type: 'Seafood beachfront' },
      { name: 'La Marina', type: 'Tapas with harbour view' },
      { name: 'Francisca', type: 'Traditional chiringuito' },
    ],
    services: [
      'Pharmacy: Farmacia La Herradura',
      'Marina del Este: boat rental, diving',
      'Nearest hospital: Hospital Santa Ana Motril (15min drive)',
    ],
  },
  {
    code: 'SALOBRENA',
    name: 'Salobreña',
    description: 'White hilltop village with Arab castle. Long beach promenade, sugar cane fields nearby, authentic Andalusian feel.',
    markets: [
      { day: 'Tuesday', where: 'Av. Federico García Lorca', notes: 'Morning market' },
    ],
    mustSeeTours: [
      'Castillo de Salobreña (Moorish fortress)',
      'Old town maze of white streets',
      'Peñón de Salobreña rock formation',
      'Sunset from the castle walls',
    ],
    trails: [
      { name: 'Salobreña to La Guardia coastal walk', difficulty: 'easy', duration: '1h 30min' },
      { name: 'Castle viewpoint climb', difficulty: 'easy', duration: '45min', notes: 'Steep but short' },
    ],
    beaches: ['Playa de La Guardia', 'Playa de La Charca', 'El Peñón'],
    restaurants: [
      { name: 'Casa Emilio', type: 'Traditional, in old town' },
      { name: 'Pesetas', type: 'Seafood beachfront' },
    ],
    services: [
      'Pharmacy: Farmacia Salobreña centro',
      'Hospital Santa Ana Motril: 5min drive',
      'Supermarket: Mercadona on N-340',
    ],
  },
  {
    code: 'MOTRIL',
    name: 'Motril',
    description: 'Main commercial and administrative centre of Costa Tropical. Largest hospital (Santa Ana), shopping, port.',
    markets: [
      { day: 'Wednesday', where: 'Recinto Ferial', notes: 'Largest weekly market in area' },
      { day: 'Saturday', where: 'Explanada del Puerto' },
    ],
    mustSeeTours: [
      'Pre-Industrial Sugar Museum (Museo Preindustrial del Azúcar)',
      'Nuestra Señora de la Cabeza sanctuary viewpoint',
      'Fishing port',
    ],
    trails: [
      { name: 'Playa de Poniente to Playa Granada', difficulty: 'easy', duration: '1h', notes: 'Long flat beach walk' },
    ],
    beaches: ['Playa Granada', 'Playa de Poniente', 'Playa de Torrenueva'],
    restaurants: [
      { name: 'Restaurante Pepe Peña', type: 'Andalusian classic' },
      { name: 'Tropical Sunset', type: 'Beach club, Playa Granada' },
    ],
    services: [
      'Hospital Santa Ana (main regional hospital) — emergency 24h',
      'Cinema: Yelmo Cines Costa Motril',
      'Carrefour, Mercadona, Lidl, Aldi all available',
      'Bus station: ALSA to Granada, Málaga, Almería',
    ],
  },
  {
    code: 'NERJA',
    name: 'Nerja',
    description: 'Eastern edge of Costa del Sol, technically neighbouring Costa Tropical. Famous caves, Balcón de Europa viewpoint.',
    markets: [
      { day: 'Tuesday', where: 'Almijara II' },
      { day: 'Sunday', where: 'Flea market at Almijara' },
    ],
    mustSeeTours: [
      'Cuevas de Nerja (world-famous stalactite caves)',
      'Balcón de Europa (iconic viewpoint)',
      'Frigiliana white village (15min drive inland)',
      'Nerja Aqueduct (Puente del Águila, 4 levels)',
    ],
    trails: [
      { name: 'Río Chíllar river walk', difficulty: 'moderate', duration: '4-6h', notes: 'Walking in river — water shoes needed, summer only' },
      { name: 'Maro-Cerro Gordo from Nerja side', difficulty: 'moderate', duration: '3h' },
    ],
    beaches: ['Playa Burriana', 'Playa Calahonda', 'Playa de Maro (natural, rocky)'],
    restaurants: [
      { name: 'Ayo Burriana', type: 'Famous paella on the beach' },
      { name: 'El Pulguilla', type: 'Tapas, always packed' },
      { name: 'Oliva Restaurant', type: 'Fine dining' },
    ],
    services: [
      'Hospital: Clínica Salud Costa del Sol Nerja',
      'Nerja Taxi: +34 952 52 05 37',
      'Pharmacy: Farmacia Plaza de los Cangrejos (24h rota)',
    ],
  },
]

/** Build the regional context block for the AI system prompt. */
export function regionalContextBlock(propertyCity: string | null | undefined): string {
  const safeCity = (propertyCity ?? '').toString()
  const normalized = safeCity.toUpperCase().replace(/[^A-Z]/g, '')
  const primary = normalized
    ? COSTA_TROPICAL_ZONES.find(z =>
        normalized.includes(z.code.replace('_', '')) ||
        normalized.includes(z.name.toUpperCase().replace(/[^A-Z]/g, '')),
      )
    : undefined

  const listZone = (z: ZoneInfo, isPrimary: boolean) => `
━━ ${z.name.toUpperCase()}${isPrimary ? ' (the property is here)' : ''} ━━
${z.description}
Markets: ${z.markets.map(m => `${m.day} at ${m.where}${m.notes ? ` — ${m.notes}` : ''}`).join(' | ')}
Must see: ${z.mustSeeTours.slice(0, 3).join(' · ')}
Trails: ${z.trails.map(t => `${t.name} (${t.difficulty}, ${t.duration})`).join(' · ')}
Beaches: ${z.beaches.join(', ')}
Restaurants: ${z.restaurants.map(r => `${r.name} (${r.type})`).join(' · ')}
Services: ${z.services.join(' · ')}
`.trim()

  const sections = COSTA_TROPICAL_ZONES.map(z =>
    listZone(z, z === primary),
  )

  return `COSTA TROPICAL REGIONAL CONTEXT (always available to cite):
${sections.join('\n\n')}

EMERGENCY NUMBERS (Spain):
• 112 — EU emergency (police, fire, ambulance)
• 091 — National Police
• 092 — Local Police
• 062 — Guardia Civil
• 061 — Medical emergency

CULTURAL NOTES:
• Siesta: many shops close 14:00-17:00, reopen until 20:00-21:00
• Dinner typically 21:00-22:30
• Tipping: round up or 5-10% in restaurants
• Sunday: most non-tourist shops closed
• Spanish holidays may affect market/shop hours
`
}
