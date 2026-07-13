import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";

export const metadata = buildPublicPageMetadata(
  "Roadmap",
  "What we are building next for AI Mock Interview."
);

export default function RoadmapPage() {
  return (
    <PublicContentPage
      title="Roadmap"
      description="A high-level look at upcoming product directions."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc space-y-2 pl-5">
          <li>Deeper company-specific interview packs</li>
          <li>Richer mobile voice experience</li>
          <li>Team / coach shared practice workspaces</li>
          <li>Expanded documentation and blog content</li>
          <li>Enterprise SSO options</li>
        </ul>
        <p>
          Have a feature request? Reach out via{" "}
          <a href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
            Contact
          </a>
          .
        </p>
      </div>
    </PublicContentPage>
  );
}
