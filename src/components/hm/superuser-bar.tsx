'use client'

import { useEffect, useState } from 'react'

type UserEntry = {
  id: string
  name: string | null
  email: string
  role: string
}

type GroupedUsers = Record<string, UserEntry[]>

type Props = {
  realUser: { name: string | null; email: string }
  viewAs: { userId: string; name: string | null; role: string } | null
}

export function SuperuserBar({ realUser, viewAs }: Props) {
  const [users, setUsers] = useState<GroupedUsers>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/superuser/users')
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(() => {})
  }, [])

  async function handleImpersonate(userId: string) {
    if (!userId) return
    setLoading(true)
    try {
      await fetch('/api/superuser/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      window.location.reload()
    } catch {
      setLoading(false)
    }
  }

  async function handleExit() {
    setLoading(true)
    try {
      await fetch('/api/superuser/impersonate', { method: 'DELETE' })
      window.location.reload()
    } catch {
      setLoading(false)
    }
  }

  const roleOrder = ['ADMIN', 'MANAGER', 'CREW', 'CLIENT']
  const sortedRoles = Object.keys(users).sort(
    (a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b)
  )

  return (
    <>
      {/* Spacer so content is not hidden behind fixed bar */}
      <div className="h-10" aria-hidden="true" />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4"
        style={{
          background: '#1e1b4b',
          height: '40px',
          borderTop: '1px solid rgba(167,139,250,0.3)',
        }}
      >
        {/* Badge */}
        <span
          className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: '#C9A84C', color: '#1e1b4b' }}
        >
          SUPERUSER
        </span>

        {/* Identity */}
        <span className="text-xs text-white/70 shrink-0">
          {viewAs ? (
            <>
              <span className="text-white/40">Impersonating:</span>{' '}
              <span className="text-white font-medium">{viewAs.name ?? '(no name)'}</span>{' '}
              <span
                className="rounded px-1 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}
              >
                {viewAs.role}
              </span>
            </>
          ) : (
            <>
              <span className="text-white/40">Real identity:</span>{' '}
              <span className="text-white font-medium">{realUser.name ?? realUser.email}</span>{' '}
              <span
                className="rounded px-1 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}
              >
                ADMIN
              </span>
            </>
          )}
        </span>

        {/* Divider */}
        <div className="h-4 w-px bg-white/20 shrink-0" />

        {/* User picker */}
        <select
          disabled={loading}
          value={viewAs?.userId ?? ''}
          onChange={e => {
            const val = e.target.value
            if (!val) return
            handleImpersonate(val)
          }}
          className="h-6 rounded border border-white/20 bg-white/10 px-2 text-[11px] text-white focus:outline-none focus:border-purple-400 disabled:opacity-50 max-w-[220px]"
        >
          <option value="" style={{ background: '#1e1b4b' }}>
            — View as user —
          </option>
          {sortedRoles.map(role => (
            <optgroup
              key={role}
              label={role}
              style={{ background: '#1e1b4b', color: '#a78bfa' }}
            >
              {users[role].map(u => (
                <option key={u.id} value={u.id} style={{ background: '#1e1b4b', color: '#fff' }}>
                  {u.name ?? u.email} ({u.email})
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Exit impersonation */}
        {viewAs && (
          <button
            onClick={handleExit}
            disabled={loading}
            className="ml-1 shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: '#dc2626' }}
          >
            Exit
          </button>
        )}
      </div>
    </>
  )
}
