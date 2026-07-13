import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";

export const metadata = buildPublicPageMetadata(
  "Documentation",
  "Guides for getting started with AI Mock Interview."
);

export default function DocsPage() {
  return (
    <PublicContentPage
      title="Documentation"
      description="Quick-start guidance for interviews, voice mode, resume tools, and analytics."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Create an account and open the Dashboard.</li>
          <li>
            Start a new interview from New Interview and select topics.
          </li>
          <li>Answer in Voice or Text Mode — switch anytime mid-session.</li>
          <li>Review AI feedback and open the full interview report.</li>
          <li>Track progress and weak topics on the analytics dashboard.</li>
        </ol>
        <p>
          Detailed docs for each feature are also available from the{" "}
          <a href="/features" className="font-medium text-foreground underline-offset-4 hover:underline">
            Features
          </a>{" "}
          explorer.
        </p>
      </div>
    </PublicContentPage>
  );
}
