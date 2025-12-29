import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { logExerciseSchema } from '@/lib/validations/workouts'
import { NextResponse } from 'next/server'

// POST /api/workouts/exercise-logs - Registrar série
export async function POST(request: Request) {
  const auth = await requireAuth(['Student'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validatedData = logExerciseSchema.parse(body)
    
    const supabase = await createClient()

    // Verificar se a sessão pertence ao aluno
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('student_id')
      .eq('id', validatedData.session_id)
      .single()

    if (!session || session.student_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Criar log
    const { data, error } = await supabase
      .from('exercise_logs')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET /api/workouts/exercise-logs - Listar logs
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const exerciseId = searchParams.get('exercise_id')
  const studentId = searchParams.get('student_id')

  const supabase = await createClient()

  let query = supabase
    .from('exercise_logs')
    .select(`
      id,
      set_number,
      weight_kg,
      reps,
      is_completed,
      rpe,
      notes,
      created_at,
      session:workout_sessions (
        id,
        started_at,
        student_id
      )
    `)
    .order('created_at', { ascending: false })

  if (sessionId) {
    query = query.eq('session_id', sessionId)
  }

  if (exerciseId) {
    query = query.eq('workout_exercise_id', exerciseId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Filtrar por permissão
  const filteredData = data.filter((log: any) => {
    if (auth.profile!.role === 'Student') {
      return log.session.student_id === auth.user!.id
    }
    return true // Trainers podem ver todos (com verificação adicional se necessário)
  })

  return NextResponse.json(filteredData)
}
