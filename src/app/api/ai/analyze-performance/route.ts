import { requireAuth } from '@/lib/auth/requireAuth'
import { analyzePerformance, type AnalyzePerformanceInput } from '@/ai/flows/analyze-performance-flow'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  studentId: z.string().uuid(),
})

export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { studentId } = requestSchema.parse(body)
    
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

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

    // Buscar dados do aluno
    const { data: student } = await supabase
      .from('users')
      .select('name')
      .eq('id', studentId)
      .single()

    // Buscar histórico de medições
    const { data: measurements } = await supabase
      .from('body_measurements')
      .select('measured_at, weight_kg, body_fat_percentage, arm_cm, leg_cm, waist_cm')
      .eq('student_id', studentId)
      .order('measured_at', { ascending: true })
      .limit(12) // Últimos 12 registros

    // Buscar plano de treino ativo
    const { data: plan } = await supabase
      .from('workout_plans')
      .select(`
        name,
        description,
        workout_days (
          day_name,
          focus,
          workout_exercises (
            exercise:exercises (name),
            sets,
            reps
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single()

    // Estruturar input para AI
    const input: AnalyzePerformanceInput = {
      studentName: student?.name || 'Aluno',
      metricHistory: measurements?.map(m => ({
        date: m.measured_at,
        weight: m.weight_kg,
        bodyFat: m.body_fat_percentage,
        arm: m.arm_cm,
        leg: m.leg_cm,
        waist: m.waist_cm,
      })) || [],
      workoutPlan: plan ? {
        name: plan.name,
        focus: plan.description || '',
        schedule: plan.workout_days?.map((day: any) => ({
          day: day.day_name,
          focus: day.focus,
          exercises: day.workout_exercises?.map((we: any) => ({
            name: we.exercise?.name || '',
            isCompleted: true, // TODO: buscar do histórico real
          })) || [],
        })) || [],
      } : undefined,
    }

    // Chamar AI flow
    const result = await analyzePerformance(input)

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('AI Analysis Error:', error)
    return NextResponse.json({ 
      error: 'Falha ao analisar desempenho. Tente novamente.' 
    }, { status: 500 })
  }
}
