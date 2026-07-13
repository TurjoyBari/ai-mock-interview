import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";
import { SITE } from "@/config/site";

export const metadata = buildPublicPageMetadata(
  "Contact",
  "Get in touch with the InterviewAI team for support, feedback, or partnerships."
);

export default function ContactPage() {
  return (
    <PublicContentPage
      title="Contact"
      description="Questions, feedback, or partnership ideas? We would love to hear from you."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Email us at{" "}
          <a
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={`mailto:${SITE.email}`}
          >
            {SITE.email}
          </a>
          .
        </p>
        <p>
          For product help, visit{" "}
          <a className="font-medium text-foreground underline-offset-4 hover:underline" href="/support">
            Support
          </a>{" "}
          or browse the{" "}
          <a className="font-medium text-foreground underline-offset-4 hover:underline" href="/faqs">
            FAQs
          </a>
          .
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Portfolio:{" "}
            <a
              href={SITE.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {SITE.portfolioUrl}
            </a>
          </li>
          <li>
            GitHub:{" "}
            <a
              href={SITE.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {SITE.social.github}
            </a>
          </li>
          <li>
            LinkedIn:{" "}
            <a
              href={SITE.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {SITE.social.linkedin}
            </a>
          </li>
        </ul>
      </div>
    </PublicContentPage>
  );
}
