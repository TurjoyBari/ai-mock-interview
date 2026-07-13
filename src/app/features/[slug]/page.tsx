import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { FeatureDetailView } from "@/components/features/feature-detail-view";
import {
  getAllFeatureSlugs,
  getFeatureBySlug,
  getRelatedFeatures,
} from "@/data/features";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) {
    return { title: "Feature not found" };
  }
  return {
    title: feature.title,
    description: feature.shortDescription,
  };
}

export default async function FeatureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  const related = getRelatedFeatures(feature);

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />
      <main>
        <FeatureDetailView feature={feature} related={related} />
      </main>
    </div>
  );
}
