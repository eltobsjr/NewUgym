import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const updateTransactionSchema = z.object({
  status: z.enum(['Pago', 'Pendente', 'Atrasado', 'Cancelado']).optional(),
  notes: z.string().optional(),
})

// PATCH /api/finance/transactions/:txId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ txId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const { txId } = await params
    const body = await request.json()
    const validated = updateTransactionSchema.parse(body)
    const supabase = await createClient()

    const update: Record<string, unknown> = { ...validated }
    if (validated.status === 'Pago') {
      update.paid_at = new Date().toISOString()
    } else if (validated.status) {
      update.paid_at = null
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(update)
      .eq('id', txId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
