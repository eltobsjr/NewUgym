import { z } from 'zod'

export const createMeasurementSchema = z.object({
  student_id: z.string().uuid(),
  measured_at: z.string().datetime(),
  weight_kg: z.number().positive().optional(),
  body_fat_percentage: z.number().min(0).max(100).optional(),
  arm_cm: z.number().positive().optional(),
  chest_cm: z.number().positive().optional(),
  waist_cm: z.number().positive().optional(),
  hip_cm: z.number().positive().optional(),
  thigh_cm: z.number().positive().optional(),
  calf_cm: z.number().positive().optional(),
  muscle_mass_kg: z.number().positive().optional(),
  visceral_fat: z.number().int().optional(),
  notes: z.string().optional(),
})

export const uploadProgressPhotoSchema = z.object({
  student_id: z.string().uuid(),
  angle: z.enum(['front', 'side', 'back']),
  taken_at: z.string().datetime(),
  notes: z.string().optional(),
})
