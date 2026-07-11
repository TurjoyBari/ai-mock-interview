import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Mic,
  Brain,
  Code,
  BarChart3,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Interviews",
    description:
      "Practice with Google Gemini that adapts to your answers, asks follow-ups, and simulates real interviewers.",
  },
  {
    icon: Mic,
    title: "Voice & Text Modes",
    description:
      "Real-time speech-to-text, natural AI voice responses, and voice activity detection.",
  },
  {
    icon: Code,
    title: "Coding Interviews",
    description:
      "Integrated Monaco editor with syntax highlighting, test cases, and AI code evaluation.",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description:
      "Track scores, identify weak topics, and visualize your improvement over time.",
  },
  {
    icon: FileText,
    title: "Resume & JD Matching",
    description:
      "Upload your resume, match against job descriptions, and get tailored interview questions.",
  },
  {
    icon: Sparkles,
    title: "Personal AI Coach",
    description:
      "Get weekly study plans, company-specific roadmaps, and personalized improvement suggestions.",
  },
];

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
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="relative border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Mic className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">InterviewAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="container mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Powered by Gemini 2.5 Flash
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Master Your Next{" "}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                Interview
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Your personal AI interview coach. Practice technical, behavioral,
              and coding interviews with real-time feedback. Prepare for top
              companies 24/7.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Practicing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {companies.map((company) => (
              <span
                key={company}
                className="rounded-lg border border-border/30 bg-card/30 px-4 py-2 backdrop-blur-sm"
              >
                {company}
              </span>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="mt-2 text-muted-foreground">
              A complete interview preparation platform built for serious
              candidates
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-24">
          <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-card/50 to-violet-500/10 p-12 text-center backdrop-blur-sm">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to Ace Your Interview?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of engineers who improved their interview skills
              with AI-powered practice.
            </p>
            <ul className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-left">
              {[
                "18+ interview types",
                "Company-specific questions",
                "Real-time AI feedback",
                "Progress tracking & analytics",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border/50 py-8">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>InterviewAI — Personal AI Mock Interview Platform</p>
        </div>
      </footer>
    </div>
  );
}
