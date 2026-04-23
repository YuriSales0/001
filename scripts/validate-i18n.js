#!/usr/bin/env node

/**
 * i18n key validation — ensures all 8 locales have the same keys as EN.
 *
 * Also cross-references keys used in code (t('x.y') and t(msgs, 'x.y'))
 * against the EN locale to find orphaned or missing keys.
 *
 * Usage:
 *   npm run i18n:check           # report only
 *   npm run i18n:check -- --fix  # auto-copy missing keys from EN
 *
 * Exit code 0 = clean, 1 = issues found (useful for CI).
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const MESSAGES_DIR = path.join(__dirname, '..', 'src', 'messages')
const SRC_DIR = path.join(__dirname, '..', 'src')
const REFERENCE_LOCALE = 'en'
const LOCALES = ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da']
const FIX_MODE = process.argv.includes('--fix')

// ── Helpers ──────────────────────────────────────────────────────────

function loadJson(locale) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function saveJson(locale, data) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(value)) {
      // Arrays are accessed by index (e.g. demo.dashboard.features.0)
      value.forEach((item, i) => {
        const indexKey = `${fullKey}.${i}`
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          keys.push(...flattenKeys(item, indexKey))
        } else {
          keys.push(indexKey)
        }
      })
    } else if (value !== null && typeof value === 'object') {
      keys.push(...flattenKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function getNestedValue(obj, dotPath) {
  const parts = dotPath.split('.')
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = current[part]
  }
  return current
}

function setNestedValue(obj, dotPath, value) {
  const parts = dotPath.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {}
    }
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

function extractKeysFromCode() {
  try {
    const stdout = execSync(
      `grep -rhoP "t\\((?:msgs,\\s*)?'[a-zA-Z][a-zA-Z0-9_.]+'" "${SRC_DIR}" --include="*.tsx" --include="*.ts" 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )
    // Filter out false positives: URL query params (hub.*), short fragments
    const FALSE_POSITIVES = ['hub.challenge', 'hub.verify_token', 'hub.mode']
    return [...new Set(
      stdout.split('\n')
        .map(line => line.replace(/t\((?:msgs,\s*)?'/, '').replace(/'$/, ''))
        .filter(key => key.includes('.') && /^[a-zA-Z]/.test(key) && !FALSE_POSITIVES.includes(key))
    )].sort()
  } catch {
    console.warn('⚠ Could not extract keys from source (grep failed)')
    return []
  }
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  console.log('\n🌐 i18n Validation Report\n')

  const refData = loadJson(REFERENCE_LOCALE)
  const refKeys = new Set(flattenKeys(refData))
  console.log(`  Reference locale: ${REFERENCE_LOCALE} (${refKeys.size} keys)\n`)

  let totalMissing = 0
  let totalExtra = 0
  let totalFixed = 0

  // ── Part 1: Cross-locale consistency ──────────────────────────────
  console.log('─── Cross-locale consistency ───────────────────────')

  for (const locale of LOCALES) {
    if (locale === REFERENCE_LOCALE) continue

    const localeData = loadJson(locale)
    const localeKeys = new Set(flattenKeys(localeData))

    const missing = [...refKeys].filter(k => !localeKeys.has(k))
    const extra = [...localeKeys].filter(k => !refKeys.has(k))

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ✅ ${locale}: ${localeKeys.size} keys — in sync`)
      continue
    }

    if (missing.length > 0) {
      console.log(`  ❌ ${locale}: ${missing.length} missing key(s)`)
      for (const key of missing.slice(0, 15)) {
        console.log(`     - ${key}`)
      }
      if (missing.length > 15) {
        console.log(`     ... and ${missing.length - 15} more`)
      }
      totalMissing += missing.length

      if (FIX_MODE) {
        for (const key of missing) {
          const enValue = getNestedValue(refData, key)
          if (enValue !== undefined) {
            setNestedValue(localeData, key, enValue)
            totalFixed++
          }
        }
        saveJson(locale, localeData)
        console.log(`     → Fixed: copied ${missing.length} keys from EN`)
      }
    }

    if (extra.length > 0) {
      console.log(`  ⚠️  ${locale}: ${extra.length} extra key(s) not in EN`)
      for (const key of extra.slice(0, 10)) {
        console.log(`     + ${key}`)
      }
      if (extra.length > 10) {
        console.log(`     ... and ${extra.length - 10} more`)
      }
      totalExtra += extra.length
    }
  }

  // ── Part 2: Code → EN consistency ─────────────────────────────────
  console.log('\n─── Code usage vs EN locale ────────────────────────')

  const codeKeys = extractKeysFromCode()
  console.log(`  Keys found in source: ${codeKeys.length}`)

  const missingInEN = codeKeys.filter(k => !refKeys.has(k))
  const unusedInEN = [...refKeys].filter(k => !codeKeys.includes(k))

  if (missingInEN.length > 0) {
    console.log(`\n  ❌ ${missingInEN.length} key(s) used in code but MISSING from EN:`)
    for (const key of missingInEN.slice(0, 20)) {
      console.log(`     - ${key}`)
    }
    if (missingInEN.length > 20) {
      console.log(`     ... and ${missingInEN.length - 20} more`)
    }
  } else {
    console.log(`  ✅ All code keys exist in EN`)
  }

  // Don't report unused keys by default (many keys are used dynamically)
  // Just count them for awareness
  const dynamicPrefixes = ['landing.', 'notifications.', 'taskTypes.', 'onboarding.']
  const trulyUnused = unusedInEN.filter(k => !dynamicPrefixes.some(p => k.startsWith(p)))
  if (trulyUnused.length > 0) {
    console.log(`\n  ℹ️  ${trulyUnused.length} EN keys not found via static grep (may be used dynamically)`)
    console.log(`     (${unusedInEN.length} total, ${unusedInEN.length - trulyUnused.length} in known-dynamic prefixes)`)
  }

  // ── Summary ───────────────────────────────────────────────────────
  console.log('\n─── Summary ────────────────────────────────────────')
  console.log(`  EN reference:    ${refKeys.size} keys`)
  console.log(`  Missing (other): ${totalMissing}`)
  console.log(`  Extra (other):   ${totalExtra}`)
  if (FIX_MODE) {
    console.log(`  Auto-fixed:      ${totalFixed}`)
  }
  console.log(`  Code → EN gaps:  ${missingInEN.length}`)

  const hasIssues = totalMissing > 0 || missingInEN.length > 0
  if (hasIssues && !FIX_MODE) {
    console.log('\n  💡 Run with --fix to auto-copy missing keys from EN\n')
    process.exit(1)
  } else if (hasIssues && FIX_MODE) {
    console.log('\n  ✅ Fixes applied. Re-run without --fix to verify.\n')
    process.exit(0)
  } else {
    console.log('\n  ✅ All clean!\n')
    process.exit(0)
  }
}

main()
