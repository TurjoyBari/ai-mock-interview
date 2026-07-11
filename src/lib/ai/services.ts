import { createChatCompletion, GeminiError } from "@/lib/gemini";
import {
  ensureValidIdealAnswer,
  ensureValidPracticeVersion,
  isPlaceholderIdealAnswer,
} from "@/lib/ai/ideal-answers";
import { parseGeminiJson } from "@/lib/ai/parse-json";
import { ANSWER_COACH_SCHEMA, POST_INTERVIEW_COACHING_BATCH_SCHEMA } from "@/lib/ai/schemas";
import { aiLogger } from "@/lib/ai/logger";
import {
  getCachedQuestions,
  setCachedQuestions,
} from "@/lib/ai/question-cache";
import {
  buildFallbackQuestions,
  buildFallbackCoachAnalysis,
  buildFallbackFeedback,
  buildFallbackResumeAnalysis,
  buildFallbackJobMatch,
  buildFallbackPostInterviewCoaching,
  buildFallbackAnswerCoaching,
  isRecoverableAiError,
} from "@/lib/ai/fallbacks";
import {
  QUESTION_GENERATION_PROMPT,
  ANSWER_EVALUATION_PROMPT,
  FEEDBACK_GENERATION_PROMPT,
  RESUME_ANALYSIS_PROMPT,
  JD_MATCHING_PROMPT,
  RESUME_REWRITE_PROMPT,
  CODING_REVIEW_PROMPT,
  COACH_PLAN_PROMPT,
  POST_INTERVIEW_COACHING_PROMPT,
  buildQuestionGenerationUserPrompt,
  buildTopicRepairUserPrompt,
  buildInterviewContextBlock,
} from "@/lib/prompts";
import {
  enforceTopicQuotas,
  normalizeGeneratedQuestion,
  validateQuestionQuotas,
  type GeneratedQuestion,
} from "@/lib/ai/question-validation";
import { expandTopicQuestionPlan } from "@/lib/interview-topics";
import {
  normalizeJobMatchResult,
  normalizeResumeAnalysis,
} from "@/lib/resume/normalize";
import type {
  InterviewConfig,
  AnswerAnalysis,
  InterviewReportData,
  ResumeAnalysis,
  JobMatchResult,
  CodingEvaluation,
  CoachPlanData,
  AnswerCoaching,
  ResumeRewriteSuggestions,
} from "@/types";

function parseJson<T>(content: string, context: string): T {
  return parseGeminiJson<T>(content, context);
}

function normalizeAnswerCoaching(
  item: { question: string; answer: string },
  raw: Partial<AnswerCoaching> & Record<string, unknown>,
  config: InterviewConfig
): AnswerCoaching {
  const missed = (raw.whatYouMissed ?? {}) as Partial<AnswerCoaching["whatYouMissed"]>;
  const comparison = (raw.comparison ?? {}) as Partial<AnswerCoaching["comparison"]>;
  const idealInterviewAnswer = ensureValidIdealAnswer(
    String(raw.idealInterviewAnswer ?? raw.industryAnswer ?? ""),
    item.question,
    config
  );
  const practiceVersion = ensureValidPracticeVersion(
    String(raw.practiceVersion ?? raw.betterSpeakingVersion ?? raw.betterVersion ?? ""),
    idealInterviewAnswer,
    item.question,
    config
  );

  return {
    question: item.question,
    answer: item.answer,
    scoreOutOf10: Number(raw.scoreOutOf10 ?? 5),
    technicalAccuracy: String(raw.technicalAccuracy ?? "Not assessed"),
    communication: String(raw.communication ?? "Not assessed"),
    confidence: String(raw.confidence ?? "Not assessed"),
    completeness: String(raw.completeness ?? "Not assessed"),
    clarity: String(raw.clarity ?? "Not assessed"),
    whatYouDidWell: Array.isArray(raw.whatYouDidWell)
      ? raw.whatYouDidWell.map(String)
      : [],
    whatYouMissed: {
      incorrectStatements: missed.incorrectStatements?.map(String) ?? [],
      missingConcepts: missed.missingConcepts?.map(String) ?? [],
      missingKeywords: missed.missingKeywords?.map(String) ?? [],
      weakExplanations: missed.weakExplanations?.map(String) ?? [],
      missingTechnicalDetails: missed.missingTechnicalDetails?.map(String) ?? [],
      communicationProblems: missed.communicationProblems?.map(String) ?? [],
      whyItMatters: String(missed.whyItMatters ?? ""),
    },
    idealInterviewAnswer,
    whyStrongAnswer: isPlaceholderIdealAnswer(String(raw.whyStrongAnswer ?? ""))
      ? `This answer works because it directly addresses the question, uses correct technical terminology, includes a concrete example, and follows a clear structure that interviewers can follow easily.`
      : String(raw.whyStrongAnswer ?? ""),
    comparison: {
      whatMissed: comparison.whatMissed?.map(String) ?? [],
      whatToImprove: comparison.whatToImprove?.map(String) ?? [],
      pointsToAdd: comparison.pointsToAdd?.map(String) ?? [],
      partsToRemoveOrSimplify:
        comparison.partsToRemoveOrSimplify?.map(String) ?? [],
    },
    practiceVersion,
    interviewTips: Array.isArray(raw.interviewTips)
      ? raw.interviewTips.map(String)
      : [],
    difficultyLevel:
      raw.difficultyLevel === "easy" ||
      raw.difficultyLevel === "medium" ||
      raw.difficultyLevel === "hard"
        ? raw.difficultyLevel
        : "medium",
    difficultyExplanation: String(raw.difficultyExplanation ?? ""),
    recommendedPractice: Array.isArray(raw.recommendedPractice)
      ? raw.recommendedPractice.map(String)
      : [],
    topicTag: raw.topicTag ? String(raw.topicTag) : undefined,
  };
}

