'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ArrowRight, FileText, User, Briefcase, Shield, Globe, Sparkles, MessageCircle } from 'lucide-react'
import { useLocale } from '@/i18n/provider'
import { LOCALES, type Locale } from '@/i18n'

type WizardProps = {
  role: string
  onComplete: () => void
}

type PendingContract = { id: string; type: string; title: string; signedByUser: boolean }

type OnboardingData = {
  needsOnboarding: boolean
  role: string
  currentData: Record<string, unknown>
  pendingContracts: PendingContract[]
}

export function OnboardingWizard({ role, onComplete }: WizardProps) {
  const { t, locale, setLocale } = useLocale()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData | null>(null)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [selectedLang, setSelectedLang] = useState<Locale>(locale)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [contractType, setContractType] = useState('FREELANCER')
  const [monthlyRate, setMonthlyRate] = useState('')
  const [taskRate, setTaskRate] = useState('')
  const [skills, setSkills] = useState<string[]>([])

  const [subscriptionShare, setSubscriptionShare] = useState('')
  const [commissionShare, setCommissionShare] = useState('')

  const [acceptedContracts, setAcceptedContracts] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/onboarding')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setData(d)
          if (d.currentData.name) setName(d.currentData.name as string)
          if (d.currentData.phone) setPhone(d.currentData.phone as string)
          if (d.currentData.language) {
            setSelectedLang(d.currentData.language as Locale)
          }
          if (d.currentData.managerSubscriptionShare) setSubscriptionShare(String((d.currentData.managerSubscriptionShare as number) * 100))
          if (d.currentData.managerCommissionShare) setCommissionShare(String((d.currentData.managerCommissionShare as number) * 100))
          if (d.currentData.crewContractType) setContractType(d.currentData.crewContractType as string)
          if (d.currentData.crewMonthlyRate) setMonthlyRate(String(d.currentData.crewMonthlyRate))
          if (d.currentData.crewTaskRate) setTaskRate(String(d.currentData.crewTaskRate))
        }
      })
  }, [])

  // Step 0 = Language, then role-specific steps, then contract, AI intro, confirm
  const stepLabels = [
    t('onboarding.languageStep'),
    t('onboarding.profileStep'),
    ...(role === 'CREW'
      ? [t('onboarding.crewContractStep'), t('onboarding.crewSkillsStep')]
      : role === 'MANAGER'
      ? [t('onboarding.managerCompStep')]
      : [t('onboarding.clientPropertyStep')]),
    t('onboarding.contractStep'),
    t('onboarding.aiStep'),
    t('onboarding.confirmStep'),
  ]

  const pickLanguage = async (lang: Locale) => {
    setSelectedLang(lang)
    setLocale(lang)
    setSaving(true)
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'language', data: { language: lang } }),
    })
    setSaving(false)
  }

  const saveStep = async (stepName: string, stepData: Record<string, unknown>, complete = false) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepName, data: stepData, complete }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || t('onboarding.saveError'))
        setSaving(false)
        return false
      }
    } catch {
      setError(t('onboarding.networkError'))
      setSaving(false)
      return false
    }
    setSaving(false)
    return true
  }

  const next = async () => {
    if (step === 0) {
      // Language already saved on pick — just advance
    }
    if (step === 1) {
      const ok = await saveStep('profile', { name, phone, language: selectedLang })
      if (!ok) return
    }
    if (step === 2 && role === 'CREW') {
      const ok = await saveStep('contract', { contractType, monthlyRate, taskRate })
      if (!ok) return
    }
    if (step === 2 && role === 'MANAGER') {
      const ok = await saveStep('compensation', {
        subscriptionShare: parseFloat(subscriptionShare) / 100,
        commissionShare: parseFloat(commissionShare) / 100,
      })
      if (!ok) return
    }
    if (step === 3 && role === 'CREW') {
      const ok = await saveStep('skills', { skills })
      if (!ok) return
    }
    if (step === stepLabels.length - 1) {
      const ok = await saveStep('complete', { signContractIds: acceptedContracts }, true)
      if (!ok) return
      onComplete()
      return
    }
    setStep(s => s + 1)
  }

  const SKILL_OPTIONS = ['CLEANING', 'MAINTENANCE', 'CHECK_IN', 'CHECK_OUT', 'INSPECTION', 'TRANSFER', 'SHOPPING', 'LAUNDRY']

  // Dynamic step indices
  const profileIdx = 1
  const roleStep1Idx = 2
  const roleStep2Idx = role === 'CREW' ? 3 : -1
  const contractIdx = role === 'CREW' ? 4 : 3
  const aiIdx = contractIdx + 1
  const confirmIdx = stepLabels.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1E3A] bg-opacity-95 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1E3A] px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-white">Host<span style={{ color: '#B08A3E' }}>Masters</span></span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(176,138,62,0.2)', color: '#B08A3E' }}>
              {t('onboarding.setupTitle')}
            </span>
          </div>
          <p className="text-sm text-white/60">{t('onboarding.setupSubtitle')}</p>

          <div className="flex gap-1.5 mt-4">
            {stepLabels.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-[#B08A3E]' : 'bg-white/10'}`} />
                <p className={`text-[9px] mt-1 truncate ${i <= step ? 'text-[#B08A3E]' : 'text-white/30'}`}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-[320px]">
          {/* Step 0: Language */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-1">
                <Globe className="h-5 w-5 text-[#B08A3E]" />
                {t('onboarding.languageStep')}
              </div>
              <p className="text-xs text-gray-500 mb-4">{t('onboarding.languageStepDesc')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LOCALES.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => pickLanguage(lang.code)}
                    className="rounded-xl border-2 p-3 text-center transition-all"
                    style={{
                      borderColor: selectedLang === lang.code ? '#B08A3E' : 'rgba(0,0,0,0.08)',
                      background: selectedLang === lang.code ? 'rgba(176,138,62,0.08)' : 'transparent',
                    }}
                  >
                    <span className="text-2xl block mb-1">{lang.flag}</span>
                    <span className={`text-xs font-semibold ${selectedLang === lang.code ? 'text-[#B08A3E]' : 'text-gray-600'}`}>
                      {lang.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 1: Profile */}
          {step === profileIdx && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <User className="h-5 w-5 text-gray-400" />
                {t('onboarding.profileStep')}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('onboarding.fullName')}</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder={t('onboarding.fullNamePlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('common.phone')}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder={t('onboarding.phonePlaceholder')} />
                </div>
              </div>
            </>
          )}

          {/* Role step 1: Crew Contract — READ ONLY (set by Admin) */}
          {step === roleStep1Idx && role === 'CREW' && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                {t('onboarding.crewContractStep')}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {t('onboarding.crewContractDesc')}
              </p>
              <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('onboarding.crewContractTypeLabel')}</span>
                  <span className="text-sm font-semibold text-hm-black">
                    {contractType === 'MONTHLY' ? t('onboarding.crewMonthly') : t('onboarding.crewFreelancer')}
                  </span>
                </div>
                {contractType === 'MONTHLY' && monthlyRate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('onboarding.crewMonthlyLabel')}</span>
                    <span className="text-sm font-semibold text-hm-black">€{monthlyRate}</span>
                  </div>
                )}
                {contractType === 'FREELANCER' && taskRate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('onboarding.crewTaskLabel')}</span>
                    <span className="text-sm font-semibold text-hm-black">€{taskRate}</span>
                  </div>
                )}
                {!monthlyRate && !taskRate && (
                  <p className="text-xs text-amber-600">
                    {t('onboarding.ratesNotConfigured')}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Role step 1: Manager Compensation — READ ONLY (set by Admin) */}
          {step === roleStep1Idx && role === 'MANAGER' && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                {t('onboarding.managerCompStep')}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {t('onboarding.managerCompDescSet')}
              </p>
              <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('onboarding.managerSubShare')}</span>
                  <span className="text-sm font-semibold text-hm-black">
                    {subscriptionShare ? `${subscriptionShare}%` : '—'}
                  </span>
                </div>
                {subscriptionShare && (
                  <p className="text-[10px] text-gray-400">Ex: MID client (€159/mo) → €{(159 * parseFloat(subscriptionShare) / 100).toFixed(0)}/mo for you</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('onboarding.managerCommShare')}</span>
                  <span className="text-sm font-semibold text-hm-black">
                    {commissionShare ? `${commissionShare}%` : '—'}
                  </span>
                </div>
                {commissionShare && (
                  <p className="text-[10px] text-gray-400">Ex: €2,000 gross rental → €{(2000 * parseFloat(commissionShare) / 100).toFixed(0)} for you</p>
                )}
                {!subscriptionShare && !commissionShare && (
                  <p className="text-xs text-amber-600">
                    {t('onboarding.compensationNotConfigured')}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Role step 1: Client Property */}
          {step === roleStep1Idx && role === 'CLIENT' && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                {t('onboarding.clientPropertyStep')}
              </div>
              <p className="text-sm text-gray-500">{t('onboarding.clientPropertyDesc')}</p>
            </>
          )}

          {/* Crew Skills */}
          {step === roleStep2Idx && role === 'CREW' && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <Shield className="h-5 w-5 text-gray-400" />
                {t('onboarding.crewSkillsStep')}
              </div>
              <p className="text-xs text-gray-500 mb-3">{t('onboarding.crewSkillsDesc')}</p>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <label key={skill} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={skills.includes(skill)}
                      onChange={e => setSkills(e.target.checked ? [...skills, skill] : skills.filter(s => s !== skill))}
                      className="accent-[#B08A3E]" />
                    {t(`crew.taskTypes.${skill}`) || skill.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Contract signing */}
          {step === contractIdx && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <FileText className="h-5 w-5 text-gray-400" />
                {t('onboarding.contractStep')}
              </div>
              {data && data.pendingContracts.length > 0 ? (
                <div className="space-y-3">
                  {data.pendingContracts.map(c => (
                    <label key={c.id} className="flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer hover:border-[#B08A3E]/50 transition-colors">
                      <input type="checkbox" checked={acceptedContracts.includes(c.id)}
                        onChange={e => setAcceptedContracts(e.target.checked ? [...acceptedContracts, c.id] : acceptedContracts.filter(id => id !== c.id))}
                        className="mt-0.5 accent-[#B08A3E]" />
                      <div>
                        <div className="text-sm font-semibold">{c.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t('onboarding.contractAccept')}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 border p-4 text-sm text-gray-500">
                  {t('onboarding.contractNone')}
                </div>
              )}
            </>
          )}

          {/* AI Assistant intro */}
          {step === aiIdx && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <Sparkles className="h-5 w-5 text-[#B08A3E]" />
                {t('onboarding.aiStepTitle')}
              </div>
              <p className="text-xs text-gray-500 mb-4">{t('onboarding.aiStepDesc')}</p>
              <div className="rounded-xl border-2 p-4 space-y-3" style={{ borderColor: 'rgba(176,138,62,0.3)', background: 'rgba(176,138,62,0.05)' }}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center" style={{ background: '#0B1E3A' }}>
                    <MessageCircle className="h-4 w-4" style={{ color: '#B08A3E' }} />
                  </div>
                  <div className="flex-1 text-xs text-gray-700">
                    <p className="font-semibold text-hm-black mb-1">{t('onboarding.aiFeatureIntro')}</p>
                    <ul className="space-y-1.5">
                      {role === 'CLIENT' && (
                        <>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureClient1')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureClient2')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureClient3')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureClient4')}</li>
                        </>
                      )}
                      {role === 'CREW' && (
                        <>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureCrew1')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureCrew2')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureCrew3')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureCrew4')}</li>
                        </>
                      )}
                      {role === 'MANAGER' && (
                        <>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureManager1')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureManager2')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureManager3')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureManager4')}</li>
                        </>
                      )}
                      {role === 'ADMIN' && (
                        <>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureAdmin1')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureAdmin2')}</li>
                          <li className="flex gap-2"><span className="text-[#B08A3E]">•</span>{t('onboarding.aiFeatureAdmin3')}</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#B08A3E]" />
                {t('onboarding.aiLanguageNote').replace('{lang}', LOCALES.find(l => l.code === selectedLang)?.label ?? 'English')}
              </p>
              <p className="text-xs text-gray-400 mt-2">{t('onboarding.aiAccessHint')}</p>
            </>
          )}

          {/* Confirm */}
          {step === confirmIdx && (
            <>
              <div className="flex items-center gap-2 text-hm-black font-semibold mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {t('onboarding.confirmStep')}
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                {role === 'CREW' && `${contractType === 'MONTHLY' ? t('onboarding.confirmCrewMonthly') : t('onboarding.confirmCrewFreelancer')} ${t('onboarding.confirmCrewSkills').replace('{n}', String(skills.length))}`}
                {role === 'MANAGER' && t('onboarding.confirmManager').replace('{sub}', subscriptionShare).replace('{comm}', commissionShare)}
                {role === 'CLIENT' && t('onboarding.confirmClient')}
              </div>
              <p className="text-xs text-gray-400">{t('onboarding.confirmHint')}</p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-2">
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              {t('onboarding.back')}
            </button>
          ) : <div />}
          <button onClick={next} disabled={saving || (step === profileIdx && !name)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B1E3A] text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
            {saving ? t('onboarding.saving') : step === confirmIdx ? t('onboarding.finish') : t('onboarding.next')}
            {!saving && step < confirmIdx && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
