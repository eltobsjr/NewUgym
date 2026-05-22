
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRoleProvider, useUserRole } from "@/contexts/user-role-context";
import { DashboardView } from "@/components/dashboard-view";
import { WorkoutsProvider } from "@/contexts/workouts-context";
import { EventsProvider } from "@/contexts/events-context";
import { TasksProvider } from "@/contexts/tasks-context";
import { Dumbbell } from "lucide-react";

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Dumbbell className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserRoleProvider>
      <DashboardGuard>
        <TasksProvider>
          <EventsProvider>
            <WorkoutsProvider>
              <DashboardView>{children}</DashboardView>
            </WorkoutsProvider>
          </EventsProvider>
        </TasksProvider>
      </DashboardGuard>
    </UserRoleProvider>
  );
}
