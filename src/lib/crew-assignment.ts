import { prisma } from '@/lib/prisma'

type Candidate = {
  userId: string
  name: string | null
  globalScore: number
  propertyTrust: number
  ownerApproved: boolean
  captainEndorsed: boolean
  rank: number
}

/**
 * Finds the best available Crew member for a task on a given property.
 *
 * Priority:
 * 1. Exclude anyone with aiAlertActive on this property
 * 2. Owner-approved favourite (ownerApproved = true)
 * 3. Captain-endorsed
 * 4. Rank by: propertyTrustScore × globalScore × availability
 * 5. Fallback: highest global score with no prior relationship
 *
 * Returns null if no crew is available — Captain must handle manually.
 */
export async function findBestCrew(propertyId: string): Promise<Candidate | null> {
  const relationships = await prisma.crewPropertyRelationship.findMany({
    where: {
      propertyId,
      aiAlertActive: false,
      crew: { role: 'CREW', onboardingCompleted: true },
    },
    include: {
      crew: {
        select: { id: true, name: true, crewScore: { select: { currentScore: true, level: true } } },
      },
    },
    orderBy: { propertyTrustScore: 'desc' },
  })

  const candidates: Candidate[] = relationships.map(r => {
    const globalScore = r.crew.crewScore?.currentScore ?? 100
    const rank = (r.propertyTrustScore / 100) * globalScore
      + (r.ownerApproved ? 200 : 0)
      + (r.captainEndorsed ? 100 : 0)
    return {
      userId: r.crewId,
      name: r.crew.name,
      globalScore,
      propertyTrust: r.propertyTrustScore,
      ownerApproved: r.ownerApproved,
      captainEndorsed: r.captainEndorsed,
      rank,
    }
  })

  // 1. Owner favourite
  const favourite = candidates.find(c => c.ownerApproved)
  if (favourite) return favourite

  // 2. Captain endorsed
  const endorsed = candidates.find(c => c.captainEndorsed)
  if (endorsed) return endorsed

  // 3. Best ranked from existing relationships
  candidates.sort((a, b) => b.rank - a.rank)
  if (candidates.length > 0) return candidates[0]

  // 4. Fallback: any available Crew with no prior relationship (highest global score)
  const fallback = await prisma.user.findFirst({
    where: {
      role: 'CREW',
      onboardingCompleted: true,
      crewScore: { level: { not: 'SUSPENDED' } },
    },
    include: { crewScore: { select: { currentScore: true } } },
    orderBy: { crewScore: { currentScore: 'desc' } },
  })

  if (fallback) {
    return {
      userId: fallback.id,
      name: fallback.name,
      globalScore: fallback.crewScore?.currentScore ?? 100,
      propertyTrust: 50,
      ownerApproved: false,
      captainEndorsed: false,
      rank: fallback.crewScore?.currentScore ?? 100,
    }
  }

  return null
}
