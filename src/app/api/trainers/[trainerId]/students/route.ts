import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/trainers/:trainerId/students - Listar alunos do trainer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ trainerId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { trainerId } = await params
  
  // Verificar se é o próprio trainer
  if (auth.user!.id !== trainerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_relationships')
    .select(`
      id,
      status,
      started_at,
      student:users!user_relationships_student_id_fkey (
        id,
        name,
        email,
        avatar_url,
        created_at
      )
    `)
    .eq('trainer_id', trainerId)
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// POST /api/trainers/:trainerId/students - Adicionar novo aluno
const addStudentSchema = z.object({
  student_id: z.string().uuid(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trainerId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { trainerId } = await params
  
  if (auth.user!.id !== trainerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { student_id } = addStudentSchema.parse(body)
    
    const supabase = await createClient()

    // Verificar se o estudante existe
    const { data: student } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', student_id)
      .single()

    if (!student || student.role !== 'Student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Criar relacionamento
    const { data, error } = await supabase
      .from('user_relationships')
      .insert({
        trainer_id: trainerId,
        student_id: student_id,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Relationship already exists' }, { status: 409 })
      }
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
