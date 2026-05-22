
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = "Student" | "Trainer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  // Student specific
  height_cm?: number;
  birthdate?: string;
  // Trainer specific
  cref?: string;
  specializations?: string;
  bio?: string;
  onboarding_completed?: boolean;
}

interface UserRoleContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  refreshSession: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const checkProfileCompleteness = (user: User, role: UserRole): boolean => {
  switch (role) {
    case "Student":
      return !!user.height_cm && !!user.birthdate;
    case "Trainer":
      return !!user.cref && !!user.specializations && !!user.bio;
    default:
      return false;
  }
}

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = () => {
    setIsLoading(true);
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(({ profile }) => {
        setUser(profile ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const userRole = user?.role ?? null;
  const isProfileComplete = user && userRole
    ? checkProfileCompleteness(user, userRole)
    : false;

  return (
    <UserRoleContext.Provider value={{ user, userRole, isLoading, isProfileComplete, refreshSession: fetchSession }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole deve ser usado dentro de um UserRoleProvider');
  }
  return context;
};
