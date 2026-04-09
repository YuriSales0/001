import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
// import Anthropic from '@anthropic-ai/sdk'                         // ← descomentar ao activar
// import { buildSystemPrompt, ASSISTANT_MODEL } from '@/lib/ai-context' // ← descomentar ao activar

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  // const me = guard.user!  // ← descomentar ao activar (necessário para buildSystemPrompt(me.role))

  const body = await request.json()
  const { message, history = [] } = body as {
    message: string
    history: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  // ── Ponto de integração Claude API ──────────────────────────────────────────
  //
  // Quando ANTHROPIC_API_KEY estiver configurada no Vercel, substituir o bloco
  // abaixo por:
  //
  // const client = new Anthropic()
  // const response = await client.messages.create({
  //   model: ASSISTANT_MODEL,
  //   max_tokens: 1024,
  //   system: [
  //     {
  //       type: 'text',
  //       text: buildSystemPrompt(me.role as import('@/lib/ai-context').ChatRole),
  //       cache_control: { type: 'ephemeral' },  // Prompt Caching — reduz custo ~90%
  //     },
  //   ],
  //   messages: [
  //     ...history.map(h => ({ role: h.role, content: h.content })),
  //     { role: 'user', content: message },
  //   ],
  // })
  // return NextResponse.json({ answer: response.content[0].text, ready: true })
  //
  // ────────────────────────────────────────────────────────────────────────────

  void history // evitar warning de variável não usada

  return NextResponse.json({
    answer: `**Assistente não configurado ainda.**\n\nPara activar:\n1. Adiciona \`ANTHROPIC_API_KEY\` nas variáveis de ambiente do Vercel\n2. Descomenta o bloco de código em \`src/app/api/ai/assistant/route.ts\`\n\nCusto estimado após activação: ~€0.55/mês para 200 perguntas (Haiku + Prompt Caching).`,
    ready: false,
  })
}
