'use client'

import { useEffect, useState } from 'react'
import { OnboardingWizard } from './onboarding-wizard'

type Props = {
  role: string
  children: React.ReactNode
}

/**
 * Wraps page content and shows onboarding wizard if user hasn't completed it.
 * Include in layout.tsx for Manager, Crew, Client portals.
 */
export function OnboardingGate({ role, children }: Props) {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    // Skip for ADMIN
    if (role === 'ADMIN') { setNeedsOnboarding(false); return }

    fetch('/api/onboarding')
      .then(r => r.ok ? r.json() : null)
      .then(d => setNeedsOnboarding(d?.needsOnboarding ?? false))
      .catch(() => setNeedsOnboarding(false))
  }, [role])

  // Still checking
  if (needsOnboarding === null) return <>{children}</>

  // Show wizard
  if (needsOnboarding) {
    return (
      <>
        {children}
        <OnboardingWizard role={role} onComplete={() => setNeedsOnboarding(false)} />
      </>
    )
  }

  return <>{children}</>
}
