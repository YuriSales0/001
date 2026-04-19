import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Default items used when seeding a property's checklist
const DEFAULT_CHECKLIST_ITEMS = [
  { category: 'exterior', label: 'Fachada e portão de entrada',          sortOrder: 1 },
  { category: 'exterior', label: 'Piscina (pH, nível de água, limpeza)', sortOrder: 2 },
  { category: 'exterior', label: 'Jardim / terraço / varanda',           sortOrder: 3 },
  { category: 'exterior', label: 'Caixa de correio e área de entrada',   sortOrder: 4 },
  { category: 'interior', label: 'Humidade e bolor — quartos e casas de banho', sortOrder: 5 },
  { category: 'interior', label: 'Ar condicionado — funcionamento e filtros',   sortOrder: 6 },
  { category: 'interior', label: 'Canalização — água quente/fria, autoclismo',  sortOrder: 7 },
  { category: 'interior', label: 'Electrodomésticos — frigorífico, forno, máquina de lavar', sortOrder: 8 },
  { category: 'interior', label: 'Fechadura Nuki — bateria e acesso remoto',    sortOrder: 9 },
  { category: 'interior', label: 'WiFi e router — ligação activa',              sortOrder: 10 },
  { category: 'interior', label: 'Janelas, estores e portadas',                 sortOrder: 11 },
  { category: 'interior', label: 'Alarme de segurança (se existir)',            sortOrder: 12 },
]

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // MANAGER can only access checklists for properties belonging to their clients
  if (me.role === 'MANAGER') {
    const prop = await prisma.property.findUnique({
      where: { id: params.id },
      select: { owner: { select: { managerId: true } } },
    })
    if (!prop || prop.owner?.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const items = await prisma.propertyChecklistItem.findMany({
    where: { propertyId: params.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(items)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // MANAGER can only manage checklists for properties belonging to their clients
  if (me.role === 'MANAGER') {
    const prop = await prisma.property.findUnique({
      where: { id: params.id },
      select: { owner: { select: { managerId: true } } },
    })
    if (!prop || prop.owner?.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()

  // Seed with defaults if body contains { seed: true }
  if (body.seed) {
    // Remove existing items and replace with defaults
    await prisma.propertyChecklistItem.deleteMany({ where: { propertyId: params.id } })
    const items = await prisma.propertyChecklistItem.createMany({
      data: DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i, propertyId: params.id })),
    })
    const created = await prisma.propertyChecklistItem.findMany({
      where: { propertyId: params.id },
      orderBy: [{ sortOrder: 'asc' }],
    })
    return NextResponse.json(created, { status: 201 })
  }

  const { category, label, sortOrder } = body
  if (!category || !label) {
    return NextResponse.json({ error: 'category and label required' }, { status: 400 })
  }

  const item = await prisma.propertyChecklistItem.create({
    data: {
      propertyId: params.id,
      category,
      label: label.trim(),
      sortOrder: sortOrder ?? 0,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
