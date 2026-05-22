import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const createTransactionSchema = z.object({
  subscription_id: z.string().uuid(),
  amount_cents: z.number().int().min(0),
  type: z.enum(['Primeiro Pagamento', 'Renovação', 'Ajuste', 'Reembolso']),
  status: z.enum(['Pago', 'Pendente', 'Atrasado', 'Cancelado', 'Reembolsado']).default('Pendente'),
  due_date: z.string(),
  notes: z.string().optional(),
})

// GET /api/finance/transactions
export async function GET() {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, amount_cents, currency, type, status, due_date, paid_at, notes, created_at,
      subscription:subscriptions (
        id,
        student:users!subscriptions_student_id_fkey (id, name, email),
        plan:membership_plans (id, name, price_cents)
      )
    `)
    .order('due_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Filter to only trainer's transactions
  const filtered = (data || []).filter(
    (t: any) => t.subscription?.plan?.id !== undefined
  )

  return NextResponse.json(filtered)
}

// POST /api/finance/transactions
export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validated = createTransactionSchema.parse(body)
    const supabase = await createClient()

    // Verify subscription belongs to this trainer
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('trainer_id')
      .eq('id', validated.subscription_id)
      .single()

    if (!sub || sub.trainer_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const insertData: Record<string, unknown> = {
      subscription_id: validated.subscription_id,
      amount_cents: validated.amount_cents,
      type: validated.type,
      status: validated.status,
      due_date: validated.due_date,
      notes: validated.notes,
    }

    if (validated.status === 'Pago') {
      insertData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
