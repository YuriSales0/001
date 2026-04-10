import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, ASSISTANT_MODEL } from '@/lib/ai-context'
import type { ChatRole } from '@/lib/ai-context'

describe('ASSISTANT_MODEL', () => {
  it('uses Haiku model', () => {
    expect(ASSISTANT_MODEL).toBe('claude-haiku-4-5-20251001')
  })
})

describe('buildSystemPrompt', () => {
  const roles: ChatRole[] = ['CREW', 'MANAGER', 'ADMIN', 'CLIENT']

  it.each(roles)('returns non-empty string for role %s', (role) => {
    const result = buildSystemPrompt(role)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(100)
  })

  it('includes base context with plans table for all roles', () => {
    for (const role of roles) {
      const prompt = buildSystemPrompt(role)
      expect(prompt).toContain('STARTER')
      expect(prompt).toContain('PREMIUM')
      expect(prompt).toContain('22%')
      expect(prompt).toContain('13%')
    }
  })

  it('includes payout flow in base context', () => {
    const prompt = buildSystemPrompt('ADMIN')
    expect(prompt).toContain('Airbnb')
    expect(prompt).toContain('Booking')
    expect(prompt).toContain('Mark Paid')
  })

  it('CREW prompt focuses on operational tasks', () => {
    const prompt = buildSystemPrompt('CREW')
    expect(prompt).toContain('limpeza')
    expect(prompt).toContain('checkout')
    expect(prompt).toContain('campo')
    // CREW should NOT see financial info in their role context
    expect(prompt).toContain('Não tens acesso a dados financeiros')
  })

  it('MANAGER prompt includes CRM and financial rules', () => {
    const prompt = buildSystemPrompt('MANAGER')
    expect(prompt).toContain('CRM')
    expect(prompt).toContain('comissões')
    expect(prompt).toContain('managerId')
  })

  it('ADMIN prompt has full access knowledge', () => {
    const prompt = buildSystemPrompt('ADMIN')
    expect(prompt).toContain('integrações')
    expect(prompt).toContain('AI Monitoring')
    expect(prompt).toContain('Roadmap')
  })

  it('CLIENT prompt focuses on owner perspective', () => {
    const prompt = buildSystemPrompt('CLIENT')
    expect(prompt).toContain('proprietário')
    expect(prompt).toContain('plano')
    expect(prompt).toContain('manutenção')
    expect(prompt).toContain('Não tens acesso a dados de outros proprietários')
  })

  it('all prompts end with language instruction', () => {
    for (const role of roles) {
      const prompt = buildSystemPrompt(role)
      expect(prompt).toContain('português de Portugal')
    }
  })
})
