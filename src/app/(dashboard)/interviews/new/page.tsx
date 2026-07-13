"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INTERVIEW_TYPES,
  DIFFICULTY_LEVELS,
  COMPANIES,
  EXPERIENCE_LEVELS,
} from "@/lib/constants";
import {
  QUICK_TECH_STACK,
  estimateInterviewDurationMinutes,
  filterTopicsForInterviewType,
  sumTopicQuestionCounts,
} from "@/lib/interview-topics";
import { interviewConfigSchema, type InterviewConfigInput } from "@/lib/validations";
import { createInterview } from "@/lib/actions";
import { interviewSessionPath } from "@/lib/routes";
import { TopicSelectionPanel } from "@/components/interview/topic-selection-panel";
import {
  QuotaExceededAlert,
  extractRetrySeconds,
  getDisplayErrorMessage,
  isRateLimitError,
} from "@/components/ai/quota-exceeded-alert";
import { Loader2, Mic, Type } from "lucide-react";
import type { InterviewType, TopicSelection } from "@/types";

/** Map specialized interview types to a matching tech chip (metadata for AI context). */
const TYPE_TO_TECH: Record<string, string> = {
  javascript: "JavaScript",
  react: "React",
  nextjs: "Next.js",
  nodejs: "Node.js",
  typescript: "TypeScript",
  python: "Python",
  database: "SQL",
};

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [quotaError, setQuotaError] = useState<{
    message: string;
    retryAfterSeconds: number;
  } | null>(null);
  const [pendingFormData, setPendingFormData] =
    useState<InterviewConfigInput | null>(null);

  const form = useForm<InterviewConfigInput>({
    resolver: zodResolver(interviewConfigSchema),
    defaultValues: {
      type: "javascript",
      difficulty: "medium",
      duration: 18,
      questionCount: 5,
      language: "en",
      mode: "text",
      techStack: ["JavaScript"],
      cameraEnabled: false,
      hintsEnabled: false,
      topics: [
        { name: "Closures", difficulty: "medium", questionCount: 2, isWeak: false },
        { name: "Event Loop", difficulty: "medium", questionCount: 2, isWeak: false },
        { name: "Promises", difficulty: "medium", questionCount: 1, isWeak: false },
      ],
      questionDistribution: "custom",
    },
  });

  const { register, handleSubmit, setValue, watch } = form;
  const mode = watch("mode");
  const company = watch("company");
  const techStack = watch("techStack");
  const interviewType = watch("type");
  const topics = (watch("topics") ?? []) as TopicSelection[];

  const syncTotalsFromTopics = (nextTopics: TopicSelection[]) => {
    const total = sumTopicQuestionCounts(nextTopics);
    const duration = estimateInterviewDurationMinutes(total);
    setValue("topics", nextTopics, { shouldDirty: true, shouldValidate: true });
    setValue("questionCount", total, { shouldDirty: true, shouldValidate: true });
    setValue("duration", duration, { shouldDirty: true, shouldValidate: true });
  };

  const addTech = (raw?: string) => {
    const value = (raw ?? techInput).trim();
    if (!value) return;
    if (!techStack.includes(value)) {
      setValue("techStack", [...techStack, value], { shouldDirty: true });
    }
    setTechInput("");
  };

  const removeTech = (tech: string) => {
    setValue(
      "techStack",
      techStack.filter((t) => t !== tech),
      { shouldDirty: true }
    );
  };

  const toggleQuickTech = (tech: string) => {
    if (techStack.includes(tech)) removeTech(tech);
    else addTech(tech);
  };

  const selectInterviewType = (type: string) => {
    setValue("type", type, { shouldDirty: true });

    // Topics come only from the selected interview type library
    const nextTopics = filterTopicsForInterviewType(
      type as InterviewType,
      topics,
      techStack
    );
    syncTotalsFromTopics(nextTopics);

    const mapped = TYPE_TO_TECH[type];
    if (mapped && !techStack.includes(mapped)) {
      setValue("techStack", [...techStack, mapped], { shouldDirty: true });
    }
  };

  const createInterviewFromData = async (data: InterviewConfigInput) => {
    setLoading(true);
    setQuotaError(null);
    try {
      const result = await createInterview(data);
      const sessionUrl = interviewSessionPath(result.id);
      if (result.usedFallbackQuestions) {
        toast.info(
          "Interview created with curated questions while AI quota recovers."
        );
      } else {
        toast.success("Interview created!");
      }
      router.push(sessionUrl);
    } catch (error) {
      if (isRateLimitError(error)) {
        setPendingFormData(data);
        setQuotaError({
          message: getDisplayErrorMessage(error),
          retryAfterSeconds: extractRetrySeconds(error),
        });
      } else {
        toast.error(getDisplayErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: InterviewConfigInput) => {
    await createInterviewFromData(data);
  };

  const retryCreateInterview = async () => {
    if (!pendingFormData) return;
    await createInterviewFromData(pendingFormData);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="New Interview"
        description="Configure type, stack, topics, and start a personalized mock interview"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {quotaError && (
          <QuotaExceededAlert
            message={quotaError.message}
            retryAfterSeconds={quotaError.retryAfterSeconds}
            onRetry={retryCreateInterview}
            onDismiss={() => setQuotaError(null)}
            isRetrying={loading}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Interview Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => selectInterviewType(type.value)}
                  className={`rounded-xl border p-4 text-left text-sm transition-all ${
                    interviewType === type.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={watch("difficulty")}
                onValueChange={(v) =>
                  setValue("difficulty", v as InterviewConfigInput["difficulty"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={company ?? ""}
                onValueChange={(v) => setValue("company", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {company === "Custom" && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Custom Company Name</Label>
                <Input {...register("customCompany")} placeholder="Company name" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Job Role</Label>
              <Input {...register("jobRole")} placeholder="Software Engineer" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Experience Level</Label>
              <Select
                value={watch("experienceLevel") ?? ""}
                onValueChange={(v) => setValue("experienceLevel", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <Label>Technology Stack</Label>
              <p className="text-sm text-muted-foreground">
                Selecting a technology loads matching interview topics below.
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TECH_STACK.map((tech) => {
                  const active = techStack.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleQuickTech(tech)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="Add custom technology"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTech())
                  }
                />
                <Button type="button" variant="outline" onClick={() => addTech()}>
                  Add
                </Button>
              </div>
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTech(tech)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <TopicSelectionPanel
              key={interviewType}
              interviewType={interviewType}
              techStack={techStack}
              topics={topics}
              onTopicsChange={syncTotalsFromTopics}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mode & Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setValue("mode", "text")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                  mode === "text"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50"
                }`}
              >
                <Type className="h-5 w-5" />
                Text Mode
              </button>
              <button
                type="button"
                onClick={() => setValue("mode", "voice")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                  mode === "voice"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50"
                }`}
              >
                <Mic className="h-5 w-5" />
                Voice Mode
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Hints</Label>
                <p className="text-sm text-muted-foreground">
                  Allow AI to provide hints during interview
                </p>
              </div>
              <Switch
                checked={watch("hintsEnabled")}
                onCheckedChange={(v) => setValue("hintsEnabled", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Camera On</Label>
                <p className="text-sm text-muted-foreground">
                  Enable camera for practice (local only)
                </p>
              </div>
              <Switch
                checked={watch("cameraEnabled")}
                onCheckedChange={(v) => setValue("cameraEnabled", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || topics.length === 0 || sumTopicQuestionCounts(topics) < 1}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Interview...
            </>
          ) : (
            "Start Interview"
          )}
        </Button>
      </form>
    </div>
  );
}
