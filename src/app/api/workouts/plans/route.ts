import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { createWorkoutPlanSchema } from '@/lib/validations/workouts'
import { NextResponse } from 'next/server'

// GET /api/workouts/plans - Listar planos
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')

  const supabase = await createClient()

  let query = supabase
    .from('workout_plans')
    .select(`
      id,
      name,
      description,
      difficulty,
      is_active,
      started_at,
      ends_at,
      student:users!workout_plans_student_id_fkey (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  // Filtrar por role
  if (auth.profile!.role === 'Student') {
    query = query.eq('student_id', auth.user!.id)
  } else if (auth.profile!.role === 'Trainer') {
    // Trainers podem ver planos de seus alunos
    if (studentId) {
      // Verificar se é aluno do trainer
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
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// POST /api/workouts/plans - Criar plano
export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validatedData = createWorkoutPlanSchema.parse(body)
    
    const supabase = await createClient()

    // Verificar se é aluno do trainer
    const { data: relationship } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('trainer_id', auth.user!.id)
      .eq('student_id', validatedData.student_id)
      .eq('status', 'active')
      .single()

    if (!relationship) {
      return NextResponse.json({ error: 'Not your student' }, { status: 403 })
    }

    // Criar plano
    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        student_id: validatedData.student_id,
        name: validatedData.name,
        description: validatedData.description,
        difficulty: validatedData.difficulty,
        is_active: true,
      })
      .select()
      .single()

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 400 })
    }

    // Criar dias do plano
    for (const [index, day] of validatedData.schedule.entries()) {
      const { data: workoutDay, error: dayError } = await supabase
        .from('workout_days')
        .insert({
          plan_id: plan.id,
          day_name: day.day_name,
          focus: day.focus,
          order_index: index,
          is_rest_day: day.is_rest_day,
        })
        .select()
        .single()

      if (dayError) {
        // Rollback: deletar plano criado
        await supabase.from('workout_plans').delete().eq('id', plan.id)
        return NextResponse.json({ error: dayError.message }, { status: 400 })
      }

      // Criar exercícios do dia
      if (day.exercises && day.exercises.length > 0) {
        const exercises = day.exercises.map((ex, idx) => ({
          day_id: workoutDay.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          order_index: idx,
        }))

        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercises)

        if (exercisesError) {
          await supabase.from('workout_plans').delete().eq('id', plan.id)
          return NextResponse.json({ error: exercisesError.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
