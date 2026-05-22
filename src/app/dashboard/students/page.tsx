"use client";

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, List, LayoutGrid, Trash2, Search, Loader2, Users } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/contexts/user-role-context";

type StudentStatus = "Ativo" | "Inativo" | "Pendente" | "Atrasado";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: StudentStatus;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const statusVariant: Record<StudentStatus, "default" | "secondary" | "destructive"> = {
  Ativo: "default",
  Inativo: "secondary",
  Pendente: "secondary",
  Atrasado: "destructive",
};

// ─── AddStudentDialog ─────────────────────────────────────────────────────────

const AddStudentDialog = ({
  open, onOpenChange, trainerId, onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trainerId: string;
  onAdded: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (searchTerm.length < 3) return;
    setSearching(true);
    const res = await fetch(`/api/users/search?email=${encodeURIComponent(searchTerm)}`);
    if (res.ok) setResults(await res.json());
    setSearching(false);
  };

  const handleAdd = async (user: SearchResult) => {
    setAdding(user.id);
    const res = await fetch(`/api/trainers/${trainerId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user.id }),
    });
    if (res.ok) {
      toast({ title: 'Aluno Adicionado!', description: `${user.name} foi vinculado à sua lista.` });
      onAdded();
      onOpenChange(false);
      setSearchTerm('');
      setResults([]);
    } else if (res.status === 409) {
      toast({ title: 'Aluno já existe', description: `${user.name} já está na sua lista.`, variant: 'destructive' });
    }
    setAdding(null);
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) { setSearchTerm(''); setResults([]); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular Novo Aluno</DialogTitle>
          <DialogDescription>Procure pelo email do aluno para adicioná-lo à sua lista.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Email do aluno..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || searchTerm.length < 3}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.map(u => (
              <div key={u.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <Button size="sm" onClick={() => handleAdd(u)} disabled={adding === u.id}>
                  {adding === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Adicionar'}
                </Button>
              </div>
            ))}
            {results.length === 0 && searchTerm.length >= 3 && !searching && (
              <p className="text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { user } = useUserRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadStudents = async () => {
    if (!user) return;
    setIsLoading(true);

    // Fetch students relationships and subscriptions in parallel
    const [studentsRes, subsRes] = await Promise.all([
      fetch(`/api/trainers/${user.id}/students`),
      fetch('/api/finance/subscriptions'),
    ]);

    const relationships: any[] = studentsRes.ok ? await studentsRes.json() : [];
    const subscriptions: any[] = subsRes.ok ? await subsRes.json() : [];

    // Build status map: studentId → subscription status
    const statusMap: Record<string, StudentStatus> = {};
    for (const sub of subscriptions) {
      const sid = sub.student?.id;
      if (!sid) continue;
      if (sub.status === 'Ativo') statusMap[sid] = 'Ativo';
      else if (sub.status === 'Atrasado' && statusMap[sid] !== 'Ativo') statusMap[sid] = 'Atrasado';
      else if (sub.status === 'Pendente' && !statusMap[sid]) statusMap[sid] = 'Pendente';
    }

    setStudents(relationships.map((r: any) => ({
      id: r.student.id,
      name: r.student.name,
      email: r.student.email,
      avatar_url: r.student.avatar_url ?? null,
      status: statusMap[r.student.id] ?? 'Inativo',
    })));
    setIsLoading(false);
  };

  useEffect(() => { loadStudents(); }, [user]);

  const handleDeleteStudent = async (studentId: string) => {
    // Optimistic update
    setStudents(prev => prev.filter(s => s.id !== studentId));
    toast({ title: "Aluno Removido", variant: 'destructive' });
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gerenciar Alunos</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md bg-muted p-1">
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
              <List className="h-5 w-5" />
            </Button>
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Aluno
          </Button>
        </div>
      </div>

      <AddStudentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        trainerId={user?.id ?? ''}
        onAdded={loadStudents}
      />

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum aluno ainda</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione seus alunos e comece a gerenciar treinos, progresso e pagamentos.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeiro Aluno
            </Button>
          </CardContent>
        </Card>
      ) : view === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos</CardTitle>
            <CardDescription>Visualize e gerencie seus alunos ({students.length} alunos).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.avatar_url ?? undefined} alt={student.name} />
                          <AvatarFallback>{initials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={statusVariant[student.status]}>{student.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/workouts?tab=assignments`}>Atribuir Treino</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/students/${student.id}/progress`}>Ver Progresso</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                                Remover Aluno
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso removerá {student.name} da sua lista de alunos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {students.map(student => (
            <Card key={student.id}>
              <CardHeader className="items-center text-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={student.avatar_url ?? undefined} alt={student.name} />
                  <AvatarFallback>{initials(student.name)}</AvatarFallback>
                </Avatar>
                <CardTitle>{student.name}</CardTitle>
                <CardDescription>{student.email}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2">
                <Badge variant={statusVariant[student.status]}>{student.status}</Badge>
                <Button variant="link" size="sm" asChild>
                  <Link href={`/dashboard/students/${student.id}/progress`}>Ver Detalhes</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
