"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone } from "@/lib/uploadthing";
import { rewriteResume, saveUploadedResume, analyzeSavedResume } from "@/lib/actions";
import { fetchApi, fetchApiArray } from "@/lib/api/client";
import { analysisFromResumeRecord } from "@/lib/resume/normalize";
import { downloadResumeReport } from "@/lib/resume/download-report";
import { resumeLog } from "@/lib/resume/logger";
import { formatScore } from "@/lib/utils";
import { ScoreBar } from "@/components/resume/score-bar";
import { SectionFeedbackCard } from "@/components/resume/section-feedback";
import { KeywordAnalysisPanel } from "@/components/resume/keyword-panel";
import { ParsedResumePreview } from "@/components/resume/resume-analysis-view";
import type { ResumeAnalysis } from "@/types";

interface ResumeRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  rawText?: string | null;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  atsScore: number | null;
  missingSkills: string[];
  suggestions: string[];
  projects?: unknown;
  education?: unknown;
  experience?: unknown;
  analysis?: ResumeAnalysis | null;
  status?: string;
  processingError?: string | null;
  isPrimary: boolean;
  createdAt: string;
}

type ProcessStep =
  | "idle"
  | "uploading"
  | "saving"
  | "extracting"
  | "analyzing"
  | "generating"
  | "completed"
  | "rewriting";

const UPLOAD_SLOW_HINT_MS = 2 * 60 * 1000;

function stepLabel(step: ProcessStep): string {
  switch (step) {
    case "uploading":
      return "Uploading...";
    case "saving":
      return "Saving file...";
    case "extracting":
      return "Extracting Resume...";
    case "analyzing":
      return "Running ATS Analysis...";
    case "generating":
      return "Generating Suggestions...";
    case "completed":
      return "Completed";
    case "rewriting":
      return "Generating rewrite suggestions...";
    default:
      return "Processing...";
  }
}

