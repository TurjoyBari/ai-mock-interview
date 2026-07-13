/**
 * Central site/branding config — update contact & social URLs here.
 */
export const SITE = {
  name: "AI Mock Interview",
  shortName: "InterviewAI",
  tagline:
    "Prepare for real-world interviews with AI-powered practice, resume analysis, coding challenges, and personalized feedback.",
  version: "0.1.0",
  copyrightYear: 2026,
  email: "hello@interviewai.app",
  portfolioUrl: "https://example.com/portfolio",
  social: {
    github: "https://github.com/interviewai",
    linkedin: "https://www.linkedin.com/company/interviewai",
    twitter: "https://x.com/interviewai",
    youtube: "https://www.youtube.com/@interviewai",
  },
} as const;

export const FOOTER_PRODUCT_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/features/ai-interviews", label: "AI Interviews" },
  { href: "/features/voice-mode", label: "Voice Interviews" },
  { href: "/features/coding-interview", label: "Coding Practice" },
  { href: "/features/resume-analyzer", label: "Resume Analyzer" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export const FOOTER_RESOURCE_LINKS = [
  { href: "/docs", label: "Documentation" },
  { href: "/faqs", label: "FAQs" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/support", label: "Support" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookies Policy" },
] as const;

/** App routes that use the dashboard shell (no marketing footer). */
export const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/interviews",
  "/interview-session",
  "/resume",
  "/job-match",
  "/reports",
  "/coach",
  "/notes",
  "/search",
  "/profile",
  "/settings",
] as const;

export function isAppShellPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
