
"use client"
import { useContext, useEffect, useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Activity, Dumbbell, Users, Calendar, ListChecks, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/contexts/user-role-context";
import { TasksContext } from "@/contexts/tasks-context";
import { EventsContext } from "@/contexts/events-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── helpers ────────────────────────────────────────────────────────────────

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildWeeklyChart(sessions: any[]) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const minutes = sessions
      .filter(s => s.started_at?.startsWith(dateStr) && s.completed_at)
      .reduce((sum: number, s: any) => sum + (s.duration_minutes ?? 0), 0);
    return { day: DAYS_PT[d.getDay()], minutes };
  });
}

function calcStreak(sessions: any[]) {
  const completedDays = new Set(
    sessions.filter(s => s.completed_at).map(s => s.started_at?.split('T')[0])
  );
  let streak = 0;
  const d = new Date();
  while (completedDays.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Agora há pouco';
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const studentChartConfig = { minutes: { label: 'Minutos', color: 'hsl(var(--primary))' } };

// ─── Student Dashboard ───────────────────────────────────────────────────────

function StudentDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { tasks } = useContext(TasksContext);
  const { events } = useContext(EventsContext);

  useEffect(() => {
    fetch('/api/workouts/sessions?limit=60')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSessions(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  const completedThisMonth = sessions.filter(
    s => s.completed_at && s.started_at?.startsWith(thisMonth)
  ).length;

  const pendingTasks = (tasks.todo?.length ?? 0) + (tasks.in_progress?.length ?? 0);

  const upcomingEvents = Object.entries(events)
    .filter(([date]) => date >= today)
    .reduce((acc, [, evs]) => acc + evs.length, 0);

  const streak = calcStreak(sessions);
  const weeklyMinutes = buildWeeklyChart(sessions);

  const recentSessions = sessions
    .filter(s => s.completed_at)
    .slice(0, 3)
    .map(s => ({
      description: s.day?.focus ? `Treino de ${s.day.focus}` : (s.plan?.name ?? 'Treino'),
      time: timeAgo(s.started_at),
      duration: s.duration_minutes ?? 0,
    }));

  const metrics = [
    { title: "Treinos Concluídos", value: String(completedThisMonth), icon: Dumbbell, change: "Neste mês" },
    { title: "Série Ativa", value: `${streak} dias`, icon: Activity, change: streak > 0 ? "Continue assim!" : "Comece hoje!" },
    { title: "Próximos Eventos", value: String(upcomingEvents), icon: Calendar, change: "Nos próximos 30 dias" },
    { title: "Tarefas Pendentes", value: String(pendingTasks), icon: ListChecks, change: "Para fazer" },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : (
                <div className="text-2xl font-bold">{metric.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Duração dos Treinos</CardTitle>
            <CardDescription>Minutos de treino nos últimos 7 dias.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <ChartContainer config={studentChartConfig} className="h-[250px] w-full">
                <BarChart data={weeklyMinutes} margin={{ top: 20, right: 20, bottom: 0, left: 0 }} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="minutes" fill="var(--color-minutes)" radius={8} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Treinos Recentes</CardTitle>
            <CardDescription>Suas últimas sessões concluídas.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}</div>
            ) : recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhum treino concluído ainda.</p>
                <Button variant="link" size="sm" asChild className="h-auto p-0">
                  <Link href="/dashboard/workouts">Iniciar um treino →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="bg-secondary p-2 rounded-full">
                      <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.description}</p>
                      <p className="text-xs text-muted-foreground">{s.time}</p>
                    </div>
                    {s.duration > 0 && <Badge variant="secondary">{s.duration} min</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ─── Trainer Dashboard ───────────────────────────────────────────────────────

function TrainerDashboard() {
  const { user } = useUserRole();
  const [students, setStudents] = useState<any[]>([]);
  const [plansCount, setPlansCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { tasks } = useContext(TasksContext);
  const { events } = useContext(EventsContext);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch(`/api/trainers/${user.id}/students`).then(r => r.ok ? r.json() : []),
      fetch('/api/workouts/plans').then(r => r.ok ? r.json() : []),
    ]).then(([studs, plans]) => {
      setStudents(Array.isArray(studs) ? studs : []);
      setPlansCount(Array.isArray(plans) ? plans.length : 0);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [user?.id]);

  const today = new Date().toISOString().split('T')[0];

  const upcomingEvents = Object.entries(events)
    .filter(([date]) => date >= today)
    .reduce((acc, [, evs]) => acc + evs.length, 0);

  const pendingTasks = (tasks.todo?.length ?? 0) + (tasks.in_progress?.length ?? 0);

  const metrics = [
    { title: "Alunos Ativos", value: String(students.length), icon: Users, change: "Vinculados à sua conta" },
    { title: "Planos de Treino", value: String(plansCount), icon: Dumbbell, change: "Criados por você" },
    { title: "Próximos Eventos", value: String(upcomingEvents), icon: Calendar, change: "Nos próximos 30 dias" },
    { title: "Tarefas Pendentes", value: String(pendingTasks), icon: ListChecks, change: "Para fazer" },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : (
                <div className="text-2xl font-bold">{metric.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Meus Alunos</CardTitle>
            <CardDescription>Alunos vinculados à sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <Skeleton className="h-8 w-12 rounded-md" />
                </div>
              ))}</div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhum aluno vinculado ainda.</p>
                <Button variant="link" size="sm" asChild className="h-auto p-0">
                  <Link href="/dashboard/students">Adicionar alunos →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {students.slice(0, 5).map((rel: any) => {
                  const s = rel.student ?? rel;
                  const initials = (s.name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={s.id} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={s.avatar_url ?? ''} alt={s.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.email}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/students/${s.id}/progress`}>Ver</Link>
                      </Button>
                    </div>
                  );
                })}
                {students.length > 5 && (
                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link href="/dashboard/students">Ver todos ({students.length})</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Tarefas Pendentes</CardTitle>
            <CardDescription>Tarefas ainda não concluídas.</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.todo?.length === 0 && tasks.in_progress?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
            ) : (
              <div className="space-y-3">
                {[...(tasks.in_progress ?? []), ...(tasks.todo ?? [])].slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start gap-3">
                    <ListChecks className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Badge variant={task.status === 'in_progress' ? 'default' : 'secondary'} className="shrink-0">
                      {task.status === 'in_progress' ? 'Em andamento' : 'A fazer'}
                    </Badge>
                  </div>
                ))}
                {pendingTasks > 5 && (
                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link href="/dashboard/tasks">Ver todas ({pendingTasks})</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ─── Welcome Alert ───────────────────────────────────────────────────────────

const WelcomeAlert = () => {
  const { user, isProfileComplete } = useUserRole();
  if (isProfileComplete) return null;
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Bem-vindo(a) ao Ugym, {user?.name?.split(' ')[0]}!</AlertTitle>
      <AlertDescription>
        Seu perfil está incompleto.{' '}
        <Button variant="link" asChild className="p-0 h-auto ml-1">
          <Link href="/dashboard/settings">Completar Perfil</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { userRole } = useUserRole();

  return (
    <div className="flex flex-col gap-6">
      <WelcomeAlert />
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        Dashboard do {userRole === 'Student' ? 'Aluno' : 'Personal'}
      </h1>
      {userRole === 'Trainer' ? <TrainerDashboard /> : <StudentDashboard />}
    </div>
  );
}
