/**
 * Pre-defined house rules for short-term rental properties.
 * Owners select from this list during property setup — NO free text.
 *
 * Each rule has a unique key (stored in Property.houseRules[]),
 * a category, an icon hint, and label keys for i18n.
 */

export type HouseRuleCategory =
  | 'GENERAL'
  | 'SMOKING_PETS'
  | 'NOISE'
  | 'CHECK_IN_OUT'
  | 'SPACES'
  | 'SAFETY'
  | 'POOL'

export type HouseRule = {
  key: string
  category: HouseRuleCategory
  icon: string // emoji for simple display
  labelEn: string
}

export const HOUSE_RULES: HouseRule[] = [
  // ── General ──
  { key: 'MAX_GUESTS',            category: 'GENERAL',       icon: '👥', labelEn: 'Maximum occupancy must be respected' },
  { key: 'RESPECT_NEIGHBOURS',    category: 'GENERAL',       icon: '🏘️', labelEn: 'Respect neighbours and surroundings' },
  { key: 'NO_EVENTS',             category: 'GENERAL',       icon: '🎉', labelEn: 'No parties or events' },
  { key: 'NO_COMMERCIAL_USE',     category: 'GENERAL',       icon: '🚫', labelEn: 'No commercial or professional use' },
  { key: 'ID_REQUIRED',           category: 'GENERAL',       icon: '🪪', labelEn: 'Valid ID required at check-in' },

  // ── Smoking & Pets ──
  { key: 'NO_SMOKING',            category: 'SMOKING_PETS',  icon: '🚭', labelEn: 'No smoking inside the property' },
  { key: 'SMOKING_TERRACE',       category: 'SMOKING_PETS',  icon: '🚬', labelEn: 'Smoking allowed on terrace only' },
  { key: 'NO_PETS',               category: 'SMOKING_PETS',  icon: '🐾', labelEn: 'No pets allowed' },
  { key: 'PETS_ALLOWED',          category: 'SMOKING_PETS',  icon: '🐕', labelEn: 'Pets allowed (prior approval required)' },

  // ── Noise ──
  { key: 'QUIET_22_08',           category: 'NOISE',         icon: '🤫', labelEn: 'Quiet hours: 22:00 – 08:00' },
  { key: 'QUIET_23_08',           category: 'NOISE',         icon: '🤫', labelEn: 'Quiet hours: 23:00 – 08:00' },
  { key: 'NO_LOUD_MUSIC',         category: 'NOISE',         icon: '🔇', labelEn: 'No loud music at any time' },
  { key: 'MUSIC_POOL_AREA',       category: 'NOISE',         icon: '🎵', labelEn: 'Music only at low volume in pool area' },

  // ── Check-in / Check-out ──
  { key: 'CHECKIN_15',            category: 'CHECK_IN_OUT',  icon: '🕐', labelEn: 'Check-in after 15:00' },
  { key: 'CHECKIN_16',            category: 'CHECK_IN_OUT',  icon: '🕐', labelEn: 'Check-in after 16:00' },
  { key: 'CHECKOUT_10',           category: 'CHECK_IN_OUT',  icon: '🕙', labelEn: 'Check-out before 10:00' },
  { key: 'CHECKOUT_11',           category: 'CHECK_IN_OUT',  icon: '🕙', labelEn: 'Check-out before 11:00' },
  { key: 'SELF_CHECKIN',          category: 'CHECK_IN_OUT',  icon: '🔑', labelEn: 'Self check-in via Smart Lock / key box' },
  { key: 'KEY_RETURN',            category: 'CHECK_IN_OUT',  icon: '🗝️', labelEn: 'Keys must be returned at check-out' },

  // ── Spaces ──
  { key: 'SHOES_OFF',             category: 'SPACES',        icon: '👟', labelEn: 'Remove shoes inside the property' },
  { key: 'NO_KITCHEN_AFTER_23',   category: 'SPACES',        icon: '🍳', labelEn: 'No cooking after 23:00' },
  { key: 'GARBAGE_SEPARATION',    category: 'SPACES',        icon: '♻️', labelEn: 'Separate garbage for recycling' },
  { key: 'NO_WASHING_MACHINE',    category: 'SPACES',        icon: '🧺', labelEn: 'No use of washing machine' },
  { key: 'TERRACE_CLEAN',         category: 'SPACES',        icon: '🪴', labelEn: 'Leave terrace clean and tidy' },
  { key: 'AC_WINDOWS_CLOSED',     category: 'SPACES',        icon: '❄️', labelEn: 'Close windows when using air conditioning' },

  // ── Safety ──
  { key: 'NO_CANDLES',            category: 'SAFETY',        icon: '🕯️', labelEn: 'No candles or open flames inside' },
  { key: 'CHILDREN_SUPERVISED',   category: 'SAFETY',        icon: '👶', labelEn: 'Children must be supervised at all times' },
  { key: 'LOCK_DOORS',            category: 'SAFETY',        icon: '🔒', labelEn: 'Lock doors and windows when leaving' },
  { key: 'EMERGENCY_NUMBERS',     category: 'SAFETY',        icon: '📞', labelEn: 'Emergency numbers posted in the property' },

  // ── Pool ──
  { key: 'POOL_HOURS',            category: 'POOL',          icon: '🏊', labelEn: 'Pool hours: 09:00 – 21:00' },
  { key: 'SHOWER_BEFORE_POOL',    category: 'POOL',          icon: '🚿', labelEn: 'Shower before entering the pool' },
  { key: 'NO_GLASS_POOL',         category: 'POOL',          icon: '🥂', labelEn: 'No glass containers in pool area' },
  { key: 'POOL_CHILDREN',         category: 'POOL',          icon: '👶', labelEn: 'Children under 12 supervised in pool area' },
  { key: 'NO_DIVING',             category: 'POOL',          icon: '🚫', labelEn: 'No diving' },
]

export const HOUSE_RULE_CATEGORIES: { key: HouseRuleCategory; labelEn: string }[] = [
  { key: 'GENERAL',       labelEn: 'General' },
  { key: 'SMOKING_PETS',  labelEn: 'Smoking & Pets' },
  { key: 'NOISE',         labelEn: 'Noise' },
  { key: 'CHECK_IN_OUT',  labelEn: 'Check-in / Check-out' },
  { key: 'SPACES',        labelEn: 'Spaces & Maintenance' },
  { key: 'SAFETY',        labelEn: 'Safety' },
  { key: 'POOL',          labelEn: 'Pool' },
]

/** Get rules grouped by category */
export function getRulesByCategory(): Map<HouseRuleCategory, HouseRule[]> {
  const map = new Map<HouseRuleCategory, HouseRule[]>()
  for (const rule of HOUSE_RULES) {
    if (!map.has(rule.category)) map.set(rule.category, [])
    map.get(rule.category)!.push(rule)
  }
  return map
}

/** Get labels for selected rules */
export function getSelectedRuleLabels(keys: string[]): { key: string; icon: string; label: string }[] {
  return keys
    .map(k => HOUSE_RULES.find(r => r.key === k))
    .filter((r): r is HouseRule => !!r)
    .map(r => ({ key: r.key, icon: r.icon, label: r.labelEn }))
}