function normalizeCoachAnalysis(raw: AnswerAnalysis): AnswerAnalysis {
  const scorePercent =
    raw.scorePercent ??
    raw.score ??
    (raw.scoreOutOf10 != null ? raw.scoreOutOf10 * 10 : 50);

  return {
    ...raw,
    score: scorePercent,
    scoreOutOf10: raw.scoreOutOf10 ?? Math.round(scorePercent / 10),
    scorePercent,
    betterVersion: raw.betterVersion || raw.betterAnswer || "",
    weakPoints: raw.weakPoints?.length ? raw.weakPoints : raw.weaknesses ?? [],
    strongPoints: raw.strongPoints?.length ? raw.strongPoints : raw.strengths ?? [],
    whyGood: raw.whyGood ?? raw.strengths ?? [],
    whyWeak: raw.whyWeak ?? raw.weaknesses ?? [],
    industryAnswer: raw.industryAnswer ?? raw.interviewerExpectations ?? "",
    recruiterView: raw.recruiterView ?? "",
  };
}

function tokensForQuestionCount(count: number): number {
  // ~350-500 tokens per question JSON object; leave headroom for larger interviews
  return Math.min(16384, Math.max(4096, count * 450 + 1024));
}

async function requestQuestionsFromAi(
  config: InterviewConfig,
  count: number
): Promise<GeneratedQuestion[]> {
  const plan = expandTopicQuestionPlan(config.topics ?? [], config.difficulty);
  const content = await createChatCompletion(
    [
      { role: "system", content: QUESTION_GENERATION_PROMPT },
      { role: "user", content: buildQuestionGenerationUserPrompt(config, count) },
    ],
    {
      jsonMode: true,
      temperature: 0.4,
      maxTokens: tokensForQuestionCount(count),
      logContext: "generate-questions",
    }
  );

  const result = parseJson<{ questions: Array<Record<string, unknown>> }>(
    content,
    "generateInterviewQuestions"
  );

  if (!Array.isArray(result.questions) || result.questions.length === 0) {
    throw new Error("Gemini returned no questions");
  }

  return result.questions
    .map((raw, index) =>
      normalizeGeneratedQuestion(
        raw,
        config,
        plan[index]?.name ?? config.topics?.[0]?.name ?? config.type,
        plan[index]?.difficulty ?? config.difficulty
      )
    )
    .filter((q): q is GeneratedQuestion => q != null);
}

