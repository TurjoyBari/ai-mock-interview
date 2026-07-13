import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";

export const metadata = buildPublicPageMetadata(
  "FAQs",
  "Frequently asked questions about AI Mock Interview."
);

export default function FaqsPage() {
  const faqs = [
    {
      q: "Is Voice Mode required?",
      a: "No. You can practice entirely in Text Mode and switch to Voice whenever you want.",
    },
    {
      q: "Do I need a resume to start?",
      a: "No. Resume tools are optional. You can begin with mock interviews immediately.",
    },
    {
      q: "Which browsers support Voice Mode?",
      a: "Chrome and Edge offer the best Web Speech API support.",
    },
    {
      q: "Is my practice data private?",
      a: "Interviews and uploads are tied to your account. See the Privacy Policy for details.",
    },
  ];

  return (
    <PublicContentPage
      title="FAQs"
      description="Answers to common questions about practicing with InterviewAI."
    >
      <div className="space-y-5">
        {faqs.map((item) => (
          <div key={item.q} className="rounded-2xl border border-border/60 bg-card/50 p-4">
            <h2 className="text-sm font-semibold text-foreground">{item.q}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
    </PublicContentPage>
  );
}
