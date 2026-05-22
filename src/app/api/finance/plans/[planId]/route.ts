import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

// DELETE /api/finance/plans/:planId
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { planId } = await params
  const supabase = await createClient()

  // Soft-delete: mark as inactive
  const { error } = await supabase
    .from('membership_plans')
    .update({ is_active: false })
    .eq('id', planId)
    .eq('trainer_id', auth.user!.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return new NextResponse(null, { status: 204 })
}
