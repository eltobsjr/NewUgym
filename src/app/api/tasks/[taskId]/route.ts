import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const updateTaskSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  due_date: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
})

// PATCH /api/tasks/:taskId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { taskId } = await params
    const body = await request.json()
    const validated = updateTaskSchema.parse(body)
    const supabase = await createClient()

    const update: Record<string, unknown> = { ...validated }
    if (validated.status === 'done') {
      update.completed_at = new Date().toISOString()
    } else if (validated.status) {
      update.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(update)
      .eq('id', taskId)
      .select(`
        id, title, description, status, priority, due_date, completed_at, created_at,
        assignee:users!tasks_assigned_to_fkey (id, name, avatar_url)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/tasks/:taskId
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { taskId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('created_by', auth.user!.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return new NextResponse(null, { status: 204 })
}
