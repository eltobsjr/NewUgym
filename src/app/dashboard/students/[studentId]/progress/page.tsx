
'use client';

import { useState, use, useContext } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, ArrowRight, Weight, Ruler, HeartPulse, PlusCircle, CheckCircle, Circle, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { WorkoutsContext } from '@/contexts/workouts-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { allUsers } from '@/lib/user-directory';
import { analyzePerformance, AnalyzePerformanceInput } from '@/ai/flows/analyze-performance-flow';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';


// Mock data for a specific student, you would fetch this based on params.studentId in a real app
const studentData: { [key: string]: any } = {
  'alex-johnson': {
    name: 'Alex Johnson',
    heightInCm: 180,
    progressData: [
      { date: '2024-05-01', weight: 90, bodyFat: 25, arm: 39, leg: 60, waist: 95 },
      { date: '2024-06-01', weight: 88, bodyFat: 23, arm: 39.5, leg: 61, waist: 92 },
      { date: '2024-07-01', weight: 86, bodyFat: 22, arm: 40, leg: 61.5, waist: 90 },
      { date: '2024-08-01', weight: 85, bodyFat: 21, arm: 40.5, leg: 62, waist: 88 },
    ],
    performanceData: {
      'Supino Reto': [
        { date: '2024-05-01', weight: 60 },
        { date: '2024-05-15', weight: 62 },
        { date: '2024-06-01', weight: 65 },
        { date: '2024-06-15', weight: 68 },
        { date: '2024-07-01', weight: 70 },
        { date: '2024-07-15', weight: 72 },
        { date: '2024-08-01', weight: 75 },
      ],
      'Agachamento Livre': [
        { date: '2024-05-01', weight: 80 },
        { date: '2024-06-01', weight: 90 },
        { date: '2024-07-01', weight: 100 },
        { date: '2024-08-01', weight: 110 },
      ],
      'Levantamento Terra': [
        { date: '2024-05-01', weight: 90 },
        { date: '2024-06-01', weight: 100 },
        { date: '2024-07-01', weight: 110 },
        { date: '2024-08-01', weight: 120 },
      ]
    }
  },
  'maria-garcia': {
    name: 'Maria Garcia',
    heightInCm: 165,
    progressData: [
      { date: '2024-05-01', weight: 65, bodyFat: 28, arm: 32, leg: 55, waist: 75 },
      { date: '2024-06-01', weight: 64, bodyFat: 27, arm: 32.5, leg: 55.5, waist: 73 },
      { date: '2024-07-01', weight: 62, bodyFat: 25, arm: 33, leg: 56, waist: 71 },
      { date: '2024-08-01', weight: 62, bodyFat: 24.5, arm: 33, leg: 56, waist: 70 },
    ],
    performanceData: {
      'Leg Press 45': [
        { date: '2024-05-01', weight: 100 },
        { date: '2024-06-01', weight: 110 },
        { date: '2024-07-01', weight: 120 },
        { date: '2024-08-01', weight: 130 },
      ],
      'Cadeira Extensora': [
        { date: '2024-05-01', weight: 30 },
        { date: '2024-06-01', weight: 35 },
        { date: '2024-07-01', weight: 40 },
        { date: '2024-08-01', weight: 45 },
      ]
    }
  },
  'david-chen': {
    name: 'David Chen',
     heightInCm: 175,
     progressData: [
      { date: '2024-07-01', weight: 78, bodyFat: 20, arm: 35, leg: 58, waist: 85 },
      { date: '2024-08-01', weight: 77, bodyFat: 19, arm: 35.5, leg: 58, waist: 84 },
    ],
  },
   'sofia-davis': {
    name: 'Sofia Davis',
     heightInCm: 168,
     progressData: [
      { date: '2024-07-01', weight: 60, bodyFat: 24, arm: 30, leg: 54, waist: 70 },
      { date: '2024-08-01', weight: 59, bodyFat: 23, arm: 30, leg: 54, waist: 69 },
    ],
  },
  // Fallback for any other student ID
  'default': {
    name: 'Aluno',
    heightInCm: 170,
    progressData: [
        { date: '2024-07-15', weight: 70, bodyFat: 20, arm: 35, leg: 55, waist: 80 },
        { date: '2024-08-01', weight: 69, bodyFat: 19.5, arm: 35.5, leg: 55.5, waist: 79 },
    ],
    performanceData: {
      'Supino Reto': [
        { date: '2024-07-15', weight: 50 },
        { date: '2024-08-01', weight: 55 },
      ]
    }
  }
};

