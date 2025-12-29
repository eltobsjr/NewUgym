import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type UserRole = 'Student' | 'Trainer'

export async function requireAuth(allowedRoles?: UserRole[]) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { 
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
      profile: null
    }
  }

  // Buscar role do usuário
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { 
      error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }),
      user: null,
      profile: null
    }
  }

  if (allowedRoles && !allowedRoles.includes(profile.role as UserRole)) {
    return { 
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
      profile: null
    }
  }

  return { error: null, user, profile }
}
