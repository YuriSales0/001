/**
 * HostMasters Pricing Engine v1 — Statistical Model
 *
 * Combina 3 fontes de dados:
 * 1. Dados próprios (PricingDataPoint) — preços reais cobrados
 * 2. Dados de competitors (CompetitorListing/CompetitorPrice) — preços de mercado
 * 3. Regras de negócio (sazonalidade, dia da semana, lead time)
 *
 * Output: preço sugerido + explicação de cada factor.
 *
 * Custo: €0/mês (corre localmente, sem API externa).
 */

export type PricingFactor = {
  name: string
  effect: number      // multiplier (1.0 = neutral, 1.15 = +15%)
  description: string
}

export type PricingSuggestion = {
  basePrice: number         // preço base (mediana histórica)
  suggestedPrice: number    // preço final sugerido
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: PricingFactor[]
  competitorMedian: number | null
  competitorCount: number
  dataPoints: number
  percentile: number | null  // percentil vs. competitors (0-100)
}

// Sazonalidade da Costa Tropical — dados empíricos do mercado STR
const SEASONAL_MULTIPLIER: Record<number, number> = {
  1:  0.75,  // Jan — baixa
  2:  0.80,  // Feb — baixa
  3:  0.90,  // Mar — início primavera
  4:  1.00,  // Apr — Semana Santa
  5:  1.05,  // May — primavera alta
  6:  1.25,  // Jun — início verão
  7:  1.45,  // Jul — alta
  8:  1.50,  // Aug — pico
  9:  1.15,  // Sep — ainda quente
  10: 0.95,  // Oct — outono
  11: 0.80,  // Nov — baixa
  12: 0.85,  // Dec — Natal boost
}

// Dia da semana (0=Mon, 5=Sat, 6=Sun)
const DAY_OF_WEEK_MULTIPLIER: Record<number, number> = {
  0: 0.95,  // Mon
  1: 0.95,  // Tue
  2: 0.97,  // Wed
  3: 1.00,  // Thu
  4: 1.05,  // Fri
  5: 1.12,  // Sat
  6: 1.08,  // Sun
}

// Lead time (dias entre booking e check-in)
function leadTimeFactor(days: number | null): PricingFactor {
  if (days === null) return { name: 'Lead time', effect: 1.0, description: 'Sem dados de lead time' }
  if (days <= 2) return { name: 'Last minute', effect: 0.85, description: `${days}d antes — desconto last-minute -15%` }
  if (days <= 7) return { name: 'Curto prazo', effect: 0.92, description: `${days}d antes — desconto -8%` }
  if (days <= 30) return { name: 'Prazo normal', effect: 1.0, description: `${days}d antes — preço standard` }
  if (days <= 90) return { name: 'Antecipação', effect: 1.05, description: `${days}d antes — premium +5%` }
  return { name: 'Reserva longa', effect: 1.08, description: `${days}d antes — premium antecipação +8%` }
}

// Ocupação (0-100%)
function occupancyFactor(occupancy: number): PricingFactor {
  if (occupancy >= 85) return { name: 'Alta procura', effect: 1.12, description: `Ocupação ${occupancy}% — aumentar +12%` }
  if (occupancy >= 75) return { name: 'Boa procura', effect: 1.05, description: `Ocupação ${occupancy}% — premium suave +5%` }
  if (occupancy >= 60) return { name: 'Procura normal', effect: 1.0, description: `Ocupação ${occupancy}% — preço neutro` }
  if (occupancy >= 45) return { name: 'Procura baixa', effect: 0.92, description: `Ocupação ${occupancy}% — desconto -8%` }
  return { name: 'Procura mínima', effect: 0.82, description: `Ocupação ${occupancy}% — desconto agressivo -18%` }
}

// Posicionamento vs. competitors
function competitorPositioning(ownPrice: number, competitorMedian: number): PricingFactor {
  const ratio = ownPrice / competitorMedian
  if (ratio > 1.25) return { name: 'Acima do mercado', effect: 0.92, description: `Preço ${((ratio - 1) * 100).toFixed(0)}% acima da mediana — ajustar -8%` }
  if (ratio > 1.10) return { name: 'Ligeiramente acima', effect: 0.97, description: `Preço ${((ratio - 1) * 100).toFixed(0)}% acima — ajuste leve -3%` }
  if (ratio < 0.80) return { name: 'Abaixo do mercado', effect: 1.10, description: `Preço ${((1 - ratio) * 100).toFixed(0)}% abaixo — oportunidade +10%` }
  if (ratio < 0.90) return { name: 'Ligeiramente abaixo', effect: 1.05, description: `Preço ${((1 - ratio) * 100).toFixed(0)}% abaixo — subir +5%` }
  return { name: 'Alinhado ao mercado', effect: 1.0, description: 'Preço dentro da banda competitiva' }
}

