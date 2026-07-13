"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Mic,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/features/feature-card";
import { FeatureFaqList } from "@/components/features/feature-faq";
import { FeatureGallery } from "@/components/features/feature-gallery";
import { StartPracticingButton, StartPracticingCta } from "@/components/features/start-practicing-cta";
import {
  FEATURE_ICONS,
  getFeatureGradient,
} from "@/components/features/feature-icons";
import {
  getFeatureStatusLabel,
  type Feature,
} from "@/data/features";
import { cn } from "@/lib/utils";

export function FeatureDetailView({
  feature,
  related,
}: {
  feature: Feature;
  related: Feature[];
}) {
  const Icon = FEATURE_ICONS[feature.icon];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-1/4 top-1/4 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto max-w-6xl space-y-16 px-4 py-10 pb-24">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/#features">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All features
          </Link>
        </Button>

        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{feature.category}</Badge>
              <Badge
                variant={
                  feature.status === "available"
                    ? "success"
                    : feature.status === "coming_soon"
                      ? "warning"
                      : "default"
                }
              >
                {getFeatureStatusLabel(feature.status)}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {feature.title}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {feature.shortDescription}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {feature.estimatedTime ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  {feature.estimatedTime}
                </span>
              ) : null}
              {feature.aiPowered ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Powered
                </span>
              ) : null}
              {feature.voiceSupport ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
                  <Mic className="h-3.5 w-3.5" />
                  Voice Support
                </span>
              ) : null}
            </div>
            <StartPracticingButton />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br shadow-xl",
              getFeatureGradient(feature.image)
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.2),transparent_50%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-white backdrop-blur-md ring-1 ring-white/30">
                <Icon className="h-12 w-12" aria-hidden />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Overview */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
          aria-labelledby="overview-heading"
        >
          <h2 id="overview-heading" className="text-2xl font-bold tracking-tight">
            Overview
          </h2>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            {feature.fullDescription}
          </p>
        </motion.section>

        {/* Key features */}
        <section aria-labelledby="key-features-heading" className="space-y-6">
          <h2
            id="key-features-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Key Features
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {feature.keyFeatures.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </section>

        <FeatureGallery
          screenshots={feature.screenshots}
          featureTitle={feature.title}
        />

        {/* Workflow */}
        <section aria-labelledby="workflow-heading" className="space-y-6">
          <div>
            <h2 id="workflow-heading" className="text-2xl font-bold tracking-tight">
              Workflow
            </h2>
            <p className="mt-2 text-muted-foreground">
              How this feature works from start to finish.
            </p>
          </div>
          <ol className="space-y-4">
            {feature.workflow.map((step, i) => (
              <motion.li
                key={step.step}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-4 rounded-2xl border border-border/60 bg-card/50 p-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.step}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Benefits */}
        <section aria-labelledby="benefits-heading" className="space-y-6">
          <h2 id="benefits-heading" className="text-2xl font-bold tracking-tight">
            Benefits
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {feature.benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <FeatureFaqList faqs={feature.faqs} />

        {related.length > 0 ? (
          <section aria-labelledby="related-heading" className="space-y-6">
            <div>
              <h2
                id="related-heading"
                className="text-2xl font-bold tracking-tight"
              >
                Related Features
              </h2>
              <p className="mt-2 text-muted-foreground">
                Explore tools that pair well with {feature.title}.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((item, index) => (
                <FeatureCard key={item.slug} feature={item} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        <StartPracticingCta />
      </div>
    </div>
  );
}
