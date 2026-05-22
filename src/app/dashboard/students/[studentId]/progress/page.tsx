'use client';

import { useState, use, useContext, useEffect } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingDown, TrendingUp, ArrowRight, Weight, Ruler, HeartPulse,
  PlusCircle, CheckCircle, Circle, Wand2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { WorkoutsContext } from '@/contexts/workouts-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { analyzePerformance, AnalyzePerformanceInput } from '@/ai/flows/analyze-performance-flow';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalizedMeasurement {
  date: string;
  weight: number | null;
  bodyFat: number | null;
  arm: number | null;
  leg: number | null;
  waist: number | null;
}

const adaptMeasurement = (m: any): NormalizedMeasurement => ({
  date: m.measured_at ? m.measured_at.split('T')[0] : '',
  weight: m.weight_kg ?? null,
  bodyFat: m.body_fat_percentage ?? null,
  arm: m.arm_cm ?? null,
  leg: m.thigh_cm ?? null,
  waist: m.waist_cm ?? null,
});

// ─── BMI helpers ──────────────────────────────────────────────────────────────

const calculateBmi = (weight: number, height: number) => {
  if (!height) return 0;
  return parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
};

const getBmiCategory = (bmi: number) => {
  if (bmi < 18.5) return { category: 'Abaixo do peso', variant: 'default' as const, className: 'bg-blue-500 hover:bg-blue-500/80' };
  if (bmi < 24.9) return { category: 'Peso normal', variant: 'default' as const, className: 'bg-green-500 hover:bg-green-500/80' };
  if (bmi < 29.9) return { category: 'Sobrepeso', variant: 'secondary' as const, className: 'bg-yellow-500/80 hover:bg-yellow-500 text-yellow-foreground' };
  return { category: 'Obesidade', variant: 'destructive' as const, className: '' };
};

// ─── Charts ───────────────────────────────────────────────────────────────────

const chartComponents = { line: LineChart, bar: BarChart, area: AreaChart };

const chartConfig: ChartConfig = {
  weight: { label: 'Peso (kg)', color: 'hsl(var(--primary))' },
  bodyFat: { label: 'Gordura Corporal (%)', color: 'hsl(var(--primary))' },
  arm: { label: 'Braço (cm)', color: 'hsl(var(--primary))' },
  leg: { label: 'Perna (cm)', color: 'hsl(var(--primary))' },
  waist: { label: 'Cintura (cm)', color: 'hsl(var(--primary))' },
};

const ChartComponent = ({
  type, data, metric,
}: { type: keyof typeof chartComponents; data: any[]; metric: string }) => {
  const Chart = chartComponents[type];
  const ChartPrimitive = (type === 'line' ? Line : type === 'bar' ? Bar : Area) as React.ElementType<any>;
  return (
    <ChartContainer config={chartConfig} className="w-full h-[300px]">
      <Chart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
        <Legend />
        <ChartPrimitive
          dataKey={metric}
          type="monotone"
          fill={`var(--color-${metric})`}
          stroke={`var(--color-${metric})`}
          name={(chartConfig[metric as keyof typeof chartConfig]?.label as string) ?? metric}
        />
      </Chart>
    </ChartContainer>
  );
};

// ─── PerformanceAnalysis ──────────────────────────────────────────────────────

