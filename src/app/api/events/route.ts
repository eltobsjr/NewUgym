import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['class', 'event', 'seminar', 'personal_session']),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().optional(),
  max_participants: z.number().int().positive().optional(),
  is_public: z.boolean().default(true),
})

// GET /api/events?month=2026-05
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // 'yyyy-MM'

  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(`
      id, title, description, type, start_time, end_time, location,
      max_participants, is_public, created_by,
      event_registrations (id, user_id, status)
    `)
    .order('start_time', { ascending: true })

  if (month) {
    const start = new Date(`${month}-01T00:00:00Z`).toISOString()
    const end = new Date(
      new Date(`${month}-01T00:00:00Z`).setMonth(
        new Date(`${month}-01T00:00:00Z`).getMonth() + 1
      )
    ).toISOString()
    query = query.gte('start_time', start).lt('start_time', end)
  }

  if (auth.profile!.role === 'Trainer') {
    query = query.eq('created_by', auth.user!.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}

// POST /api/events
export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validated = createEventSchema.parse(body)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .insert({ ...validated, created_by: auth.user!.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
