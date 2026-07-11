"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { jobDescriptionSchema, type JobDescriptionInput } from "@/lib/validations";
import { createJobMatch } from "@/lib/actions";
import { fetchApiArray } from "@/lib/api/client";
import { formatScore } from "@/lib/utils";
import { ScoreBar } from "@/components/resume/score-bar";

interface JobMatch {
  id: string;
  matchScore: number;
  missingSkills: string[];
  matchingSkills?: string[];
  suggestions: string[];
  interviewQuestions: string[];
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    density: number;
    matchingSkills?: string[];
    sectionRecommendations?: { section: string; recommendation: string }[];
  } | null;
  sectionRecommendations?: { section: string; recommendation: string }[];
  atsImprovements: string[];
  jobDescription: { title: string; company: string | null };
  createdAt: string;
}

function getMatchingSkills(match: JobMatch): string[] {
  return (
    match.matchingSkills ??
    match.keywordAnalysis?.matchingSkills ??
    match.keywordAnalysis?.matched ??
    []
  );
}

function getSectionRecs(match: JobMatch) {
  return (
    match.sectionRecommendations ??
    match.keywordAnalysis?.sectionRecommendations ??
    []
  );
}

export default function JobMatchPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: { title: "", company: "", rawText: "" },
  });

  useEffect(() => {
    fetchApiArray<JobMatch>("/api/job-match")
      .then((data) => {
        setMatches(data);
        if (data.length > 0) setSelectedMatch(data[0]);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to load matches";
        setListError(message);
        toast.error(message);
      })
      .finally(() => setLoadingList(false));
  }, []);

  const onSubmit = async (data: JobDescriptionInput) => {
    setLoading(true);
    try {
      const match = (await createJobMatch(data)) as unknown as JobMatch;
      setMatches((prev) => [match, ...prev]);
      setSelectedMatch(match);
      form.reset();
      toast.success("Job match analysis complete");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Analysis failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Job Description Matching"
        description="Paste a JD to compare against your primary resume"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Paste Job Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  {...form.register("title")}
                  placeholder="Senior Software Engineer"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-rose-600">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input {...form.register("company")} placeholder="Google" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea
                {...form.register("rawText")}
                placeholder="Paste the full job description here..."
                className="min-h-[200px]"
              />
              {form.formState.errors.rawText && (
                <p className="text-xs text-rose-600">
                  {form.formState.errors.rawText.message}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Match"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Requires a{" "}
                <Link href="/resume" className="underline underline-offset-2">
                  primary resume
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {loadingList ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : listError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-rose-600">
            {listError}
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No job matches yet. Paste a description above to generate a match
            score and recommendations.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            {matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => setSelectedMatch(match)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                  selectedMatch?.id === match.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:bg-accent/50"
                }`}
              >
                <p className="font-medium">{match.jobDescription.title}</p>
                <p className="text-xs text-muted-foreground">
                  {match.jobDescription.company || "Company N/A"} ·{" "}
                  {formatScore(match.matchScore)}
                </p>
              </button>
            ))}
          </div>

          {selectedMatch && (
            <div className="space-y-6 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Match score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-4">
                    <p className="text-5xl font-bold tabular-nums text-primary">
                      {formatScore(selectedMatch.matchScore)}
                    </p>
                    <p className="pb-2 text-sm text-muted-foreground">
                      Resume ↔ job description fit
                    </p>
                  </div>
                  <ScoreBar
                    label="Keyword density"
                    score={
                      selectedMatch.keywordAnalysis?.density != null
                        ? selectedMatch.keywordAnalysis.density <= 1
                          ? Math.round(
                              selectedMatch.keywordAnalysis.density * 100
                            )
                          : selectedMatch.keywordAnalysis.density
                        : 0
                    }
                  />
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-emerald-600">
                      Matching skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {getMatchingSkills(selectedMatch).length === 0 ? (
                        <p className="text-sm text-muted-foreground">None listed</p>
                      ) : (
                        getMatchingSkills(selectedMatch).map((k) => (
                          <Badge key={k} variant="success">
                            {k}
                          </Badge>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-amber-600">
                      Missing skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.missingSkills.length === 0 ? (
                        <p className="text-sm text-muted-foreground">None listed</p>
                      ) : (
                        selectedMatch.missingSkills.map((k) => (
                          <Badge key={k} variant="warning">
                            {k}
                          </Badge>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Matched keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.keywordAnalysis?.matched?.map((k) => (
                        <Badge key={k} variant="secondary">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Missing keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.keywordAnalysis?.missing?.map((k) => (
                        <Badge key={k} variant="outline">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {getSectionRecs(selectedMatch).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Section-specific recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getSectionRecs(selectedMatch).map((rec) => (
                      <div
                        key={`${rec.section}-${rec.recommendation}`}
                        className="rounded-lg border border-border/50 p-3 text-sm"
                      >
                        <p className="font-medium">{rec.section}</p>
                        <p className="text-muted-foreground">
                          {rec.recommendation}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Suggested resume changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedMatch.suggestions.map((tip, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-border/50 p-3 text-sm"
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ATS improvements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedMatch.atsImprovements.map((tip, i) => (
                      <li key={i} className="text-sm">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Likely interview questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedMatch.interviewQuestions.map((q, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-border/50 p-3 text-sm"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
