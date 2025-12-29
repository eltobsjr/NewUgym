import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.enum(['Student', 'Trainer'], { required_error: 'Selecione um tipo de usuário' }),
  
  // Campos opcionais do Student
  height_cm: z.number().optional(),
  birthdate: z.string().optional(),
  
  // Campos opcionais do Trainer
  cref: z.string().optional(),
  specializations: z.string().optional(),
  bio: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})
