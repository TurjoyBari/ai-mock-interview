import {
  PublicContentPage,
  buildPublicPageMetadata,
} from "@/components/layout/public-content-page";
import { SITE } from "@/config/site";

export const metadata = buildPublicPageMetadata(
  "Changelog",
  "Recent product updates for AI Mock Interview."
);

export default function ChangelogPage() {
  return (
    <PublicContentPage
      title="Changelog"
      description={`Product updates for ${SITE.name} v${SITE.version}.`}
    >
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
          <p className="font-semibold text-foreground">v{SITE.version}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Interview analytics dashboard</li>
            <li>Live Voice ↔ Text mode switching</li>
            <li>Features marketplace explorer</li>
            <li>Marketing footer and scroll-to-top</li>
          </ul>
        </div>
      </div>
    </PublicContentPage>
  );
}
