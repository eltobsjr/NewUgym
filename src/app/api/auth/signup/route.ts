import { createClient } from '@/lib/supabase/server'
import { signupSchema } from '@/lib/validations/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar input
    const validatedData = signupSchema.parse(body)
    
    const supabase = await createClient()

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          role: validatedData.role,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Falha ao criar usuário' }, { status: 500 })
    }

    // 2. Criar perfil na tabela users
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: validatedData.email,
      name: validatedData.name,
      role: validatedData.role,
      height_cm: validatedData.height_cm,
      birthdate: validatedData.birthdate,
      cref: validatedData.cref,
      specializations: validatedData.specializations,
      bio: validatedData.bio,
    })

    if (profileError) {
      // Tentar deletar o usuário do Auth se falhar ao criar perfil
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Falha ao criar perfil' }, { status: 500 })
    }

    return NextResponse.json({ 
      user: authData.user,
      message: 'Conta criada com sucesso! Verifique seu email.'
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
