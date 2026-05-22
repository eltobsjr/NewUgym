
"use client";

import { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Circle, Dumbbell, PlusCircle, Sparkles, Trash2, MoreVertical, GripVertical, Save, X, UserPlus, Edit, NotebookText, ArrowLeft, Library, PencilRuler, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useUserRole } from '@/contexts/user-role-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GenerateWorkoutForm } from '@/components/generate-workout-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WorkoutsContext, WorkoutPlan, DailyWorkout, Exercise, SetLog } from '@/contexts/workouts-context';
import { DragDropContext, Droppable, Draggable, DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { exerciseLibrary, Exercise as LibraryExercise, exerciseCategories } from '@/lib/exercise-library';

// Wrapper to solve React 18 strict mode issue with react-beautiful-dnd
const ClientOnlyDroppable = ({ children, ...props }: DroppableProps) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    return isMounted ? <Droppable {...props}>{children}</Droppable> : null;
};

type GeneratedWorkoutPlan = { planName: string; weeklySchedule: { day: string; focus: string; exercises?: { name: string; sets?: number; reps?: string; duration?: string; rest?: string }[] }[] };

const AddExerciseModal = ({ open, onOpenChange, onAddExercises }: { open: boolean, onOpenChange: (open: boolean) => void, onAddExercises: (exercises: Exercise[]) => void }) => {
    const [activeTab, setActiveTab] = useState('library');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
    const [exerciseSearch, setExerciseSearch] = useState('');

    const filteredExercises = exerciseLibrary
        .filter(ex => selectedCategory === 'Todos' || ex.category === selectedCategory)
        .filter(ex => !exerciseSearch || ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()));

    const handleSelectExercise = (exerciseId: string, isSelected: boolean) => {
        const newSet = new Set(selectedExercises);
        if (isSelected) {
            newSet.add(exerciseId);
        } else {
            newSet.delete(exerciseId);
        }
        setSelectedExercises(newSet);
    }

    const handleAddFromLibrary = () => {
        const exercisesToAdd = exerciseLibrary
            .filter(ex => selectedExercises.has(ex.id))
            .map(ex => ({
                id: `ex-${Date.now()}-${ex.id}`,
                name: ex.name,
                sets: '3',
                reps: '10-12',
                mediaUrl: ex.mediaUrl,
                exerciseId: ex.exerciseDbId,
            }));
        
        onAddExercises(exercisesToAdd);
        setSelectedExercises(new Set());
        onOpenChange(false);
    }
    
    const handleAddFromScratch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newExercise: Exercise = {
            id: `ex-${Date.now()}`,
            name: formData.get('name') as string,
            sets: formData.get('sets') as string,
            reps: formData.get('reps') as string,
            mediaUrl: formData.get('mediaUrl') as string,
        };
        onAddExercises([newExercise]);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Adicionar Exercício ao Dia</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="library"><Library className="mr-2" /> Biblioteca de Exercícios</TabsTrigger>
                        <TabsTrigger value="scratch"><PencilRuler className="mr-2" /> Criar do Zero</TabsTrigger>
                    </TabsList>
                    <TabsContent value="library">
                        <div className="flex flex-col sm:flex-row border-t pt-4">
                            <aside className="w-full sm:w-1/4 sm:pr-4 sm:border-r pb-3 sm:pb-0 border-b sm:border-b-0 mb-3 sm:mb-0">
                                <h4 className="font-semibold mb-2">Categorias</h4>
                                <div className="flex flex-row flex-wrap sm:flex-col items-start gap-1">
                                    <Button variant={selectedCategory === 'Todos' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelectedCategory('Todos')} className="w-full justify-start">Todos</Button>
                                    {exerciseCategories.map(cat => (
                                         <Button key={cat} variant={selectedCategory === cat ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelectedCategory(cat)} className="w-full justify-start">{cat}</Button>
                                    ))}
                                </div>
                            </aside>
                            <main className="w-full sm:w-3/4 sm:pl-4">
                                <div className="relative mb-3">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="Buscar exercício..."
                                        value={exerciseSearch}
                                        onChange={e => setExerciseSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <ScrollArea className="h-64 sm:h-96">
                                    <div className="space-y-2 pr-4">
                                        {filteredExercises.map(ex => (
                                            <div key={ex.id} className="flex items-center gap-4 p-2 rounded-md border">
                                                <Checkbox id={ex.id} onCheckedChange={checked => handleSelectExercise(ex.id, !!checked)} checked={selectedExercises.has(ex.id)} />
                                                <Image src={ex.mediaUrl} alt={ex.name} width={60} height={60} className="rounded-md object-cover" data-ai-hint="exercise fitness" />
                                                <div className="flex-1">
                                                    <Label htmlFor={ex.id} className="font-semibold">{ex.name}</Label>
                                                    <p className="text-xs text-muted-foreground">{ex.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </main>
                        </div>
                        <DialogFooter className="mt-4 pt-4 border-t">
                             <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                             <Button onClick={handleAddFromLibrary} disabled={selectedExercises.size === 0}>Adicionar {selectedExercises.size} Exercício(s)</Button>
                        </DialogFooter>
                    </TabsContent>
                    <TabsContent value="scratch">
                        <form onSubmit={handleAddFromScratch} className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Exercício</Label>
                                <Input id="name" name="name" placeholder="Ex: Remada Unilateral com Halter" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sets">Séries</Label>
                                    <Input id="sets" name="sets" placeholder="Ex: 4" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reps">Repetições</Label>
                                    <Input id="reps" name="reps" placeholder="Ex: 8-12" required />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="mediaUrl">URL da Imagem/GIF (Opcional)</Label>
                                <Input id="mediaUrl" name="mediaUrl" placeholder="https://exemplo.com/imagem.gif" />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                <Button type="submit">Adicionar Exercício</Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};


const WorkoutBuilder = ({ onSave, onBack, plan: initialPlan }: { onSave: (plan: WorkoutPlan) => void, onBack: () => void, plan: WorkoutPlan | null }) => {
    const [plan, setPlan] = useState<WorkoutPlan>(initialPlan || {} as WorkoutPlan);
    const [activeDayId, setActiveDayId] = useState<string | null>(null);
    const [isAddExoModalOpen, setAddExoModalOpen] = useState(false);

    useEffect(() => {
      const p = initialPlan || {id: `pln-${Date.now()}`, name: 'Novo Plano', difficulty: 'Iniciante', description: '', schedule: []};
      setPlan(JSON.parse(JSON.stringify(p))); // Deep copy
      if (p.schedule.length > 0) {
        setActiveDayId(p.schedule[0].id);
      }
    }, [initialPlan]);

    const activeDay = plan.schedule?.find(d => d.id === activeDayId);

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination || !plan.schedule) return;

        const { source, destination, type } = result;

        if (type === 'day') {
          const newSchedule = Array.from(plan.schedule);
          const [reorderedItem] = newSchedule.splice(source.index, 1);
          newSchedule.splice(destination.index, 0, reorderedItem);
          setPlan({ ...plan, schedule: newSchedule });
        } else if (type === 'exercise' && activeDay) {
          const newExercises = Array.from(activeDay.exercises);
          const [reorderedItem] = newExercises.splice(source.index, 1);
          newExercises.splice(destination.index, 0, reorderedItem);
          const newSchedule = plan.schedule.map(day => day.id === activeDayId ? { ...day, exercises: newExercises } : day);
          setPlan({ ...plan, schedule: newSchedule });
        }
    };

    const updatePlanDetails = (field: keyof Omit<WorkoutPlan, 'schedule'|'id'>, value: string) => {
        setPlan({ ...plan, [field]: value });
    };

    const addDay = () => {
        const newDay: DailyWorkout = { id: `day-${Date.now()}`, day: `Dia ${plan.schedule.length + 1}`, focus: 'Novo Foco', exercises: [] };
        setPlan({ ...plan, schedule: [...(plan.schedule || []), newDay] });
        setActiveDayId(newDay.id);
    };

    const updateDay = (dayId: string, field: keyof Omit<DailyWorkout, 'exercises' | 'id'>, value: string) => {
        const newSchedule = plan.schedule.map(d => d.id === dayId ? { ...d, [field]: value } : d);
        setPlan({ ...plan, schedule: newSchedule });
    };
    
    const removeDay = (dayId: string) => {
      const newSchedule = plan.schedule.filter(d => d.id !== dayId);
      setPlan({...plan, schedule: newSchedule});
      // Do not change active day, user can select another or be left with no selection
    }

    const handleAddExercises = (newExercises: Exercise[]) => {
         if (!activeDayId) return;
        const newSchedule = plan.schedule.map(day => 
            day.id === activeDayId 
                ? { ...day, exercises: [...day.exercises, ...newExercises] } 
                : day
        );
        setPlan({ ...plan, schedule: newSchedule });
    }

    const removeExercise = (exerciseId: string) => {
        if (!activeDayId) return;
        const newSchedule = plan.schedule.map(day => day.id === activeDayId ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) } : day);
        setPlan({ ...plan, schedule: newSchedule });
    };

    const updateExercise = (exerciseId: string, field: keyof Omit<Exercise, 'id'|'isCompleted'|'notes'|'setLogs'>, value: string) => {
        if (!activeDayId) return;
        const newSchedule = plan.schedule.map(day => day.id === activeDayId ? {
            ...day, exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, [field]: value } : ex)
        } : day);
        setPlan({ ...plan, schedule: newSchedule });
    };

    if (!plan.id) return null;

    return (
      <>
        <AddExerciseModal open={isAddExoModalOpen} onOpenChange={setAddExoModalOpen} onAddExercises={handleAddExercises} />
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="flex flex-col h-full">
                <header className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b">
                    <Button variant="ghost" onClick={onBack} className="shrink-0 px-2 sm:px-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Voltar</span>
                    </Button>
                    <h1 className="text-base sm:text-xl font-bold truncate flex-1 text-center px-2">{plan.name || "Novo Plano"}</h1>
                    <Button onClick={() => onSave(plan)} className="shrink-0 px-2 sm:px-4">
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Salvar</span>
                    </Button>
                </header>
                <div className="flex-1 flex flex-col md:grid md:grid-cols-[320px_1fr] overflow-y-auto md:overflow-hidden">
                    {/* Left Sidebar */}
                    <aside className="border-b md:border-b-0 border-r flex flex-col md:overflow-y-auto">
                        <div className="p-4 space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="plan-name">Nome do Plano</Label>
                                <Input id="plan-name" value={plan.name} onChange={e => updatePlanDetails('name', e.target.value)} placeholder="Ex: Hipertrofia Intensa 5x" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="plan-difficulty">Dificuldade</Label>
                                <Input id="plan-difficulty" value={plan.difficulty} onChange={e => updatePlanDetails('difficulty', e.target.value)} placeholder="Ex: Intermediário" required/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="plan-description">Descrição</Label>
                                <Textarea id="plan-description" value={plan.description} onChange={e => updatePlanDetails('description', e.target.value)} placeholder="Descreva o foco e objetivo deste plano..." />
                            </div>
                        </div>
                        <div className="p-4 border-t">
                        <h3 className="font-semibold mb-2">Dias de Treino</h3>
                        <ClientOnlyDroppable droppableId="days-list" type="day">
                            {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {plan.schedule?.map((day, index) => (
                                <Draggable key={day.id} draggableId={day.id} index={index}>
                                    {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() => setActiveDayId(day.id)}
                                        className={cn(
                                        "flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors",
                                        activeDayId === day.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                                        snapshot.isDragging && "shadow-lg"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <span>{day.day}</span>
                                        </div>
                                        <span className="text-xs opacity-70 truncate max-w-[100px]">{day.focus}</span>
                                    </div>
                                    )}
                                </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                            )}
                        </ClientOnlyDroppable>
                        <Button variant="outline" size="sm" onClick={addDay} className="w-full mt-4"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Dia</Button>
                        </div>
                    </aside>
                    
                    {/* Main Content */}
                    <main className="md:overflow-y-auto p-4 sm:p-6">
                        {activeDay ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1 flex-1 mr-4">
                                        <Label htmlFor="day-focus">Foco do Dia</Label>
                                        <Input id="day-focus" value={activeDay.focus} onChange={(e) => updateDay(activeDayId!, 'focus', e.target.value)} placeholder="Ex: Peito e Tríceps, Descanso" />
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => removeDay(activeDay.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>

                                <Card>
                                <CardHeader>
                                    <CardTitle>Exercícios</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ClientOnlyDroppable droppableId={activeDay.id} type="exercise">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        {activeDay.exercises.map((exercise, index) => (
                                            <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 border rounded-md bg-muted/50">
                                                    <div {...provided.dragHandleProps} className="p-1 cursor-grab">
                                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    {exercise.mediaUrl && (
                                                        <Image src={exercise.mediaUrl} alt={exercise.name} width={50} height={50} className="rounded-md object-cover" data-ai-hint="exercise fitness"/>
                                                    )}
                                                    <Input value={exercise.name} onChange={e => updateExercise(exercise.id, 'name', e.target.value)} placeholder="Nome do exercício" className="flex-1 min-w-[120px]" />
                                                    <Input value={exercise.sets} onChange={e => updateExercise(exercise.id, 'sets', e.target.value)} placeholder="Séries" type="text" className="w-20 shrink-0" />
                                                    <Input value={exercise.reps} onChange={e => updateExercise(exercise.id, 'reps', e.target.value)} placeholder="Reps" className="w-20 shrink-0" />
                                                    <Button variant="ghost" size="icon" onClick={() => removeExercise(exercise.id)} className="shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        </div>
                                    )}
                                    </ClientOnlyDroppable>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" onClick={() => setAddExoModalOpen(true)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Exercício</Button>
                                </CardFooter>
                                </Card>
                            </div>
                        ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            <p>Selecione um dia à esquerda para ver os detalhes, <br />ou adicione um novo dia ao seu plano.</p>
                        </div>
                        )}
                    </main>
                </div>
            </div>
        </DragDropContext>
      </>
    );
};

const AssignWorkoutModal = ({ open, onOpenChange, onAssign, planName, students }: { open: boolean, onOpenChange: (open: boolean) => void, onAssign: (studentIds: string[]) => void, planName: string, students: {id: string, name: string}[] }) => {
    const { toast } = useToast();
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    const handleAssign = () => {
        if (selectedStudents.size === 0) {
            toast({
                title: 'Nenhum aluno selecionado',
                description: 'Por favor, selecione pelo menos um aluno para atribuir o treino.',
                variant: 'destructive',
            });
            return;
        }
        onAssign(Array.from(selectedStudents));
        onOpenChange(false);
        setSelectedStudents(new Set());
    };

    const handleSelectStudent = (studentId: string, isSelected: boolean) => {
        const newSet = new Set(selectedStudents);
        if (isSelected) {
            newSet.add(studentId);
        } else {
            newSet.delete(studentId);
        }
        setSelectedStudents(newSet);
    };

    const handleSelectAll = (isAllSelected: boolean) => {
        if (isAllSelected) {
            setSelectedStudents(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Atribuir "{planName}"</DialogTitle>
                    <DialogDescription>Selecione os alunos para quem você deseja atribuir este plano de treino.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="flex items-center px-4 pb-2 border-b">
                        <Checkbox id="select-all" onCheckedChange={(checked) => handleSelectAll(Boolean(checked))} checked={selectedStudents.size === students.length && students.length > 0} />
                        <Label htmlFor="select-all" className="ml-2 font-semibold">Selecionar Todos</Label>
                    </div>
                    <ScrollArea className="h-64">
                        <div className="p-4 space-y-2">
                        {students.map(student => (
                            <div key={student.id} className="flex items-center">
                                <Checkbox id={student.id} onCheckedChange={(checked) => handleSelectStudent(student.id, Boolean(checked))} checked={selectedStudents.has(student.id)}/>
                                <Label htmlFor={student.id} className="ml-2">{student.name}</Label>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAssign}>Atribuir a {selectedStudents.size} Aluno(s)</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const TrainerView = () => {
    const { toast } = useToast();
    const { plans, addPlan, updatePlan, deletePlan, assignPlanToStudents, getAssignments, students } = useContext(WorkoutsContext);
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'assignments' ? 'assignments' : 'templates');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [view, setView] = useState<'list' | 'builder'>('list');
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);

    const handleAiGeneratedPlan = (plan: GeneratedWorkoutPlan | null) => {
        if (plan) {
            const newPlan: Omit<WorkoutPlan, 'id'| 'assignedTo'> = {
                name: plan.planName,
                description: `Plano gerado por IA com foco em ${plan.weeklySchedule[0]?.focus || 'geral'}.`,
                difficulty: 'IA Gerado',
                schedule: plan.weeklySchedule.map((day, index) => ({
                    id: `day-ai-${index}`,
                    day: day.day,
                    focus: day.focus,
                    exercises: (day.exercises || []).map((ex, exIndex) => ({
                        id: `ex-ai-${index}-${exIndex}`,
                        name: ex.name,
                        sets: String(ex.sets || ''),
                        reps: String(ex.reps || ex.duration || ''),
                    }))
                })),
            };
            addPlan(newPlan);
             toast({
                title: "Plano de IA Criado!",
                description: `O novo plano "${plan.planName}" foi adicionado à sua biblioteca.`,
            });
        }
        setIsAiModalOpen(false);
    };
    
    const handleSavePlan = (plan: WorkoutPlan) => {
         const isEditing = plans.some(p => p.id === plan.id);
         if (isEditing) {
             updatePlan(plan.id, plan);
         } else {
             addPlan(plan);
         }
         toast({
            title: `Plano ${isEditing ? 'Atualizado' : 'Criado'}!`,
            description: `O plano de treino "${plan.name}" foi salvo com sucesso.`,
        });
        setView('list');
        setSelectedPlan(null);
    }

    const handleEditPlan = (plan: WorkoutPlan) => {
        setSelectedPlan(plan);
        setView('builder');
    }
    
    const handleAddNewPlan = () => {
        setSelectedPlan(null);
        setView('builder');
    }
    
    const handleOpenAssignModal = (plan: WorkoutPlan) => {
        setSelectedPlan(plan);
        setAssignModalOpen(true);
    }

    const handleDeletePlan = (planId: string) => {
        deletePlan(planId);
        toast({
            title: 'Plano Excluído',
            description: 'O plano de treino foi removido da sua biblioteca.',
            variant: 'destructive'
        })
    }

    const handleAssignStudents = (studentIds: string[]) => {
        if (!selectedPlan) return;
        assignPlanToStudents(selectedPlan.id, studentIds);
        toast({
            title: 'Plano Atribuído!',
            description: `O plano "${selectedPlan.name}" foi atribuído com sucesso.`,
        });
    }

    const assignments = getAssignments();
    const planTemplates = plans.filter(p => !p.owner);
    
    if (view === 'builder') {
      return <WorkoutBuilder plan={selectedPlan} onSave={handleSavePlan} onBack={() => setView('list')} />
    }

    return (
    <>
      {selectedPlan && (
          <AssignWorkoutModal 
            open={isAssignModalOpen}
            onOpenChange={setAssignModalOpen}
            planName={selectedPlan.name}
            onAssign={handleAssignStudents}
            students={students}
          />
      )}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gerenciar Treinos</h1>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleAddNewPlan} className="flex-1"><PlusCircle className="mr-2 h-4 w-4" />Criar Plano</Button>
            <Button className="flex-1" disabled title="Funcionalidade temporariamente desativada">
                <Sparkles className="mr-2 h-4 w-4" />
                Criar com IA
                <Badge variant="secondary" className="ml-2 text-xs">Em breve</Badge>
            </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="templates" className="flex-1 sm:flex-none text-xs sm:text-sm">Meus Planos (Modelos)</TabsTrigger>
            <TabsTrigger value="assignments" className="flex-1 sm:flex-none text-xs sm:text-sm">Planos de Alunos</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
            <Card>
                <CardHeader>
                    <CardTitle>Biblioteca de Planos</CardTitle>
                    <CardDescription>Crie e gerencie planos reutilizáveis para seus alunos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                     <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Plano</TableHead>
                            <TableHead className="hidden md:table-cell">Dificuldade</TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {planTemplates.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium">{plan.name}</TableCell>
                               <TableCell className="hidden md:table-cell">
                                  <Badge variant="outline">{plan.difficulty}</Badge>
                               </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleEditPlan(plan)}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleOpenAssignModal(plan)}>
                                            <UserPlus className="mr-2 h-4 w-4" /> Atribuir a Alunos
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDeletePlan(plan.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="assignments">
            <Card>
                <CardHeader>
                    <CardTitle>Planos de Treino Ativos dos Alunos</CardTitle>
                    <CardDescription>Visualize e edite o plano de treino de cada um dos seus alunos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                     <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Plano Ativo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.map((ass) => (
                               <TableRow key={ass.studentId}>
                                   <TableCell className="font-medium">{ass.studentName}</TableCell>
                                   <TableCell>{ass.plan?.name || "Nenhum plano ativo"}</TableCell>
                                   <TableCell className="text-right">
                                       {ass.plan ? (
                                           <Button variant="outline" size="sm" onClick={() => handleEditPlan(ass.plan!)}>
                                               <Edit className="h-4 w-4 sm:mr-2" />
                                               <span className="hidden sm:inline">Ver/Editar</span>
                                           </Button>
                                       ) : (
                                            <Button variant="secondary" size="sm" disabled>Atribuir um plano</Button>
                                       )}
                                   </TableCell>
                               </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
    )
}

const ExerciseTrackerModal = ({ open, onOpenChange, planId, dayId, exercise, onUpdate }: { open: boolean, onOpenChange: (open: boolean) => void, planId: string, dayId: string, exercise: Exercise, onUpdate: (planId: string, dayId: string, exercise: Exercise) => void }) => {
    const [localExercise, setLocalExercise] = useState<Exercise | null>(null);

    useEffect(() => {
        if (open && exercise) {
            // Initialize set logs if they don't exist
            const numSets = parseInt(exercise.sets, 10) || 0;
            const currentLogs = exercise.setLogs || [];
            const newLogs: SetLog[] = Array.from({ length: numSets }, (_, i) => ({
                id: currentLogs[i]?.id || `set-${Date.now()}-${i}`,
                weight: currentLogs[i]?.weight || 0,
                reps: currentLogs[i]?.reps || 0,
                isCompleted: currentLogs[i]?.isCompleted || false,
            }));
            setLocalExercise({ ...exercise, setLogs: newLogs });
        }
    }, [open, exercise]);

    if (!localExercise) return null;

    const handleSetUpdate = (setIndex: number, field: keyof Omit<SetLog, 'id'>, value: string | number | boolean) => {
        setLocalExercise(prev => {
            if (!prev) return null;
            const newSetLogs = [...(prev.setLogs || [])];
            newSetLogs[setIndex] = { ...newSetLogs[setIndex], [field]: value };
            return { ...prev, setLogs: newSetLogs };
        });
    };

    const handleNotesUpdate = (notes: string) => {
        setLocalExercise(prev => prev ? { ...prev, notes } : null);
    };
    
    const handleSave = () => {
        if (localExercise) {
            const allSetsCompleted = localExercise.setLogs?.every(s => s.isCompleted);
            const updatedExercise = { ...localExercise, isCompleted: allSetsCompleted };
            onUpdate(planId, dayId, updatedExercise);
        }
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Rastrear Exercício: {exercise.name}</DialogTitle>
                    <DialogDescription>
                        Registre seu desempenho para cada série deste exercício.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Série</TableHead>
                                <TableHead>Peso (kg)</TableHead>
                                <TableHead>Reps</TableHead>
                                <TableHead className="w-[100px] text-right">Feito</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {localExercise.setLogs?.map((set, index) => (
                                <TableRow key={set.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                        <Input type="number" value={set.weight} onChange={e => handleSetUpdate(index, 'weight', parseFloat(e.target.value))} className="h-8"/>
                                    </TableCell>
                                     <TableCell>
                                        <Input type="number" value={set.reps} onChange={e => handleSetUpdate(index, 'reps', parseInt(e.target.value, 10))} className="h-8" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Checkbox checked={set.isCompleted} onCheckedChange={checked => handleSetUpdate(index, 'isCompleted', !!checked)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea id="notes" placeholder="Ex: Senti uma fisgada, aumentei a carga, etc." value={localExercise.notes || ''} onChange={e => handleNotesUpdate(e.target.value)}/>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Salvar Progresso</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const StudentView = () => {
    const { toast } = useToast();
    const { user } = useUserRole();
    const { 
        plans,
        addPlan,
        updatePlan,
        deletePlan,
        activeStudentPlans,
        setActiveStudentPlan,
        updateExerciseDetails,
    } = useContext(WorkoutsContext);

    const studentId = user?.id ?? '';
    
    const myPlans = plans.filter(p => p.owner === studentId);
    const weeklyPlan = activeStudentPlans[studentId] ? plans.find(p => p.id === activeStudentPlans[studentId]) : null;

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [view, setView] = useState<'list' | 'builder'>('list');
    const [isTrackerOpen, setIsTrackerOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
    const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<{planId: string, dayId: string, exercise: Exercise} | null>(null);

    const [activeTab, setActiveTab] = useState('weekly-plan');
    
    const handleOpenTracker = (planId: string, dayId: string, exercise: Exercise) => {
        setSelectedExerciseInfo({ planId, dayId, exercise });
        setIsTrackerOpen(true);
    };

    const handleAiGeneratedPlan = (planData: GeneratedWorkoutPlan | null) => {
        if (planData) {
            const newPlan: Omit<WorkoutPlan, 'id'> = {
                name: planData.planName,
                description: `Plano gerado por IA.`,
                difficulty: 'IA Gerado',
                owner: studentId,
                schedule: planData.weeklySchedule.map((day, index) => ({
                    id: `day-ai-${Date.now()}-${index}`, day: day.day, focus: day.focus,
                    exercises: (day.exercises || []).map((ex, exIndex) => ({
                        id: `ex-ai-${Date.now()}-${index}-${exIndex}`, name: ex.name, sets: String(ex.sets || ''), reps: String(ex.reps || ex.duration || ''),
                    }))
                })),
            };
            addPlan(newPlan);
             toast({ title: "Plano de IA Criado!", description: `O novo plano "${planData.planName}" foi adicionado e ativado.` });
        }
        setIsAiModalOpen(false);
    };

    const handleSavePlan = (plan: WorkoutPlan) => {
         const isEditing = myPlans.some(p => p.id === plan.id);
         const planWithOwner = { ...plan, owner: studentId };
         if (isEditing) {
             updatePlan(plan.id, planWithOwner);
         } else {
             addPlan(planWithOwner);
         }
         toast({ title: `Plano ${isEditing ? 'Atualizado' : 'Criado'}!`, description: `Seu plano "${plan.name}" foi salvo com sucesso.` });
         setView('list');
    };

    const handleAddNewPlan = () => { setSelectedPlan(null); setView('builder'); };
    const handleEditPlan = (plan: WorkoutPlan) => { setSelectedPlan(plan); setView('builder'); };
    const handleDeletePlan = (planId: string) => {
        deletePlan(planId);
        toast({ title: 'Plano Excluído', variant: 'destructive' });
    };
    const handleActivatePlan = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            setActiveStudentPlan(studentId, planId);
            toast({ title: 'Plano Ativado!', description: `Você começou o plano "${plan.name}".`});
            setActiveTab('weekly-plan');
        }
    };
    
    const handleUpdateExercise = (planId: string, dayId: string, exercise: Exercise) => {
        updateExerciseDetails(planId, dayId, exercise);
        toast({ title: "Exercício Atualizado!", description: `Seu progresso em ${exercise.name} foi salvo.` });
    };

    if (view === 'builder') {
      return <WorkoutBuilder plan={selectedPlan} onSave={handleSavePlan} onBack={() => setView('list')} />
    }

    return (
        <div className="flex flex-col gap-6">
            
            {selectedExerciseInfo && (
              <ExerciseTrackerModal 
                open={isTrackerOpen}
                onOpenChange={setIsTrackerOpen}
                planId={selectedExerciseInfo.planId}
                dayId={selectedExerciseInfo.dayId}
                exercise={selectedExerciseInfo.exercise}
                onUpdate={handleUpdateExercise}
              />
            )}

            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <DialogTrigger asChild>
                    <Button className="sr-only">Criar com IA</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Gerador de Plano com IA</DialogTitle>
                        <DialogDescription>Descreva seus objetivos e deixe a IA criar um plano de treino para você.</DialogDescription>
                    </DialogHeader>
                    <GenerateWorkoutForm onPlanGenerated={handleAiGeneratedPlan} />
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Meus Treinos</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleAddNewPlan} className="flex-1"><PlusCircle className="mr-2 h-4 w-4" />Criar Plano</Button>
                    <Button className="flex-1" disabled title="Funcionalidade temporariamente desativada"><Sparkles className="mr-2 h-4 w-4" />Criar com IA<Badge variant="secondary" className="ml-2 text-xs">Em breve</Badge></Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="weekly-plan">Meu Plano Semanal</TabsTrigger>
                    <TabsTrigger value="my-plans">Meus Planos Salvos</TabsTrigger>
                </TabsList>
                <TabsContent value="weekly-plan">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plano Ativo: {weeklyPlan?.name || "Nenhum"}</CardTitle>
                            <CardDescription>Seu plano de treino para esta semana. Clique em um exercício para registrar seu progresso.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {weeklyPlan && weeklyPlan.schedule.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full" defaultValue={`item-${new Date().getDay()}`}>
                                    {weeklyPlan.schedule.map((day, index) => {
                                        const isRestDay = !day.exercises || day.exercises.length === 0;
                                        const allCompleted = !isRestDay && day.exercises.every(ex => ex.isCompleted);
                                        
                                        return (
                                            <AccordionItem value={`item-${index+1}`} key={day.id}>
                                                <AccordionTrigger>
                                                    <div className="flex justify-between items-center w-full pr-4">
                                                        <div className="flex items-center gap-3">
                                                            {allCompleted ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Dumbbell className="h-5 w-5 text-muted-foreground" />}
                                                            <span className="font-semibold">{day.day}</span> - <span className="text-muted-foreground">{day.focus}</span>
                                                        </div>
                                                        {isRestDay && <Badge variant="outline">Descanso</Badge>}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    {isRestDay ? (
                                                        <p className="text-muted-foreground pl-10">Aproveite para descansar e se recuperar para o próximo treino!</p>
                                                    ) : (
                                                        <div className="pl-6 space-y-2">
                                                            {day.exercises.map(exercise => (
                                                                <button key={exercise.id} onClick={() => handleOpenTracker(weeklyPlan.id, day.id, exercise)} className="flex items-center w-full text-left p-2 rounded-md hover:bg-accent transition-colors">
                                                                    {exercise.isCompleted ? <CheckCircle2 className="h-5 w-5 text-primary mr-3" /> : <Circle className="h-5 w-5 text-muted-foreground mr-3" />}
                                                                    <div className="flex-1">
                                                                        <span className={cn("font-medium", exercise.isCompleted && "line-through text-muted-foreground")}>{exercise.name}</span>
                                                                        <span className="text-muted-foreground ml-2 text-sm">{exercise.sets} séries x {exercise.reps} reps</span>
                                                                    </div>
                                                                    {exercise.mediaUrl && (
                                                                        <div className="relative h-12 w-12 ml-2">
                                                                            <Image src={exercise.mediaUrl} alt={exercise.name} layout="fill" className="rounded-md object-cover" data-ai-hint="exercise fitness" />
                                                                        </div>
                                                                    )}
                                                                    <NotebookText className="h-5 w-5 text-muted-foreground ml-2" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                    })}
                                </Accordion>
                             ) : (
                                 <div className="text-center py-10">
                                     <p className="text-muted-foreground">Você ainda não tem um plano de treino ativo.</p>
                                     <p className="text-muted-foreground">Vá para 'Meus Planos Salvos' para ativar um plano.</p>
                                 </div>
                             )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="my-plans">
                    <Card>
                        <CardHeader>
                            <CardTitle>Biblioteca de Planos</CardTitle>
                            <CardDescription>Gerencie seus planos de treino salvos e ative-os quando quiser.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Dificuldade</TableHead><TableHead>Origem</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {myPlans.map((plan) => (
                                        <TableRow key={plan.id}>
                                            <TableCell className="font-medium">{plan.name}</TableCell>
                                            <TableCell><Badge variant="outline">{plan.difficulty}</Badge></TableCell>
                                            <TableCell>
                                                <Badge variant={plan.templateId ? 'secondary' : 'default'}>{plan.templateId ? 'Recebido' : 'Criado por mim'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleActivatePlan(plan.id)} disabled={activeStudentPlans[studentId] === plan.id}>
                                                    {activeStudentPlans[studentId] === plan.id ? 'Ativo' : 'Ativar'}
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleEditPlan(plan)}>
                                                          <Edit className="mr-2 h-4 w-4"/> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleDeletePlan(plan.id)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4"/> Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default function WorkoutsPage() {
  const { userRole } = useUserRole();

  return (
    <div className="flex flex-col gap-6 h-full">
      {userRole === "Student" ? <StudentView /> : <TrainerView />}
    </div>
  );
}
