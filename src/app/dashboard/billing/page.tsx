"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUserRole } from '@/contexts/user-role-context';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountCents / 100);

type SubscriptionStatus = 'Ativo' | 'Pendente' | 'Atrasado' | 'Cancelado';

const statusDetails: Record<SubscriptionStatus, { text: string; icon: React.ElementType; className: string }> = {
  Ativo:    { text: "Assinatura Ativa",    icon: CheckCircle, className: "text-green-500" },
  Pendente: { text: "Pagamento Pendente",  icon: Clock,       className: "text-yellow-500" },
  Atrasado: { text: "Pagamento Atrasado",  icon: AlertCircle, className: "text-destructive" },
  Cancelado:{ text: "Assinatura Cancelada",icon: AlertCircle, className: "text-muted-foreground" },
};

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  started_at: string;
  next_due_date: string | null;
  cancelled_at: string | null;
  plan: { id: string; name: string; price_cents: number; recurrence: string };
}

interface Transaction {
  id: string;
  amount_cents: number;
  type: string;
  status: string;
  due_date: string;
  paid_at: string | null;
  subscription: { plan: { name: string } } | null;
}

export default function BillingPage() {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBilling = async () => {
    setIsLoading(true);
    const res = await fetch('/api/finance/billing');
    if (res.ok) {
      const data = await res.json();
      setSubscription(data.subscription ?? null);
      setTransactions(data.transactions ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) loadBilling();
  }, [user]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    const res = await fetch(`/api/finance/subscriptions/${subscription.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelado' }),
    });
    if (res.ok) {
      setSubscription(prev => prev ? { ...prev, status: 'Cancelado' } : null);
      toast({
        title: "Assinatura Cancelada",
        description: "Sua assinatura foi cancelada. Você ainda terá acesso até o final do período atual.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Minha Mensalidade</h1>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Você não possui uma assinatura ativa no momento.</p>
            <p className="text-sm mt-1">Entre em contato com seu personal trainer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { icon: StatusIcon, text: statusText, className: statusClassName } =
    statusDetails[subscription.status] ?? statusDetails['Pendente'];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Minha Mensalidade</h1>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral da Assinatura</CardTitle>
          <CardDescription>{subscription.plan.name}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label className="text-sm text-muted-foreground">Plano Atual</Label>
            <p className="text-lg font-semibold">
              {subscription.plan.name}{' '}
              <span className="text-base text-muted-foreground">
                — {formatCurrency(subscription.plan.price_cents)}/{subscription.plan.recurrence.toLowerCase()}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm text-muted-foreground">Status</Label>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${statusClassName}`} />
              <p className={`text-lg font-semibold ${statusClassName}`}>{statusText}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm text-muted-foreground">Próximo Vencimento</Label>
            <p className="text-lg font-semibold">
              {subscription.status !== 'Cancelado' && subscription.next_due_date
                ? format(parseISO(subscription.next_due_date), "dd 'de' MMMM, yyyy", { locale: ptBR })
                : 'Não aplicável'}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={subscription.status === 'Cancelado'}>
                Cancelar Assinatura
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá cancelar sua assinatura. Você manterá o acesso até o final do ciclo atual.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelSubscription}>Sim, Cancelar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Suas transações anteriores.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma transação encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.due_date ? format(parseISO(t.due_date), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell>{t.type} — {t.subscription?.plan.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'Pago' ? 'default' : t.status === 'Pendente' ? 'secondary' : 'destructive'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(t.amount_cents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
