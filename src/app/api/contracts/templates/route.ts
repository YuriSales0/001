import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'

const TEMPLATES: Record<string, { title: string; terms: string }> = {
  MANAGER_AGREEMENT: {
    title: 'Acordo de Manager',
    terms: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — MANAGER\n\nEntre: HostMasters Costa Tropical S.L. ("Empresa")\nE: [Nome do Manager] ("Manager")\n\n1. OBJECTO\nO Manager compromete-se a gerir uma carteira de proprietários.\n\n2. COMPENSAÇÃO\na) [X]% do valor mensal de cada cliente\nb) [X]% do valor bruto de cada reserva\nc) Pagamento mensal até dia 10\n\n3. DURAÇÃO\nTempo indeterminado, período experimental 3 meses.\nRescisão: 30 dias aviso prévio.\n\n4. CONFIDENCIALIDADE\nSigilo sobre dados de clientes e informações internas.\n\nHostMasters — Costa Tropical, España`,
  },
  CREW_MONTHLY: {
    title: 'Contrato Crew (Mensal)',
    terms: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — CREW (MENSAL)\n\nEntre: HostMasters Costa Tropical S.L.\nE: [Nome do Crew]\n\n1. OBJECTO\nTarefas operacionais: limpeza, check-in/out, inspecções, manutenção.\n\n2. COMPENSAÇÃO\nValor fixo mensal: €[X]/mês. Pagamento até dia 5.\n\n3. DURAÇÃO\nMensal renovável. Rescisão: 15 dias aviso prévio.\n\nHostMasters — Costa Tropical, España`,
  },
  CREW_FREELANCER: {
    title: 'Contrato Crew (Freelancer)',
    terms: `CONTRATO — CREW (FREELANCER)\n\nEntre: HostMasters Costa Tropical S.L.\nE: [Nome do Crew]\n\n1. OBJECTO\nTarefas pontuais atribuídas via plataforma.\n\n2. COMPENSAÇÃO\n€[X]/tarefa. €[X]/hora quando aplicável.\n\n3. SEM EXCLUSIVIDADE\nLivre para prestar serviços a terceiros.\n\nHostMasters — Costa Tropical, España`,
  },
  CLIENT_SERVICE: {
    title: 'Contrato de Serviço (Proprietário)',
    terms: `CONTRATO DE GESTÃO DE PROPRIEDADE\n\nEntre: HostMasters Costa Tropical S.L.\nE: [Nome do Proprietário]\n\n1. OBJECTO\nGestão de arrendamento de curta duração.\n\n2. COMISSÃO\nPlano [X]: [13-22]% sobre valor bruto. Mensalidade €[0-269]/mês.\n\n3. PAGAMENTO\nAirbnb: checkout +1d +2 úteis. Booking: fim do mês. Directo: +7 dias.\n\n4. DURAÇÃO\nAnual renovável. Rescisão: 60 dias aviso.\n\nHostMasters — Costa Tropical, España`,
  },
}

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  return NextResponse.json(TEMPLATES)
}