async function repairMissingTopicQuestions(
  config: InterviewConfig,
  current: GeneratedQuestion[],
  topicName: string,
  difficulty: string,
  missingCount: number
): Promise<GeneratedQuestion[]> {
  if (missingCount <= 0) return [];

  const existing = current
    .filter((q) => q.topic === topicName)
    .map((q) => q.content);

  try {
    const content = await createChatCompletion(
      [
        { role: "system", content: QUESTION_GENERATION_PROMPT },
        {
          role: "user",
          content: buildTopicRepairUserPrompt(
            config,
            topicName,
            difficulty,
            missingCount,
            existing
          ),
        },
      ],
      {
        jsonMode: true,
        temperature: 0.45,
        maxTokens: tokensForQuestionCount(missingCount),
        logContext: "repair-topic-questions",
      }
    );

    const parsed = parseJson<{ questions: Array<Record<string, unknown>> }>(
      content,
      "repairMissingTopicQuestions"
    );

    return (parsed.questions ?? [])
      .map((raw) =>
        normalizeGeneratedQuestion(raw, config, topicName, difficulty)
      )
      .filter((q): q is GeneratedQuestion => q != null)
      .map((q) => ({ ...q, topic: topicName, difficulty }))
      .slice(0, missingCount);
  } catch (error) {
    aiLogger.error("repairMissingTopicQuestions:failed", error, {
      topicName,
      missingCount,
    });
    return [];
  }
}

export async function generateInterviewQuestions(
  config: InterviewConfig,
  count: number
): Promise<{ questions: Array<Record<string, unknown>>; usedFallback: boolean }> {
  const topics = config.topics ?? [];
  const expectedCount =
    topics.length > 0
      ? topics.reduce((sum, t) => sum + t.questionCount, 0)
      : count;

  // Never serve cached results for topic-quota interviews — quotas must be exact.
  const allowCache = topics.length === 0;
  if (allowCache) {
    const cached = getCachedQuestions(config, expectedCount);
    if (cached) {
      aiLogger.info("generateInterviewQuestions:cache-hit", {
        type: config.type,
        count: expectedCount,
      });
      return { questions: cached.questions, usedFallback: false };
    }
  }

  let usedFallback = false;
  let questions: GeneratedQuestion[] = [];

  try {
    questions = await requestQuestionsFromAi(config, expectedCount);
  } catch (error) {
    aiLogger.error("generateInterviewQuestions:primary-failed", error, {
      type: config.type,
      expectedCount,
      recoverable: isRecoverableAiError(error),
    });
    usedFallback = true;
    questions = buildFallbackQuestions(config, expectedCount)
      .questions.map((q, index) => {
        const plan = expandTopicQuestionPlan(topics, config.difficulty);
        return normalizeGeneratedQuestion(
          q,
          config,
          plan[index]?.name ?? topics[0]?.name ?? config.type,
          plan[index]?.difficulty ?? config.difficulty
        );
      })
      .filter((q): q is GeneratedQuestion => q != null);
  }

  // First enforcement pass (normalize topics, trim/fill structure)
  questions = enforceTopicQuotas(questions, { ...config, questionCount: expectedCount });

  // Repair missing topic quotas with targeted AI calls (up to 2 rounds)
  for (let round = 0; round < 2; round++) {
    const validation = validateQuestionQuotas(questions, topics, config);
    if (validation.ok || topics.length === 0) {
      questions = validation.questions;
      break;
    }

    aiLogger.info("generateInterviewQuestions:repair-round", {
      round: round + 1,
      issues: validation.issues,
      missingByTopic: validation.missingByTopic,
    });

    for (const gap of validation.missingByTopic) {
      const topicConfig = topics.find((t) => t.name === gap.topic);
      const difficulty =
        !topicConfig || topicConfig.difficulty === "mixed"
          ? config.difficulty
          : topicConfig.difficulty;

      const repaired = await repairMissingTopicQuestions(
        config,
        questions,
        gap.topic,
        difficulty,
        gap.missing
      );
      questions = [...questions, ...repaired];
    }

    questions = enforceTopicQuotas(questions, {
      ...config,
      questionCount: expectedCount,
    });
  }

  const finalValidation = validateQuestionQuotas(questions, topics, config);
  questions = enforceTopicQuotas(finalValidation.questions, {
    ...config,
    questionCount: expectedCount,
  });

  const sealed = validateQuestionQuotas(questions, topics, config);
  if (!sealed.ok && topics.length > 0) {
    aiLogger.error(
      "generateInterviewQuestions:validation-failed-after-repair",
      new Error(sealed.issues.join("; ")),
      {
        totalExpected: sealed.totalExpected,
        totalActual: sealed.totalActual,
        issues: sealed.issues,
      }
    );
    // Final hard enforcement via fallback templates — guarantees exact quotas
    usedFallback = true;
    questions = enforceTopicQuotas(
      buildFallbackQuestions(config, expectedCount)
        .questions.map((q, index) => {
          const plan = expandTopicQuestionPlan(topics, config.difficulty);
          return normalizeGeneratedQuestion(
            q,
            config,
            plan[index]?.name ?? topics[0]?.name ?? config.type,
            plan[index]?.difficulty ?? config.difficulty
          );
        })
        .filter((q): q is GeneratedQuestion => q != null),
      { ...config, questionCount: expectedCount }
    );
  }

  const verified = validateQuestionQuotas(
    questions,
    topics.length > 0 ? topics : [],
    config
  );

  if (topics.length > 0 && !verified.ok) {
    throw new Error(
      `Interview generation failed validation: ${verified.issues.join("; ")}`
    );
  }

  const output = {
    questions: verified.questions.map((q) => ({ ...q })),
  };

  if (allowCache) {
    setCachedQuestions(config, expectedCount, output);
  }

  aiLogger.info("generateInterviewQuestions:success", {
    type: config.type,
    count: verified.questions.length,
    usedFallback,
    topicCounts: Object.fromEntries(
      (config.topics ?? []).map((t) => [
        t.name,
        verified.questions.filter((q) => q.topic === t.name).length,
      ])
    ),
  });

  return { questions: output.questions, usedFallback };
}

