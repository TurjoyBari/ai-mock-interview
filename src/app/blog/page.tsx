import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";

export const metadata = buildPublicPageMetadata(
  "Blog",
  "Interview tips and product updates from AI Mock Interview."
);

export default function BlogPage() {
  return (
    <PublicContentPage
      title="Blog"
      description="Articles and product stories will appear here. This is a placeholder landing page."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Coming soon: guides on behavioral storytelling, system design drills, and ATS resume tips.</p>
        <p>
          Subscribe to the newsletter in the footer to get notified when new
          posts publish.
        </p>
      </div>
    </PublicContentPage>
  );
}
