import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const updateSubSchema = z.object({
  status: z.enum(['Ativo', 'Pendente', 'Atrasado', 'Cancelado', 'Pausado']).optional(),
  next_due_date: z.string().optional(),
  cancellation_reason: z.string().optional(),
})

// PATCH /api/finance/subscriptions/:subId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ subId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const { subId } = await params
    const body = await request.json()
    const validated = updateSubSchema.parse(body)
    const supabase = await createClient()

    const update: Record<string, unknown> = { ...validated }
    if (validated.status === 'Cancelado') {
      update.cancelled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(update)
      .eq('id', subId)
      .eq('trainer_id', auth.user!.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
