import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";

export const metadata = buildPublicPageMetadata(
  "About",
  "Learn about AI Mock Interview and our mission to help candidates prepare with confidence."
);

export default function AboutPage() {
  return (
    <PublicContentPage
      title="About"
      description="InterviewAI helps software engineers practice real-world interviews with AI."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          AI Mock Interview is a complete interview preparation platform — not
          just a question generator. Practice technical, behavioral, HR, and
          coding interviews with adaptive AI, voice conversations, ATS resume
          analysis, and detailed performance reports.
        </p>
        <p>
          We built InterviewAI so candidates can prepare anytime, get actionable
          feedback, and track improvement across topics that matter for real
          hiring loops.
        </p>
      </div>
    </PublicContentPage>
  );
}
