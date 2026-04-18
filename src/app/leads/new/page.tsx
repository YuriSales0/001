'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function LeadCapturePage() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? ''

  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]   = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null, ref: ref || null }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: '#1A1A1A' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-full flex items-center justify-center"
               style={{ background: '#B08A3E' }}>
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Host<span style={{ color: '#B08A3E' }}>Masters</span>
          </span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Obrigado!</h2>
              <p className="text-gray-500 text-sm">
                Recebemos o teu contacto. A nossa equipa vai entrar em contacto em breve.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Fala connosco</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gestão profissional de propriedades · Costa Tropical, Espanha
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="O teu nome completo"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Fala-nos sobre a tua propriedade ou interesse…"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="w-full rounded-lg py-3 text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: '#B08A3E' }}
                >
                  {submitting ? 'A enviar…' : 'Enviar contacto'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          HostMasters · Costa Tropical, Espanha
        </p>
      </div>
    </div>
  )
}
