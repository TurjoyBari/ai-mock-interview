import type {
  JobMatchResult,
  ResumeAnalysis,
  ResumeImprovementSuggestion,
  ResumeKeywordAnalysis,
  ResumeScoreBreakdown,
  ResumeSectionFeedback,
} from "@/types";

function clampScore(value: unknown, fallback = 50): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

function defaultSection(
  status: ResumeSectionFeedback["status"] = "adequate"
): ResumeSectionFeedback {
  return {
    status,
    strengths: [],
    weaknesses: [],
    missing: [],
    improvements: [],
  };
}

function normalizeSection(raw: unknown): ResumeSectionFeedback {
  if (!raw || typeof raw !== "object") return defaultSection();
  const s = raw as Record<string, unknown>;
  const status = s.status;
  return {
    status:
      status === "strong" ||
      status === "adequate" ||
      status === "weak" ||
      status === "missing"
        ? status
        : "adequate",
    strengths: asStringArray(s.strengths),
    weaknesses: asStringArray(s.weaknesses),
    missing: asStringArray(s.missing),
    improvements: asStringArray(s.improvements),
  };
}

function deriveScores(
  analysis: Partial<ResumeAnalysis>,
  wordCount: number
): ResumeScoreBreakdown {
  const existing = analysis.scores;
  const overall = clampScore(existing?.overall ?? analysis.atsScore, 55);
  const hasExp = (analysis.experience?.length ?? 0) > 0;
  const hasEdu = (analysis.education?.length ?? 0) > 0;
  const hasProjects = (analysis.projects?.length ?? 0) > 0;
  const skillCount = analysis.skills?.length ?? 0;

  return {
    overall,
    strength: clampScore(existing?.strength, overall),
    formatting: clampScore(
      existing?.formatting,
      wordCount > 80 ? Math.min(90, 55 + Math.floor(wordCount / 40)) : 45
    ),
    keywordMatch: clampScore(
      existing?.keywordMatch,
      Math.min(92, 40 + skillCount * 4)
    ),
    skills: clampScore(existing?.skills, Math.min(95, 35 + skillCount * 5)),
    experience: clampScore(existing?.experience, hasExp ? 70 : 35),
    education: clampScore(existing?.education, hasEdu ? 75 : 40),
    projects: clampScore(existing?.projects, hasProjects ? 72 : 38),
    readability: clampScore(
      existing?.readability,
      wordCount > 120 && wordCount < 1200 ? 78 : 58
    ),
  };
}

function normalizeKeywords(
  raw: unknown,
  skills: string[],
  missingSkills: string[]
): ResumeKeywordAnalysis {
  if (raw && typeof raw === "object") {
    const k = raw as Record<string, unknown>;
    return {
      strong: asStringArray(k.strong).slice(0, 20),
      weak: asStringArray(k.weak).slice(0, 15),
      missing: asStringArray(k.missing).slice(0, 20),
      suggested: asStringArray(k.suggested).slice(0, 20),
    };
  }
  return {
    strong: skills.slice(0, 8),
    weak: [],
    missing: missingSkills.slice(0, 8),
    suggested: missingSkills.slice(0, 8),
  };
}

function normalizeImprovements(
  raw: unknown,
  suggestions: string[]
): ResumeImprovementSuggestion[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => {
        if (typeof item === "string") {
          return {
            title: item.slice(0, 80),
            detail: item,
            whyItHelpsAts: "Improves keyword coverage and clarity for ATS parsers.",
            priority: "medium" as const,
          };
        }
        if (!item || typeof item !== "object") return null;
        const s = item as Record<string, unknown>;
        const priority = s.priority;
        return {
          title: String(s.title ?? "Improvement").trim(),
          detail: String(s.detail ?? s.title ?? "").trim(),
          whyItHelpsAts: String(
            s.whyItHelpsAts ?? "Improves ATS parseability and relevance."
          ).trim(),
          priority:
            priority === "high" || priority === "medium" || priority === "low"
              ? priority
              : ("medium" as const),
        };
      })
      .filter((item): item is ResumeImprovementSuggestion => Boolean(item?.title));
  }

  return suggestions.map((s) => ({
    title: s.slice(0, 80),
    detail: s,
    whyItHelpsAts: "Helps ATS systems and recruiters evaluate your fit faster.",
    priority: "medium" as const,
  }));
}

