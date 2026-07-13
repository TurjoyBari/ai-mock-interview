import type { Metadata } from "next";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { FeatureExplorer } from "@/components/features/feature-explorer";
import { FEATURES } from "@/data/features";
import { parseFeatureExplorerState } from "@/lib/features/query";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore InterviewAI capabilities — search, filter, and discover AI interviews, voice mode, resume tools, coding practice, and analytics.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FeaturesIndexPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  const initialState = parseFeatureExplorerState(params);

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-1/4 top-1/3 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <SiteNavbar />
      <main className="relative">
        <FeatureExplorer
          features={FEATURES}
          initialState={initialState}
          syncUrl
          showHeader
        />
      </main>
    </div>
  );
}