const PerformanceAnalysis = ({
  studentId, studentName, measurements,
}: { studentId: string; studentName: string; measurements: NormalizedMeasurement[] }) => {
  const { getStudentPlan } = useContext(WorkoutsContext);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const studentPlan = getStudentPlan(studentId);
      const input: AnalyzePerformanceInput = {
        studentName,
        metricHistory: measurements.map(m => ({
          date: m.date,
          weight: m.weight ?? 0,
          bodyFat: m.bodyFat ?? undefined,
        })),
        workoutPlan: studentPlan
          ? {
              name: studentPlan.name,
              focus: studentPlan.description,
              schedule: studentPlan.schedule.map(day => ({
                day: day.day,
                focus: day.focus,
                exercises: day.exercises.map(ex => ({ name: ex.name, isCompleted: !!ex.isCompleted })),
              })),
            }
          : undefined,
      };
      const result = await analyzePerformance(input);
      setAnalysis(result.analysis);
    } catch {
      toast({ title: 'Erro na Análise', description: 'Não foi possível gerar a análise.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="opacity-60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Análise de Desempenho com IA</CardTitle>
          <Badge variant="secondary" className="text-xs">Em breve</Badge>
        </div>
        <CardDescription>Funcionalidade temporariamente desativada. Em breve disponível.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            A IA analisa as métricas e o plano de treino e fornece um resumo acionável.
          </p>
          <Button disabled>
            <Wand2 className="mr-2 h-4 w-4" />
            Analisar Desempenho
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentProgressPage({ params: paramsPromise }: { params: Promise<{ studentId: string }> }) {
  const params = use(paramsPromise);
  const { getStudentPlan, getStudentWorkoutProgress } = useContext(WorkoutsContext);
  const { toast } = useToast();

  const [studentProfile, setStudentProfile] = useState<{ name: string; height_cm: number | null } | null>(null);
  const [measurements, setMeasurements] = useState<NormalizedMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState<keyof typeof chartComponents>('line');
  const [selectedMetric, setSelectedMetric] = useState('weight');

  const loadData = async () => {
    setIsLoading(true);
    const [profileRes, metricsRes] = await Promise.all([
      fetch(`/api/users/${params.studentId}`),
      fetch(`/api/progress/measurements?student_id=${params.studentId}`),
    ]);
    if (profileRes.ok) {
      const p = await profileRes.json();
      setStudentProfile({ name: p.name ?? 'Aluno', height_cm: p.height_cm ?? null });
    }
    if (metricsRes.ok) {
      const raw: any[] = await metricsRes.json();
      setMeasurements(raw.map(adaptMeasurement).reverse());
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [params.studentId]);

  const handleAddMetric = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, any> = {
      student_id: params.studentId,
      measured_at: fd.get('date') as string,
      weight_kg: fd.get('weight') ? parseFloat(fd.get('weight') as string) : undefined,
      body_fat_percentage: fd.get('bodyFat') ? parseFloat(fd.get('bodyFat') as string) : undefined,
      arm_cm: fd.get('arm') ? parseFloat(fd.get('arm') as string) : undefined,
      thigh_cm: fd.get('leg') ? parseFloat(fd.get('leg') as string) : undefined,
      waist_cm: fd.get('waist') ? parseFloat(fd.get('waist') as string) : undefined,
    };

    const res = await fetch('/api/progress/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast({ title: 'Medição Adicionada!', description: 'Os dados foram salvos com sucesso.' });
      setIsModalOpen(false);
      loadData();
    } else {
      toast({ title: 'Erro', description: 'Não foi possível salvar a medição.', variant: 'destructive' });
    }
  };

  const name = studentProfile?.name ?? 'Aluno';
  const heightInCm = studentProfile?.height_cm ?? 0;
  const studentWorkoutPlan = getStudentPlan(params.studentId);
  const workoutProgress = getStudentWorkoutProgress(params.studentId);

  const latestMeasurement = measurements[measurements.length - 1];
  const previousMeasurement = measurements.length > 1 ? measurements[measurements.length - 2] : null;
  const currentWeight = latestMeasurement?.weight ?? 0;
  const previousWeight = previousMeasurement?.weight ?? currentWeight;
  const weightTrend = currentWeight > previousWeight ? 'increase' : currentWeight < previousWeight ? 'decrease' : 'stable';
  const currentBmi = heightInCm > 0 && currentWeight > 0 ? calculateBmi(currentWeight, heightInCm) : 0;
  const bmiInfo = getBmiCategory(currentBmi);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Progresso de {name}</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Medição
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Medição para {name}</DialogTitle>
              <DialogDescription>Preencha as métricas mais recentes do aluno.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMetric} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input id="weight" name="weight" type="number" step="0.1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Gordura Corporal (%)</Label>
                <Input id="bodyFat" name="bodyFat" type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arm">Braço (cm)</Label>
                <Input id="arm" name="arm" type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leg">Perna/Coxa (cm)</Label>
                <Input id="leg" name="leg" type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">Cintura (cm)</Label>
                <Input id="waist" name="waist" type="number" step="0.1" />
              </div>
              <DialogFooter className="col-span-2">
                <Button type="submit">Salvar Medição</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peso Atual</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeight > 0 ? `${currentWeight} kg` : '—'}</div>
            <div className="text-xs text-muted-foreground flex items-center">
              {weightTrend === 'increase' && <TrendingUp className="mr-1 h-4 w-4 text-red-500" />}
              {weightTrend === 'decrease' && <TrendingDown className="mr-1 h-4 w-4 text-green-500" />}
              {weightTrend === 'stable' && <ArrowRight className="mr-1 h-4 w-4 text-muted-foreground" />}
              {weightTrend === 'increase' ? 'Aumento' : weightTrend === 'decrease' ? 'Redução' : 'Estável'} desde a última medição
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Altura</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heightInCm > 0 ? `${heightInCm} cm` : '—'}</div>
            <p className="text-xs text-muted-foreground">Medição estática</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IMC</CardTitle>
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBmi > 0 ? currentBmi : '—'}</div>
            {currentBmi > 0 && (
              <Badge variant={bmiInfo.variant} className={bmiInfo.className}>{bmiInfo.category}</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progresso de Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={workoutProgress} className="h-2" />
              <span className="text-lg font-bold">{workoutProgress}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Exercícios concluídos este mês.</p>
          </CardContent>
        </Card>
      </div>

      <PerformanceAnalysis studentId={params.studentId} studentName={name} measurements={measurements} />

      <Card>
        <CardHeader>
          <CardTitle>Plano de Treino do Aluno</CardTitle>
          <CardDescription>Progresso de conclusão dos treinos.</CardDescription>
        </CardHeader>
        <CardContent>
          {studentWorkoutPlan && studentWorkoutPlan.schedule.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {studentWorkoutPlan.schedule.map((day, index) => {
                const allCompleted = day.exercises.length > 0 && day.exercises.every(ex => ex.isCompleted);
                return (
                  <AccordionItem value={`item-${index}`} key={day.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        {allCompleted
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : <Circle className="h-5 w-5 text-muted-foreground" />}
                        <span className="font-semibold">{day.day}</span> — <span className="text-muted-foreground">{day.focus}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-6 space-y-3">
                        {day.exercises.map(exercise => (
                          <div key={exercise.id} className="flex items-center">
                            {exercise.isCompleted
                              ? <CheckCircle className="h-4 w-4 text-primary mr-2" />
                              : <Circle className="h-4 w-4 text-muted-foreground mr-2" />}
                            <span className={cn(exercise.isCompleted && 'text-muted-foreground')}>
                              {exercise.name}
                            </span>
                            <span className="text-muted-foreground ml-auto">{exercise.sets} x {exercise.reps}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center py-4">Este aluno não possui plano ativo.</p>
          )}
        </CardContent>
      </Card>

      {measurements.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Evolução das Métricas</CardTitle>
                  <CardDescription>Progresso ao longo do tempo.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Peso (kg)</SelectItem>
                      <SelectItem value="bodyFat">Gordura Corporal (%)</SelectItem>
                      <SelectItem value="arm">Braço (cm)</SelectItem>
                      <SelectItem value="leg">Perna (cm)</SelectItem>
                      <SelectItem value="waist">Cintura (cm)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={chartType} onValueChange={v => setChartType(v as any)}>
                    <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Linha</SelectItem>
                      <SelectItem value="bar">Barras</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartComponent type={chartType} data={measurements} metric={selectedMetric} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico Detalhado</CardTitle>
              <CardDescription>Todos os registros de medições.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Peso (kg)</TableHead>
                    <TableHead className="hidden sm:table-cell">Gordura (%)</TableHead>
                    <TableHead className="hidden sm:table-cell">Braço (cm)</TableHead>
                    <TableHead className="hidden md:table-cell">Perna (cm)</TableHead>
                    <TableHead className="hidden md:table-cell">Cintura (cm)</TableHead>
                    <TableHead>IMC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...measurements].reverse().map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.weight ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{entry.bodyFat ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{entry.arm ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{entry.leg ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{entry.waist ?? '—'}</TableCell>
                      <TableCell>
                        {entry.weight && heightInCm > 0 ? calculateBmi(entry.weight, heightInCm) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Nenhuma medição registrada para este aluno.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Medição" para registrar os dados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
