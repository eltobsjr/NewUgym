import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params
  const supabase = await createClient()
  
  // Verificar se é o próprio usuário ou um trainer consultando seu aluno
  if (auth.user!.id !== id && auth.profile!.role !== 'Trainer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Se for trainer, verificar se o usuário é seu aluno
  if (auth.profile!.role === 'Trainer' && auth.user!.id !== id) {
    const { data: relationship } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('trainer_id', auth.user!.id)
      .eq('student_id', id)
      .eq('status', 'active')
      .single()

    if (!relationship) {
      return NextResponse.json({ error: 'Not your student' }, { status: 403 })
    }
  }

  return NextResponse.json(profile)
}
