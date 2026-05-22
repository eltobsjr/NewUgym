'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, ArrowRight, Weight, Ruler, HeartPulse, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { useUserRole } from '@/contexts/user-role-context';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Measurement {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  arm_cm: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  muscle_mass_kg: number | null;
  notes: string | null;
}

interface ChartEntry {
  date: string;
  weight: number;
  bodyFat: number;
  arm: number;
  leg: number;
  waist: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calculateBmi = (weight: number, height: number) => {
  if (!height) return 0;
  return (weight / ((height / 100) * (height / 100))).toFixed(1);
};

const getBmiCategory = (bmi: number) => {
  if (bmi < 18.5) return { category: 'Abaixo do peso', variant: 'default' as const, className: 'bg-blue-500 hover:bg-blue-500/80' };
  if (bmi < 24.9) return { category: 'Peso normal', variant: 'default' as const, className: 'bg-green-500 hover:bg-green-500/80' };
  if (bmi < 29.9) return { category: 'Sobrepeso', variant: 'secondary' as const, className: 'bg-yellow-500/80 hover:bg-yellow-500 text-yellow-foreground' };
  return { category: 'Obesidade', variant: 'destructive' as const, className: '' };
};

const measurementToChartEntry = (m: Measurement): ChartEntry => ({
  date: m.measured_at.split('T')[0],
  weight: m.weight_kg ?? 0,
  bodyFat: m.body_fat_percentage ?? 0,
  arm: m.arm_cm ?? 0,
  leg: m.thigh_cm ?? 0,
  waist: m.waist_cm ?? 0,
});

// ─── Chart ───────────────────────────────────────────────────────────────────

const chartComponents = {
  line: LineChart,
  bar: BarChart,
  area: AreaChart,
} as const;

const chartConfig: ChartConfig = {
  weight: { label: 'Peso (kg)', color: 'hsl(var(--primary))' },
  bodyFat: { label: 'Gordura Corporal (%)', color: 'hsl(var(--primary))' },
  arm: { label: 'Braço (cm)', color: 'hsl(var(--primary))' },
  leg: { label: 'Perna (cm)', color: 'hsl(var(--primary))' },
  waist: { label: 'Cintura (cm)', color: 'hsl(var(--primary))' },
};

const ChartComponent = ({ type, data, metric }: { type: keyof typeof chartComponents; data: any[]; metric: string }) => {
  const Chart = chartComponents[type];
  const ChartPrimitive = (type === 'line' ? Line : type === 'bar' ? Bar : Area) as typeof Line;

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user } = useUserRole();
  const { toast } = useToast();

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [chartType, setChartType] = useState<keyof typeof chartComponents>('line');
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/progress/measurements')
      .then(r => r.ok ? r.json() : [])
      .then((data: Measurement[]) => setMeasurements(data))
      .finally(() => setIsLoadingData(false));
  }, []);

  const progressData: ChartEntry[] = measurements
    .map(measurementToChartEntry)
    .reverse(); // chronological order for charts

  const heightInCm = user?.height_cm ?? 0;
  const currentWeight = progressData.length > 0 ? progressData[progressData.length - 1].weight : 0;
  const previousWeight = progressData.length > 1 ? progressData[progressData.length - 2].weight : currentWeight;
  const weightTrend = currentWeight > previousWeight ? 'increase' : currentWeight < previousWeight ? 'decrease' : 'stable';
  const currentBmi = heightInCm ? parseFloat(calculateBmi(currentWeight, heightInCm) as string) : 0;
  const bmiInfo = getBmiCategory(currentBmi);

  const handleAddMetric = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const getValue = (key: string) => {
      const val = formData.get(key) as string;
      return val ? parseFloat(val) : null;
    };

    if (!user) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/progress/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          measured_at: new Date(formData.get('date') as string).toISOString(),
          weight_kg: getValue('weight'),
          body_fat_percentage: getValue('bodyFat'),
          arm_cm: getValue('arm'),
          thigh_cm: getValue('leg'),
          waist_cm: getValue('waist'),
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      const newMeasurement: Measurement = await res.json();
      setMeasurements(prev => [newMeasurement, ...prev]);

      toast({ title: 'Medição Adicionada!', description: 'Suas novas métricas foram salvas com sucesso.' });
      setIsModalOpen(false);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar a medição.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Meu Progresso</h1>
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
            <form onSubmit={handleAddMetric} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label htmlFor="leg">Perna (cm)</Label>
                <Input id="leg" name="leg" type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">Cintura (cm)</Label>
                <Input id="waist" name="waist" type="number" step="0.1" />
              </div>
              <DialogFooter className="col-span-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Medição
                </Button>
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
              {currentWeight > 0
                ? (weightTrend === 'increase' ? 'Aumento' : weightTrend === 'decrease' ? 'Redução' : 'Estável') + ' desde a última medição'
                : 'Nenhuma medição ainda'}
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
            <p className="text-xs text-muted-foreground">
              {heightInCm > 0 ? 'Medição estática' : 'Configure no seu perfil'}
            </p>
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
            <CardTitle className="text-sm font-medium">Medições Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{measurements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total no histórico.</p>
          </CardContent>
        </Card>
      </div>

      {progressData.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Evolução das Métricas</CardTitle>
                  <CardDescription>Acompanhe seu progresso ao longo do tempo.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
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
                  <Select value={chartType} onValueChange={(v) => setChartType(v as keyof typeof chartComponents)}>
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
              <CardTitle>Histórico Detalhado</CardTitle>
              <CardDescription>Todos os registros de suas medições.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                  {measurements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.measured_at.split('T')[0]}</TableCell>
                      <TableCell>{m.weight_kg ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{m.body_fat_percentage ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{m.arm_cm ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{m.thigh_cm ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{m.waist_cm ?? '—'}</TableCell>
                      <TableCell>
                        {m.weight_kg && heightInCm ? calculateBmi(m.weight_kg, heightInCm) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Weight className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhuma medição ainda</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione sua primeira medição para começar a acompanhar seu progresso.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Medição
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
