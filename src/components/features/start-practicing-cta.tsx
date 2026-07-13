"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StartPracticingButton({
  size = "lg",
  className,
}: {
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const href = !isLoaded || !isSignedIn ? "/sign-in" : "/dashboard";

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button size={size} className={className} asChild>
        <Link href={href} aria-label="Start practicing now">
          Start Practicing Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </motion.div>
  );
}

export function StartPracticingCta({
  className,
}: {
  className?: string;
}) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      aria-labelledby="feature-cta-heading"
    >
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-cyan-500/10 p-8 text-center sm:p-12">
        <h2
          id="feature-cta-heading"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Start Practicing Now
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Jump into your dashboard and run your next mock interview with
          AI-powered feedback.
        </p>
        <div className="mt-6 flex justify-center">
          <StartPracticingButton />
        </div>
      </div>
    </motion.section>
  );
}
