"use client"

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRole } from '@/contexts/user-role-context';

export type EventType = 'class' | 'event' | 'seminar' | 'personal_session';

export type Event = {
  id: string;
  title: string;
  date: string;   // yyyy-MM-dd (derived from start_time)
  time: string;   // HH:mm (derived from start_time)
  description: string;
  type: EventType;
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
  is_registered?: boolean;
  registrations_count?: number;
};

type EventsState = Record<string, Event[]>;

function apiEventToEvent(e: any, userId?: string): Event {
  const start = new Date(e.start_time);
  const date = start.toISOString().split('T')[0];
  const time = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const registrations: any[] = e.event_registrations || [];
  return {
    id: e.id,
    title: e.title,
    date,
    time,
    description: e.description || '',
    type: e.type as EventType,
    start_time: e.start_time,
    end_time: e.end_time,
    location: e.location,
    max_participants: e.max_participants,
    is_registered: userId
      ? registrations.some((r: any) => r.user_id === userId && r.status === 'confirmed')
      : false,
    registrations_count: registrations.filter((r: any) => r.status === 'confirmed').length,
  };
}

function groupByDate(events: Event[]): EventsState {
  const result: EventsState = {};
  events.forEach(e => {
    if (!result[e.date]) result[e.date] = [];
    result[e.date].push(e);
  });
  return result;
}

interface EventsContextType {
  events: EventsState;
  isLoading: boolean;
  addEvent: (newEventData: Omit<Event, 'id' | 'date' | 'time' | 'is_registered' | 'registrations_count'>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  registerForEvent: (eventId: string) => Promise<void>;
  unregisterFromEvent: (eventId: string) => Promise<void>;
  isRegistered: (eventId: string) => boolean;
  refreshMonth: (month: string) => Promise<void>;
}

export const EventsContext = createContext<EventsContextType>({
  events: {},
  isLoading: false,
  addEvent: async () => {},
  deleteEvent: async () => {},
  registerForEvent: async () => {},
  unregisterFromEvent: async () => {},
  isRegistered: () => false,
  refreshMonth: async () => {},
});

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUserRole();
  const [events, setEvents] = useState<EventsState>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchMonth = useCallback(async (month: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events?month=${month}`);
      const data: any[] = res.ok ? await res.json() : [];
      const mapped = data.map(e => apiEventToEvent(e, user?.id));
      setEvents(prev => ({ ...prev, ...groupByDate(mapped) }));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      fetchMonth(month);
    }
  }, [user, fetchMonth]);

  const refreshMonth = (month: string) => fetchMonth(month);

  const addEvent = async (newEventData: Omit<Event, 'id' | 'date' | 'time' | 'is_registered' | 'registrations_count'>) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newEventData.title,
        description: newEventData.description,
        type: newEventData.type,
        start_time: newEventData.start_time,
        end_time: newEventData.end_time,
        location: newEventData.location,
        max_participants: newEventData.max_participants,
        is_public: true,
      }),
    });
    if (res.ok) {
      const created: any = await res.json();
      const mapped = apiEventToEvent(created, user?.id);
      setEvents(prev => {
        const next = { ...prev };
        if (!next[mapped.date]) next[mapped.date] = [];
        next[mapped.date] = [...next[mapped.date], mapped];
        return next;
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
    setEvents(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(date => {
        next[date] = next[date].filter(e => e.id !== eventId);
        if (next[date].length === 0) delete next[date];
      });
      return next;
    });
  };

  const registerForEvent = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' });
    if (res.ok) {
      setEvents(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(date => {
          next[date] = next[date].map(e =>
            e.id === eventId
              ? { ...e, is_registered: true, registrations_count: (e.registrations_count ?? 0) + 1 }
              : e
          );
        });
        return next;
      });
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'DELETE' });
    if (res.ok) {
      setEvents(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(date => {
          next[date] = next[date].map(e =>
            e.id === eventId
              ? { ...e, is_registered: false, registrations_count: Math.max(0, (e.registrations_count ?? 1) - 1) }
              : e
          );
        });
        return next;
      });
    }
  };

  const isRegistered = (eventId: string) => {
    return Object.values(events).flat().find(e => e.id === eventId)?.is_registered ?? false;
  };

  return (
    <EventsContext.Provider value={{
      events, isLoading, addEvent, deleteEvent, registerForEvent, unregisterFromEvent, isRegistered, refreshMonth
    }}>
      {children}
    </EventsContext.Provider>
  );
};
