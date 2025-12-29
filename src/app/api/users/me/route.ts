import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', auth.user!.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(profile)
}

const updateProfileSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  height_cm: z.number().positive().optional(),
  birthdate: z.string().optional(),
  cref: z.string().optional(),
  specializations: z.string().optional(),
  bio: z.string().optional(),
})

export async function PATCH(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)
    
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .update(validatedData)
      .eq('id', auth.user!.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
