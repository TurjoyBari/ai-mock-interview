import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";
import { SITE } from "@/config/site";

export const metadata = buildPublicPageMetadata(
  "Privacy Policy",
  "How AI Mock Interview collects, uses, and protects your information."
);

export default function PrivacyPage() {
  return (
    <PublicContentPage
      title="Privacy Policy"
      description="This placeholder policy explains our high-level privacy practices. Replace with legal counsel review before production launch."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          We collect account information (such as email via Clerk), interview
          practice data, and resume uploads you choose to submit so we can
          provide AI interview practice and feedback.
        </p>
        <p>
          We do not sell your personal data. Service providers that process data
          on our behalf (authentication, hosting, AI inference, file storage)
          are used only to operate the product.
        </p>
        <p>
          Contact{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {SITE.email}
          </a>{" "}
          for privacy requests.
        </p>
        <p className="text-xs">Last updated: July 13, 2026</p>
      </div>
    </PublicContentPage>
  );
}
