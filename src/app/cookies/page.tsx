import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";

export const metadata = buildPublicPageMetadata(
  "Cookies Policy",
  "How AI Mock Interview uses cookies and similar technologies."
);

export default function CookiesPage() {
  return (
    <PublicContentPage
      title="Cookies Policy"
      description="This placeholder explains cookie usage for authentication, preferences, and product analytics."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          We use essential cookies and similar storage to keep you signed in,
          remember theme preferences, and protect the application.
        </p>
        <p>
          Optional analytics cookies may be used later to understand product
          usage. You can manage browser cookie settings at any time.
        </p>
        <p className="text-xs">Last updated: July 13, 2026</p>
      </div>
    </PublicContentPage>
  );
}
