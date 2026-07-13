"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { FeatureScreenshot } from "@/data/features";

const THEME_STYLES: Record<FeatureScreenshot["theme"], string> = {
  interview: "from-sky-600/40 via-slate-800 to-slate-950",
  voice: "from-teal-600/40 via-slate-800 to-slate-950",
  coding: "from-indigo-700/40 via-slate-900 to-black",
  resume: "from-amber-700/30 via-slate-800 to-slate-950",
  analytics: "from-cyan-700/30 via-slate-800 to-slate-950",
  coach: "from-emerald-700/30 via-slate-800 to-slate-950",
};

function ScreenshotPanel({
  shot,
  className,
}: {
  shot: FeatureScreenshot;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[16/10] flex-col overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br p-4",
        THEME_STYLES[shot.theme],
        className
      )}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 truncate text-[10px] text-white/50">
          {shot.title}
        </span>
      </div>
      <div className="grid flex-1 gap-2">
        <div className="h-3 w-2/5 rounded bg-white/20" />
        <div className="h-2 w-4/5 rounded bg-white/10" />
        <div className="h-2 w-3/5 rounded bg-white/10" />
        <div className="mt-auto grid grid-cols-3 gap-2">
          <div className="h-12 rounded-lg bg-white/10" />
          <div className="h-12 rounded-lg bg-white/15" />
          <div className="h-12 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function FeatureGallery({
  screenshots,
  featureTitle,
}: {
  screenshots: FeatureScreenshot[];
  featureTitle: string;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!screenshots.length) return null;

  const current = screenshots[active] ?? screenshots[0];

  const go = (dir: -1 | 1) => {
    setActive((i) => (i + dir + screenshots.length) % screenshots.length);
  };

  return (
    <section aria-labelledby="gallery-heading" className="space-y-6">
      <div>
        <h2 id="gallery-heading" className="text-2xl font-bold tracking-tight">
          Screenshots
        </h2>
        <p className="mt-2 text-muted-foreground">
          Explore how {featureTitle} looks inside the product.
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative w-full overflow-hidden rounded-2xl border border-border/60 text-left shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open lightbox for ${current.title}`}
        >
          <ScreenshotPanel shot={current} />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" />
            Expand
          </span>
        </button>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{current.caption}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Previous screenshot"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {active + 1}/{screenshots.length}
            </span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Next screenshot"
              onClick={() => go(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {screenshots.map((shot, i) => (
            <button
              key={shot.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${shot.title}`}
              aria-current={i === active}
              className={cn(
                "overflow-hidden rounded-xl border transition",
                i === active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/50 opacity-80 hover:opacity-100"
              )}
            >
              <ScreenshotPanel shot={shot} className="rounded-none border-0" />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl border-border/60 bg-background p-0 sm:rounded-2xl">
          <div className="border-b border-border/50 px-4 py-3 pr-12">
            <DialogTitle className="text-base">{current.title}</DialogTitle>
          </div>
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <ScreenshotPanel shot={current} />
              </motion.div>
            </AnimatePresence>
            <p className="mt-3 text-sm text-muted-foreground">{current.caption}</p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
