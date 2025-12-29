
"use client";

import { useState, useContext, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, GripVertical, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { TasksContext, Task, TaskStatus } from '@/contexts/tasks-context';
import { useUserRole } from '@/contexts/user-role-context';
import { allUsers } from '@/lib/user-directory';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const ClientOnlyDroppable = ({ children, ...props }: DroppableProps) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    return isMounted ? <Droppable {...props}>{children}</Droppable> : null;
};

const AddTaskDialog = () => {
    const { addTask } = useContext(TasksContext);
    const { user: currentUser, userRole } = useUserRole();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [dueDate, setDueDate] = useState<Date | undefined>();
    
    // Users that can be assigned tasks
    const assignableUsers = userRole === 'Trainer' 
        ? allUsers.filter(u => u.role === 'Student')
        : allUsers;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const assigneeId = formData.get('assignee') as string;

        const assignee = allUsers.find(u => u.id === assigneeId);

        if (!title || !assignee) {
             toast({ title: 'Erro', description: 'Título e responsável são obrigatórios.', variant: 'destructive' });
             return;
        }

        addTask({
            title,
            description: formData.get('description') as string,
            dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
            assignee: {
                id: assignee.id,
                name: assignee.name,
                avatar: `https://placehold.co/100x100.png`
            }
        });

        toast({ title: 'Tarefa Adicionada!', description: `A tarefa "${title}" foi criada com sucesso.` });
        setOpen(false);
        setDueDate(undefined);
        e.currentTarget.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Nova Tarefa
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                    <DialogDescription>Preencha os detalhes da tarefa.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" name="title" required placeholder="Ex: Renovar plano de treino do Alex"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea id="description" name="description" placeholder="Adicione mais detalhes sobre a tarefa..."/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Data de Entrega</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, "dd 'de' MMMM", {locale: ptBR}) : <span>Escolha uma data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus/>
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="assignee">Responsável</Label>
                             <Select name="assignee" required defaultValue={currentUser.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignableUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Adicionar Tarefa</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const columnTitles: Record<TaskStatus, string> = {
    todo: "A Fazer",
    in_progress: "Em Andamento",
    done: "Concluído",
};


const TaskCard = ({ task, index }: { task: Task, index: number }) => {
    const initials = task.assignee.name.split(" ").map(n => n[0]).join('').toUpperCase();
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                        "p-3 rounded-lg border bg-card text-card-foreground shadow-sm mb-3",
                        snapshot.isDragging && "shadow-xl"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm flex-1 pr-2">{task.title}</p>
                         <div {...provided.dragHandleProps} className="p-1 cursor-grab">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                    <div className="flex justify-between items-center mt-3">
                        {task.dueDate ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{format(parseISO(task.dueDate), "dd MMM", {locale: ptBR})}</span>
                            </div>
                        ) : <div />}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Avatar className="h-6 w-6">
                                        <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} data-ai-hint="person portrait" />
                                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent><p>{task.assignee.name}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            )}
        </Draggable>
    );
};


export default function TasksPage() {
    const { tasks, moveTask } = useContext(TasksContext);

    const onDragEnd = (result: DropResult) => {
        const { destination, draggableId } = result;
        if (!destination) return;

        moveTask(draggableId, destination.droppableId as TaskStatus);
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Tarefas</h1>
                <AddTaskDialog />
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start flex-1">
                    {(Object.keys(columnTitles) as TaskStatus[]).map(status => (
                        <Card key={status} className="bg-muted/50">
                            <CardHeader>
                                <CardTitle>{columnTitles[status]}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ClientOnlyDroppable droppableId={status}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={cn("min-h-[400px] transition-colors", snapshot.isDraggingOver && 'bg-accent/50')}
                                        >
                                            {tasks[status].map((task, index) => (
                                                <TaskCard key={task.id} task={task} index={index} />
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </ClientOnlyDroppable>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