function statusToStep(status?: string): ProcessStep | null {
  switch (status) {
    case "extracting":
      return "extracting";
    case "analyzing":
      return "analyzing";
    case "completed":
      return "completed";
    case "failed":
      return "idle";
    default:
      return null;
  }
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<ProcessStep>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadHintRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  const clearTimers = () => {
    if (uploadHintRef.current) {
      clearTimeout(uploadHintRef.current);
      uploadHintRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const failProcessing = (message: string, resumeId?: string) => {
    resumeLog("error", { stage: "ui", message, resumeId });
    processingRef.current = false;
    clearTimers();
    setStep("idle");
    setUploadError(message);
    if (resumeId) {
      setResumes((prev) =>
        prev.map((r) =>
          r.id === resumeId
            ? { ...r, status: "failed", processingError: message }
            : r
        )
      );
    }
    toast.error(message);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    fetchApiArray<ResumeRecord>("/api/resume")
      .then((data) => {
        setResumes(data);
        const primary = data.find((r) => r.isPrimary) ?? data[0];
        if (primary) setSelectedId(primary.id);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load resumes"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === selectedId) ?? null,
    [resumes, selectedId]
  );

  const analysis = useMemo(() => {
    if (!selectedResume) return null;
    const status = selectedResume.status;
    const hasAnalysis =
      selectedResume.atsScore != null ||
      Boolean(selectedResume.analysis) ||
      (selectedResume.skills?.length ?? 0) > 0;
    if (status === "failed") return null;
    if (
      status &&
      status !== "completed" &&
      !hasAnalysis &&
      status !== "uploaded"
    ) {
      return null;
    }
    if (status && status !== "completed" && !hasAnalysis) {
      return null;
    }
    return analysisFromResumeRecord(selectedResume);
  }, [selectedResume]);

  const upsertResume = (resume: ResumeRecord) => {
    setResumes((prev) => {
      const without = prev.filter((r) => r.id !== resume.id);
      return [{ ...resume, isPrimary: true }, ...without.map((r) => ({ ...r, isPrimary: false }))];
    });
    setSelectedId(resume.id);
  };

  const startStatusPolling = (resumeId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void (async () => {
        try {
          const latest = await fetchApi<ResumeRecord>(`/api/resume/${resumeId}`);
          upsertResume(latest);
          const mapped = statusToStep(latest.status);
          if (mapped && mapped !== "completed") {
            setStep(mapped);
          }
          if (latest.status === "failed") {
            failProcessing(
              latest.processingError || "Resume processing failed.",
              resumeId
            );
          }
        } catch (error) {
          resumeLog("error", {
            stage: "poll",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    }, 2000);
  };

  const processResumeAfterUpload = async (resume: ResumeRecord) => {
    processingRef.current = true;
    setStep("extracting");
    startStatusPolling(resume.id);

    try {
      // Step 1 — extract only (fits Vercel Hobby 60s function limit)
      resumeLog("extract-started", {
        resumeId: resume.id,
        via: "extract-api",
      });
      const { text } = await fetchApi<{ text: string }>("/api/resume/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: resume.fileUrl,
          type: resume.fileType || "application/pdf",
          fileName: resume.fileName,
        }),
      });

      if (!text || text.trim().length < 40) {
        throw new Error(
          "Could not extract enough text from this file. Try a text-based PDF or DOCX."
        );
      }

      resumeLog("extract-completed", {
        resumeId: resume.id,
        chars: text.length,
      });

      // Step 2 — ATS analysis only (separate request, no upload coupling)
      setStep("analyzing");
      resumeLog("ai-request-sent", {
        resumeId: resume.id,
        chars: text.length,
      });
      const updated = (await analyzeSavedResume({
        resumeId: resume.id,
        rawText: text,
      })) as unknown as ResumeRecord;

      setStep("generating");
      upsertResume(updated);
      resumeLog("ats-analysis-generated", {
        resumeId: updated.id,
        atsScore: updated.atsScore,
      });

      setStep("completed");
      resumeLog("ui-updated", { resumeId: updated.id, status: "completed" });
      toast.success("Resume analyzed successfully");

      processingRef.current = false;
      clearTimers();
      window.setTimeout(() => {
        if (!processingRef.current) setStep("idle");
      }, 1200);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to process resume. Please try again.";
      failProcessing(message, resume.id);
    }
  };

  const handleUploadComplete = async (
    files: { url: string; name: string; type: string }[]
  ) => {
    const file = files[0];
    if (!file?.url) {
      failProcessing(
        "Upload finished but no file URL was returned. Please try again."
      );
      return;
    }

    resumeLog("file-url-received", {
      name: file.name,
      type: file.type,
    });
    resumeLog("upload-completed", { name: file.name });

    if (uploadHintRef.current) {
      clearTimeout(uploadHintRef.current);
      uploadHintRef.current = null;
    }

    setUploadError(null);
    setStep("saving");

    try {
      // Upload is done — persist metadata only (no AI in this request)
      const saved = (await saveUploadedResume({
        fileName: file.name,
        fileUrl: file.url,
        fileType: file.type || "application/pdf",
      })) as unknown as ResumeRecord;

      resumeLog("database-saved", {
        resumeId: saved.id,
        status: saved.status ?? "uploaded",
      });
      upsertResume(saved);
      toast.success("Resume uploaded successfully");

      // Separate processing pipeline (extract → ATS → suggestions)
      await processResumeAfterUpload(saved);
    } catch (error) {
      failProcessing(
        error instanceof Error
          ? error.message
          : "Failed to save uploaded resume."
      );
    }
  };

  const handleRewrite = async () => {
    if (!selectedResume) return;
    processingRef.current = true;
    setStep("rewriting");
    try {
      const updated = (await rewriteResume(
        selectedResume.id
      )) as unknown as ResumeRecord;
      upsertResume(updated);
      toast.success("AI rewrite suggestions ready");
      processingRef.current = false;
      setStep("idle");
    } catch (error) {
      failProcessing(
        error instanceof Error ? error.message : "Rewrite failed"
      );
    }
  };

  const handleDownload = async () => {
    if (!selectedResume || !analysis) return;
    let jobMatch: {
      title: string;
      company?: string | null;
      matchScore: number;
      missingSkills: string[];
      matchingSkills?: string[];
      suggestions: string[];
      atsImprovements: string[];
    } | null = null;

    try {
      const matches = await fetchApiArray<{
        matchScore: number;
        missingSkills: string[];
        matchingSkills?: string[];
        suggestions: string[];
        atsImprovements: string[];
        keywordAnalysis?: { matchingSkills?: string[] } | null;
        jobDescription: { title: string; company: string | null };
      }>("/api/job-match");
      const latest = matches[0];
      if (latest) {
        jobMatch = {
          title: latest.jobDescription.title,
          company: latest.jobDescription.company,
          matchScore: latest.matchScore,
          missingSkills: latest.missingSkills,
          matchingSkills:
            latest.matchingSkills ??
            latest.keywordAnalysis?.matchingSkills ??
            [],
          suggestions: latest.suggestions,
          atsImprovements: latest.atsImprovements,
        };
      }
    } catch {
      // Report still downloads without job match section
    }

    downloadResumeReport({
      fileName: selectedResume.fileName,
      analysis,
      jobMatch,
    });
    toast.success("Report downloaded");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const busy = step !== "idle" && step !== "completed";
  const scores = analysis?.scores;
  // Never cover/disable the dropzone during UploadThing transfer — that aborted uploads.
  // Overlay only after the file URL is saved and server-side processing begins.
  const showUploadOverlay =
    busy &&
    step !== "rewriting" &&
    step !== "uploading";
  const isAnalysisReady =
    Boolean(analysis) &&
    selectedResume?.status !== "failed" &&
    selectedResume?.status !== "extracting" &&
    selectedResume?.status !== "analyzing" &&
    (selectedResume?.status === "completed" ||
      selectedResume?.atsScore != null ||
      Boolean(selectedResume?.analysis));
  const pipelineSteps: ProcessStep[] = [
    "uploading",
    "saving",
    "extracting",
    "analyzing",
    "generating",
    "completed",
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume"
        description="Upload finishes first — ATS analysis runs as a separate step"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[220px]">
            {step === "uploading" && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Uploading... Please keep this tab open.
              </div>
            )}
            <div
              className={
                showUploadOverlay ? "pointer-events-none opacity-40" : undefined
              }
              aria-hidden={showUploadOverlay}
            >
              <UploadDropzone
                endpoint="resumeUploader"
                onUploadBegin={(fileName) => {
                  resumeLog("file-selected", { fileName });
                  resumeLog("upload-started", { fileName });
                  setUploadError(null);
                  processingRef.current = true;
                  setStep("uploading");
                  // Soft hint only — never cancel the UploadThing request
                  if (uploadHintRef.current) clearTimeout(uploadHintRef.current);
                  uploadHintRef.current = setTimeout(() => {
                    if (processingRef.current) {
                      setUploadError(
                        "Upload is taking longer than usual. Please keep this tab open — large files can take a couple of minutes."
                      );
                    }
                  }, UPLOAD_SLOW_HINT_MS);
                }}
                onClientUploadComplete={(res) => {
                  const mapped = (res ?? []).map((f) => {
                    const server = f.serverData as
                      | { url?: string; name?: string; type?: string }
                      | undefined;
                    return {
                      url: server?.url || f.ufsUrl || f.url,
                      name: server?.name || f.name,
                      type: server?.type || f.type || "application/pdf",
                    };
                  });

                  if (mapped.length === 0 || !mapped[0]?.url) {
                    failProcessing(
                      "Upload completed but the file URL was missing. Please try again."
                    );
                    return;
                  }

                  void handleUploadComplete(mapped);
                }}
                onUploadError={(error) => {
                  failProcessing(
                    error.message ||
                      "Upload failed. Use a PDF or DOCX under 8MB."
                  );
                }}
              />
            </div>

            {showUploadOverlay && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/85 px-4 backdrop-blur-[1px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm font-medium">{stepLabel(step)}</p>
                <ol className="mt-4 w-full max-w-sm space-y-1.5 text-xs text-muted-foreground">
                  {pipelineSteps.map((s) => {
                    const currentIdx = Math.max(0, pipelineSteps.indexOf(step));
                    const idx = pipelineSteps.indexOf(s);
                    const done = idx < currentIdx;
                    const active = s === step;
                    return (
                      <li
                        key={s}
                        className={
                          active
                            ? "font-medium text-foreground"
                            : done
                              ? "text-emerald-600 dark:text-emerald-400"
                              : undefined
                        }
                      >
                        {done ? "✓ " : active ? "→ " : "○ "}
                        {stepLabel(s)}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Supports PDF and DOCX up to 8MB. Upload saves immediately; ATS
            analysis runs afterward so large files do not time out the upload.
          </p>
          {uploadError && (
            <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {uploadError}
            </p>
          )}
        </CardContent>
      </Card>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No resumes yet. Upload one to generate your ATS report.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            {resumes.map((resume) => (
              <button
                key={resume.id}
                type="button"
                onClick={() => setSelectedId(resume.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                  selectedId === resume.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:bg-accent/50"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{resume.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {resume.status === "failed"
                      ? "Failed"
                      : resume.status === "completed" ||
                          resume.atsScore != null
                        ? formatScore(resume.atsScore)
                        : resume.status
                          ? `Status: ${resume.status}`
                          : formatScore(resume.atsScore)}
                    {resume.isPrimary ? " · Primary" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {selectedResume && (
            <div className="space-y-6 lg:col-span-3">
              {selectedResume.status &&
                selectedResume.status !== "completed" &&
                selectedResume.status !== "failed" && (
                  <Card>
                    <CardContent className="flex items-center gap-3 py-6 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      Processing this resume ({selectedResume.status})...
                    </CardContent>
                  </Card>
                )}

              {selectedResume.status === "failed" && (
                <Card>
                  <CardContent className="py-6 text-sm text-rose-600 dark:text-rose-400">
                    {selectedResume.processingError ||
                      "Processing failed for this resume. Please upload again."}
                  </CardContent>
                </Card>
              )}

              {isAnalysisReady && analysis && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleDownload()}
                      disabled={busy}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download report
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleRewrite()}
                      disabled={busy}
                    >
                      {step === "rewriting" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      AI rewrite
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>ATS score overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-end gap-4">
                        <p className="text-5xl font-bold tabular-nums text-primary">
                          {formatScore(analysis.atsScore)}
                        </p>
                        <p className="pb-2 text-sm text-muted-foreground">
                          Overall ATS compatibility
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ScoreBar
                          label="Resume strength"
                          score={scores?.strength ?? analysis.atsScore}
                        />
                        <ScoreBar
                          label="Formatting"
                          score={scores?.formatting ?? 0}
                        />
                        <ScoreBar
                          label="Keyword match"
                          score={scores?.keywordMatch ?? 0}
                        />
                        <ScoreBar label="Skills" score={scores?.skills ?? 0} />
                        <ScoreBar
                          label="Experience"
                          score={scores?.experience ?? 0}
                        />
                        <ScoreBar
                          label="Education"
                          score={scores?.education ?? 0}
                        />
                        <ScoreBar
                          label="Projects"
                          score={scores?.projects ?? 0}
                        />
                        <ScoreBar
                          label="Readability"
                          score={scores?.readability ?? 0}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="preview">
                    <TabsList className="flex h-auto w-full flex-wrap justify-start">
                      <TabsTrigger value="preview">Parsed preview</TabsTrigger>
                      <TabsTrigger value="sections">Section feedback</TabsTrigger>
                      <TabsTrigger value="keywords">Keywords</TabsTrigger>
                      <TabsTrigger value="improve">Improvements</TabsTrigger>
                      <TabsTrigger value="rewrite">Rewrites</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="mt-4">
                      <ParsedResumePreview analysis={analysis} />
                    </TabsContent>

                    <TabsContent value="sections" className="mt-4 space-y-4">
                      <SectionFeedbackCard
                        title="Summary"
                        feedback={analysis.sectionFeedback?.summary}
                      />
                      <SectionFeedbackCard
                        title="Skills"
                        feedback={analysis.sectionFeedback?.skills}
                      />
                      <SectionFeedbackCard
                        title="Experience"
                        feedback={analysis.sectionFeedback?.experience}
                      />
                      <SectionFeedbackCard
                        title="Projects"
                        feedback={analysis.sectionFeedback?.projects}
                      />
                      <SectionFeedbackCard
                        title="Education"
                        feedback={analysis.sectionFeedback?.education}
                      />
                      <SectionFeedbackCard
                        title="Certifications"
                        feedback={analysis.sectionFeedback?.certifications}
                      />
                    </TabsContent>

                    <TabsContent value="keywords" className="mt-4 space-y-4">
                      <KeywordAnalysisPanel analysis={analysis} />
                      {analysis.missingSkills.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Missing skills for target roles</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {analysis.missingSkills.map((skill) => (
                                <Badge key={skill} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="improve" className="mt-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-emerald-600">
                              Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-2">
                            {analysis.strengths.map((s) => (
                              <Badge key={s} variant="success">
                                {s}
                              </Badge>
                            ))}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-amber-600">
                              Weaknesses
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-2">
                            {analysis.weaknesses.map((w) => (
                              <Badge key={w} variant="warning">
                                {w}
                              </Badge>
                            ))}
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Improvement suggestions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(analysis.improvementSuggestions?.length
                            ? analysis.improvementSuggestions
                            : analysis.suggestions.map((s) => ({
                                title: s,
                                detail: s,
                                whyItHelpsAts:
                                  "Improves ATS parseability and recruiter clarity.",
                                priority: "medium" as const,
                              }))
                          ).map((item, i) => (
                            <div
                              key={`${item.title}-${i}`}
                              className="rounded-lg border border-border/50 p-3"
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {item.title}
                                </p>
                                <Badge variant="outline">{item.priority}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.detail}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                Why it helps ATS: {item.whyItHelpsAts}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Personalized action plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ol className="list-decimal space-y-2 pl-5 text-sm">
                            {(analysis.actionPlan ?? analysis.suggestions).map(
                              (stepItem) => (
                                <li key={stepItem}>{stepItem}</li>
                              )
                            )}
                          </ol>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="rewrite" className="mt-4 space-y-4">
                      {!analysis.rewrites ? (
                        <Card>
                          <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Click{" "}
                            <span className="font-medium">AI rewrite</span> to
                            generate truthful summary, bullets, projects, and
                            skills rewrites.
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <Card>
                            <CardHeader>
                              <CardTitle>
                                Improved professional summary
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm leading-relaxed">
                              {analysis.rewrites.professionalSummary}
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle>Improved experience bullets</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-sm">
                                {analysis.rewrites.experienceBullets.map(
                                  (b) => (
                                    <li
                                      key={b}
                                      className="rounded-lg border border-border/50 p-3"
                                    >
                                      {b}
                                    </li>
                                  )
                                )}
                              </ul>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle>
                                Improved project descriptions
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-sm">
                                {analysis.rewrites.projectDescriptions.map(
                                  (b) => (
                                    <li
                                      key={b}
                                      className="rounded-lg border border-border/50 p-3"
                                    >
                                      {b}
                                    </li>
                                  )
                                )}
                              </ul>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle>Improved skills section</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              {analysis.rewrites.skillsSection.map((line) => (
                                <p key={line}>{line}</p>
                              ))}
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
