'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ArrowRight, FileText, User, Briefcase, Shield } from 'lucide-react'

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
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState('es')

  // Crew
  const [contractType, setContractType] = useState('FREELANCER')
  const [monthlyRate, setMonthlyRate] = useState('')
  const [taskRate, setTaskRate] = useState('')
  const [skills, setSkills] = useState<string[]>([])

  // Manager — no defaults, Admin sets these via invite
  const [subscriptionShare, setSubscriptionShare] = useState('')
  const [commissionShare, setCommissionShare] = useState('')

  // Contract
  const [acceptedContracts, setAcceptedContracts] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/onboarding')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setData(d)
          if (d.currentData.name) setName(d.currentData.name as string)
          if (d.currentData.phone) setPhone(d.currentData.phone as string)
          // Load values pre-set by Admin during invite
          if (d.currentData.managerSubscriptionShare) setSubscriptionShare(String((d.currentData.managerSubscriptionShare as number) * 100))
          if (d.currentData.managerCommissionShare) setCommissionShare(String((d.currentData.managerCommissionShare as number) * 100))
          if (d.currentData.crewContractType) setContractType(d.currentData.crewContractType as string)
          if (d.currentData.crewMonthlyRate) setMonthlyRate(String(d.currentData.crewMonthlyRate))
          if (d.currentData.crewTaskRate) setTaskRate(String(d.currentData.crewTaskRate))
        }
      })
  }, [])

  const steps = role === 'CREW'
    ? ['Perfil', 'Contrato', 'Competências', 'Confirmar']
    : role === 'MANAGER'
    ? ['Perfil', 'Compensação', 'Contrato', 'Confirmar']
    : ['Perfil', 'Propriedade', 'Contrato', 'Confirmar'] // CLIENT

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
      await saveStep('profile', { name, phone, language })
    }
    if (step === 1 && role === 'CREW') {
      await saveStep('contract', { contractType, monthlyRate, taskRate })
    }
    if (step === 1 && role === 'MANAGER') {
      await saveStep('compensation', { subscriptionShare: parseFloat(subscriptionShare) / 100, commissionShare: parseFloat(commissionShare) / 100 })
    }
    if (step === 2 && role === 'CREW') {
      await saveStep('skills', { skills })
    }
    if (step === steps.length - 1) {
      await saveStep('complete', { signContractIds: acceptedContracts }, true)
      onComplete()
      return
    }
    setStep(s => s + 1)
  }

  const SKILL_OPTIONS = ['CLEANING', 'MAINTENANCE', 'CHECK_IN', 'CHECK_OUT', 'INSPECTION', 'TRANSFER', 'SHOPPING', 'LAUNDRY']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827] bg-opacity-95 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#111827] px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-white">Host<span style={{ color: '#C9A84C' }}>Masters</span></span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
              Setup
            </span>
          </div>
          <p className="text-sm text-white/60">Configuração inicial da tua conta</p>

          {/* Progress */}
          <div className="flex gap-1.5 mt-4">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-[#C9A84C]' : 'bg-white/10'}`} />
                <p className={`text-[9px] mt-1 ${i <= step ? 'text-[#C9A84C]' : 'text-white/30'}`}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-[280px]">
          {/* Step 0: Profile */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <User className="h-5 w-5 text-gray-400" />
                O teu perfil
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nome completo</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="O teu nome" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Telefone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="+34 600 000 000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Idioma preferido</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Step 1: Crew Contract */}
          {step === 1 && role === 'CREW' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                Tipo de contrato
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setContractType('MONTHLY')}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${contractType === 'MONTHLY' ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-sm font-semibold">Mensal</div>
                  <div className="text-xs text-gray-500 mt-1">Valor fixo por mês</div>
                </button>
                <button onClick={() => setContractType('FREELANCER')}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${contractType === 'FREELANCER' ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-sm font-semibold">Freelancer</div>
                  <div className="text-xs text-gray-500 mt-1">Por tarefa concluída</div>
                </button>
              </div>
              {contractType === 'MONTHLY' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Valor mensal (€)</label>
                  <input type="number" value={monthlyRate} onChange={e => setMonthlyRate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="ex: 1200" />
                </div>
              )}
              {contractType === 'FREELANCER' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Valor por tarefa (€)</label>
                  <input type="number" value={taskRate} onChange={e => setTaskRate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="ex: 35" />
                </div>
              )}
            </>
          )}

          {/* Step 1: Manager Compensation */}
          {step === 1 && role === 'MANAGER' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                Acordo de compensação
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {subscriptionShare ? 'Valores definidos pelo Admin. Confirma os termos.' : 'Preenche os valores acordados com o Admin.'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">% da assinatura do cliente</label>
                  <input type="number" min="0" max="50" value={subscriptionShare} onChange={e => setSubscriptionShare(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Ex: cliente MID (€159/mês) → recebes €{(159 * parseFloat(subscriptionShare || '0') / 100).toFixed(0)}/mês</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">% da receita bruta de aluguéis</label>
                  <input type="number" min="0" max="10" step="0.5" value={commissionShare} onChange={e => setCommissionShare(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Ex: €2000 bruto → recebes €{(2000 * parseFloat(commissionShare || '0') / 100).toFixed(0)}</p>
                </div>
              </div>
            </>
          )}

          {/* Step 1: Client Property (placeholder) */}
          {step === 1 && role === 'CLIENT' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Briefcase className="h-5 w-5 text-gray-400" />
                A tua propriedade
              </div>
              <p className="text-sm text-gray-500">
                A tua propriedade será configurada pelo Admin ou Manager. Nesta fase, confirma os teus dados pessoais e aceita o contrato de serviço no próximo passo.
              </p>
            </>
          )}

          {/* Step 2: Crew Skills */}
          {step === 2 && role === 'CREW' && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <Shield className="h-5 w-5 text-gray-400" />
                Competências
              </div>
              <p className="text-xs text-gray-500 mb-3">Selecciona os tipos de tarefa que sabes executar.</p>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <label key={skill} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={skills.includes(skill)}
                      onChange={e => setSkills(e.target.checked ? [...skills, skill] : skills.filter(s => s !== skill))}
                      className="accent-[#C9A84C]" />
                    {skill.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Contract signing (Manager + Client) */}
          {step === 2 && (role === 'MANAGER' || role === 'CLIENT') && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <FileText className="h-5 w-5 text-gray-400" />
                Contrato de serviço
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
                        <div className="text-xs text-gray-500 mt-0.5">Li e aceito os termos deste contrato</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 border p-4 text-sm text-gray-500">
                  Nenhum contrato pendente. O Admin vai disponibilizar o teu contrato em breve.
                </div>
              )}
            </>
          )}

          {/* Final step: Confirm */}
          {step === steps.length - 1 && (
            <>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Tudo pronto
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                {role === 'CREW' && `Contrato ${contractType === 'MONTHLY' ? 'mensal' : 'freelancer'} configurado. ${skills.length} competência(s) seleccionada(s).`}
                {role === 'MANAGER' && `Compensação: ${subscriptionShare}% assinaturas + ${commissionShare}% comissões.`}
                {role === 'CLIENT' && 'O teu perfil está configurado. Bem-vindo à HostMasters.'}
              </div>
              <p className="text-xs text-gray-400">Clica "Concluir" para entrar na plataforma. Podes alterar estas definições mais tarde no teu perfil.</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Voltar
            </button>
          ) : <div />}
          <button onClick={next} disabled={saving || (step === 0 && !name)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#111827] text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'A guardar...' : step === steps.length - 1 ? 'Concluir' : 'Próximo'}
            {!saving && step < steps.length - 1 && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
