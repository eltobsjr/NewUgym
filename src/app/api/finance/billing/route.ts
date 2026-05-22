import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

// GET /api/finance/billing — Student views their own subscription and transactions
export async function GET() {
  const auth = await requireAuth(['Student'])
  if (auth.error) return auth.error

  const supabase = await createClient()

  // Get student's active subscription
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      started_at,
      next_due_date,
      cancelled_at,
      plan:membership_plans (
        id,
        name,
        price_cents,
        recurrence
      )
    `)
    .eq('student_id', auth.user!.id)
    .order('started_at', { ascending: false })
    .limit(1)

  const subscription = subscriptions?.[0] ?? null

  // Get student's transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id,
      amount_cents,
      type,
      status,
      due_date,
      paid_at,
      subscription:subscriptions (
        plan:membership_plans (
          name,
          price_cents
        )
      )
    `)
    .eq('subscriptions.student_id', auth.user!.id)
    .order('due_date', { ascending: false })
    .limit(24)

  return NextResponse.json({ subscription, transactions: transactions ?? [] })
}
