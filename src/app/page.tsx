import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { FeaturesShowcase } from "@/components/features/features-showcase";
import { FEATURES } from "@/data/features";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "OpenAI",
  "Stripe",
  "Netflix",
  "Apple",
];

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <div id="home" className="min-h-screen scroll-smooth bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <SiteNavbar />

      <main className="relative">
        <section className="container mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Powered by Gemini 2.5 Flash
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Master Your Next{" "}
              <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                Interview
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Your personal AI interview coach. Practice technical, behavioral,
              and coding interviews with real-time feedback. Prepare for top
              companies 24/7.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isSignedIn ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/sign-up">
                      Start Practicing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <FeaturesShowcase features={FEATURES} />

        <section
          id="about"
          className="container mx-auto max-w-6xl scroll-mt-24 px-4 py-16"
        >
          <div className="mx-auto max-w-3xl rounded-3xl border border-border/50 bg-card/40 p-8 text-center backdrop-blur-sm sm:p-12">
            <h2 className="text-3xl font-bold tracking-tight">About</h2>
            <p className="mt-4 text-muted-foreground">
              InterviewAI is a complete interview preparation platform — not just
              a question generator. Practice technical, behavioral, HR, and coding
              interviews with adaptive AI, voice conversations, ATS resume
              analysis, and detailed performance reports.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {companies.map((company) => (
                <span
                  key={company}
                  className="rounded-full border border-border/50 bg-card/40 px-4 py-1.5 text-sm"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="container mx-auto max-w-6xl scroll-mt-24 px-4 py-16"
        >
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Pricing</h2>
            <p className="mt-2 text-muted-foreground">
              Start free and upgrade when you are ready
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
              <p className="text-sm font-medium text-muted-foreground">Free</p>
              <p className="mt-2 text-4xl font-bold">$0</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {[
                  "Core mock interviews",
                  "Resume ATS score",
                  "Basic reports",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" variant="outline" asChild>
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  {isSignedIn ? "Open Dashboard" : "Get Started"}
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-8 backdrop-blur-sm">
              <p className="text-sm font-medium text-primary">Pro</p>
              <p className="mt-2 text-4xl font-bold">
                $19
                <span className="text-base font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {[
                  "Unlimited AI interviews",
                  "Voice mode + coaching",
                  "Job description matching",
                  "Priority feedback",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" asChild>
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  {isSignedIn ? "Continue Practicing" : "Start Pro Trial"}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="container mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 pt-8"
        >
          <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-card/60 to-cyan-500/10 p-10 text-center backdrop-blur-sm">
            <Mail className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h2 className="mb-3 text-3xl font-bold tracking-tight">Contact</h2>
            <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
              Questions, feedback, or partnership ideas? Reach out and we will
              get back to you.
            </p>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:hello@interviewai.app">hello@interviewai.app</a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
