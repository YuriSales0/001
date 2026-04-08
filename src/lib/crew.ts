import { prisma } from './prisma'

export const CHECKLISTS: Record<string, string[]> = {
  CHECK_IN: [
    'Contactar hóspede 2h antes da chegada',
    'Verificar limpeza das áreas de entrada',
    'Entregar chaves ou confirmar código de fechadura inteligente',
    'Walkthrough: WiFi, electrodomésticos, comodidades',
    'Recolher ID do hóspede e registo',
    'Explicar regras da casa e contactos de emergência',
    'Confirmar número de hóspedes com a reserva',
  ],
  CHECK_OUT: [
    'Recolher chaves / confirmar fechadura inteligente desactivada',
    'Inspeccionar estado geral do imóvel',
    'Verificar danos (evidência fotográfica)',
    'Verificar inventário (toalhas, roupa de cama, cozinha)',
    'Fechar portas, janelas e áreas exteriores',
    'Reportar qualquer problema ao admin imediatamente',
  ],
  CLEANING: [
    'Tirar roupa de cama e iniciar lavandaria',
    'Limpar e desinfectar casas de banho',
    'Cozinha: loiça, bancadas, electrodomésticos, frigorífico',
    'Aspirar e esfregar todos os quartos',
    'Repor comodidades (artigos de higiene, café, papel)',
    'Toalhas e roupa de cama lavadas',
    'Lixo, verificar exterior',
    'Walkthrough final e fotos',
  ],
  MAINTENANCE_PREVENTIVE: [
    'Testar detectores de fumo e CO',
    'Verificar filtros e funcionamento HVAC',
    'Inspeccionar canalização para fugas',
    'Testar todas as luminárias',
    'Verificar fechaduras de portas e janelas',
    'Testar velocidade WiFi e reiniciar router',
    'Inspeccionar áreas exteriores e drenagem',
    'Verificar funcionamento de electrodomésticos (AC, aquecedor, esquentador)',
  ],
  MAINTENANCE_CORRECTIVE: [
    'Documentar problema reportado com fotos',
    'Identificar causa raiz',
    'Executar reparação ou contactar especialista',
    'Testar solução exaustivamente',
    'Documentar resultado com fotos',
    'Notificar admin e cliente quando resolvido',
    'Emitir nota fiscal se > €50',
  ],
  INSPECTION: [
    'Walkthrough completo com checklist',
    'Fotografar cada divisão',
    'Anotar desgaste e problemas',
    'Verificar equipamento de segurança',
    'Reportar conclusões ao admin',
  ],
  TRANSFER: [
    'Confirmar voo/chegada com hóspede',
    'Verificar hora e terminal de chegada',
    'Preparar sinalização com nome do hóspede',
    'Ajudar com bagagem',
    'Informar tempo estimado até ao imóvel',
    'Entregar chaves / apresentar propriedade no destino',
  ],
  SHOPPING: [
    'Confirmar lista de compras com o owner',
    'Verificar restrições alimentares do hóspede',
    'Comprar produtos essenciais (leite, café, água, pão)',
    'Comprar itens específicos solicitados',
    'Colocar compras no frigorífico / despensa',
    'Deixar nota de boas-vindas com itens disponíveis',
  ],
  LAUNDRY: [
    'Recolher toda a roupa de cama e toalhas',
    'Separar por cores e tipo de tecido',
    'Lavar a 60°C (roupa de cama) e 40°C (toalhas)',
    'Secar e dobrar correctamente',
    'Repor no imóvel com apresentação premium',
    'Verificar estado — reportar peças danificadas',
  ],
}

export function buildChecklist(type: string) {
  const items = CHECKLISTS[type] || []
  return items.map(text => ({ text, done: false }))
}

/**
 * Tipos de task que cada plano gera automaticamente por reserva.
 * Acumulativo: MID inclui tudo do BASIC, PREMIUM inclui tudo do MID.
 */
export const PLAN_AUTO_TASKS: Record<string, string[]> = {
  STARTER:  [],
  BASIC:    ['INSPECTION'],           // Inspecção pré e pós-estadia
  MID:      ['INSPECTION'],
  PREMIUM:  ['INSPECTION', 'SHOPPING', 'TRANSFER', 'LAUNDRY'],
}

export function autoTasksForPlan(plan: string | null | undefined): string[] {
  return PLAN_AUTO_TASKS[plan ?? 'STARTER'] ?? []
}

/**
 * Load-balance: devolve o utilizador CREW com menos tasks abertas.
 * Devolve null se não existir nenhum crew.
 */
export async function pickLeastBusyCrew(): Promise<string | null> {
  if (!prisma) return null
  const crews = await prisma.user.findMany({
    where: { role: 'CREW' },
    select: {
      id: true,
      _count: { select: { tasks: { where: { status: { not: 'COMPLETED' } } } } },
    },
  })
  if (crews.length === 0) return null
  crews.sort((a, b) => a._count.tasks - b._count.tasks)
  return crews[0].id
}
