import Link from "next/link";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { Button } from "@/components/ui/button";

export default function FeatureNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />
      <main className="container mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Feature not found</h1>
        <p className="mt-3 text-muted-foreground">
          That feature page does not exist or may have moved.
        </p>
        <Button className="mt-8" asChild>
          <Link href="/#features">Back to Features</Link>
        </Button>
      </main>
    </div>
  );
}
