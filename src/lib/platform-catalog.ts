/**
 * Catalog of all HostMasters platform features + one-time services.
 * Used by /client/plus to show Starter users what they're missing.
 */

export type PlanTier = 'STARTER' | 'BASIC' | 'MID' | 'PREMIUM'

export interface PlatformFeature {
  id: string
  category: 'operations' | 'ai' | 'guest' | 'fiscal' | 'finance'
  title: string
  desc: string
  minTier: PlanTier           // Lowest plan that includes this
  highlight?: string          // Key metric (e.g. "+25% revenue")
  icon: 'Sparkles' | 'Brain' | 'Shield' | 'MessageCircle' | 'Phone'
    | 'BarChart3' | 'Wrench' | 'Lock' | 'Receipt' | 'FileText'
    | 'Activity' | 'Star' | 'TrendingUp' | 'Calendar' | 'Globe'
}

export interface OneTimeService {
  id: string
  title: string
  desc: string
  price: number              // EUR — base price; may be adjusted by Manager
  category: 'setup' | 'photography' | 'maintenance' | 'fiscal' | 'guest' | 'other'
  icon: 'Camera' | 'Lock' | 'Wrench' | 'FileText' | 'Package' | 'Home' | 'Sparkles'
  durationLabel?: string     // e.g. "2-hour visit", "One-time"
  popular?: boolean
  /** Task kind created when service is confirmed and paid. */
  taskType: 'INSPECTION' | 'CLEANING' | 'MAINTENANCE_PREVENTIVE' | 'MAINTENANCE_CORRECTIVE' | 'SHOPPING' | 'SETUP_FIELD_INSPECTION' | 'SETUP_AI_CONTEXT'
  /** Who executes the task. */
  assigneeRole: 'CAPTAIN' | 'CREW' | 'ADMIN'
  /** Payment timing */
  paymentTiming: 'PREPAID' | 'POSTPAID'
}

// ── FEATURES (included in plans) ──────────────────────────────────────────

export const PLATFORM_FEATURES: PlatformFeature[] = [
  // Operations
  {
    id: 'full_str_management',
    category: 'operations',
    title: 'Full short-term rental management',
    desc: 'Airbnb, Booking.com and direct listings — 24/7 guest communication, calendar sync, pricing, payouts.',
    minTier: 'STARTER',
    icon: 'Globe',
  },
  {
    id: 'preventive_maintenance',
    category: 'operations',
    title: 'Preventive maintenance',
    desc: 'Monthly property checks — smoke detectors, HVAC, plumbing, locks. Problems caught before guests notice.',
    minTier: 'BASIC',
    icon: 'Wrench',
  },
  {
    id: 'smart_lock',
    category: 'operations',
    title: 'Smart Lock with rotating codes',
    desc: 'Unique code per guest, expires on checkout. Full access log in your dashboard. No more key handovers.',
    minTier: 'MID',
    icon: 'Lock',
  },

  // AI
  {
    id: 'ai_pricing',
    category: 'ai',
    title: 'AI Dynamic Pricing',
    desc: 'Algorithm analyses 7 factors — seasonality, events, competition, demand, ratings — to set optimal price every night.',
    minTier: 'MID',
    highlight: '+25% revenue',
    icon: 'Sparkles',
  },
  {
    id: 'ai_monitor',
    category: 'ai',
    title: 'AI Property Monitor',
    desc: '43 daily automated checks: overdue check-ins, failed payouts, cleaning delays, stock levels. Auto-fixes safe issues.',
    minTier: 'PREMIUM',
    highlight: '43 checks/day',
    icon: 'Activity',
  },
  {
    id: 'market_intelligence',
    category: 'ai',
    title: 'Market Intelligence',
    desc: 'Weekly data from Airbnb + Booking.com across Costa Tropical. See competitor prices, ratings, occupancy by zone.',
    minTier: 'MID',
    icon: 'BarChart3',
  },
  {
    id: 'ai_team_chat',
    category: 'ai',
    title: 'AI Team Assistant (owner portal)',
    desc: 'Ask anything about your property — earnings, bookings, tax deadlines. Instant answers backed by real data.',
    minTier: 'MID',
    icon: 'Brain',
  },

  // Guest experience
  {
    id: 'guest_stay_chat',
    category: 'guest',
    title: 'Guest AI Assistant during stay',
    desc: '24/7 AI concierge answers guest questions about WiFi, door code, local tips. 70% resolved without human.',
    minTier: 'STARTER',
    highlight: '70% auto-resolved',
    icon: 'MessageCircle',
  },
  {
    id: 'vagf_voice_feedback',
    category: 'guest',
    title: 'Voice feedback after checkout',
    desc: 'AI calls every guest 24-48h after checkout. Captures 12 scores + qualitative feedback in their language.',
    minTier: 'BASIC',
    icon: 'Phone',
  },
  {
    id: 'emergency_response',
    category: 'guest',
    title: 'Emergency response within 4h',
    desc: 'Guest reports issue → Manager notified via WhatsApp + Admin escalation if needed. Urgent task auto-created for field team.',
    minTier: 'PREMIUM',
    highlight: '<4h response',
    icon: 'Shield',
  },

  // Fiscal
  {
    id: 'tax_compliance',
    category: 'fiscal',
    title: 'Full fiscal compliance',
    desc: 'Modelo 179 quarterly filings, IRNR, NRU, energy certificate. We track deadlines, you sign.',
    minTier: 'PREMIUM',
    icon: 'FileText',
  },
  {
    id: 'multilang_statements',
    category: 'fiscal',
    title: 'Statements in any language',
    desc: 'Monthly statements + invoices auto-translated to your accountant\'s language.',
    minTier: 'MID',
    icon: 'FileText',
  },

  // Finance
  {
    id: 'detailed_reports',
    category: 'finance',
    title: 'Detailed monthly reports',
    desc: 'Every euro tracked — rental income, commissions, cleaning fees, VAT. Export to PDF/CSV for your accountant.',
    minTier: 'STARTER',
    icon: 'Receipt',
  },
  {
    id: 'pricing_analytics',
    category: 'finance',
    title: 'Pricing Analytics',
    desc: 'Your property performance over time — seasonal trends, average rates, occupancy patterns.',
    minTier: 'BASIC',
    icon: 'TrendingUp',
  },
]

