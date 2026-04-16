'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ArrowRight, FileText, User, Briefcase, Shield, Globe } from 'lucide-react'
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

  // Step 0 = Language, then role-specific steps
  const stepLabels = [
    t('onboarding.languageStep'),
    t('onboarding.profileStep'),
    ...(role === 'CREW'
      ? [t('onboarding.crewContractStep'), t('onboarding.crewSkillsStep')]
      : role === 'MANAGER'
      ? [t('onboarding.managerCompStep')]
      : [t('onboarding.clientPropertyStep')]),
    t('onboarding.contractStep'),
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
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: stepName, data: stepData, complete }),
    })
    setSaving(false)
  }

  const next = async () => {
    if (step === 0) {
      // Language already saved on pick — just advance
    }
    if (step === 1) {
      await saveStep('profile', { name, phone, language: selectedLang })
    }
    if (step === 2 && role === 'CREW') {
      await saveStep('contract', { contractType, monthlyRate, taskRate })
    }
    if (step === 2 && role === 'MANAGER') {
      await saveStep('compensation', {
        subscriptionShare: parseFloat(subscriptionShare) / 100,
        commissionShare: parseFloat(commissionShare) / 100,
      })
    }
    if (step === 3 && role === 'CREW') {
      await saveStep('skills', { skills })
    }
    if (step === stepLabels.length - 1) {
      await saveStep('complete', { signContractIds: acceptedContracts }, true)
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
  const confirmIdx = stepLabels.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827] bg-opacity-95 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#111827] px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-white">Host<span style={{ color: '#C9A84C' }}>Masters</span></span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
              {t('onboarding.setupTitle')}
            </span>
          </div>
          <p className="text-sm text-white/60">{t('onboarding.setupSubtitle')}</p>

          <div className="flex gap-1.5 mt-4">
            {stepLabels.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-[#C9A84C]' : 'bg-white/10'}`} />
                <p className={`text-[9px] mt-1 truncate ${i <= step ? 'text-[#C9A84C]' : 'text-white/30'}`}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-[320px]">
          {/* Step 0: Language */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-1">
                <Globe className="h-5 w-5 text-[#C9A84C]" />
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
                      borderColor: selectedLang === lang.code ? '#C9A84C' : 'rgba(0,0,0,0.08)',
                      background: selectedLang === lang.code ? 'rgba(201,168,76,0.08)' : 'transparent',
                    }}
                  >
                    <span className="text-2xl block mb-1">{lang.flag}</span>
                    <span className={`text-xs font-semibold ${selectedLang === lang.code ? 'text-[#C9A84C]' : 'text-gray-600'}`}>
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
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
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

          {/* Role step 1: Crew Contract */}
          {step === roleStep1Idx && role === 'CREW' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                {t('onboarding.crewContractStep')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setContractType('MONTHLY')}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${contractType === 'MONTHLY' ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-sm font-semibold">{t('onboarding.crewMonthly')}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('onboarding.crewMonthlySub')}</div>
                </button>
                <button onClick={() => setContractType('FREELANCER')}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${contractType === 'FREELANCER' ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-sm font-semibold">{t('onboarding.crewFreelancer')}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('onboarding.crewFreelancerSub')}</div>
                </button>
              </div>
              {contractType === 'MONTHLY' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('onboarding.crewMonthlyLabel')}</label>
                  <input type="number" value={monthlyRate} onChange={e => setMonthlyRate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="ex: 1200" />
                </div>
              )}
              {contractType === 'FREELANCER' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('onboarding.crewTaskLabel')}</label>
                  <input type="number" value={taskRate} onChange={e => setTaskRate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="ex: 35" />
                </div>
              )}
            </>
          )}

          {/* Role step 1: Manager Compensation */}
          {step === roleStep1Idx && role === 'MANAGER' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                {t('onboarding.managerCompStep')}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {subscriptionShare ? t('onboarding.managerCompDescSet') : t('onboarding.managerCompDescEmpty')}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('onboarding.managerSubShare')}</label>
                  <input type="number" min="0" max="50" value={subscriptionShare} onChange={e => setSubscriptionShare(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Ex: MID (€159/mo) → €{(159 * parseFloat(subscriptionShare || '0') / 100).toFixed(0)}/mo</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('onboarding.managerCommShare')}</label>
                  <input type="number" min="0" max="10" step="0.5" value={commissionShare} onChange={e => setCommissionShare(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Ex: €2000 bruto → €{(2000 * parseFloat(commissionShare || '0') / 100).toFixed(0)}</p>
                </div>
              </div>
            </>
          )}

          {/* Role step 1: Client Property */}
          {step === roleStep1Idx && role === 'CLIENT' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                {t('onboarding.clientPropertyStep')}
              </div>
              <p className="text-sm text-gray-500">{t('onboarding.clientPropertyDesc')}</p>
            </>
          )}

          {/* Crew Skills */}
          {step === roleStep2Idx && role === 'CREW' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Shield className="h-5 w-5 text-gray-400" />
                {t('onboarding.crewSkillsStep')}
              </div>
              <p className="text-xs text-gray-500 mb-3">{t('onboarding.crewSkillsDesc')}</p>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <label key={skill} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={skills.includes(skill)}
                      onChange={e => setSkills(e.target.checked ? [...skills, skill] : skills.filter(s => s !== skill))}
                      className="accent-[#C9A84C]" />
                    {t(`crew.taskTypes.${skill}`) || skill.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Contract signing */}
          {step === contractIdx && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <FileText className="h-5 w-5 text-gray-400" />
                {t('onboarding.contractStep')}
              </div>
              {data && data.pendingContracts.length > 0 ? (
                <div className="space-y-3">
                  {data.pendingContracts.map(c => (
                    <label key={c.id} className="flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer hover:border-[#C9A84C]/50 transition-colors">
                      <input type="checkbox" checked={acceptedContracts.includes(c.id)}
                        onChange={e => setAcceptedContracts(e.target.checked ? [...acceptedContracts, c.id] : acceptedContracts.filter(id => id !== c.id))}
                        className="mt-0.5 accent-[#C9A84C]" />
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

          {/* Confirm */}
          {step === confirmIdx && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
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

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              {t('onboarding.back')}
            </button>
          ) : <div />}
          <button onClick={next} disabled={saving || (step === profileIdx && !name)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#111827] text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
            {saving ? t('onboarding.saving') : step === confirmIdx ? t('onboarding.finish') : t('onboarding.next')}
            {!saving && step < confirmIdx && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
