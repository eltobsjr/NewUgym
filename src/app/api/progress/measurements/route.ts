import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { createMeasurementSchema } from '@/lib/validations/progress'
import { NextResponse } from 'next/server'

// GET /api/progress/measurements
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')

  const supabase = await createClient()

  let query = supabase
    .from('body_measurements')
    .select(`
      id,
      measured_at,
      weight_kg,
      body_fat_percentage,
      arm_cm,
      chest_cm,
      waist_cm,
      hip_cm,
      thigh_cm,
      calf_cm,
      muscle_mass_kg,
      visceral_fat,
      notes
    `)
    .order('measured_at', { ascending: false })

  // Filtrar por role
  if (auth.profile!.role === 'Student') {
    query = query.eq('student_id', auth.user!.id)
  } else if (studentId) {
    // Trainer vendo medições de um aluno
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

// POST /api/progress/measurements
export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validatedData = createMeasurementSchema.parse(body)
    
    const supabase = await createClient()

    // Se for Student, só pode criar para si mesmo
    if (auth.profile!.role === 'Student' && validatedData.student_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Se for Trainer, verificar se é aluno dele
    if (auth.profile!.role === 'Trainer') {
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
    }

    // Criar medição
    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        ...validatedData,
        measured_by: auth.user!.id,
      })
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
