import { prisma } from '@/lib/prisma'

/**
 * Updates (or creates) the CrewPropertyRelationship after a task
 * is approved or rejected for a given crew+property pair.
 */
export async function updateCrewPropertyRelationship(
  crewId: string,
  propertyId: string,
  taskType: string,
  wasApproved: boolean,
) {
  const existing = await prisma.crewPropertyRelationship.findUnique({
    where: { crewId_propertyId: { crewId, propertyId } },
  })

  const now = new Date()

  if (!existing) {
    const breakdown: Record<string, number> = { [taskType]: 1 }
    await prisma.crewPropertyRelationship.create({
      data: {
        crewId,
        propertyId,
        totalTasks: 1,
        firstTaskAt: now,
        lastTaskAt: now,
        taskTypeBreakdown: breakdown,
        propertyTrustScore: wasApproved ? 55 : 40,
        incidentCount: wasApproved ? 0 : 1,
      },
    })
    return
  }

  const breakdown = (existing.taskTypeBreakdown as Record<string, number>) ?? {}
  breakdown[taskType] = (breakdown[taskType] ?? 0) + 1

  const trustDelta = wasApproved ? 3 : -8
  const newTrust = Math.max(0, Math.min(100, existing.propertyTrustScore + trustDelta))

  await prisma.crewPropertyRelationship.update({
    where: { id: existing.id },
    data: {
      totalTasks: { increment: 1 },
      lastTaskAt: now,
      taskTypeBreakdown: breakdown,
      propertyTrustScore: newTrust,
      incidentCount: wasApproved ? undefined : { increment: 1 },
    },
  })
}
