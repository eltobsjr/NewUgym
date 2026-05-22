"use client"

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUserRole } from '@/contexts/user-role-context';

export type SetLog = {
    id: string;
    weight: number;
    reps: number;
    isCompleted: boolean;
};

export type Exercise = {
    id: string;
    name: string;
    sets: string;
    reps: string;
    mediaUrl?: string;
    isCompleted?: boolean;
    notes?: string;
    setLogs?: SetLog[];
    /** UUID da tabela public.exercises — necessário para salvar no DB */
    exerciseId?: string;
};

export type DailyWorkout = { id: string; day: string; focus: string; exercises: Exercise[]; };

export type WorkoutPlan = {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    schedule: DailyWorkout[];
    assignedTo?: string[];
    owner?: string;
    templateId?: string;
};

// ─── Adapters (DB → WorkoutPlan) ────────────────────────────────────────────

function daysToSchedule(days: any[]): DailyWorkout[] {
    return (days || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((day: any) => ({
            id: day.id,
            day: day.day_name,
            focus: day.focus || '',
            exercises: (day.workout_exercises || [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((we: any) => ({
                    id: we.id,
                    name: we.exercise?.name || 'Exercício',
                    sets: String(we.sets),
                    reps: we.reps,
                    mediaUrl: we.exercise?.media_url,
                    notes: we.notes || '',
                    isCompleted: false,
                    setLogs: [],
                    exerciseId: we.exercise?.id,
                })),
        }));
}

function apiTemplateToWorkoutPlan(t: any): WorkoutPlan {
    return {
        id: t.id,
        name: t.name,
        description: t.description || '',
        difficulty: t.difficulty || 'Todos os Níveis',
        schedule: daysToSchedule(t.workout_days || []),
    };
}

function apiPlanToWorkoutPlan(p: any): WorkoutPlan {
    return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        difficulty: p.difficulty || 'Todos os Níveis',
        owner: p.student_id,
        templateId: p.template_id,
        schedule: daysToSchedule(p.workout_days || []),
    };
}

// ─── Context types ────────────────────────────────────────────────────────────

type ActiveStudentPlans = Record<string, string>;

interface WorkoutsContextType {
    plans: WorkoutPlan[];
    activeStudentPlans: ActiveStudentPlans;
    students: { id: string; name: string; email: string }[];
    isLoading: boolean;
    addPlan: (planData: Omit<WorkoutPlan, 'id'>) => Promise<void>;
    updatePlan: (planId: string, updates: Partial<WorkoutPlan>) => Promise<void>;
    deletePlan: (planId: string) => Promise<void>;
    assignPlanToStudents: (planId: string, studentIds: string[]) => Promise<void>;
    getAssignments: () => { studentId: string; studentName: string; plan: WorkoutPlan | null; }[];
    setActiveStudentPlan: (studentId: string, planId: string) => Promise<void>;
    updateExerciseDetails: (planId: string, dayId: string, updatedExercise: Exercise) => void;
    getStudentPlan: (studentId: string) => WorkoutPlan | null;
    getStudentWorkoutProgress: (studentId: string) => number;
}

export const WorkoutsContext = createContext<WorkoutsContextType>({} as WorkoutsContextType);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const WorkoutsProvider = ({ children }: { children: ReactNode }) => {
    const { user, userRole } = useUserRole();
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [students, setStudents] = useState<{ id: string; name: string; email: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            if (userRole === 'Trainer') {
                const [templatesRes, studentsRes] = await Promise.all([
                    fetch('/api/workouts/templates'),
                    fetch(`/api/trainers/${user.id}/students`),
                ]);

                const templates: any[] = templatesRes.ok ? await templatesRes.json() : [];
                const studentsRaw: any[] = studentsRes.ok ? await studentsRes.json() : [];

                setStudents(studentsRaw.map((s: any) => ({
                    id: s.student.id,
                    name: s.student.name,
                    email: s.student.email,
                })));

                const studentPlansRes = await fetch('/api/workouts/plans');
                const studentPlans: any[] = studentPlansRes.ok ? await studentPlansRes.json() : [];

                setPlans([
                    ...templates.map(apiTemplateToWorkoutPlan),
                    ...studentPlans.map(apiPlanToWorkoutPlan),
                ]);
            } else {
                const res = await fetch('/api/workouts/plans');
                const data: any[] = res.ok ? await res.json() : [];
                setPlans(data.map(apiPlanToWorkoutPlan));
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, userRole]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    // Derive activeStudentPlans: first plan per student (is_active handled by DB)
    const activeStudentPlans: ActiveStudentPlans = {};
    plans.forEach(p => {
        if (p.owner && !activeStudentPlans[p.owner]) {
            activeStudentPlans[p.owner] = p.id;
        }
    });

    const addPlan = async (planData: Omit<WorkoutPlan, 'id'>) => {
        const schedule = planData.schedule.map(day => ({
            day_name: day.day,
            focus: day.focus,
            is_rest_day: day.exercises.length === 0,
            exercises: day.exercises
                .filter(ex => ex.exerciseId)
                .map((ex, idx) => ({
                    exercise_id: ex.exerciseId!,
                    sets: ex.sets,
                    reps: ex.reps,
                    order_index: idx,
                })),
        }));

        if (planData.owner) {
            await fetch('/api/workouts/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: planData.owner,
                    template_id: planData.templateId,
                    name: planData.name,
                    description: planData.description,
                    difficulty: planData.difficulty,
                    schedule,
                }),
            });
        } else {
            await fetch('/api/workouts/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: planData.name,
                    description: planData.description,
                    difficulty: planData.difficulty,
                    schedule,
                }),
            });
        }

        await fetchData();
    };

    const updatePlan = async (planId: string, updates: Partial<WorkoutPlan>) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        const isTemplate = !plan.owner;
        const endpoint = isTemplate
            ? `/api/workouts/templates/${planId}`
            : `/api/workouts/plans/${planId}`;

        await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: updates.name,
                description: updates.description,
                difficulty: updates.difficulty,
            }),
        });

        // Optimistic local update
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
    };

    const deletePlan = async (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        const isTemplate = !plan.owner;
        const endpoint = isTemplate
            ? `/api/workouts/templates/${planId}`
            : `/api/workouts/plans/${planId}`;

        await fetch(endpoint, { method: 'DELETE' });
        setPlans(prev => prev.filter(p => p.id !== planId));
    };

    const assignPlanToStudents = async (planId: string, studentIds: string[]) => {
        const template = plans.find(p => p.id === planId && !p.owner);
        if (!template) return;

        await Promise.all(studentIds.map(studentId =>
            fetch('/api/workouts/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    template_id: planId,
                    name: template.name,
                    description: template.description,
                    difficulty: template.difficulty,
                    schedule: template.schedule.map(day => ({
                        day_name: day.day,
                        focus: day.focus,
                        is_rest_day: day.exercises.length === 0,
                        exercises: [],
                    })),
                }),
            })
        ));

        await fetchData();
    };

    const getAssignments = (): { studentId: string; studentName: string; plan: WorkoutPlan | null; }[] => {
        return students.map(student => ({
            studentId: student.id,
            studentName: student.name,
            plan: plans.find(p => p.owner === student.id) ?? null,
        }));
    };

    const setActiveStudentPlan = async (studentId: string, planId: string) => {
        const currentActiveId = activeStudentPlans[studentId];
        if (currentActiveId && currentActiveId !== planId) {
            await fetch(`/api/workouts/plans/${currentActiveId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: false }),
            });
        }
        await fetch(`/api/workouts/plans/${planId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: true }),
        });
        await fetchData();
    };

    const updateExerciseDetails = (planId: string, dayId: string, updatedExercise: Exercise) => {
        setPlans(prevPlans => prevPlans.map(plan => {
            if (plan.id !== planId) return plan;
            return {
                ...plan,
                schedule: plan.schedule.map(day => {
                    if (day.id !== dayId) return day;
                    return {
                        ...day,
                        exercises: day.exercises.map(ex =>
                            ex.id === updatedExercise.id ? updatedExercise : ex
                        ),
                    };
                }),
            };
        }));
    };

    const getStudentPlan = (studentId: string): WorkoutPlan | null => {
        const activePlanId = activeStudentPlans[studentId];
        return activePlanId ? plans.find(p => p.id === activePlanId) ?? null : null;
    };

    const getStudentWorkoutProgress = (_studentId: string): number => 0;

    return (
        <WorkoutsContext.Provider value={{
            plans, activeStudentPlans, students, isLoading,
            addPlan, updatePlan, deletePlan, assignPlanToStudents,
            getAssignments, setActiveStudentPlan, updateExerciseDetails,
            getStudentPlan, getStudentWorkoutProgress,
        }}>
            {children}
        </WorkoutsContext.Provider>
    );
};
