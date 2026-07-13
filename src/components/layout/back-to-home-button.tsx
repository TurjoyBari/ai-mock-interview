"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Back to marketing home (`/`) from the dashboard shell */
export function BackToHomeButton() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 gap-1.5">
      <Link href="/">
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>
    </Button>
  );
}
