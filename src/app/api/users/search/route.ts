import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'

// GET /api/users/search?email=<partial> — Trainer-only user search by email
export async function GET(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.trim().toLowerCase()

  if (!email || email.length < 3) {
    return NextResponse.json([])
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url')
    .ilike('email', `%${email}%`)
    .eq('role', 'Student')
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
