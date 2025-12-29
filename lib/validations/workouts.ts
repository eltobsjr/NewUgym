import { z } from 'zod'

export const createWorkoutPlanSchema = z.object({
  student_id: z.string().uuid(),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  difficulty: z.enum(['Iniciante', 'Intermediário', 'Avançado']).optional(),
  schedule: z.array(z.object({
    day_name: z.string(),
    focus: z.string(),
    is_rest_day: z.boolean().default(false),
    exercises: z.array(z.object({
      exercise_id: z.string().uuid(),
      sets: z.string(),
      reps: z.string(),
      rest_seconds: z.number().optional(),
      notes: z.string().optional(),
    })).optional(),
  })),
})

export const startWorkoutSessionSchema = z.object({
  plan_id: z.string().uuid(),
  day_id: z.string().uuid(),
  started_at: z.string().datetime(),
})

export const logExerciseSchema = z.object({
  session_id: z.string().uuid(),
  workout_exercise_id: z.string().uuid(),
  set_number: z.number().int().positive(),
  weight_kg: z.number().positive().optional(),
  reps: z.number().int().positive().optional(),
  is_completed: z.boolean().default(true),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
})

export const completeSessionSchema = z.object({
  completed_at: z.string().datetime(),
  duration_minutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  mood: z.enum(['Excelente', 'Bom', 'Normal', 'Cansado', 'Péssimo']).optional(),
})