const calculateBmi = (weight: number, height: number) => {
    if(!height) return 0;
    return (weight / ((height / 100) * (height / 100))).toFixed(1);
}

const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Abaixo do peso", variant: "default", className: "bg-blue-500 hover:bg-blue-500/80"};
    if (bmi < 24.9) return { category: "Peso normal", variant: "default", className: "bg-green-500 hover:bg-green-500/80"};
    if (bmi < 29.9) return { category: "Sobrepeso", variant: "secondary", className: "bg-yellow-500/80 hover:bg-yellow-500 text-yellow-foreground" };
    return { category: "Obesidade", variant: "destructive"};
}

const chartComponents = {
  line: LineChart,
  bar: BarChart,
  area: AreaChart,
};

const chartConfig: ChartConfig = {
    weight: { label: 'Peso (kg)', color: 'hsl(var(--primary))'},
    bodyFat: { label: 'Gordura Corporal (%)', color: 'hsl(var(--primary))'},
    arm: { label: 'Braço (cm)', color: 'hsl(var(--primary))'},
    leg: { label: 'Perna (cm)', color: 'hsl(var(--primary))'},
    waist: { label: 'Cintura (cm)', color: 'hsl(var(--primary))'},
}

const ChartComponent = ({ type, data, metric } : { type: keyof typeof chartComponents, data: any[], metric: string}) => {
  const Chart = chartComponents[type];
  const ChartPrimitive = type === 'line' ? Line : type === 'bar' ? Bar : Area;

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
            name={chartConfig[metric as keyof typeof chartConfig]?.label as string || metric}
        />
      </Chart>
    </ChartContainer>
  );
};

