"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Target,
  BarChart3,
  GraduationCap,
  StickyNote,
  Search,
  User,
  Settings,
  Mic,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserMenu } from "@/components/layout/user-menu";

const iconMap = {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Target,
  BarChart3,
  GraduationCap,
  StickyNote,
  Search,
  User,
  Settings,
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" as const },
  { href: "/interviews/new", label: "New Interview", icon: "PlusCircle" as const },
  { href: "/interviews/history", label: "History", icon: "History" as const },
  { href: "/resume", label: "Resume", icon: "FileText" as const },
  { href: "/job-match", label: "Job Match", icon: "Target" as const },
  { href: "/reports", label: "Reports", icon: "BarChart3" as const },
  { href: "/coach", label: "AI Coach", icon: "GraduationCap" as const },
  { href: "/notes", label: "Notes", icon: "StickyNote" as const },
  { href: "/search", label: "Search", icon: "Search" as const },
  { href: "/profile", label: "Profile", icon: "User" as const },
  { href: "/settings", label: "Settings", icon: "Settings" as const },
];

function SidebarNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Mic className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">InterviewAI</h1>
          <p className="text-xs text-muted-foreground">Your AI Coach</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border/50 p-4">
        <UserMenu />
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNavContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
