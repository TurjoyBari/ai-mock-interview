"use client";

import { FeatureExplorer } from "@/components/features/feature-explorer";
import type { Feature } from "@/data/features";

export function FeaturesShowcase({ features }: { features: Feature[] }) {
  return (
    <FeatureExplorer
      features={features}
      syncUrl
      showHeader
      compact
    />
  );
}
