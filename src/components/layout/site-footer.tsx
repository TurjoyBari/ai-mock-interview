"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Mic } from "lucide-react";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_PRODUCT_LINKS,
  FOOTER_RESOURCE_LINKS,
  SITE,
} from "@/config/site";
import { cn } from "@/lib/utils";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 2C6.477 2 2 6.586 2 12.253c0 4.537 2.865 8.379 6.839 9.738.5.094.683-.22.683-.486 0-.24-.009-.875-.014-1.717-2.782.617-3.369-1.372-3.369-1.372-.454-1.178-1.11-1.492-1.11-1.492-.908-.635.069-.622.069-.622 1.003.072 1.531 1.053 1.531 1.053.892 1.561 2.341 1.111 2.91.85.091-.662.35-1.111.636-1.367-2.22-.258-4.555-1.139-4.555-5.068 0-1.12.39-2.035 1.029-2.752-.103-.258-.446-1.296.098-2.701 0 0 .84-.275 2.75 1.05A9.35 9.35 0 0 1 12 7.14c.85.004 1.705.117 2.504.343 1.909-1.325 2.747-1.05 2.747-1.05.546 1.405.203 2.443.1 2.701.64.717 1.028 1.632 1.028 2.752 0 3.939-2.338 4.806-4.566 5.06.359.316.679.94.679 1.895 0 1.368-.012 2.471-.012 2.808 0 .269.18.586.688.486A10.28 10.28 0 0 0 22 12.253C22 6.586 17.523 2 12 2Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.554V9h3.565v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M23.498 6.186a2.994 2.994 0 0 0-2.108-2.12C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.39.566A2.994 2.994 0 0 0 .502 6.186C0 8.03 0 12 0 12s0 3.97.502 5.814a2.994 2.994 0 0 0 2.108 2.12C4.44 20.5 12 20.5 12 20.5s7.56 0 9.39-.566a2.994 2.994 0 0 0 2.108-2.12C24 15.97 24 12 24 12s0-3.97-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: SITE.social.github, label: "GitHub", icon: GitHubIcon },
  { href: SITE.social.linkedin, label: "LinkedIn", icon: LinkedInIcon },
  { href: SITE.social.twitter, label: "X (Twitter)", icon: XIcon },
  { href: SITE.social.youtube, label: "YouTube", icon: YouTubeIcon },
] as const;

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const className =
    "text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

  if (external) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold tracking-wide text-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "relative z-10 border-t border-border/60 bg-card/40 backdrop-blur-sm",
        className
      )}
    >
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Mic className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-lg font-bold">{SITE.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {SITE.tagline}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © {SITE.copyrightYear} {SITE.name}. All rights reserved.
            </p>
          </div>

          <FooterColumn title="Product">
            <ul className="space-y-2.5">
              {FOOTER_PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Resources">
            <ul className="space-y-2.5">
              {FOOTER_RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Company">
            <ul className="space-y-2.5">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Contact">
            <ul className="space-y-2.5">
              <li>
                <FooterLink href={`mailto:${SITE.email}`}>
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {SITE.email}
                  </span>
                </FooterLink>
              </li>
              <li>
                <FooterLink href={SITE.portfolioUrl}>Portfolio</FooterLink>
              </li>
              <li>
                <FooterLink href={SITE.social.github}>GitHub</FooterLink>
              </li>
              <li>
                <FooterLink href={SITE.social.linkedin}>LinkedIn</FooterLink>
              </li>
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </motion.a>
              ))}
            </div>
          </FooterColumn>
        </div>

        <div className="mt-12 grid gap-8 border-t border-border/50 pt-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <NewsletterForm />
          <div className="flex flex-col gap-2 text-xs text-muted-foreground lg:items-end lg:text-right">
            <p>
              © {SITE.copyrightYear} {SITE.name}. All rights reserved.
            </p>
            <p>
              Built with ❤️ using Next.js
            </p>
            <p>Version {SITE.version}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
