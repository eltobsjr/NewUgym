import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const createPlanSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price_cents: z.number().int().min(0),
  recurrence: z.enum(['Mensal', 'Trimestral', 'Semestral', 'Anual']),
  features: z.array(z.string()).optional().default([]),
})

// GET /api/finance/plans
export async function GET() {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('membership_plans')
    .select('id, name, description, price_cents, currency, recurrence, is_active, features, created_at')
    .eq('trainer_id', auth.user!.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}

// POST /api/finance/plans
export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validated = createPlanSchema.parse(body)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('membership_plans')
      .insert({
        trainer_id: auth.user!.id,
        name: validated.name,
        description: validated.description,
        price_cents: validated.price_cents,
        recurrence: validated.recurrence,
        features: validated.features,
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
