"use client";

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRole } from '@/contexts/user-role-context';

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
  dueDate?: string;
  assignee: TaskAssignee;
};

type TasksState = Record<TaskStatus, Task[]>;

function apiTaskToTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as TaskStatus,
    dueDate: t.due_date ?? undefined,
    assignee: {
      id: t.assignee?.id ?? '',
      name: t.assignee?.name ?? 'Desconhecido',
      avatar: t.assignee?.avatar_url ?? 'https://placehold.co/100x100.png',
    },
  };
}

function groupByStatus(tasks: Task[]): TasksState {
  return {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };
}

interface TasksContextType {
  tasks: TasksState;
  isLoading: boolean;
  addTask: (newTaskData: Omit<Task, 'id' | 'status'>) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export const TasksContext = createContext<TasksContextType>({
  tasks: { todo: [], in_progress: [], done: [] },
  isLoading: false,
  addTask: async () => {},
  moveTask: async () => {},
});

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUserRole();
  const [tasks, setTasks] = useState<TasksState>({ todo: [], in_progress: [], done: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data: any[] = res.ok ? await res.json() : [];
      setTasks(groupByStatus(data.map(apiTaskToTask)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  const addTask = async (newTaskData: Omit<Task, 'id' | 'status'>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTaskData.title,
        description: newTaskData.description,
        assigned_to: newTaskData.assignee.id,
        due_date: newTaskData.dueDate,
      }),
    });
    if (res.ok) {
      const created: any = await res.json();
      const task = apiTaskToTask(created);
      setTasks(prev => ({ ...prev, todo: [task, ...prev.todo] }));
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(prev => {
      const all: Task[] = Object.values(prev).flat();
      const task = all.find(t => t.id === taskId);
      if (!task) return prev;
      const fromStatus = task.status;
      const updated = { ...task, status: newStatus };
      return {
        ...prev,
        [fromStatus]: prev[fromStatus].filter(t => t.id !== taskId),
        [newStatus]: [updated, ...prev[newStatus]],
      };
    });

    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  return (
    <TasksContext.Provider value={{ tasks, isLoading, addTask, moveTask }}>
      {children}
    </TasksContext.Provider>
  );
};
