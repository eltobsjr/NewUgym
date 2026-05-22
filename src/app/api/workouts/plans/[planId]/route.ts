import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

// DELETE /api/workouts/plans/:planId
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { planId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('id', planId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return new NextResponse(null, { status: 204 })
}

// PATCH /api/workouts/plans/:planId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { planId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from('workout_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
