import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Mic,
  Sparkles,
  Star,
  Target,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnswerCoaching, InterviewConfig } from "@/types";
import {
  ensureValidIdealAnswer,
  ensureValidPracticeVersion,
} from "@/lib/ai/ideal-answers";

interface PostInterviewCoachingCardProps {
  coaching: AnswerCoaching;
  questionNumber: number;
  interviewConfig?: InterviewConfig;
}

export function PostInterviewCoachingCard({
  coaching: raw,
  questionNumber,
  interviewConfig,
}: PostInterviewCoachingCardProps) {
  const coaching = normalizeCoaching(raw, interviewConfig);
  const isStrong = coaching.scoreOutOf10 >= 7;
  const difficultyVariant =
    coaching.difficultyLevel === "easy"
      ? "secondary"
      : coaching.difficultyLevel === "hard"
        ? "destructive"
        : "outline";

  const hasMistakes =
    coaching.whatYouMissed.incorrectStatements.length > 0 ||
    coaching.whatYouMissed.missingConcepts.length > 0 ||
    coaching.whatYouMissed.missingKeywords.length > 0 ||
    coaching.whatYouMissed.weakExplanations.length > 0 ||
    coaching.whatYouMissed.missingTechnicalDetails.length > 0 ||
    coaching.whatYouMissed.communicationProblems.length > 0;

  return (
    <Card
      className={
        isStrong
          ? "border-emerald-500/20 bg-emerald-500/[0.02]"
          : "border-amber-500/20 bg-amber-500/[0.02]"
      }
    >
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isStrong ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <Target className="h-5 w-5 shrink-0 text-amber-500" />
            )}
            Question {questionNumber}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isStrong ? "default" : "secondary"} className="text-base px-3">
              {coaching.scoreOutOf10}/10
            </Badge>
            <Badge variant={difficultyVariant}>{coaching.difficultyLevel}</Badge>
            {coaching.topicTag && (
              <Badge variant="outline">{coaching.topicTag}</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-sm">
        <Section icon={<MessageSquare className="h-4 w-4" />} title="Question">
          <p className="font-medium leading-relaxed">{coaching.question}</p>
        </Section>

        <Section icon={<Mic className="h-4 w-4" />} title="My Answer">
          <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 leading-relaxed text-muted-foreground">
            {coaching.answer || "No answer recorded"}
          </p>
        </Section>

        <Section icon={<Star className="h-4 w-4" />} title="Evaluation">
          <div className="mb-3">
            <span className="text-2xl font-bold text-primary">
              {coaching.scoreOutOf10}/10
            </span>
            <span className="ml-2 text-muted-foreground">Overall Score</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <EvalMetric label="Technical Accuracy" value={coaching.technicalAccuracy} />
            <EvalMetric label="Communication" value={coaching.communication} />
            <EvalMetric label="Confidence" value={coaching.confidence} />
            <EvalMetric label="Clarity" value={coaching.clarity} />
            <EvalMetric label="Completeness" value={coaching.completeness} />
          </div>
        </Section>

        {coaching.whatYouDidWell.length > 0 && (
          <Section
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            title="Strengths"
            className="border-emerald-500/20 bg-emerald-500/5"
          >
            <ul className="space-y-2 text-muted-foreground">
              {coaching.whatYouDidWell.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {hasMistakes && (
          <Section
            icon={<XCircle className="h-4 w-4 text-amber-500" />}
            title="Mistakes"
            className="border-amber-500/20 bg-amber-500/5"
          >
            <div className="space-y-4">
              <MissedList
                label="Incorrect Statements"
                items={coaching.whatYouMissed.incorrectStatements}
              />
              <MissedList label="Missing Concepts" items={coaching.whatYouMissed.missingConcepts} />
              <MissedList label="Missing Keywords" items={coaching.whatYouMissed.missingKeywords} />
              <MissedList
                label="Weak Explanations"
                items={coaching.whatYouMissed.weakExplanations}
              />
              <MissedList
                label="Missing Technical Details"
                items={coaching.whatYouMissed.missingTechnicalDetails}
              />
              <MissedList
                label="Communication Problems"
                items={coaching.whatYouMissed.communicationProblems}
              />
              {coaching.whatYouMissed.whyItMatters && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 font-medium">Why This Matters</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {coaching.whatYouMissed.whyItMatters}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        <Section
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          title="Ideal Interview Answer"
          className="border-primary/30 bg-primary/5 ring-1 ring-primary/10"
          highlight
        >
          <p className="whitespace-pre-wrap leading-relaxed">
            {coaching.idealInterviewAnswer}
          </p>
        </Section>

        {coaching.whyStrongAnswer && (
          <Section
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
            title="Why This Is a Strong Answer"
            className="border-primary/20 bg-primary/5"
          >
            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {coaching.whyStrongAnswer}
            </p>
          </Section>
        )}

        <Section
          icon={<ArrowLeftRight className="h-4 w-4" />}
          title="Comparison"
          className="border-border"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="mb-2 font-medium text-amber-600">My Answer</p>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {coaching.answer || "No answer recorded"}
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 font-medium text-primary">Ideal Interview Answer</p>
              <p className="whitespace-pre-wrap leading-relaxed">
                {coaching.idealInterviewAnswer}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ComparisonList label="What I Missed" items={coaching.comparison.whatMissed} />
            <ComparisonList label="What I Should Improve" items={coaching.comparison.whatToImprove} />
            <ComparisonList label="Points to Add" items={coaching.comparison.pointsToAdd} />
            <ComparisonList
              label="Remove or Simplify"
              items={coaching.comparison.partsToRemoveOrSimplify}
            />
          </div>
        </Section>

        {coaching.practiceVersion && (
          <Section
            icon={<Mic className="h-4 w-4 text-primary" />}
            title="Practice Version"
            subtitle="30–90 second spoken version"
            className="border-primary/10 bg-muted/30"
          >
            <p className="whitespace-pre-wrap italic leading-relaxed text-muted-foreground">
              &ldquo;{coaching.practiceVersion}&rdquo;
            </p>
          </Section>
        )}

        {coaching.interviewTips.length > 0 && (
          <Section
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
            title="Interview Tips"
            className="border-primary/20 bg-primary/5"
          >
            <ul className="space-y-2 text-muted-foreground">
              {coaching.interviewTips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {coaching.recommendedPractice.length > 0 && (
          <Section
            icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
            title="Recommended Practice"
            className="border-border/50"
          >
            <ul className="space-y-2 text-muted-foreground">
              {coaching.recommendedPractice.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
            {coaching.difficultyExplanation && (
              <p className="mt-3 text-xs text-muted-foreground">
                Difficulty: {coaching.difficultyLevel} — {coaching.difficultyExplanation}
              </p>
            )}
          </Section>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeCoaching(
  coaching: AnswerCoaching,
  config?: InterviewConfig
): AnswerCoaching {
  const fallbackConfig: InterviewConfig = config ?? {
    type: "technical",
    difficulty: "medium",
    techStack: [],
    duration: 30,
    questionCount: 5,
    language: "en",
    mode: "text",
    cameraEnabled: false,
    hintsEnabled: false,
    jobRole: undefined,
    experienceLevel: undefined,
  };

  const idealInterviewAnswer = ensureValidIdealAnswer(
    coaching.idealInterviewAnswer,
    coaching.question,
    fallbackConfig
  );
  const practiceVersion = ensureValidPracticeVersion(
    coaching.practiceVersion ?? coaching.betterSpeakingVersion ?? "",
    idealInterviewAnswer,
    coaching.question,
    fallbackConfig
  );

  return {
    ...coaching,
    idealInterviewAnswer,
    practiceVersion,
    whyStrongAnswer: coaching.whyStrongAnswer ?? "",
    comparison: coaching.comparison ?? {
      whatMissed: [],
      whatToImprove: [],
      pointsToAdd: [],
      partsToRemoveOrSimplify: [],
    },
    whatYouMissed: {
      incorrectStatements: coaching.whatYouMissed?.incorrectStatements ?? [],
      missingConcepts: coaching.whatYouMissed?.missingConcepts ?? [],
      missingKeywords: coaching.whatYouMissed?.missingKeywords ?? [],
      weakExplanations: coaching.whatYouMissed?.weakExplanations ?? [],
      missingTechnicalDetails: coaching.whatYouMissed?.missingTechnicalDetails ?? [],
      communicationProblems: coaching.whatYouMissed?.communicationProblems ?? [],
      whyItMatters: coaching.whatYouMissed?.whyItMatters ?? "",
    },
  };
}

function Section({
  icon,
  title,
  subtitle,
  children,
  className = "",
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border/50 p-4 ${className}`}>
      <p className="mb-3 flex items-center gap-2 font-semibold">
        {icon}
        {title}
        {highlight && <span className="text-primary">⭐</span>}
      </p>
      {subtitle && (
        <p className="-mt-2 mb-3 text-xs text-muted-foreground">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

function EvalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 leading-snug">{value}</p>
    </div>
  );
}

function MissedList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 font-medium">{label}</p>
      <ul className="space-y-1 text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <p className="mb-2 font-medium">{label}</p>
      <ul className="space-y-1 text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
