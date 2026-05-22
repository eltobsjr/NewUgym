import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const createTemplateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  difficulty: z.string().optional(),
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
    })).optional().default([]),
  })).optional().default([]),
})

// GET /api/workouts/templates - Listar templates do trainer
export async function GET() {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workout_templates')
    .select(`
      id, name, description, difficulty, is_public, created_at,
      workout_days (
        id, day_name, focus, order_index, is_rest_day,
        workout_exercises (
          id, sets, reps, notes, order_index,
          exercise:exercises (id, name, media_url)
        )
      )
    `)
    .eq('created_by', auth.user!.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}

// POST /api/workouts/templates - Criar template
export async function POST(request: Request) {
  const auth = await requireAuth(['Trainer'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const validated = createTemplateSchema.parse(body)
    const supabase = await createClient()

    const { data: template, error: tErr } = await supabase
      .from('workout_templates')
      .insert({
        created_by: auth.user!.id,
        name: validated.name,
        description: validated.description,
        difficulty: validated.difficulty,
      })
      .select()
      .single()

    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 400 })

    for (const [i, day] of validated.schedule.entries()) {
      const { data: wd, error: dErr } = await supabase
        .from('workout_days')
        .insert({
          template_id: template.id,
          day_name: day.day_name,
          focus: day.focus,
          order_index: i,
          is_rest_day: day.is_rest_day,
        })
        .select()
        .single()

      if (dErr) {
        await supabase.from('workout_templates').delete().eq('id', template.id)
        return NextResponse.json({ error: dErr.message }, { status: 400 })
      }

      if (day.exercises && day.exercises.length > 0) {
        const { error: exErr } = await supabase
          .from('workout_exercises')
          .insert(
            day.exercises.map((ex, idx) => ({
              day_id: wd.id,
              exercise_id: ex.exercise_id,
              sets: ex.sets,
              reps: ex.reps,
              rest_seconds: ex.rest_seconds,
              notes: ex.notes,
              order_index: idx,
            }))
          )

        if (exErr) {
          await supabase.from('workout_templates').delete().eq('id', template.id)
          return NextResponse.json({ error: exErr.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json(template, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
