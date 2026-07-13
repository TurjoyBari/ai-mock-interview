"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  BarChart3,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROFILE_LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/interviews/history",
    label: "My Interviews",
    icon: History,
  },
  {
    href: "/resume",
    label: "Resume Analyzer",
    icon: FileText,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
] as const;

interface ProfileDropdownProps {
  /** Sidebar uses a wide trigger; landing navbar uses a compact avatar. */
  variant?: "navbar" | "sidebar";
  className?: string;
  showHelp?: boolean;
}

export function ProfileDropdown({
  variant = "navbar",
  className,
  showHelp = true,
}: ProfileDropdownProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "h-9 w-9 animate-pulse rounded-full bg-muted",
          variant === "sidebar" && "h-10 w-full rounded-xl",
          className
        )}
        aria-hidden
      />
    );
  }

  if (!user) return null;

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const displayName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Account";

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <Button
            variant="ghost"
            className={cn(
              "relative h-10 w-full justify-start gap-3 px-2 hover:bg-accent",
              className
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.imageUrl} alt={displayName} />
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-9 w-9 rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
            aria-label="Open account menu"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.imageUrl} alt={displayName} />
              <AvatarFallback className="text-xs font-semibold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.imageUrl} alt={displayName} />
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-sm font-medium leading-none">
                {displayName}
              </p>
              {email ? (
                <p className="truncate text-xs leading-none text-muted-foreground">
                  {email}
                </p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROFILE_LINKS.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="cursor-pointer">
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        {showHelp ? (
          <DropdownMenuItem asChild>
            <Link href="/#contact" className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => void signOut({ redirectUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