// ── ONE-TIME SERVICES (purchase without plan upgrade) ─────────────────────

export const ONE_TIME_SERVICES: OneTimeService[] = [
  {
    id: 'smart_lock_install',
    title: 'Smart Lock installation',
    desc: 'We install a Nuki smart lock at your property — includes the device, pairing with our platform, and guest onboarding. Guests get rotating codes automatically.',
    price: 249,
    category: 'setup',
    icon: 'Lock',
    durationLabel: 'One-time',
    popular: true,
    taskType: 'SETUP_FIELD_INSPECTION',
    assigneeRole: 'CAPTAIN',
    paymentTiming: 'PREPAID',
  },
  {
    id: 'property_photography',
    title: 'Professional property photography',
    desc: 'Professional photographer visits your property, 30-50 edited photos ready for Airbnb/Booking listing. +15-30% booking rate typical.',
    price: 199,
    category: 'photography',
    icon: 'Camera',
    durationLabel: '2-hour visit',
    popular: true,
    taskType: 'INSPECTION',
    assigneeRole: 'CAPTAIN',
    paymentTiming: 'PREPAID',
  },
  {
    id: 'channel_setup',
    title: 'Airbnb + Booking.com listing setup',
    desc: 'We create and optimise your listings on both platforms. Copy, pricing suggestions, calendar sync, payout settings — all configured.',
    price: 149,
    category: 'setup',
    icon: 'Home',
    durationLabel: 'One-time',
    taskType: 'SETUP_AI_CONTEXT',
    assigneeRole: 'ADMIN',
    paymentTiming: 'PREPAID',
  },
  {
    id: 'fiscal_irnr_filing',
    title: 'IRNR Modelo 210 filing (one-off)',
    desc: 'Our fiscal partner files your quarterly non-resident tax return. Includes calculation, submission and receipt for your records.',
    price: 75,
    category: 'fiscal',
    icon: 'FileText',
    durationLabel: 'Per filing',
    taskType: 'SETUP_AI_CONTEXT',
    assigneeRole: 'ADMIN',
    paymentTiming: 'POSTPAID',
  },
  {
    id: 'deep_cleaning',
    title: 'Deep cleaning (between guests or one-off)',
    desc: 'Full deep clean: bathrooms, kitchen, bedrooms, common areas, laundry. Photos before/after.',
    price: 95,
    category: 'maintenance',
    icon: 'Sparkles',
    durationLabel: '3-4 hours',
    taskType: 'CLEANING',
    assigneeRole: 'CREW',
    paymentTiming: 'POSTPAID',
  },
  {
    id: 'maintenance_inspection',
    title: 'Complete maintenance inspection',
    desc: 'Our technician inspects electrical, plumbing, HVAC, appliances. Written report + photos + recommended fixes with quotes.',
    price: 85,
    category: 'maintenance',
    icon: 'Wrench',
    durationLabel: '1-hour visit',
    taskType: 'INSPECTION',
    assigneeRole: 'CAPTAIN',
    paymentTiming: 'POSTPAID',
  },
  {
    id: 'welcome_kit',
    title: 'Premium welcome kit',
    desc: 'Stocked for guest arrival: local wine, olive oil, fresh bread, coffee pods, toiletries. Personalised card.',
    price: 45,
    category: 'guest',
    icon: 'Package',
    durationLabel: 'Per arrival',
    taskType: 'SHOPPING',
    assigneeRole: 'CREW',
    paymentTiming: 'PREPAID',
  },
  {
    id: 'energy_certificate',
    title: 'Energy certificate (Certificado Energético)',
    desc: 'Required for short-term rental in Spain. We send a qualified technician, you get the certificate valid for 10 years.',
    price: 135,
    category: 'fiscal',
    icon: 'FileText',
    durationLabel: 'One-time',
    taskType: 'INSPECTION',
    assigneeRole: 'CAPTAIN',
    paymentTiming: 'PREPAID',
  },
]

export function featuresUnavailableForTier(tier: PlanTier): PlatformFeature[] {
  const order: PlanTier[] = ['STARTER', 'BASIC', 'MID', 'PREMIUM']
  const userIdx = order.indexOf(tier)
  return PLATFORM_FEATURES.filter(f => order.indexOf(f.minTier) > userIdx)
}

export function featuresIncludedForTier(tier: PlanTier): PlatformFeature[] {
  const order: PlanTier[] = ['STARTER', 'BASIC', 'MID', 'PREMIUM']
  const userIdx = order.indexOf(tier)
  return PLATFORM_FEATURES.filter(f => order.indexOf(f.minTier) <= userIdx)
}