export async function evaluateAndCoachAnswer(params: {
  config: InterviewConfig;
  question: string;
  answer: string;
  nextQuestionContent?: string | null;
  isLastQuestion?: boolean;
  clarificationRound?: number;
}): Promise<AnswerAnalysis & { usedFallback: boolean }> {
  const { config, question, answer, nextQuestionContent, isLastQuestion, clarificationRound = 0 } =
    params;

  try {
    const content = await createChatCompletion(
      [
        { role: "system", content: ANSWER_EVALUATION_PROMPT },
        {
          role: "system",
          content: buildInterviewContextBlock(config),
        },
        {
          role: "user",
          content: `QUESTION ASKED:
${question}

CANDIDATE ANSWER:
${answer}

CONTEXT:
- Clarification round: ${clarificationRound} (0 = first attempt on this question)
- Is last planned question: ${isLastQuestion ? "yes" : "no"}
- Next planned question (if advancing): ${nextQuestionContent ?? "none"}

Evaluate rigorously. Coach specifically. Decide follow-up strategy.`,
        },
      ],
      {
        jsonMode: true,
        responseSchema: ANSWER_COACH_SCHEMA,
        temperature: 0.35,
        maxTokens: 2048,
        logContext: "evaluate-coach",
      }
    );

    const parsed = normalizeCoachAnalysis(
      parseJson<AnswerAnalysis>(content, "evaluateAndCoachAnswer")
    );

    if (!parsed.interviewerResponse?.trim()) {
      throw new Error("Empty interviewer response in evaluation");
    }

    return { ...parsed, usedFallback: false };
  } catch (error) {
    aiLogger.error("evaluateAndCoachAnswer:fallback", error);
    return { ...buildFallbackCoachAnalysis(question, answer, nextQuestionContent, isLastQuestion), usedFallback: true };
  }
}

/** @deprecated Use evaluateAndCoachAnswer */
export async function getInterviewerResponse(
  config: InterviewConfig,
  messages: { role: "user" | "assistant"; content: string }[],
  phase: string,
  options?: { nextQuestionContent?: string | null; isLastQuestion?: boolean }
): Promise<{ response: string; usedFallback: boolean }> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const question = lastAssistant?.content ?? "Interview question";

  const result = await evaluateAndCoachAnswer({
    config,
    question,
    answer: lastUser?.content ?? "",
    nextQuestionContent: options?.nextQuestionContent,
    isLastQuestion: options?.isLastQuestion,
  });

  return {
    response: result.interviewerResponse ?? result.betterVersion,
    usedFallback: result.usedFallback,
  };
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  config: InterviewConfig
): Promise<AnswerAnalysis> {
  const result = await evaluateAndCoachAnswer({ config, question, answer });
  return result;
}

