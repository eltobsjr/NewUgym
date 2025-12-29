
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, List, LayoutGrid, Trash2, Edit, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { allUsers, type DirectoryUser } from "@/lib/user-directory";
import { getStudentStatus } from "@/lib/finance-manager";
import { format, subDays } from 'date-fns';

type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  lastActive: string;
  progress: number;
  status: "Ativo" | "Inativo" | "Pendente" | "Atrasado";
};

const AddStudentDialog = ({ open, onOpenChange, onAddStudent }: { open: boolean, onOpenChange: (open: boolean) => void, onAddStudent: (student: Omit<Student, 'status'>) => void}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<DirectoryUser[]>([]);
    
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        if (term.length > 2) {
            const results = allUsers.filter(user => 
                user.email.toLowerCase().includes(term) && user.role === 'Student'
            );
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }

    const handleAddClick = (user: DirectoryUser) => {
        const newStudent: Omit<Student, 'status'> = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: "https://placehold.co/100x100.png",
            initials: user.name.split(" ").map(n => n[0]).join("").toUpperCase(),
            lastActive: 'Agora',
            progress: 0,
        };
        onAddStudent(newStudent);
        setSearchTerm('');
        setSearchResults([]);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Aluno
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vincular Novo Aluno</DialogTitle>
                    <DialogDescription>
                    Procure por um aluno existente pelo email para adicioná-lo à sua lista.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Digite o email do aluno..."
                            className="pl-9"
                        />
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <Button size="sm" onClick={() => handleAddClick(user)}>Adicionar</Button>
                            </div>
                        ))}
                        {searchTerm.length > 2 && searchResults.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground">Nenhum aluno encontrado com este email.</p>
                        )}
                    </div>
              </div>
            </DialogContent>
        </Dialog>
    )
}

const statusVariant: Record<Student['status'], "default" | "secondary" | "destructive"> = {
    Ativo: "default",
    Inativo: "secondary",
    Pendente: "secondary",
    Atrasado: "destructive",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Unify student list from the main user directory and enrich with status
    const studentUsers = allUsers.filter(u => u.role === 'Student');
    const studentData = studentUsers.map((user, index) => {
        const memberStatus = getStudentStatus(user.id);
        const lastActiveDays = [2, 0, 7, 15, 1, 3];

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: `https://placehold.co/100x100.png`,
            initials: user.name.split(" ").map(n => n[0]).join("").toUpperCase(),
            lastActive: format(subDays(new Date(), lastActiveDays[index % lastActiveDays.length]), 'dd/MM/yyyy'),
            progress: Math.floor(Math.random() * 80) + 20, // Random progress for visuals
            status: memberStatus.status,
        };
    });
    setStudents(studentData);
  }, []);

  const handleAddStudent = (newStudent: Omit<Student, 'status'>) => {
    if (students.some(s => s.id === newStudent.id)) {
        toast({ title: "Aluno já existe", description: `${newStudent.name} já está na sua lista de alunos.`, variant: "destructive" });
        return;
    }
    const studentWithStatus: Student = { ...newStudent, status: 'Inativo' };
    setStudents(prev => [studentWithStatus, ...prev]);
    setIsAddDialogOpen(false);
    toast({ title: "Aluno Adicionado!", description: `${newStudent.name} foi adicionado à sua lista. Agora você pode atribuir um treino.` });
  };


  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    toast({ title: "Aluno Removido", variant: 'destructive' });
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Alunos</h1>
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md bg-muted p-1">
                <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}><List className="h-5 w-5"/></Button>
                <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}><LayoutGrid className="h-5 w-5"/></Button>
            </div>
             <AddStudentDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddStudent={handleAddStudent} />
        </div>
      </div>

      {view === 'list' ? (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>Visualize e gerencie seus alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>Progresso do Treino</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{student.initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                     <Badge variant={statusVariant[student.status]}>
                        {student.status}
                      </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={student.progress} className="h-2 w-16 sm:w-[100px]" />
                      <span className="text-sm text-muted-foreground">{student.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild><Link href={`/dashboard/workouts`}>Atribuir Treino</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href={`/dashboard/students/${student.id}/progress`}>Ver Progresso</Link></DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Remover Aluno</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>Isso removerá permanentemente {student.name}. Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>Confirmar</AlertDialogAction>
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
                            <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{student.initials}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{student.name}</CardTitle>
                        <CardDescription>Ativo desde: {student.lastActive}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="w-full px-4 text-center space-y-2">
                           <Badge variant={statusVariant[student.status]}>
                             {student.status}
                           </Badge>
                          <Progress value={student.progress} className="h-2" />
                          <p className="text-sm text-muted-foreground">{student.progress}% de progresso</p>
                        </div>
                        <Button variant="link" size="sm" asChild className="mt-2"><Link href={`/dashboard/students/${student.id}/progress`}>Ver Detalhes</Link></Button>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
