import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, ASSISTANT_MODEL } from '@/lib/ai-context'
import type { ChatRole } from '@/lib/ai-context'

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await request.json()
  const { message, history = [] } = body as {
    message: string
    history: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  // Graceful fallback se ANTHROPIC_API_KEY não estiver definida
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      answer: `**Assistente não configurado ainda.**\n\nPara activar, adiciona \`ANTHROPIC_API_KEY\` nas variáveis de ambiente do Vercel.\n\nCusto estimado: ~€0.55/mês para 200 perguntas (Haiku + Prompt Caching).`,
      ready: false,
    })
  }

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(me.role as ChatRole),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        ...history.slice(-10).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user' as const, content: message },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ answer: text, ready: true })
  } catch (err) {
    console.error('[AI Assistant]', err)
    return NextResponse.json(
      { error: 'Erro ao contactar o assistente. Tenta novamente.' },
      { status: 502 },
    )
  }
}
