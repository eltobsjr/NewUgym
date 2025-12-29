
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { MoreHorizontal, Download, FileText, CheckCircle, AlertTriangle, XCircle, Eye, PlusCircle, TrendingUp, TrendingDown, Users, BarChart3, UserCheck, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allUsers } from "@/lib/user-directory";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { subDays, startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns';
import { generateMockTransactions, getAllTransactions, addTransaction as addFinanceTransaction, Transaction, MembershipPlan, getAllPlans, addPlan as addFinancePlan, cancelSubscription } from "@/lib/finance-manager";


const statusStyles: { [key in Transaction['status']]: { variant: "default" | "secondary" | "destructive" | "outline", className?: string, text: string }} = {
  "Pago": { variant: "secondary", className: "bg-green-500/10 text-green-400 border-green-500/20", text: "Pago" },
  "Pendente": { variant: "secondary", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", text: "Pendente" },
  "Atrasado": { variant: "destructive", text: "Atrasado" },
  "Cancelado": { variant: "outline", text: "Cancelado" },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}

const monthlyChartConfig = {
    revenue: { label: "Receita", color: "hsl(var(--primary))" },
} satisfies ChartConfig

const churnChartConfig = {
    new: { label: "Novos Alunos", color: "hsl(var(--primary))" },
    churn: { label: "Cancelamentos", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

const AddTransactionDialog = ({ open, onOpenChange, prefilledStudentId, onAdd, plans, members }: { open: boolean, onOpenChange: (open: boolean) => void, prefilledStudentId: string, onAdd: (t: Omit<Transaction, 'id'>) => void, plans: MembershipPlan[], members: {id: string, name: string}[] }) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');

    useEffect(() => {
        if (open && prefilledStudentId) {
            setSelectedPlanId('');
            setAmount('');
        }
    }, [open, prefilledStudentId]);
    
    const handlePlanChange = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if(plan) {
            setSelectedPlanId(planId);
            setAmount(plan.price.toString());
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const studentId = formData.get("studentId") as string;
        const selectedMember = members.find(m => m.id === studentId);
        const selectedPlan = plans.find(p => p.id === selectedPlanId);

        if(!selectedMember || !selectedPlan) return;
    
        const newTransaction: Omit<Transaction, 'id'> = {
            studentName: selectedMember.name,
            studentId: selectedMember.id,
            amount: parseFloat(amount),
            status: formData.get("status") as Transaction['status'],
            type: formData.get("type") as Transaction['type'],
            date: formData.get("date") as string,
            plan: selectedPlan.name,
        }

        onAdd(newTransaction);
        onOpenChange(false);
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
                            <SelectTrigger id="studentId">
                                <SelectValue placeholder="Selecione um aluno" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(member => (
                                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="planId">Plano</Label>
                        <Select name="planId" required onValueChange={handlePlanChange}>
                            <SelectTrigger id="planId">
                                <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>{plan.name} - {formatCurrency(plan.price)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$)</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" required defaultValue="Pago">
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
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
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Primeiro Pagamento">Primeiro Pagamento</SelectItem>
                                    <SelectItem value="Renovação">Renovação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                     </div>
                    <DialogFooter>
                        <Button type="submit">Adicionar Transação</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const AddPlanDialog = ({ onAdd }: { onAdd: (plan: Omit<MembershipPlan, 'id'>) => void }) => {
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newPlan: Omit<MembershipPlan, 'id'> = {
            name: formData.get('name') as string,
            price: parseFloat(formData.get('price') as string),
            recurrence: formData.get('recurrence') as "Mensal" | "Anual",
        };
        onAdd(newPlan);
        setOpen(false);
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
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Plano</DialogTitle>
                </DialogHeader>
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
                                <SelectItem value="Anual">Anual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter><Button type="submit">Salvar Plano</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [members] = useState(allUsers.filter(u => u.role === 'Student'));
  const [tableFilter, setTableFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all-time");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [prefilledStudentId, setPrefilledStudentId] = useState('');
  const [memberChurnData, setMemberChurnData] = useState<any[]>([]);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();


  useEffect(() => {
    generateMockTransactions();
    setTransactions(getAllTransactions());
    setPlans(getAllPlans());

    const churnByMonth: { [key: string]: { new: number, churn: number } } = {};
    const months = Array.from({length: 6}, (_, i) => format(subMonths(new Date(), i), 'yyyy-MM')).reverse();

    months.forEach(month => {
        churnByMonth[month] = { new: 0, churn: 0 };
    });
    
    getAllTransactions().forEach(t => {
      const monthKey = format(parseISO(t.date), 'yyyy-MM');
      if (churnByMonth[monthKey] !== undefined) {
        if (t.type === 'Primeiro Pagamento' && t.status === 'Pago') {
          churnByMonth[monthKey].new++;
        }
        if (t.status === 'Cancelado') {
          churnByMonth[monthKey].churn++;
        }
      }
    });
    
    const data = Object.entries(churnByMonth).map(([month, data]) => ({
        month,
        monthLabel: format(new Date(month + '-02'), "MMM/yy"),
        ...data
    }));

    setMemberChurnData(data);
  }, []);

  useEffect(() => {
    const newStudentId = searchParams.get('new_student_id');
    if (newStudentId) {
      setPrefilledStudentId(decodeURIComponent(newStudentId));
      setIsAddDialogOpen(true);
      router.replace('/dashboard/finance', {scroll: false});
    }
  }, [searchParams, router]);

  const { filteredTransactions, periodLabel } = useMemo(() => {
    let startDate: Date;
    let label = "Todo o Período";

    switch (dateFilter) {
      case 'last-30-days':
        startDate = subDays(new Date(), 30);
        label = "Últimos 30 dias";
        break;
      case 'this-month':
        startDate = startOfMonth(new Date());
        label = "Este Mês";
        break;
      case 'this-year':
        startDate = startOfMonth(new Date(new Date().getFullYear(), 0, 1));
        label = "Este Ano";
        break;
      case 'all-time':
      default:
        startDate = new Date(0); // far in the past
        break;
    }
    
    return {
        filteredTransactions: transactions.filter(t => new Date(t.date) >= startDate),
        periodLabel: label,
    };
  }, [transactions, dateFilter]);
  
  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
        if (t.status === 'Pago') acc.paid += t.amount;
        if (t.status === 'Pendente') acc.pending += t.amount;
        if (t.status === 'Atrasado') acc.overdue += t.amount;
        return acc;
    }, { paid: 0, pending: 0, overdue: 0, newMembers: 0, churnedMembers: 0 });
  }, [filteredTransactions]);
  
  const monthlyRevenueData = useMemo(() => {
    const revenueByMonth: {[key: string]: number} = {};
    const months = Array.from({length: 6}, (_, i) => format(subMonths(new Date(), i), 'yyyy-MM')).reverse();
    
    months.forEach(month => {
      revenueByMonth[month] = 0;
    });

    filteredTransactions.forEach(t => {
      if (t.status === 'Pago') {
        const monthKey = format(parseISO(t.date), 'yyyy-MM');
        if (revenueByMonth[monthKey] !== undefined) {
          revenueByMonth[monthKey] += t.amount;
        }
      }
    });

    return Object.entries(revenueByMonth).map(([month, revenue]) => ({ 
        month, 
        revenue, 
        monthLabel: format(new Date(month + '-02'), "MMM/yy") 
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  const handleStatusChange = (id: string, newStatus: Transaction['status']) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast({ title: "Status Atualizado", description: `A transação ${id} foi marcada como ${newStatus}.` });
  };

  const handleCancelSubscription = (studentId: string) => {
    cancelSubscription(studentId);
    setTransactions(getAllTransactions()); // Refresh transactions to show cancellation
    toast({ title: "Plano Cancelado", description: `O plano do aluno foi cancelado.`, variant: "destructive" });
  };
  
  const handleExport = (type: 'CSV') => {
      toast({
          title: "Exportação Iniciada",
          description: `Seu arquivo ${type} está sendo gerado e será baixado em breve.`
      })
  }

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    addFinanceTransaction(newTransaction);
    setTransactions(getAllTransactions());
    toast({ title: "Transação Adicionada", description: `Nova transação para ${newTransaction.studentName} foi criada.` });
    setIsAddDialogOpen(false);
    setPrefilledStudentId('');
  };
  
  const handleAddPlan = (newPlan: Omit<MembershipPlan, 'id'>) => {
      addFinancePlan(newPlan);
      setPlans(getAllPlans());
      toast({ title: "Plano Adicionado", description: `O plano ${newPlan.name} foi criado.` });
  }

  const transactionsForTable = filteredTransactions.filter(t => {
    if (tableFilter === "all") return true;
    const statusMap = {
        paid: "Pago",
        pending: "Pendente",
        overdue: "Atrasado",
        cancelled: "Cancelado",
    };
    return t.status === (statusMap[tableFilter as keyof typeof statusMap] || "");
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">Visão geral financeira.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
            <Button variant="outline" className="w-full" onClick={() => handleExport('CSV')}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <AddTransactionDialog 
                open={isAddDialogOpen}
                onOpenChange={(isOpen) => {
                    setIsAddDialogOpen(isOpen);
                    if (!isOpen) setPrefilledStudentId('');
                }}
                prefilledStudentId={prefilledStudentId}
                onAdd={handleAddTransaction}
                plans={plans}
                members={members}
            />
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Faturamento ({periodLabel})</CardTitle>
                 <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(summary.paid)}</p>
                <p className="text-xs text-muted-foreground">Total de transações pagas no período.</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Novos Alunos</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">+{memberChurnData.length > 0 ? memberChurnData[memberChurnData.length - 1]?.new || 0 : 0}</p>
                <p className="text-xs text-muted-foreground">No último mês.</p>
              </CardContent>
            </Card>
          </div>
          
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <Card>
                  <CardHeader>
                      <CardTitle>Receita Mensal</CardTitle>
                      <CardDescription>Visão geral do faturamento pago nos últimos 6 meses.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ChartContainer config={monthlyChartConfig} className="w-full h-[300px]">
                          <BarChart data={monthlyRevenueData}>
                              <CartesianGrid vertical={false} strokeDasharray="3 3" />
                              <XAxis dataKey="monthLabel" />
                              <YAxis tickFormatter={(tick) => formatCurrency(tick).replace('R$', '')} />
                              <Tooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                              <Legend />
                              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ChartContainer>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader>
                      <CardTitle>Alunos: Novos vs. Cancelados</CardTitle>
                      <CardDescription>Balanço de crescimento de alunos nos últimos 6 meses.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ChartContainer config={churnChartConfig} className="w-full h-[300px]">
                          <LineChart data={memberChurnData}>
                              <CartesianGrid vertical={false} strokeDasharray="3 3" />
                              <XAxis dataKey="monthLabel" />
                              <YAxis />
                              <Tooltip content={<ChartTooltipContent />} />
                              <Legend />
                              <Line type="monotone" dataKey="new" stroke="var(--color-new)" strokeWidth={2} />
                              <Line type="monotone" dataKey="churn" stroke="var(--color-churn)" strokeWidth={2} />
                          </LineChart>
                      </ChartContainer>
                  </CardContent>
              </Card>
           </div>


          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <CardTitle>Histórico de Transações</CardTitle>
                  <CardDescription>Visualize e gerencie todos os pagamentos ({transactionsForTable.length} resultados).</CardDescription>
                </div>
                <div className="w-full sm:w-auto">
                  <Tabs defaultValue="all" onValueChange={setTableFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      <TabsTrigger value="paid">Pago</TabsTrigger>
                      <TabsTrigger value="pending">Pendente</TabsTrigger>
                      <TabsTrigger value="overdue">Atrasado</TabsTrigger>
                      <TabsTrigger value="cancelled">Cancelado</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsForTable.slice(0, 15).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.studentName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{format(parseISO(transaction.date), 'dd/MM/yyyy')}</TableCell>
                       <TableCell>
                          <Badge variant={transaction.type === 'Primeiro Pagamento' ? 'default' : 'secondary'} className={cn(transaction.type === 'Primeiro Pagamento' && 'bg-blue-500/10 text-blue-400 border-blue-500/20')}>
                            {transaction.type}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusStyles[transaction.status]?.variant || "default"} className={cn(statusStyles[transaction.status]?.className)}>
                          {statusStyles[transaction.status]?.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4"/>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleStatusChange(transaction.id, 'Pago')} disabled={transaction.status === 'Pago' || transaction.status === 'Cancelado'}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Marcar como Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleStatusChange(transaction.id, 'Pendente')} disabled={transaction.status === 'Pendente' || transaction.status === 'Cancelado'}>
                                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />Marcar como Pendente
                            </DropdownMenuItem>
                             <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <XCircle className="mr-2 h-4 w-4"/> Cancelar Assinatura
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>Isso cancelará permanentemente o plano de {transaction.studentName}. O status do aluno será definido como 'Inativo'.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleCancelSubscription(transaction.studentId)}>Confirmar</AlertDialogAction>
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
            </CardContent>
          </Card>
        
          <Card>
              <CardHeader>
                  <CardTitle>Planos de Consultoria</CardTitle>
                  <CardDescription>Gerencie os planos disponíveis.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Plano</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {plans.map(plan => (
                              <TableRow key={plan.id}>
                                  <TableCell className="font-medium">{plan.name} <Badge variant="outline" className="ml-2">{plan.recurrence}</Badge></TableCell>
                                  <TableCell className="text-right">{formatCurrency(plan.price)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
              <CardFooter className="border-t pt-4">
                 <AddPlanDialog onAdd={handleAddPlan} />
              </CardFooter>
          </Card>
      </div>
    </div>
  );
}
