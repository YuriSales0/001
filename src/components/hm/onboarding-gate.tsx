'use client'

import { useEffect, useState } from 'react'
import { ClientTour } from './client-tour'
import { OnboardingWizard } from './onboarding-wizard'

type Props = {
  role: string
  children: React.ReactNode
}

/**
 * Wraps page content and shows onboarding tour/wizard if user hasn't completed it.
 * CLIENT gets the interactive platform tour. MANAGER/CREW get the setup wizard.
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
