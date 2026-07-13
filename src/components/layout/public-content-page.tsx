import Link from "next/link";
import type { Metadata } from "next";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export function buildPublicPageMetadata(
  title: string,
  description: string
): Metadata {
  return { title, description };
}

export function PublicContentPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <SiteNavbar />
      <main className="relative container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm font-medium text-primary">{SITE.shortName}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
          {children}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/features">Explore Features</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
