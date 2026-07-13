import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";
import { SITE } from "@/config/site";

export const metadata = buildPublicPageMetadata(
  "Support",
  "Get help with AI Mock Interview."
);

export default function SupportPage() {
  return (
    <PublicContentPage
      title="Support"
      description="We are here to help you get unblocked and keep practicing."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Email{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {SITE.email}
          </a>{" "}
          with screenshots and steps to reproduce if you hit a bug.
        </p>
        <p>
          Before writing in, check the{" "}
          <a href="/faqs" className="font-medium text-foreground underline-offset-4 hover:underline">
            FAQs
          </a>{" "}
          and{" "}
          <a href="/docs" className="font-medium text-foreground underline-offset-4 hover:underline">
            Documentation
          </a>
          .
        </p>
      </div>
    </PublicContentPage>
  );
}
