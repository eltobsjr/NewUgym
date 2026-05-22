import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

// DELETE /api/workouts/templates/:templateId
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { templateId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId)
    .eq('created_by', auth.user!.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return new NextResponse(null, { status: 204 })
}

// PATCH /api/workouts/templates/:templateId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const { templateId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty

    const { data, error } = await supabase
      .from('workout_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('created_by', auth.user!.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
