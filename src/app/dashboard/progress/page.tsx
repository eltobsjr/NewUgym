
'use client';

import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, ArrowRight, Weight, Ruler, HeartPulse, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

const progressData = [
  { date: '2024-05-01', weight: 85, bodyFat: 22, arm: 38, leg: 58, waist: 90 },
  { date: '2024-06-01', weight: 83, bodyFat: 20, arm: 38.5, leg: 59, waist: 88 },
  { date: '2024-07-01', weight: 82, bodyFat: 19, arm: 39, leg: 59.5, waist: 86 },
  { date: '2024-08-01', weight: 80, bodyFat: 18, arm: 39.5, leg: 60, waist: 85 },
];

const performanceData: { [key: string]: { date: string; weight: number }[] } = {
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

const heightInCm = 175;
const currentWeight = progressData[progressData.length - 1].weight;
const previousWeight = progressData[progressData.length - 2].weight;
const weightTrend = currentWeight > previousWeight ? 'increase' : currentWeight < previousWeight ? 'decrease' : 'stable';
const currentBmi = parseFloat(calculateBmi(currentWeight, heightInCm));
const bmiInfo = getBmiCategory(currentBmi);


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


export default function ProgressPage() {
  const [chartType, setChartType] = useState<keyof typeof chartComponents>('line');
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const exerciseList = Object.keys(performanceData);
  const [selectedExercise, setSelectedExercise] = useState(exerciseList.length > 0 ? exerciseList[0] : '');
  const [performanceChartType, setPerformanceChartType] = useState<keyof typeof chartComponents>('line');

  const { toast } = useToast();

  const handleAddMetric = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, you would add the metric to your state/DB
    toast({
        title: "Medição Adicionada!",
        description: "Suas novas métricas foram salvas com sucesso.",
    });
    setIsModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Meu Progresso</h1>
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Medição
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Medição</DialogTitle>
                    <DialogDescription>Preencha suas métricas mais recentes.</DialogDescription>
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
                    <Progress value={82} className="h-2" />
                    <span className="text-lg font-bold">82%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Exercícios concluídos este mês.</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div>
                <CardTitle>Evolução das Métricas</CardTitle>
                <CardDescription>Acompanhe seu progresso ao longo do tempo.</CardDescription>
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
                <CardDescription>Acompanhe a progressão de carga nos seus exercícios.</CardDescription>
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
           {selectedExercise && performanceData[selectedExercise] ? (
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
          <CardDescription>Todos os registros de suas medições.</CardDescription>
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
              {progressData.map((entry, index) => (
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
