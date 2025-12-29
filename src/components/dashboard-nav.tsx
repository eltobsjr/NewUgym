
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, Calendar, Settings, Users, DollarSign, ClipboardList, LogOut, Palette, BookOpen, ListChecks as TasksIcon } from "lucide-react";
import { useUserRole } from "@/contexts/user-role-context";
import { cn } from "@/lib/utils";

export const navConfig = {
  student: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Meus Treinos", href: "/dashboard/workouts", icon: ClipboardList },
    { name: "Meu Progresso", href: "/dashboard/progress", icon: LineChart },
    { name: "Tarefas", href: "/dashboard/tasks", icon: TasksIcon },
    { name: "Biblioteca", href: "/dashboard/library", icon: BookOpen },
    { name: "Calendário", href: "/dashboard/calendar", icon: Calendar },
    { name: "Mensalidade", href: "/dashboard/billing", icon: DollarSign },
  ],
  trainer: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Alunos", href: "/dashboard/students", icon: Users },
    { name: "Treinos", href: "/dashboard/workouts", icon: ClipboardList },
    { name: "Financeiro", href: "/dashboard/finance", icon: DollarSign },
    { name: "Tarefas", href: "/dashboard/tasks", icon: TasksIcon },
    { name: "Calendário", href: "/dashboard/calendar", icon: Calendar },
  ],
};

const bottomNavItems = [
    { name: "Aparência", href: "/dashboard/appearance", icon: Palette },
    { name: "Perfil", href: "/dashboard/settings", icon: Settings },
    { name: "Sair", href: "/", icon: LogOut },
]

export function DashboardNav({ isCollapsed, onLinkClick }: { isCollapsed: boolean, onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { userRole } = useUserRole();

  const lowerCaseRole = userRole.toLowerCase() as keyof typeof navConfig;
  const navItems = navConfig[lowerCaseRole] || navConfig.student;

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  }

  const linkClass = (href: string, isCollapsed: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        ? "bg-primary text-primary-foreground hover:text-primary-foreground"
        : "hover:bg-muted",
      isCollapsed ? "justify-center" : ""
    );

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-2 px-2 py-4">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} onClick={handleLinkClick}>
            <div className={linkClass(item.href, isCollapsed)}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn("truncate", isCollapsed ? "hidden" : "block")}>{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t">
        <div className="space-y-1 px-2 py-4">
            {bottomNavItems.map((item) => (
                 <Link key={item.name} href={item.href} onClick={handleLinkClick}>
                    <div className={linkClass(item.href, isCollapsed)}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className={cn("truncate", isCollapsed ? "hidden" : "block")}>{item.name}</span>
                    </div>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
