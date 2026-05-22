import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

// POST /api/events/:eventId/register
export async function POST(
  _: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { eventId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .upsert(
      { event_id: eventId, user_id: auth.user!.id, status: 'confirmed' },
      { onConflict: 'event_id,user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/events/:eventId/register — cancel registration
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { eventId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', auth.user!.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return new NextResponse(null, { status: 204 })
}
