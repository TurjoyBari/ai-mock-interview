"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Menu, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#home", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#about", label: "About" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
] as const;

export function SiteNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="relative z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          onClick={closeMobile}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Mic className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">InterviewAI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex min-h-9 min-w-[9.5rem] items-center justify-end gap-2">
            {!isLoaded ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
            ) : isSignedIn ? (
              <div className="hidden md:block">
                <ProfileDropdown variant="navbar" />
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="container mx-auto max-w-6xl space-y-4 px-4 py-4">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {isLoaded && !isSignedIn ? (
            <div className="flex flex-col gap-2 border-t border-border/50 pt-4 sm:hidden">
              <Button variant="outline" asChild>
                <Link href="/sign-in" onClick={closeMobile}>
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up" onClick={closeMobile}>
                  Sign Up
                </Link>
              </Button>
            </div>
          ) : null}

          {isLoaded && isSignedIn ? (
            <div className="border-t border-border/50 pt-4">
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account
              </p>
              <ProfileDropdown variant="sidebar" className="w-full" />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
