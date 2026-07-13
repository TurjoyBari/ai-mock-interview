"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top";
import { isAppShellPath } from "@/config/site";

/**
 * Marketing chrome (footer + scroll-to-top) for public pages.
 * Hidden inside the authenticated dashboard app shell.
 */
export function PublicChrome() {
  const pathname = usePathname();
  if (isAppShellPath(pathname)) return null;

  return (
    <>
      <SiteFooter />
      <ScrollToTopButton />
    </>
  );
}
