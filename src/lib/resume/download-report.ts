import type { ResumeAnalysis } from "@/types";

export function downloadResumeReport(params: {
  fileName: string;
  analysis: Pick<
    ResumeAnalysis,
    | "fullName"
    | "professionalTitle"
    | "atsScore"
    | "scores"
    | "strengths"
    | "weaknesses"
    | "keywordAnalysis"
    | "improvementSuggestions"
    | "suggestions"
    | "actionPlan"
    | "missingSkills"
  >;
  jobMatch?: {
    title: string;
    company?: string | null;
    matchScore: number;
    missingSkills: string[];
    matchingSkills?: string[];
    suggestions: string[];
    atsImprovements: string[];
  } | null;
}) {
  const { fileName, analysis, jobMatch } = params;
  const lines: string[] = [];

  lines.push("ATS RESUME ANALYSIS REPORT");
  lines.push("=".repeat(40));
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Resume: ${fileName}`);
  if (analysis.fullName) lines.push(`Candidate: ${analysis.fullName}`);
  if (analysis.professionalTitle) lines.push(`Title: ${analysis.professionalTitle}`);
  lines.push("");

  lines.push("ATS SCORES");
  lines.push("-".repeat(40));
  lines.push(`Overall ATS Score: ${Math.round(analysis.atsScore)}/100`);
  if (analysis.scores) {
    for (const [key, value] of Object.entries(analysis.scores)) {
      lines.push(`  ${key}: ${Math.round(value)}`);
    }
  }
  lines.push("");

  lines.push("STRENGTHS");
  analysis.strengths.forEach((s) => lines.push(`- ${s}`));
  lines.push("");

  lines.push("WEAKNESSES");
  analysis.weaknesses.forEach((s) => lines.push(`- ${s}`));
  lines.push("");

  if (analysis.keywordAnalysis) {
    lines.push("KEYWORD ANALYSIS");
    lines.push(`Strong: ${analysis.keywordAnalysis.strong.join(", ") || "—"}`);
    lines.push(`Weak: ${analysis.keywordAnalysis.weak.join(", ") || "—"}`);
    lines.push(`Missing: ${analysis.keywordAnalysis.missing.join(", ") || "—"}`);
    lines.push(
      `Suggested: ${analysis.keywordAnalysis.suggested.join(", ") || "—"}`
    );
    lines.push("");
  }

  lines.push("MISSING SKILLS");
  analysis.missingSkills.forEach((s) => lines.push(`- ${s}`));
  lines.push("");

  lines.push("IMPROVEMENT SUGGESTIONS");
  const improvements =
    analysis.improvementSuggestions?.length
      ? analysis.improvementSuggestions.map(
          (i) =>
            `[${i.priority.toUpperCase()}] ${i.title}\n  ${i.detail}\n  Why ATS: ${i.whyItHelpsAts}`
        )
      : analysis.suggestions;
  improvements.forEach((s) => lines.push(`- ${s}`));
  lines.push("");

  lines.push("PERSONALIZED ACTION PLAN");
  (analysis.actionPlan ?? analysis.suggestions.slice(0, 5)).forEach((s, i) =>
    lines.push(`${i + 1}. ${s}`)
  );
  lines.push("");

  if (jobMatch) {
    lines.push("JOB MATCH ANALYSIS");
    lines.push("-".repeat(40));
    lines.push(`Role: ${jobMatch.title}${jobMatch.company ? ` @ ${jobMatch.company}` : ""}`);
    lines.push(`Match Score: ${Math.round(jobMatch.matchScore)}/100`);
    lines.push(
      `Matching Skills: ${jobMatch.matchingSkills?.join(", ") || "—"}`
    );
    lines.push(`Missing Skills: ${jobMatch.missingSkills.join(", ") || "—"}`);
    jobMatch.suggestions.forEach((s) => lines.push(`- ${s}`));
    jobMatch.atsImprovements.forEach((s) => lines.push(`- ATS: ${s}`));
    lines.push("");
  }

  lines.push("End of report.");

  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/\.[^.]+$/, "")}-ats-report.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
