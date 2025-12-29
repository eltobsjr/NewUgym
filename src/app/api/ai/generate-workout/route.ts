import { requireAuth } from '@/lib/auth/requireAuth'
import { generateWorkoutPlan, type GenerateWorkoutInput } from '@/ai/flows/generate-workout-flow'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  goal: z.string(),
  level: z.string(),
  daysPerWeek: z.number().min(1).max(7),
  sessionDuration: z.number().min(15).max(120),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validatedData = requestSchema.parse(body) as GenerateWorkoutInput
    
    // Chamar AI flow
    const result = await generateWorkoutPlan(validatedData)

    // TODO: Salvar em ai_generations para auditoria
    // const supabase = await createClient()
    // await supabase.from('ai_generations').insert({
    //   user_id: auth.user!.id,
    //   type: 'workout_generation',
    //   input_data: validatedData,
    //   output_data: result,
    // })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('AI Generation Error:', error)
    return NextResponse.json({ 
      error: 'Falha ao gerar treino. Tente novamente.' 
    }, { status: 500 })
  }
}
