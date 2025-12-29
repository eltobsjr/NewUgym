
"use client";

import { createContext, useState, ReactNode } from 'react';
import { allUsers } from '@/lib/user-directory';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskAssignee = {
    id: string;
    name: string;
    avatar: string;
};

export type Task = {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    dueDate?: string; // yyyy-MM-dd
    assignee: TaskAssignee;
};

type TasksState = Record<TaskStatus, Task[]>;

const findUser = (id: string, nameOnError: string = 'Desconhecido') => {
    const user = allUsers.find(u => u.id === id);
    return {
        id: user?.id || 'unknown',
        name: user?.name || nameOnError,
        avatar: `https://placehold.co/100x100.png`
    }
}

const initialTasks: TasksState = {
    todo: [
        { id: 'task-1', title: 'Revisar plano de treino de Maria Garcia', description: 'Verificar se os pesos estão adequados.', status: 'todo', dueDate: '2024-08-15', assignee: findUser('trn-1', 'John Carter') },
        { id: 'task-3', title: 'Medir progresso mensal', description: 'Tirar fotos e atualizar planilha de medidas.', status: 'todo', assignee: findUser('stu-001', 'Alice Johnson') }
    ],
    in_progress: [
        { id: 'task-4', title: 'Preparar seminário de nutrição', description: 'Montar a apresentação de slides.', status: 'in_progress', dueDate: '2024-08-10', assignee: findUser('trn-2', 'Sophie Brown') }
    ],
    done: [
        { id: 'task-6', title: 'Confirmar participação na aula de spinning', status: 'done', assignee: findUser('alex-johnson', 'Alex Johnson') }
    ]
};

interface TasksContextType {
    tasks: TasksState;
    addTask: (newTaskData: Omit<Task, 'id' | 'status'>) => void;
    moveTask: (taskId: string, newStatus: TaskStatus) => void;
}

export const TasksContext = createContext<TasksContextType>({
    tasks: { todo: [], in_progress: [], done: [] },
    addTask: () => {},
    moveTask: () => {}
});

export const TasksProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<TasksState>(initialTasks);

    const addTask = (newTaskData: Omit<Task, 'id' | 'status'>) => {
        const newTask: Task = {
            ...newTaskData,
            id: `task-${Date.now()}`,
            status: 'todo'
        };
        setTasks(prev => ({
            ...prev,
            todo: [newTask, ...prev.todo]
        }));
    };

    const moveTask = (taskId: string, newStatus: TaskStatus) => {
        setTasks(prev => {
            const allTasks: Task[] = Object.values(prev).flat();
            const taskToMove = allTasks.find(t => t.id === taskId);

            if (!taskToMove) return prev;

            const sourceStatus = taskToMove.status;
            taskToMove.status = newStatus;

            const newTasksState = { ...prev };
            
            // Remove from old column
            newTasksState[sourceStatus] = newTasksState[sourceStatus].filter(t => t.id !== taskId);
            // Add to new column
            newTasksState[newStatus].unshift(taskToMove); // Add to the beginning of the list

            return newTasksState;
        });
    };

    return (
        <TasksContext.Provider value={{ tasks, addTask, moveTask }}>
            {children}
        </TasksContext.Provider>
    );
};
