import { describe, it, expect } from 'vitest'
import { gt } from '@/lib/guest-i18n'

describe('guest-i18n gt()', () => {
  it('returns English by default for unknown language', () => {
    const result = gt('stay', 'humanButton', 'xx')
    expect(result).toBe('Human')
  })

  it('returns translation for known language', () => {
    expect(gt('stay', 'humanButton', 'pt')).toBe('Pessoa')
    expect(gt('stay', 'humanButton', 'es')).toBe('Humano')
    expect(gt('stay', 'humanButton', 'de')).toBe('Mensch')
    expect(gt('stay', 'humanButton', 'fr')).toBe('Humain')
  })

  it('interpolates variables', () => {
    const result = gt('stay', 'greeting', 'en', { name: 'Erik' })
    expect(result).toContain('Erik')
    expect(result).not.toContain('{name}')
  })

  it('interpolates in multiple languages', () => {
    const pt = gt('stay', 'greeting', 'pt', { name: 'João' })
    const de = gt('stay', 'greeting', 'de', { name: 'Klaus' })
    expect(pt).toContain('João')
    expect(de).toContain('Klaus')
  })

  it('handles missing vars gracefully', () => {
    const result = gt('stay', 'greeting', 'en')
    // Template placeholder stays if no vars passed
    expect(result).toContain('{name}')
  })

  it('returns feedback section strings', () => {
    expect(gt('feedback', 'submit', 'pt')).toBe('Enviar opinião')
    expect(gt('feedback', 'thankYou', 'es')).toBe('¡Gracias!')
  })

  it('all 8 supported languages have all keys', () => {
    const langs = ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da']
    const stayKeys = ['greeting', 'greetingSub', 'placeholder', 'humanButton', 'escalationBanner', 'footerNote', 'expired', 'rateLimit'] as const
    const feedbackKeys = ['title', 'intro', 'propertySection', 'crewSection', 'platformSection', 'tellUsMore', 'submit', 'thankYou'] as const

    for (const lang of langs) {
      for (const k of stayKeys) {
        const v = gt('stay', k, lang)
        expect(v, `stay.${k}.${lang}`).toBeTruthy()
        expect(v, `stay.${k}.${lang}`).not.toBe('')
      }
      for (const k of feedbackKeys) {
        const v = gt('feedback', k, lang)
        expect(v, `feedback.${k}.${lang}`).toBeTruthy()
      }
    }
  })
})