export async function generatePostInterviewCoaching(
  items: { question: string; answer: string; analysis?: AnswerAnalysis | null }[],
  config: InterviewConfig,
  recurringWeakTopics: string[] = []
): Promise<AnswerCoaching[]> {
  if (items.length === 0) return [];

  try {
    const content = await createChatCompletion(
      [
        { role: "system", content: POST_INTERVIEW_COACHING_PROMPT },
        { role: "system", content: buildInterviewContextBlock(config) },
        {
          role: "user",
          content: `Generate personalized coaching for all ${items.length} questions.

CRITICAL: idealInterviewAnswer must be the ACTUAL spoken answer text — never instructions or placeholders like "strong candidates should...".

Recurring weak areas from past interviews: ${recurringWeakTopics.join(", ") || "none"}

Questions and answers:
${items
  .map(
    (item, i) => `--- Q${i + 1} (index ${i}) ---
Question: ${item.question}
Candidate Answer: ${item.answer}${
      item.analysis
        ? `\nLive session score: ${item.analysis.scoreOutOf10 ?? "N/A"}/10`
        : ""
    }`
  )
  .join("\n\n")}`,
        },
      ],
      {
        jsonMode: true,
        responseSchema: POST_INTERVIEW_COACHING_BATCH_SCHEMA,
        temperature: 0.45,
        maxTokens: 16384,
        logContext: "post-interview-coaching",
      }
    );

    const parsed = parseJson<{
      coachings: Array<
        Omit<AnswerCoaching, "question" | "answer"> & { questionIndex: number }
      >;
    }>(content, "generatePostInterviewCoaching");

    return items.map((item, index) => {
      const match =
        parsed.coachings.find((c) => c.questionIndex === index) ??
        parsed.coachings[index];
      if (!match) {
        return buildFallbackAnswerCoaching(
          item.question,
          item.answer,
          config,
          item.analysis
        );
      }
      const { questionIndex: _idx, ...rest } = match;
      return normalizeAnswerCoaching(item, rest, config);
    });
  } catch (error) {
    aiLogger.error("generatePostInterviewCoaching:fallback", error);
    return buildFallbackPostInterviewCoaching(items, config);
  }
}

export async function generateFeedback(
  transcript: {
    question: string;
    answer: string;
    score?: number;
    analysis?: AnswerAnalysis;
  }[],
  config: InterviewConfig,
  recurringWeakTopics: string[] = []
): Promise<InterviewReportData> {
  try {
    const content = await createChatCompletion(
      [
        { role: "system", content: FEEDBACK_GENERATION_PROMPT },
        {
          role: "system",
          content: buildInterviewContextBlock(config),
        },
        {
          role: "user",
          content: `Generate a comprehensive end-of-interview report.

Recurring weak topics from past interviews: ${recurringWeakTopics.join(", ") || "none yet"}

Transcript with per-answer evaluations:
${transcript
  .map((t, i) => {
    const a = t.analysis;
    return `Q${i + 1}: ${t.question}
A${i + 1}: ${t.answer}
Score: ${t.score ?? "N/A"}${a ? `
Missing: ${a.missingPoints?.join("; ") ?? "N/A"}
Incorrect: ${a.incorrectStatements?.join("; ") ?? "N/A"}
Topic: ${a.topicTag ?? "N/A"}` : ""}`;
  })
  .join("\n\n")}`,
        },
      ],
      { jsonMode: true, temperature: 0.4, maxTokens: 4096, logContext: "generate-feedback" }
    );

    return parseJson<InterviewReportData>(content, "generateFeedback");
  } catch (error) {
    aiLogger.error("generateFeedback:fallback", error);
    return buildFallbackFeedback(transcript, config, recurringWeakTopics);
  }
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const trimmed = resumeText.trim();
  if (trimmed.length < 40) {
    throw new Error(
      "Resume text is too short to analyze. Please upload a readable PDF or DOCX."
    );
  }

  const { resumeLog, withTimeout } = await import("@/lib/resume/logger");

  try {
    resumeLog("ai-request-sent", { chars: trimmed.length });
    const content = await withTimeout(
      createChatCompletion(
        [
          { role: "system", content: RESUME_ANALYSIS_PROMPT },
          { role: "user", content: trimmed.slice(0, 14000) },
        ],
        {
          jsonMode: true,
          temperature: 0.3,
          maxTokens: 8192,
          logContext: "analyze-resume",
        }
      ),
      90_000,
      "AI resume analysis timed out. Using local ATS scoring instead."
    );
    resumeLog("ai-response-received", { chars: content.length });
    const parsed = parseJson<ResumeAnalysis>(content, "analyzeResume");
    const normalized = normalizeResumeAnalysis(parsed, trimmed);
    resumeLog("ats-analysis-generated", { atsScore: normalized.atsScore });
    return normalized;
  } catch (error) {
    aiLogger.error("analyzeResume:fallback", error);
    resumeLog("error", {
      stage: "analyze-resume",
      message: error instanceof Error ? error.message : String(error),
      fallback: true,
    });
    const normalized = normalizeResumeAnalysis(
      buildFallbackResumeAnalysis(trimmed),
      trimmed
    );
    resumeLog("ats-analysis-generated", {
      atsScore: normalized.atsScore,
      fallback: true,
    });
    return normalized;
  }
}

