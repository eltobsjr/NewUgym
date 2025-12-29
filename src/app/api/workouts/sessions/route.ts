import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { startWorkoutSessionSchema } from '@/lib/validations/workouts'
import { NextResponse } from 'next/server'

// GET /api/workouts/sessions - Listar sessões
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = await createClient()

  let query = supabase
    .from('workout_sessions')
    .select(`
      id,
      started_at,
      completed_at,
      duration_minutes,
      notes,
      mood,
      plan:workout_plans (
        id,
        name
      ),
      day:workout_days (
        id,
        day_name,
        focus
      )
    `)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Filtrar por role
  if (auth.profile!.role === 'Student') {
    query = query.eq('student_id', auth.user!.id)
  } else if (studentId) {
    // Trainer vendo sessões de um aluno específico
    const { data: relationship } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('trainer_id', auth.user!.id)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single()

    if (!relationship) {
      return NextResponse.json({ error: 'Not your student' }, { status: 403 })
    }

    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// POST /api/workouts/sessions - Iniciar sessão
export async function POST(request: Request) {
  const auth = await requireAuth(['Student'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validatedData = startWorkoutSessionSchema.parse(body)
    
    const supabase = await createClient()

    // Verificar se o plano pertence ao aluno
    const { data: plan } = await supabase
      .from('workout_plans')
      .select('student_id')
      .eq('id', validatedData.plan_id)
      .single()

    if (!plan || plan.student_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Criar sessão
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        student_id: auth.user!.id,
        plan_id: validatedData.plan_id,
        day_id: validatedData.day_id,
        started_at: validatedData.started_at,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(session, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