const PerformanceAnalysis = ({ studentId, studentName }: {studentId: string, studentName: string}) => {
    const { getStudentPlan, getStudentWorkoutProgress } = useContext(WorkoutsContext);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const { toast } = useToast();

    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysis(null);
        try {
            const studentPlan = getStudentPlan(studentId);
            const data = studentData[studentId] || studentData['default'];
            
            const input: AnalyzePerformanceInput = {
                studentName: studentName,
                metricHistory: data.progressData,
                workoutPlan: studentPlan ? {
                    name: studentPlan.name,
                    focus: studentPlan.description,
                    schedule: studentPlan.schedule.map(day => ({
                        day: day.day,
                        focus: day.focus,
                        exercises: day.exercises.map(ex => ({ name: ex.name, isCompleted: !!ex.isCompleted }))
                    }))
                } : undefined,
            };

            const result = await analyzePerformance(input);
            setAnalysis(result.analysis);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro na Análise',
                description: 'Não foi possível gerar a análise de desempenho.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Análise de Desempenho com IA</CardTitle>
                <CardDescription>Obtenha insights e sugestões automáticas sobre o progresso do aluno.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analisando dados... Isso pode levar um momento.</p>
                    </div>
                ) : analysis ? (
                    <div className="space-y-4">
                        <div className="whitespace-pre-wrap p-4 bg-muted rounded-md text-sm">{analysis}</div>
                        <Button variant="outline" onClick={() => setAnalysis(null)}>
                            Fechar Análise
                        </Button>
                    </div>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg">
                         <p className="text-muted-foreground mb-4">Clique no botão para que a IA analise os dados de treino e métricas corporais, fornecendo um resumo acionável.</p>
                        <Button onClick={handleAnalyze}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Analisar Desempenho
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function StudentProgressPage({ params: paramsPromise }: { params: Promise<{ studentId: string }> }) {
  const params = use(paramsPromise);
  const { getStudentPlan, getStudentWorkoutProgress } = useContext(WorkoutsContext);
  
  const [chartType, setChartType] = useState<keyof typeof chartComponents>('line');
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Use a fallback if studentId is not in mock data
  const data = studentData[params.studentId] || studentData['default'];
  const name = allUsers.find(u => u.id === params.studentId)?.name || 'Aluno';
  const { heightInCm, progressData, performanceData } = data;
  
  const studentWorkoutPlan = getStudentPlan(params.studentId);
  const workoutProgress = getStudentWorkoutProgress(params.studentId);

  const exerciseList = performanceData ? Object.keys(performanceData) : [];
  const [selectedExercise, setSelectedExercise] = useState(exerciseList.length > 0 ? exerciseList[0] : '');
  const [performanceChartType, setPerformanceChartType] = useState<keyof typeof chartComponents>('line');

  const currentWeight = progressData[progressData.length - 1].weight;
  const previousWeight = progressData.length > 1 ? progressData[progressData.length - 2].weight : currentWeight;
  const weightTrend = currentWeight > previousWeight ? 'increase' : currentWeight < previousWeight ? 'decrease' : 'stable';
  const currentBmi = parseFloat(calculateBmi(currentWeight, heightInCm));
  const bmiInfo = getBmiCategory(currentBmi);


  const handleAddMetric = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, you would add the metric to your state/DB for this specific student
    toast({
        title: "Medição Adicionada!",
        description: `As novas métricas para ${name} foram salvas com sucesso.`,
    });
    setIsModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Progresso de {name}</h1>
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
                        <Input id="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <Input id="weight" type="number" step="0.1" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bodyFat">Gordura Corporal (%)</Label>
                        <Input id="bodyFat" type="number" step="0.1" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="arm">Braço (cm)</Label>
                        <Input id="arm" type="number" step="0.1" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="leg">Perna (cm)</Label>
                        <Input id="leg" type="number" step="0.1" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="waist">Cintura (cm)</Label>
                        <Input id="waist" type="number" step="0.1" />
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
                <div className="text-2xl font-bold">{currentWeight} kg</div>
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
                <div className="text-2xl font-bold">{heightInCm} cm</div>
                <p className="text-xs text-muted-foreground">Medição estática</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">IMC</CardTitle>
                <HeartPulse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{currentBmi}</div>
                <Badge variant={bmiInfo.variant} className={bmiInfo.className}>{bmiInfo.category}</Badge>
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
      
      <PerformanceAnalysis studentId={params.studentId} studentName={name}/>

       <Card>
        <CardHeader>
          <CardTitle>Plano de Treino do Aluno</CardTitle>
          <CardDescription>Veja o progresso de conclusão dos treinos.</CardDescription>
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
                                        {allCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                                        <span className="font-semibold">{day.day}</span> - <span className="text-muted-foreground">{day.focus}</span>
                                     </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-6 space-y-3">
                                        {day.exercises.map(exercise => (
                                            <div key={exercise.id} className="flex items-center">
                                                {exercise.isCompleted ? <CheckCircle className="h-4 w-4 text-primary mr-2" /> : <Circle className="h-4 w-4 text-muted-foreground mr-2" />}
                                                <span className={cn(exercise.isCompleted && "text-muted-foreground")}>{exercise.name}</span>
                                                <span className="text-muted-foreground ml-auto">{exercise.sets} x {exercise.reps}</span>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            ) : (
                <p className="text-muted-foreground text-center py-4">Este aluno ainda não possui um plano de treino ativo.</p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div>
                <CardTitle>Evolução das Métricas</CardTitle>
                <CardDescription>Acompanhe o progresso do aluno ao longo do tempo.</CardDescription>
             </div>
             <div className="flex gap-2">
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Selecionar Métrica" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weight">Peso (kg)</SelectItem>
                        <SelectItem value="bodyFat">Gordura Corporal (%)</SelectItem>
                        <SelectItem value="arm">Braço (cm)</SelectItem>
                        <SelectItem value="leg">Perna (cm)</SelectItem>
                        <SelectItem value="waist">Cintura (cm)</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Tipo de Gráfico" />
                    </SelectTrigger>
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
           <ChartComponent type={chartType} data={progressData} metric={selectedMetric} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div>
                <CardTitle>Evolução de Cargas e Desempenho</CardTitle>
                <CardDescription>Acompanhe a progressão de carga nos exercícios.</CardDescription>
             </div>
             <div className="flex gap-2">
                {exerciseList.length > 0 && (
                    <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Selecionar Exercício" />
                        </SelectTrigger>
                        <SelectContent>
                            {exerciseList.map(ex => (
                                <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                <Select value={performanceChartType} onValueChange={(v) => setPerformanceChartType(v as any)}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Tipo de Gráfico" />
                    </SelectTrigger>
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
           {performanceData && selectedExercise && performanceData[selectedExercise] ? (
               <ChartComponent type={performanceChartType} data={performanceData[selectedExercise]} metric="weight" />
           ) : (
               <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                   Nenhum dado de desempenho disponível para este exercício.
               </div>
           )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
          <CardDescription>Todos os registros de medições do aluno.</CardDescription>
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
              {progressData.map((entry: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.weight}</TableCell>
                  <TableCell className="hidden sm:table-cell">{entry.bodyFat}</TableCell>
                  <TableCell className="hidden sm:table-cell">{entry.arm}</TableCell>
                  <TableCell className="hidden md:table-cell">{entry.leg}</TableCell>
                  <TableCell className="hidden md:table-cell">{entry.waist}</TableCell>
                   <TableCell>{calculateBmi(entry.weight, heightInCm)}</TableCell>
                </TableRow>
              )).reverse()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