export async function matchJobDescription(
  resumeText: string,
  jobDescription: string
): Promise<JobMatchResult> {
  try {
    const content = await createChatCompletion(
      [
        { role: "system", content: JD_MATCHING_PROMPT },
        {
          role: "user",
          content: `RESUME:\n${resumeText.slice(0, 8000)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 8000)}`,
        },
      ],
      {
        jsonMode: true,
        temperature: 0.3,
        maxTokens: 4096,
        logContext: "job-match",
      }
    );
    return normalizeJobMatchResult(
      parseJson<JobMatchResult>(content, "matchJobDescription")
    );
  } catch (error) {
    aiLogger.error("matchJobDescription:fallback", error);
    return normalizeJobMatchResult(
      buildFallbackJobMatch(resumeText, jobDescription)
    );
  }
}

export async function rewriteResumeContent(
  resumeText: string,
  analysis?: ResumeAnalysis | null
): Promise<ResumeRewriteSuggestions> {
  const fallback = analysis?.rewrites ?? {
    professionalSummary:
      "Results-driven professional seeking to apply proven skills and deliver measurable impact.",
    experienceBullets: [
      "Delivered features and improvements in collaboration with the team.",
      "Improved quality through testing, debugging, and iteration.",
    ],
    projectDescriptions: [
      "Built a project using modern technologies and documented the approach end to end.",
    ],
    skillsSection: analysis?.technicalSkills?.length
      ? [`Technical: ${analysis.technicalSkills.join(", ")}`]
      : analysis?.skills?.length
        ? [`Skills: ${analysis.skills.join(", ")}`]
        : ["List your core technical skills here"],
  };

  try {
    const content = await createChatCompletion(
      [
        { role: "system", content: RESUME_REWRITE_PROMPT },
        {
          role: "user",
          content: `Rewrite based only on this resume text. Do not invent experience.\n\nRESUME:\n${resumeText.slice(0, 10000)}\n\nPARSED CONTEXT (JSON):\n${JSON.stringify(
            {
              summary: analysis?.summary,
              experience: analysis?.experience?.slice(0, 4),
              projects: analysis?.projects?.slice(0, 4),
              skills: analysis?.skills,
            }
          )}`,
        },
      ],
      {
        jsonMode: true,
        temperature: 0.4,
        maxTokens: 3072,
        logContext: "resume-rewrite",
      }
    );
    const parsed = parseJson<ResumeRewriteSuggestions>(
      content,
      "rewriteResumeContent"
    );
    return {
      professionalSummary:
        parsed.professionalSummary?.trim() || fallback.professionalSummary,
      experienceBullets:
        parsed.experienceBullets?.filter(Boolean).length
          ? parsed.experienceBullets.filter(Boolean)
          : fallback.experienceBullets,
      projectDescriptions:
        parsed.projectDescriptions?.filter(Boolean).length
          ? parsed.projectDescriptions.filter(Boolean)
          : fallback.projectDescriptions,
      skillsSection:
        parsed.skillsSection?.filter(Boolean).length
          ? parsed.skillsSection.filter(Boolean)
          : fallback.skillsSection,
    };
  } catch (error) {
    aiLogger.error("rewriteResumeContent:fallback", error);
    return fallback;
  }
}

export async function reviewCode(
  problem: string,
  code: string,
  language: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<CodingEvaluation> {
  const content = await createChatCompletion(
    [
      { role: "system", content: CODING_REVIEW_PROMPT },
      {
        role: "user",
        content: `Language: ${language}\nProblem:\n${problem}\n\nTest Cases:\n${testCases
          .map((t, i) => `${i + 1}. Input: ${t.input}, Expected: ${t.expectedOutput}`)
          .join("\n")}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ],
    { jsonMode: true, temperature: 0.2, logContext: "review-code" }
  );
  return parseJson<CodingEvaluation>(content, "reviewCode");
}

export async function generateCoachPlan(context: {
  weakTopics: string[];
  strongTopics: string[];
  targetCompanies: string[];
  targetRole: string;
  experienceLevel: string;
  recentScores: number[];
}): Promise<CoachPlanData> {
  const content = await createChatCompletion(
    [
      { role: "system", content: COACH_PLAN_PROMPT },
      { role: "user", content: JSON.stringify(context, null, 2) },
    ],
    { jsonMode: true, temperature: 0.6, logContext: "coach-plan" }
  );
  return parseJson<CoachPlanData>(content, "generateCoachPlan");
}

export { GeminiError };
