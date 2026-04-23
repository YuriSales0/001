'use client'

import { useEffect, useState, useRef } from 'react'
import { ClientTour } from './client-tour'
import { OnboardingWizard } from './onboarding-wizard'

type Props = {
  role: string
  children: React.ReactNode
}

const MAX_RETRIES = 3

/**
 * Wraps page content and shows onboarding tour/wizard if user hasn't completed it.
 * CLIENT gets the interactive platform tour. MANAGER/CREW get the setup wizard.
 */
export function OnboardingGate({ role, children }: Props) {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)
  const [error, setError] = useState(false)
  const [retryTrigger, setRetryTrigger] = useState(0)
  const retryCount = useRef(0)

  useEffect(() => {
    // Skip for ADMIN
    if (role === 'ADMIN') { setNeedsOnboarding(false); return }

    const fetchOnboarding = () => {
      fetch('/api/onboarding')
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
        .then(d => {
          setNeedsOnboarding(d?.needsOnboarding ?? false)
          setError(false)
        })
        .catch(() => {
          retryCount.current += 1
          if (retryCount.current < MAX_RETRIES) {
            setTimeout(fetchOnboarding, 1000 * retryCount.current)
          } else {
            setError(true)
          }
        })
    }

    fetchOnboarding()
  }, [role, retryTrigger])

  // Error state — do not render children to avoid broken state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-2">
          <p className="text-sm text-red-600">Failed to load onboarding status.</p>
          <button
            onClick={() => { retryCount.current = 0; setError(false); setNeedsOnboarding(null); setRetryTrigger(n => n + 1) }}
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Still checking — show skeleton, never the real dashboard
  if (needsOnboarding === null) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-100" />
      <div className="h-32 rounded-xl bg-gray-100" />
      <div className="h-24 rounded-xl bg-gray-100" />
    </div>
  )

  // Show tour/wizard
  if (needsOnboarding) {
    return (
      <>
        {children}
        {role === 'CLIENT' ? (
          <ClientTour onComplete={() => setNeedsOnboarding(false)} />
        ) : (
          <OnboardingWizard role={role} onComplete={() => setNeedsOnboarding(false)} />
        )}
      </>
    )
  }

  return <>{children}</>
}
