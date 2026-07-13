"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Sparkles, Mic, Code2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FEATURE_ICONS,
  getFeatureGradient,
} from "@/components/features/feature-icons";
import { highlightText } from "@/components/features/highlight-text";
import {
  getFeatureStatusLabel,
  type Feature,
  type FeatureStatus,
} from "@/data/features";
import { cn } from "@/lib/utils";

function statusVariant(
  status: FeatureStatus
): "success" | "default" | "warning" {
  if (status === "available") return "success";
  if (status === "new" || status === "beta") return "default";
  return "warning";
}

export function FeatureCard({
  feature,
  index = 0,
  searchQuery = "",
}: {
  feature: Feature;
  index?: number;
  searchQuery?: string;
}) {
  const Icon = FEATURE_ICONS[feature.icon];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg"
    >
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden bg-gradient-to-br",
          getFeatureGradient(feature.image)
        )}
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25">
            <Icon className="h-8 w-8" aria-hidden />
          </div>
        </motion.div>
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur">
            {highlightText(feature.category, searchQuery)}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <Badge variant={statusVariant(feature.status)}>
            {getFeatureStatusLabel(feature.status)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-snug tracking-tight">
              {highlightText(feature.title, searchQuery)}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {highlightText(feature.shortDescription, searchQuery)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {feature.estimatedTime ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden />
              {feature.estimatedTime}
            </span>
          ) : null}
          <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
            {feature.difficulty}
          </span>
          {feature.aiSupport.includes("ai") ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" aria-hidden />
              AI
            </span>
          ) : null}
          {feature.aiSupport.includes("voice") ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Mic className="h-3 w-3" aria-hidden />
              Voice
            </span>
          ) : null}
          {feature.aiSupport.includes("resume") ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              <FileText className="h-3 w-3" aria-hidden />
              Resume
            </span>
          ) : null}
          {feature.aiSupport.includes("coding") ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Code2 className="h-3 w-3" aria-hidden />
              Coding
            </span>
          ) : null}
        </div>

        <Button
          asChild
          variant="outline"
          className="mt-1 w-full justify-between group-hover:border-primary/40"
        >
          <Link
            href={`/features/${feature.slug}`}
            aria-label={`View details for ${feature.title}`}
          >
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}

export function FeatureCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="w-full space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-auto flex gap-2 pt-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-1 h-9 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
