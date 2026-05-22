
"use client";

import { DashboardNav } from "@/components/dashboard-nav";
import { UserProfile } from "./user-profile";
import { useUserRole } from "@/contexts/user-role-context";

export function SidebarContent({ isCollapsed, onToggle, onMobileLinkClick }: { isCollapsed: boolean, onToggle: () => void, onMobileLinkClick?: () => void }) {
  const { user } = useUserRole();

  if (!user) return null;

  return (
    <>
      <UserProfile isCollapsed={isCollapsed} onToggle={onToggle} user={user} />
      <DashboardNav isCollapsed={isCollapsed} onLinkClick={onMobileLinkClick} />
    </>
  );
}