export function normalizeResumeAnalysis(
  raw: Partial<ResumeAnalysis> | null | undefined,
  resumeText = ""
): ResumeAnalysis {
  const wordCount = resumeText.trim().split(/\s+/).filter(Boolean).length;
  const skills = asStringArray(raw?.skills);
  const missingSkills = asStringArray(raw?.missingSkills);
  const suggestions = asStringArray(raw?.suggestions);
  const scores = deriveScores(raw ?? {}, wordCount);
  const sectionFeedback = raw?.sectionFeedback ?? {};

  return {
    fullName: raw?.fullName?.trim() || undefined,
    professionalTitle: raw?.professionalTitle?.trim() || undefined,
    summary: raw?.summary?.trim() || undefined,
    contact: raw?.contact
      ? {
          email: raw.contact.email,
          phone: raw.contact.phone,
          location: raw.contact.location,
          github: raw.contact.github,
          linkedin: raw.contact.linkedin,
          portfolio: raw.contact.portfolio,
        }
      : undefined,
    skills,
    technicalSkills: asStringArray(raw?.technicalSkills).length
      ? asStringArray(raw?.technicalSkills)
      : skills,
    softSkills: asStringArray(raw?.softSkills),
    certifications: asStringArray(raw?.certifications),
    languages: asStringArray(raw?.languages),
    achievements: asStringArray(raw?.achievements),
    projects: Array.isArray(raw?.projects)
      ? raw.projects.map((p) => ({
          name: String(p?.name ?? "Project"),
          description: String(p?.description ?? ""),
          technologies: asStringArray(p?.technologies),
        }))
      : [],
    education: Array.isArray(raw?.education)
      ? raw.education.map((e) => ({
          institution: String(e?.institution ?? ""),
          degree: String(e?.degree ?? ""),
          year: String(e?.year ?? ""),
        }))
      : [],
    experience: Array.isArray(raw?.experience)
      ? raw.experience.map((e) => ({
          company: String(e?.company ?? ""),
          role: String(e?.role ?? ""),
          duration: String(e?.duration ?? ""),
          highlights: asStringArray(e?.highlights),
        }))
      : [],
    strengths: asStringArray(raw?.strengths),
    weaknesses: asStringArray(raw?.weaknesses),
    atsScore: scores.overall,
    scores,
    sectionFeedback: {
      summary: normalizeSection(sectionFeedback.summary),
      skills: normalizeSection(sectionFeedback.skills),
      experience: normalizeSection(sectionFeedback.experience),
      projects: normalizeSection(sectionFeedback.projects),
      education: normalizeSection(sectionFeedback.education),
      certifications: normalizeSection(sectionFeedback.certifications),
    },
    keywordAnalysis: normalizeKeywords(raw?.keywordAnalysis, skills, missingSkills),
    missingSkills,
    suggestions,
    improvementSuggestions: normalizeImprovements(
      raw?.improvementSuggestions,
      suggestions
    ),
    actionPlan: asStringArray(raw?.actionPlan).length
      ? asStringArray(raw?.actionPlan)
      : suggestions.slice(0, 5),
    rewrites: raw?.rewrites
      ? {
          professionalSummary: String(raw.rewrites.professionalSummary ?? ""),
          experienceBullets: asStringArray(raw.rewrites.experienceBullets),
          projectDescriptions: asStringArray(raw.rewrites.projectDescriptions),
          skillsSection: asStringArray(raw.rewrites.skillsSection),
        }
      : undefined,
  };
}

export function normalizeJobMatchResult(
  raw: Partial<JobMatchResult> | null | undefined
): JobMatchResult {
  const keyword = raw?.keywordAnalysis;
  let density = 50;
  if (keyword && typeof keyword.density === "number") {
    density =
      keyword.density <= 1
        ? Math.round(keyword.density * 100)
        : clampScore(keyword.density, 50);
  }

  const matched = asStringArray(keyword?.matched);
  const missing = asStringArray(keyword?.missing);
  const matchingSkills =
    asStringArray(raw?.matchingSkills).length > 0
      ? asStringArray(raw?.matchingSkills)
      : matched;

  return {
    matchScore: clampScore(raw?.matchScore, 50),
    missingSkills: asStringArray(raw?.missingSkills),
    matchingSkills,
    keywordAnalysis: {
      matched,
      missing,
      density,
    },
    atsImprovements: asStringArray(raw?.atsImprovements),
    suggestions: asStringArray(raw?.suggestions),
    interviewQuestions: asStringArray(raw?.interviewQuestions),
    sectionRecommendations: Array.isArray(raw?.sectionRecommendations)
      ? raw.sectionRecommendations
          .map((item) => ({
            section: String(item?.section ?? "").trim(),
            recommendation: String(item?.recommendation ?? "").trim(),
          }))
          .filter((item) => item.section && item.recommendation)
      : [],
  };
}

export function analysisFromResumeRecord(resume: {
  skills?: string[] | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  atsScore?: number | null;
  missingSkills?: string[] | null;
  suggestions?: string[] | null;
  projects?: unknown;
  education?: unknown;
  experience?: unknown;
  analysis?: unknown;
  rawText?: string | null;
}): ResumeAnalysis {
  const stored =
    resume.analysis && typeof resume.analysis === "object"
      ? (resume.analysis as Partial<ResumeAnalysis>)
      : null;

  return normalizeResumeAnalysis(
    {
      ...(stored ?? {}),
      skills: stored?.skills?.length ? stored.skills : resume.skills ?? [],
      strengths: stored?.strengths?.length
        ? stored.strengths
        : resume.strengths ?? [],
      weaknesses: stored?.weaknesses?.length
        ? stored.weaknesses
        : resume.weaknesses ?? [],
      atsScore: stored?.atsScore ?? resume.atsScore ?? undefined,
      missingSkills: stored?.missingSkills?.length
        ? stored.missingSkills
        : resume.missingSkills ?? [],
      suggestions: stored?.suggestions?.length
        ? stored.suggestions
        : resume.suggestions ?? [],
      projects:
        stored?.projects ??
        (Array.isArray(resume.projects)
          ? (resume.projects as ResumeAnalysis["projects"])
          : []),
      education:
        stored?.education ??
        (Array.isArray(resume.education)
          ? (resume.education as ResumeAnalysis["education"])
          : []),
      experience:
        stored?.experience ??
        (Array.isArray(resume.experience)
          ? (resume.experience as ResumeAnalysis["experience"])
          : []),
    },
    resume.rawText ?? ""
  );
}
