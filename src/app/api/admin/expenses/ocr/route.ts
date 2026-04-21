import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

// ── Rate limiter (in-memory, 10 calls/minute) ───────────────────────────────
const rateLimitWindow = 60_000 // 1 minute
const maxRequests = 10
const requestTimestamps: number[] = []

function isRateLimited(): boolean {
  const now = Date.now()
  // Remove timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - rateLimitWindow) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= maxRequests) return true
  requestTimestamps.push(now)
  return false
}

// ── Max image size: 10 MB ────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB in bytes

const OCR_PROMPT = `Analiza esta factura/ticket y extrae la información en formato JSON:
{
  "supplierName": "nombre del proveedor",
  "supplierTaxId": "NIF/CIF si visible",
  "invoiceNumber": "número de factura si visible",
  "date": "YYYY-MM-DD",
  "items": [{ "description": "...", "quantity": 1, "unitPrice": 10.00 }],
  "subtotal": 100.00,
  "vatRate": 21,
  "vatAmount": 21.00,
  "total": 121.00,
  "suggestedCategory": "CONSUMABLES | LAUNDRY | OPERATIONS"
}

Para suggestedCategory usa:
- "CONSUMABLES" si la factura contiene productos de limpieza, ropa de cama, toallas, amenities, productos de higiene, o suministros consumibles
- "LAUNDRY" si es un servicio de lavandería
- "OPERATIONS" para todo lo demás: alquiler, suministros, combustible, servicios, reparaciones, etc.

Si algún campo no es visible, usa null. Responde SOLO con el JSON, sin markdown ni explicaciones.`

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // Rate limit check
  if (isRateLimited()) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 10 OCR requests per minute.' },
      { status: 429 },
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { image } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'image is required (base64 data URL)' },
        { status: 400 },
      )
    }

    // Parse data URL: "data:image/jpeg;base64,/9j/4AAQ..."
    const dataUrlMatch = image.match(/^data:(image\/(?:jpeg|jpg|png|gif|webp));base64,(.+)$/)
    if (!dataUrlMatch) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be a base64 data URL (image/jpeg, image/png, image/gif, or image/webp).' },
        { status: 400 },
      )
    }

    const mediaType = dataUrlMatch[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    const base64Data = dataUrlMatch[2]!

    // Check image size (base64 is ~4/3 of original size)
    const estimatedBytes = (base64Data.length * 3) / 4
    if (estimatedBytes > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 },
      )
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: OCR_PROMPT,
            },
          ],
        },
      ],
    })

    // Extract text content from response
    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from OCR' },
        { status: 500 },
      )
    }

    let rawText = textBlock.text.trim()

    // Strip markdown code fences if present
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    // Parse the JSON response
    let ocrData: {
      supplierName: string | null
      supplierTaxId: string | null
      invoiceNumber: string | null
      date: string | null
      items: Array<{ description: string; quantity: number; unitPrice: number }> | null
      subtotal: number | null
      vatRate: number | null
      vatAmount: number | null
      total: number | null
      suggestedCategory: string | null
    }

    try {
      ocrData = JSON.parse(rawText)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse OCR response', raw: rawText },
        { status: 422 },
      )
    }

    // Map suggestedCategory from OCR to ExpenseCategory enum
    const categoryMap: Record<string, string> = {
      CONSUMABLES: 'CONSUMABLES',
      LAUNDRY: 'LAUNDRY',
      OPERATIONS: 'OTHER',
    }
    const category = categoryMap[ocrData.suggestedCategory ?? ''] ?? 'OTHER'

    return NextResponse.json({
      supplierName: ocrData.supplierName ?? null,
      supplierTaxId: ocrData.supplierTaxId ?? null,
      invoiceNumber: ocrData.invoiceNumber ?? null,
      date: ocrData.date ?? null,
      items: ocrData.items ?? [],
      subtotal: ocrData.subtotal ?? null,
      vatRate: ocrData.vatRate ?? null,
      vatAmount: ocrData.vatAmount ?? null,
      total: ocrData.total ?? null,
      category,
      suggestedCategory: ocrData.suggestedCategory ?? null,
    })
  } catch (e) {
    console.error('OCR processing error:', e)
    return NextResponse.json(
      { error: 'OCR processing failed' },
      { status: 500 },
    )
  }
}
