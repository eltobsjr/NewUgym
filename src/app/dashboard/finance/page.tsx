"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from "@/components/ui/card";
import {
  MoreHorizontal, Download, CheckCircle, AlertTriangle, XCircle, Eye,
  PlusCircle, TrendingUp, TrendingDown, UserCheck, Loader2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { subDays, startOfMonth, format, subMonths, parseISO } from 'date-fns';
import { WorkoutsContext } from "@/contexts/workouts-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxStatus = "Pago" | "Pendente" | "Atrasado" | "Cancelado";
type TxType = "Primeiro Pagamento" | "Renovação" | "Ajuste" | "Reembolso";
type Recurrence = "Mensal" | "Trimestral" | "Semestral" | "Anual";

interface NormalizedTransaction {
  id: string;
  studentName: string;
  studentId: string;
  subscriptionId: string;
  amount: number; // in BRL (cents / 100)
  status: TxStatus;
  type: TxType;
  date: string;         // YYYY-MM-DD (due_date)
  plan: string;
  planPriceCents: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;        // in BRL
  price_cents: number;
  recurrence: Recurrence;
}

interface Subscription {
  id: string;
  status: string;
  student: { id: string; name: string; email: string };
  plan: { id: string; name: string; price_cents: number; recurrence: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

function normalizeTransaction(t: any): NormalizedTransaction {
  return {
    id: t.id,
    studentName: t.subscription?.student?.name ?? '—',
    studentId: t.subscription?.student?.id ?? '',
    subscriptionId: t.subscription?.id ?? '',
    amount: (t.amount_cents ?? 0) / 100,
    status: t.status as TxStatus,
    type: t.type as TxType,
    date: t.due_date ?? t.created_at?.split('T')[0] ?? '',
    plan: t.subscription?.plan?.name ?? '—',
    planPriceCents: t.subscription?.plan?.price_cents ?? 0,
  };
}

const statusStyles: Record<TxStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string; text: string }> = {
  Pago: { variant: "secondary", className: "bg-green-500/10 text-green-400 border-green-500/20", text: "Pago" },
  Pendente: { variant: "secondary", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", text: "Pendente" },
  Atrasado: { variant: "destructive", text: "Atrasado" },
  Cancelado: { variant: "outline", text: "Cancelado" },
};

const monthlyChartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

// ─── AddPlanDialog ────────────────────────────────────────────────────────────

const AddPlanDialog = ({ onAdd }: { onAdd: (plan: Plan) => void }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const priceBrl = parseFloat(fd.get('price') as string);
    const recurrence = fd.get('recurrence') as Recurrence;

    setSaving(true);
    try {
      const res = await fetch('/api/finance/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price_cents: Math.round(priceBrl * 100), recurrence }),
      });
      if (res.ok) {
        const created = await res.json();
        onAdd({ id: created.id, name: created.name, price: created.price_cents / 100, price_cents: created.price_cents, recurrence: created.recurrence });
        toast({ title: "Plano Adicionado", description: `O plano ${name} foi criado.` });
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo Plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar Novo Plano</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Plano</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input id="price" name="price" type="number" step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recurrence">Recorrência</Label>
            <Select name="recurrence" required defaultValue="Mensal">
              <SelectTrigger id="recurrence"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mensal">Mensal</SelectItem>
                <SelectItem value="Trimestral">Trimestral</SelectItem>
                <SelectItem value="Semestral">Semestral</SelectItem>
                <SelectItem value="Anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>Salvar Plano</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── AddTransactionDialog ─────────────────────────────────────────────────────

const AddTransactionDialog = ({
  open, onOpenChange, prefilledStudentId, plans, members, subscriptions, onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefilledStudentId: string;
  plans: Plan[];
  members: { id: string; name: string }[];
  subscriptions: Subscription[];
  onAdded: () => void;
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) { setSelectedPlanId(''); setAmount(''); }
  }, [open]);

  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) { setSelectedPlanId(planId); setAmount((plan.price_cents / 100).toString()); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const studentId = fd.get('studentId') as string;
    const status = fd.get('status') as TxStatus;
    const type = fd.get('type') as TxType;
    const dueDate = fd.get('date') as string;
    const amountBrl = parseFloat(amount);

    if (!studentId || !selectedPlanId || !amountBrl) return;

    setSaving(true);
    try {
      // Find or create subscription
      let sub = subscriptions.find(s => s.student.id === studentId && s.plan.id === selectedPlanId && s.status !== 'Cancelado');
      if (!sub) {
        const subRes = await fetch('/api/finance/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, plan_id: selectedPlanId, next_due_date: dueDate }),
        });
        if (!subRes.ok) {
          toast({ title: 'Erro', description: 'Não foi possível criar assinatura.', variant: 'destructive' });
          return;
        }
        sub = await subRes.json();
      }

      const txRes = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: sub!.id,
          amount_cents: Math.round(amountBrl * 100),
          type,
          status,
          due_date: dueDate,
        }),
      });

      if (txRes.ok) {
        toast({ title: 'Transação Adicionada', description: 'A transação foi criada com sucesso.' });
        onAdded();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Transação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Transação</DialogTitle>
          <DialogDescription>Preencha os detalhes para criar um novo registro de transação.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Aluno</Label>
            <Select name="studentId" required defaultValue={prefilledStudentId}>
              <SelectTrigger id="studentId"><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="planId">Plano</Label>
            <Select name="planId" required onValueChange={handlePlanChange}>
              <SelectTrigger id="planId"><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
              <SelectContent>
                {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data de Vencimento</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" required defaultValue="Pago">
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" required defaultValue={prefilledStudentId ? "Primeiro Pagamento" : "Renovação"}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primeiro Pagamento">Primeiro Pagamento</SelectItem>
                  <SelectItem value="Renovação">Renovação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Transação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all-time');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [prefilledStudentId, setPrefilledStudentId] = useState('');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { students } = useContext(WorkoutsContext);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txRes, plansRes, subsRes] = await Promise.all([
        fetch('/api/finance/transactions'),
        fetch('/api/finance/plans'),
        fetch('/api/finance/subscriptions'),
      ]);
      const txRaw: any[] = txRes.ok ? await txRes.json() : [];
      const plansRaw: any[] = plansRes.ok ? await plansRes.json() : [];
      const subsRaw: any[] = subsRes.ok ? await subsRes.json() : [];

      setTransactions(txRaw.map(normalizeTransaction));
      setPlans(plansRaw.map(p => ({ id: p.id, name: p.name, price: p.price_cents / 100, price_cents: p.price_cents, recurrence: p.recurrence })));
      setSubscriptions(subsRaw);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const newStudentId = searchParams.get('new_student_id');
    if (newStudentId) {
      setPrefilledStudentId(decodeURIComponent(newStudentId));
      setIsAddDialogOpen(true);
      router.replace('/dashboard/finance', { scroll: false });
    }
  }, [searchParams, router]);

  const { filteredTransactions, periodLabel } = useMemo(() => {
    let startDate: Date;
    let label = 'Todo o Período';
    switch (dateFilter) {
      case 'last-30-days': startDate = subDays(new Date(), 30); label = 'Últimos 30 dias'; break;
      case 'this-month': startDate = startOfMonth(new Date()); label = 'Este Mês'; break;
      case 'this-year': startDate = new Date(new Date().getFullYear(), 0, 1); label = 'Este Ano'; break;
      default: startDate = new Date(0); break;
    }
    return {
      filteredTransactions: transactions.filter(t => t.date && new Date(t.date) >= startDate),
      periodLabel: label,
    };
  }, [transactions, dateFilter]);

  const summary = useMemo(() => filteredTransactions.reduce(
    (acc, t) => {
      if (t.status === 'Pago') acc.paid += t.amount;
      if (t.status === 'Pendente') acc.pending += t.amount;
      if (t.status === 'Atrasado') acc.overdue += t.amount;
      return acc;
    },
    { paid: 0, pending: 0, overdue: 0 }
  ), [filteredTransactions]);

  const monthlyRevenueData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), i), 'yyyy-MM')).reverse();
    const map: Record<string, number> = Object.fromEntries(months.map(m => [m, 0]));
    filteredTransactions.forEach(t => {
      if (t.status === 'Pago' && t.date) {
        const k = t.date.substring(0, 7);
        if (map[k] !== undefined) map[k] += t.amount;
      }
    });
    return months.map(m => ({ month: m, revenue: map[m], monthLabel: format(new Date(m + '-02'), 'MMM/yy') }));
  }, [filteredTransactions]);

  const handleStatusChange = async (id: string, newStatus: TxStatus) => {
    const res = await fetch(`/api/finance/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      toast({ title: 'Status Atualizado', description: `Marcado como ${newStatus}.` });
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const res = await fetch(`/api/finance/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelado' }),
    });
    if (res.ok) {
      toast({ title: 'Plano Cancelado', description: 'O plano foi cancelado.', variant: 'destructive' });
      loadData();
    }
  };

  const transactionsForTable = filteredTransactions.filter(t => {
    if (tableFilter === 'all') return true;
    const map: Record<string, TxStatus> = { paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado', cancelled: 'Cancelado' };
    return t.status === map[tableFilter];
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Visão geral financeira.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <AddTransactionDialog
            open={isAddDialogOpen}
            onOpenChange={v => { setIsAddDialogOpen(v); if (!v) setPrefilledStudentId(''); }}
            prefilledStudentId={prefilledStudentId}
            plans={plans}
            members={students}
            subscriptions={subscriptions}
            onAdded={loadData}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Label>Período:</Label>
          <Tabs defaultValue="all-time" onValueChange={setDateFilter}>
            <TabsList>
              <TabsTrigger value="last-30-days">Últimos 30 Dias</TabsTrigger>
              <TabsTrigger value="this-month">Este Mês</TabsTrigger>
              <TabsTrigger value="this-year">Este Ano</TabsTrigger>
              <TabsTrigger value="all-time">Todo o Período</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faturamento ({periodLabel})</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(summary.paid)}</p>
              <p className="text-xs text-muted-foreground">Total de transações pagas.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(summary.pending)}</p>
              <p className="text-xs text-muted-foreground">Total aguardando pagamento.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{formatCurrency(summary.overdue)}</p>
              <p className="text-xs text-muted-foreground">Total de pagamentos atrasados.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Faturamento pago nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={monthlyChartConfig} className="w-full h-[300px]">
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis tickFormatter={v => formatCurrency(v).replace('R$\u00a0', '')} />
                <Tooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} name="Receita" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os pagamentos ({transactionsForTable.length} resultados).
                </CardDescription>
              </div>
              <Tabs defaultValue="all" onValueChange={setTableFilter}>
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="paid">Pago</TabsTrigger>
                  <TabsTrigger value="pending">Pendente</TabsTrigger>
                  <TabsTrigger value="overdue">Atrasado</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelado</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsForTable.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserCheck className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
                <p className="text-xs text-muted-foreground mt-1">Adicione alunos e crie transações para começar.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsForTable.slice(0, 20).map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.studentName}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={t.type === 'Primeiro Pagamento' ? 'default' : 'secondary'}
                          className={cn(t.type === 'Primeiro Pagamento' && 'bg-blue-500/10 text-blue-400 border-blue-500/20')}
                        >
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusStyles[t.status]?.variant ?? 'default'}
                          className={cn(statusStyles[t.status]?.className)}
                        >
                          {statusStyles[t.status]?.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(t.id, 'Pago')}
                              disabled={t.status === 'Pago' || t.status === 'Cancelado'}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Marcar como Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(t.id, 'Pendente')}
                              disabled={t.status === 'Pendente' || t.status === 'Cancelado'}
                            >
                              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" /> Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" /> Cancelar Assinatura
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Isso cancelará permanentemente o plano de {t.studentName}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelSubscription(t.subscriptionId)}>
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planos de Consultoria</CardTitle>
            <CardDescription>Gerencie os planos disponíveis para seus alunos.</CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum plano cadastrado ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.name}
                        <Badge variant="outline" className="ml-2">{p.recurrence}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <AddPlanDialog onAdd={p => setPlans(prev => [p, ...prev])} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
