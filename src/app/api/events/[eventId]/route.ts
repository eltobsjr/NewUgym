import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

// DELETE /api/events/:eventId
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { eventId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('created_by', auth.user!.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return new NextResponse(null, { status: 204 })
}
