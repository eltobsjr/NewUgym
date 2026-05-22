import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const createSubscriptionSchema = z.object({
  student_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  started_at: z.string().datetime().optional(),
  next_due_date: z.string().optional(),
})

// GET /api/finance/subscriptions
export async function GET() {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      id, status, started_at, next_due_date, cancelled_at,
      student:users!subscriptions_student_id_fkey (id, name, email, avatar_url),
      plan:membership_plans (id, name, price_cents, recurrence)
    `)
    .eq('trainer_id', auth.user!.id)
    .order('started_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}

// POST /api/finance/subscriptions
export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validated = createSubscriptionSchema.parse(body)
    const supabase = await createClient()

    // Verify this student belongs to the trainer
    const { data: rel } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('trainer_id', auth.user!.id)
      .eq('student_id', validated.student_id)
      .eq('status', 'active')
      .single()

    if (!rel) {
      return NextResponse.json({ error: 'Not your student' }, { status: 403 })
    }

    // Verify this plan belongs to the trainer
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('id, recurrence')
      .eq('id', validated.plan_id)
      .eq('trainer_id', auth.user!.id)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        student_id: validated.student_id,
        trainer_id: auth.user!.id,
        plan_id: validated.plan_id,
        status: 'Ativo',
        started_at: validated.started_at || new Date().toISOString(),
        next_due_date: validated.next_due_date || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
