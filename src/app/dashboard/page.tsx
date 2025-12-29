
"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Dumbbell, Users, Calendar, ListChecks, ArrowUp, User, FileText, Megaphone, AlertTriangle, LineChart as LineChartIcon, BarChart3, UserCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Legend, Line, LineChart } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/contexts/user-role-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// --- Data for Student Dashboard ---
const studentMetrics = [
  { title: "Treinos Concluídos", value: "12/20", icon: Dumbbell, change: "+2 esta semana" },
  { title: "Série Ativa", value: "5 dias", icon: Activity, change: "Continue assim!" },
  { title: "Próximos Eventos", value: "3", icon: Calendar, change: "Aula de Yoga amanhã" },
  { title: "Tarefas Pendentes", value: "2", icon: ListChecks, change: "Plano de pernas" }
];

const studentWorkoutData = [
  { day: 'Seg', minutes: 60 }, { day: 'Ter', minutes: 45 }, { day: 'Qua', minutes: 75 },
  { day: 'Qui', minutes: 30 }, { day: 'Sex', minutes: 90 }, { day: 'Sáb', minutes: 0 }, { day: 'Dom', minutes: 20 },
];
const studentChartConfig = { minutes: { label: 'Minutos', color: 'hsl(var(--primary))' } };

const studentRecentActivity = [
    { type: 'workout', description: 'Concluiu o treino de Pernas', time: '2h atrás', icon: Dumbbell, status: 'feito' },
    { type: 'task', description: 'Atualizou o plano de refeições', time: '5h atrás', icon: ListChecks, status: 'feito' },
    { type: 'event', description: 'Inscreveu-se no desafio "Verão Total"', time: '1d atrás', icon: Calendar, status: 'inscrito' },
];

const StudentDashboard = () => (
    <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {studentMetrics.map(metric => (
                <Card key={metric.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground">{metric.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Duração dos Treinos</CardTitle>
                    <CardDescription>Seus minutos de treino nos últimos 7 dias.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={studentChartConfig} className="h-[250px] w-full">
                        <BarChart data={studentWorkoutData} margin={{ top: 20, right: 20, bottom: 0, left: 0 }} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="minutes" fill="var(--color-minutes)" radius={8} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                    <CardDescription>Um registro de suas ações recentes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {studentRecentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="bg-secondary p-2 rounded-full"><activity.icon className="h-5 w-5 text-muted-foreground" /></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                                </div>
                                <Badge variant={activity.status === 'inscrito' ? 'default' : 'secondary'} className={cn(activity.status === 'feito' && 'bg-green-500/10 text-green-400 border-green-500/20')}>{activity.status}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </>
);

// --- Data for Trainer Dashboard ---
const trainerMetrics = [
    { title: "Alunos Ativos", value: "15", icon: Users, change: "+1 novo este mês" },
    { title: "Treinos Atribuídos", value: "45", icon: Dumbbell, change: "5 pendentes de revisão" },
    { title: "Sessões Próximas", value: "8", icon: Calendar, change: "2 hoje" },
    { title: "Tarefas Atrasadas", value: "1", icon: AlertTriangle, change: "Follow-up com a Joana" }
];

const studentEngagementData = [
  { student: 'Alex J.', lastActive: 1, progress: 75 },
  { student: 'Maria G.', lastActive: 0, progress: 90 },
  { student: 'David C.', lastActive: 7, progress: 40 },
  { student: 'Emily W.', lastActive: 2, progress: 60 },
  { student: 'Sofia D.', lastActive: 15, progress: 25 },
];

const trainerChartConfig = {
    progress: { label: "Progresso (%)", color: "hsl(var(--primary))" },
    lastActive: { label: "Últ. Atividade (Dias)", color: "hsl(var(--secondary))" },
}

const studentsNeedingAttention = [
    { name: 'David Chen', reason: 'Baixo progresso de treino (40%)', avatar: 'https://placehold.co/100x100.png', initials: 'DC', id: 'david-chen' },
    { name: 'Sofia Davis', reason: 'Inativa há 15 dias', avatar: 'https://placehold.co/100x100.png', initials: 'SD', id: 'sofia-davis'},
]

const TrainerDashboard = () => (
    <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trainerMetrics.map(metric => (
                <Card key={metric.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground">{metric.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Engajamento dos Alunos</CardTitle>
                    <CardDescription>Progresso de treino vs. dias desde a última atividade.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={trainerChartConfig} className="h-[250px] w-full">
                        <BarChart data={studentEngagementData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="student" />
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Legend />
                            <Bar dataKey="progress" name="Progresso (%)" fill="var(--color-progress)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="lastActive" name="Últ. Atividade (Dias)" fill="var(--color-lastActive)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Alunos Precisando de Atenção</CardTitle>
                    <CardDescription>Alunos com baixa atividade ou progresso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {studentsNeedingAttention.map((student) => (
                           <div key={student.id} className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{student.initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{student.name}</p>
                                    <p className="text-sm text-muted-foreground">{student.reason}</p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/students/${student.id}/progress`}>Ver</Link>
                                </Button>
                           </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </>
);






const renderDashboardByRole = (role: string) => {
  switch(role) {
    case 'Student':
      return <StudentDashboard />;
    case 'Trainer':
      return <TrainerDashboard />;
    default:
      return <StudentDashboard />;
  }
}

const WelcomeAlert = () => {
  const { user, isProfileComplete } = useUserRole();

  if (isProfileComplete) {
    return null;
  }

  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Bem-vindo(a) ao Ugym, {user.name.split(' ')[0]}!</AlertTitle>
      <AlertDescription>
        Parece que seu perfil está incompleto. Por favor, tire um momento para preencher suas informações. 
        <Button variant="link" asChild className="p-0 h-auto ml-1">
            <Link href="/dashboard/settings">Completar Perfil</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default function DashboardPage() {
  const { userRole } = useUserRole();
  
  return (
    <div className="flex flex-col gap-6">
      <WelcomeAlert />
      <h1 className="text-3xl font-bold tracking-tight">
        Dashboard do {userRole === 'Student' ? 'Aluno' : 'Personal'}
      </h1>
      {renderDashboardByRole(userRole)}
    </div>
  );
}
