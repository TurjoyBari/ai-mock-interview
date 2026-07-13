import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";

export const metadata = buildPublicPageMetadata(
  "Terms of Service",
  "Terms governing your use of AI Mock Interview."
);

export default function TermsPage() {
  return (
    <PublicContentPage
      title="Terms of Service"
      description="These placeholder terms outline acceptable use of InterviewAI. Have counsel finalize before public launch."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          By using AI Mock Interview you agree to use the platform for lawful
          interview preparation purposes and not to abuse AI endpoints, scrape
          content, or attempt unauthorized access.
        </p>
        <p>
          Features are provided as-is. AI-generated feedback is educational and
          does not guarantee interview outcomes or employment.
        </p>
        <p>
          We may update these terms as the product evolves. Continued use after
          updates constitutes acceptance of the revised terms.
        </p>
        <p className="text-xs">Last updated: July 13, 2026</p>
      </div>
    </PublicContentPage>
  );
}
