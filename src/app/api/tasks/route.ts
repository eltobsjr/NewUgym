import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  assigned_to: z.string().uuid(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
})

// GET /api/tasks
export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id, title, description, status, priority, due_date, completed_at, created_at,
      assignee:users!tasks_assigned_to_fkey (id, name, avatar_url),
      creator:users!tasks_created_by_fkey (id, name)
    `)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}

// POST /api/tasks
export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validated = createTaskSchema.parse(body)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        created_by: auth.user!.id,
        assigned_to: validated.assigned_to,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        due_date: validated.due_date || null,
        status: 'todo',
      })
      .select(`
        id, title, description, status, priority, due_date, completed_at, created_at,
        assignee:users!tasks_assigned_to_fkey (id, name, avatar_url)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