export type PricingInput = {
  // Dados da propriedade
  ownHistoricalPrices: number[]       // preços cobrados nos últimos 90 dias
  ownOccupancy: number                // 0-100

  // Dados de competitors na zona
  competitorPrices: number[]          // preços actuais dos competitors

  // Contexto da data a precificar
  targetMonth: number                 // 1-12
  targetDayOfWeek: number             // 0-6 (Mon-Sun)
  leadTimeDays: number | null         // dias até check-in (null se desconhecido)

  // Qualidade da propriedade (afecta positioning)
  rating: number | null               // 0-5
  isSuperhost: boolean
}

export function calculateSuggestedPrice(input: PricingInput): PricingSuggestion {
  const {
    ownHistoricalPrices,
    ownOccupancy,
    competitorPrices,
    targetMonth,
    targetDayOfWeek,
    leadTimeDays,
    rating,
    isSuperhost,
  } = input

  const dataPoints = ownHistoricalPrices.length
  const competitorCount = competitorPrices.length

  // ── Base price: mediana do histórico próprio ou mediana de competitors ──
  let basePrice: number
  if (dataPoints >= 5) {
    const sorted = [...ownHistoricalPrices].sort((a, b) => a - b)
    basePrice = sorted[Math.floor(sorted.length / 2)]
  } else if (competitorCount >= 3) {
    const sorted = [...competitorPrices].sort((a, b) => a - b)
    basePrice = sorted[Math.floor(sorted.length / 2)]
  } else {
    // Fallback: média de tudo que temos
    const all = [...ownHistoricalPrices, ...competitorPrices]
    basePrice = all.length > 0 ? all.reduce((s, p) => s + p, 0) / all.length : 120 // default €120
  }

  // ── Factors ──
  const factors: PricingFactor[] = []

  // 1. Sazonalidade
  const seasonMult = SEASONAL_MULTIPLIER[targetMonth] ?? 1.0
  factors.push({
    name: 'Sazonalidade',
    effect: seasonMult,
    description: seasonMult > 1.1
      ? `Época alta (mês ${targetMonth}) — premium +${((seasonMult - 1) * 100).toFixed(0)}%`
      : seasonMult < 0.9
      ? `Época baixa (mês ${targetMonth}) — desconto ${((1 - seasonMult) * 100).toFixed(0)}%`
      : `Época normal (mês ${targetMonth})`,
  })

  // 2. Dia da semana
  const dayMult = DAY_OF_WEEK_MULTIPLIER[targetDayOfWeek] ?? 1.0
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  factors.push({
    name: 'Dia da semana',
    effect: dayMult,
    description: `${dayNames[targetDayOfWeek]} — ${dayMult > 1.05 ? 'premium fim de semana' : dayMult < 0.97 ? 'desconto meio de semana' : 'neutro'}`,
  })

  // 3. Lead time
  factors.push(leadTimeFactor(leadTimeDays))

  // 4. Ocupação
  factors.push(occupancyFactor(ownOccupancy))

  // 5. Competitor positioning (se temos dados)
  let competitorMedian: number | null = null
  let percentile: number | null = null

  if (competitorCount >= 3) {
    const sorted = [...competitorPrices].sort((a, b) => a - b)
    competitorMedian = sorted[Math.floor(sorted.length / 2)]
    factors.push(competitorPositioning(basePrice, competitorMedian))

    // Percentile: em que posição estamos vs. competitors
    const belowCount = sorted.filter(p => p <= basePrice).length
    percentile = Math.round((belowCount / sorted.length) * 100)
  }

  // 6. Quality premium (rating + superhost)
  if (rating !== null && rating >= 4.8) {
    factors.push({ name: 'Rating premium', effect: 1.06, description: `Rating ${rating}/5 — premium qualidade +6%` })
  } else if (rating !== null && rating < 4.2) {
    factors.push({ name: 'Rating baixo', effect: 0.94, description: `Rating ${rating}/5 — ajuste -6%` })
  }

  if (isSuperhost) {
    factors.push({ name: 'Superhost', effect: 1.04, description: 'Badge Superhost — premium confiança +4%' })
  }

  // ── Calculate final price ──
  let suggestedPrice = basePrice
  for (const f of factors) {
    suggestedPrice *= f.effect
  }
  suggestedPrice = Math.round(suggestedPrice)

  // ── Confidence ──
  let confidence: PricingSuggestion['confidence'] = 'LOW'
  if (dataPoints >= 20 && competitorCount >= 10) confidence = 'HIGH'
  else if (dataPoints >= 5 || competitorCount >= 5) confidence = 'MEDIUM'

  return {
    basePrice: Math.round(basePrice),
    suggestedPrice,
    confidence,
    factors,
    competitorMedian,
    competitorCount,
    dataPoints,
    percentile,
  }
}
