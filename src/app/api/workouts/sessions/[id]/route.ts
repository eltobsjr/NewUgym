import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { completeSessionSchema } from '@/lib/validations/workouts'
import { NextResponse } from 'next/server'

// PATCH /api/workouts/sessions/:id - Completar sessão
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['Student'])
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = completeSessionSchema.parse(body)
    
    const supabase = await createClient()

    // Verificar se a sessão pertence ao aluno
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('student_id')
      .eq('id', id)
      .single()

    if (!session || session.student_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Atualizar sessão
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
