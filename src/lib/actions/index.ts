"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import {
  generateInterviewQuestions,
  generateFeedback,
  generatePostInterviewCoaching,
  analyzeResume,
  matchJobDescription,
  rewriteResumeContent,
  reviewCode,
  generateCoachPlan,
} from "@/lib/ai/services";
import { analysisFromResumeRecord } from "@/lib/resume/normalize";
import { buildHeuristicAnswerAnalysis } from "@/lib/ai/fallbacks";
import { interviewSessionPath } from "@/lib/routes";
import { toFeedbackCreateData } from "@/lib/feedback/map-feedback";
import {
  buildInterviewTopicMetadata,
  computeTopicPerformance,
  estimateInterviewDurationMinutes,
  sumTopicQuestionCounts,
} from "@/lib/interview-topics";
import { INTERVIEW_TOPIC_LIBRARY } from "@/data/interview-topic-library";
import {
  interviewConfigSchema,
  noteSchema,
  profileSchema,
  settingsSchema,
  jobDescriptionSchema,
} from "@/lib/validations";
import type {
  InterviewConfig,
  AnswerAnalysis,
  TopicSelection,
  ResumeAnalysis,
  Difficulty,
  TopicDifficulty,
} from "@/types";
import type { DashboardRange } from "@/types/dashboard";
import { INTERVIEW_TYPES } from "@/lib/constants";
import { aiLogger } from "@/lib/ai/logger";
import { toActionError } from "@/lib/ai/action-errors";
import { getDashboardAnalytics } from "@/lib/queries";

async function measureStep<T>(
  stage: string,
  timings: Record<string, number>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    timings[stage] = Date.now() - start;
  }
}

async function batchUpdateAnswerCoaching(
  answers: { id: string }[],
  coachings: object[],
  batchSize = 10
): Promise<void> {
  for (let i = 0; i < answers.length; i += batchSize) {
    const slice = answers.slice(i, i + batchSize);
    await Promise.all(
      slice.map((answer, offset) =>
        prisma.answer.update({
          where: { id: answer.id },
          data: { coaching: coachings[i + offset] as object },
        })
      )
    );
  }
}

export async function createInterview(data: unknown) {
  const user = await requireDbUser();
  const parsed = interviewConfigSchema.parse(data);

  const typeLabel =
    INTERVIEW_TYPES.find((t) => t.value === parsed.type)?.label ?? parsed.type;

  const resolvedTopics: TopicSelection[] = parsed.topics.map((t) => ({
    ...t,
    questionCount: Math.max(1, Math.floor(t.questionCount)),
  }));
  const totalQuestions = sumTopicQuestionCounts(resolvedTopics);
  const duration =
    parsed.duration || estimateInterviewDurationMinutes(totalQuestions);

  const config: InterviewConfig = {
    ...(parsed as InterviewConfig),
    topics: resolvedTopics,
    questionCount: totalQuestions,
    duration,
    questionDistribution: "custom",
  };

  const interview = await prisma.interview.create({
    data: {
      userId: user.id,
      title: `${typeLabel} — ${config.company || config.customCompany || "General"}`,
      type: config.type,
      difficulty: config.difficulty,
      company: config.company,
      customCompany: config.customCompany,
      jobRole: config.jobRole,
      experienceLevel: config.experienceLevel,
      techStack: config.techStack,
      duration: config.duration,
      questionCount: totalQuestions,
      language: config.language,
      mode: config.mode,
      cameraEnabled: config.cameraEnabled,
      hintsEnabled: config.hintsEnabled,
      status: "scheduled",
      metadata: {
        ...buildInterviewTopicMetadata(resolvedTopics, "custom"),
        interviewType: config.type,
        jobRole: config.jobRole,
        technology: config.techStack,
        experienceLevel: config.experienceLevel,
        totalQuestions,
        userSelectedTopics: true,
      } as object,
    },
  });

  try {
    aiLogger.info("createInterview:generate-questions", {
      interviewId: interview.id,
      questionCount: totalQuestions,
      mode: config.mode,
      topicCount: resolvedTopics.length,
      topics: resolvedTopics.map((t) => `${t.name}:${t.questionCount}`),
    });

    const { questions, usedFallback } = await generateInterviewQuestions(
      config,
      totalQuestions
    );

    if (questions.length !== totalQuestions) {
      throw new Error(
        `Generated ${questions.length} questions but ${totalQuestions} were requested`
      );
    }

    for (const topic of resolvedTopics) {
      const actual = questions.filter((q) => String(q.topic) === topic.name).length;
      if (actual !== topic.questionCount) {
        throw new Error(
          `Topic "${topic.name}" has ${actual} questions but ${topic.questionCount} were requested`
        );
      }
    }

    const unrelated = questions.filter(
      (q) => !resolvedTopics.some((t) => t.name === String(q.topic))
    );
    if (unrelated.length > 0) {
      throw new Error(
        `Found ${unrelated.length} questions with topics outside the selected list`
      );
    }

    await prisma.question.createMany({
      data: questions.map((q, index) => ({
        interviewId: interview.id,
        order: index + 1,
        content: String(q.content),
        type: String(q.type ?? config.type),
        topic: String(q.topic),
        difficulty: String(q.difficulty ?? config.difficulty),
        hints: Array.isArray(q.hints) ? q.hints.map(String) : [],
        codingProblem: q.codingProblem ?? undefined,
      })),
    });

    revalidatePath("/dashboard");
    revalidatePath("/interviews/history");
    revalidatePath(interviewSessionPath(interview.id));

    aiLogger.info("createInterview:success", {
      interviewId: interview.id,
      sessionUrl: interviewSessionPath(interview.id),
      usedFallbackQuestions: usedFallback,
      topics: resolvedTopics.map((t) => `${t.name}:${t.questionCount}`),
    });

    return { id: interview.id, usedFallbackQuestions: usedFallback };
  } catch (error) {
    aiLogger.error("createInterview:failed", error, {
      interviewId: interview.id,
    });
    await prisma.interview.delete({ where: { id: interview.id } }).catch(() => {});
    throw toActionError(error);
  }
}

function resolveTypeForTopic(topic: string): string {
  for (const [key, topics] of Object.entries(INTERVIEW_TOPIC_LIBRARY)) {
    if (key === "custom") continue;
    if (topics.includes(topic)) return key;
  }
  return "technical";
}

/** Creates a focused practice interview for a weak topic (dashboard "Practice Again"). */
export async function createTopicPracticeInterview(topicName: string) {
  const topic = topicName.trim();
  if (!topic) throw new Error("Topic is required");

  const questionCount = 5;
  const duration = estimateInterviewDurationMinutes(questionCount);

  return createInterview({
    type: resolveTypeForTopic(topic),
    difficulty: "medium",
    techStack: [],
    duration,
    questionCount,
    language: "en",
    mode: "text",
    cameraEnabled: false,
    hintsEnabled: true,
    topics: [
      {
        name: topic,
        difficulty: "mixed",
        questionCount,
        isWeak: true,
      },
    ],
    questionDistribution: "custom",
  });
}

/** Retakes a completed interview with the same type, difficulty, and topics. */
export async function retryInterview(interviewId: string) {
  const user = await requireDbUser();

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId: user.id },
    include: { questions: { select: { topic: true } } },
  });

  if (!interview) throw new Error("Interview not found");

  const meta = (interview.metadata ?? {}) as {
    topics?: TopicSelection[];
    selectedTopics?: string[];
    topicDifficulty?: Record<string, TopicDifficulty>;
    topicQuestionCounts?: Record<string, number>;
  };

  let topics: TopicSelection[] = [];

  if (Array.isArray(meta.topics) && meta.topics.length > 0) {
    topics = meta.topics.map((t) => ({
      name: t.name,
      difficulty: t.difficulty ?? "mixed",
      questionCount: Math.max(1, t.questionCount || 1),
      isWeak: t.isWeak,
    }));
  } else if (meta.selectedTopics?.length) {
    topics = meta.selectedTopics.map((name) => ({
      name,
      difficulty: meta.topicDifficulty?.[name] ?? "mixed",
      questionCount: Math.max(1, meta.topicQuestionCounts?.[name] ?? 1),
    }));
  } else {
    const counts = new Map<string, number>();
    for (const q of interview.questions) {
      const name = q.topic?.trim() || "General";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    topics = [...counts.entries()].map(([name, questionCount]) => ({
      name,
      difficulty: "mixed" as TopicDifficulty,
      questionCount,
    }));
  }

  if (!topics.length) {
    topics = [
      {
        name: "General",
        difficulty: "mixed",
        questionCount: Math.max(1, interview.questionCount || 5),
      },
    ];
  }

  const totalQuestions = sumTopicQuestionCounts(topics);
  const duration =
    estimateInterviewDurationMinutes(totalQuestions) || interview.duration;

  return createInterview({
    type: interview.type,
    difficulty: interview.difficulty as Difficulty,
    company: interview.company ?? undefined,
    customCompany: interview.customCompany ?? undefined,
    jobRole: interview.jobRole ?? undefined,
    experienceLevel: interview.experienceLevel ?? undefined,
    techStack: interview.techStack,
    duration,
    questionCount: totalQuestions,
    language: interview.language || "en",
    mode: (interview.mode as "text" | "voice") || "text",
    cameraEnabled: interview.cameraEnabled,
    hintsEnabled: interview.hintsEnabled,
    topics,
    questionDistribution: "custom",
  });
}

export async function fetchDashboardAnalytics(range: DashboardRange = "all") {
  return getDashboardAnalytics(range);
}

export async function startInterview(interviewId: string) {
  const user = await requireDbUser();

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId: user.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!interview) throw new Error("Interview not found");

  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: "in_progress",
      startedAt: new Date(),
      currentPhase: "introduction",
    },
  });

  await prisma.interviewMessage.create({
    data: {
      interviewId,
      role: "assistant",
      content: `Welcome! I'll be conducting your ${interview.type.replace(/_/g, " ")} interview today${interview.company ? ` for ${interview.company}` : ""}. Let's begin with a brief introduction. Could you tell me about yourself and your background?`,
      phase: "introduction",
    },
  });

  revalidatePath(`/interviews/${interviewId}`);
  revalidatePath(interviewSessionPath(interviewId));
  return interview;
}

export async function submitAnswer(data: {
  interviewId: string;
  questionId: string;
  content: string;
  duration?: number;
}) {
  const user = await requireDbUser();

  aiLogger.info("submitAnswer:start", {
    interviewId: data.interviewId,
    questionId: data.questionId,
    transcriptLength: data.content.length,
    transcriptPreview: data.content.slice(0, 120),
  });

  if (!data.content?.trim()) {
    throw new Error("Answer transcript is empty");
  }

  const interview = await prisma.interview.findFirst({
    where: { id: data.interviewId, userId: user.id },
    include: { questions: true },
  });

  if (!interview) throw new Error("Interview not found");

  const question = interview.questions.find((q) => q.id === data.questionId);
  if (!question) throw new Error("Question not found");

  const existingAnswer = await prisma.answer.findFirst({
    where: {
      interviewId: data.interviewId,
      questionId: data.questionId,
    },
  });

  if (existingAnswer) {
    aiLogger.info("submitAnswer:existing", {
      interviewId: data.interviewId,
      questionId: data.questionId,
      answerId: existingAnswer.id,
    });
    return existingAnswer;
  }

  // Live session: save answer only — evaluation deferred to completeInterview (saves 1 Gemini call per answer).
  const answer = await prisma.answer.create({
    data: {
      interviewId: data.interviewId,
      questionId: data.questionId,
      content: data.content,
      duration: data.duration,
      score: null,
      isGood: null,
      weakPoints: [],
      strongPoints: [],
      betterVersion: null,
      industryAnswer: null,
      recruiterView: null,
    },
  });

  await prisma.interviewMessage.createMany({
    data: [
      {
        interviewId: data.interviewId,
        role: "user",
        content: data.content,
      },
    ],
  });

  aiLogger.info("submitAnswer:saved", {
    interviewId: data.interviewId,
    questionId: data.questionId,
    answerId: answer.id,
    score: answer.score,
  });

  revalidatePath(`/interviews/${data.interviewId}`);
  return answer;
}

export async function completeInterview(interviewId: string) {
  const user = await requireDbUser();
  const timings: Record<string, number> = {};
  const totalStart = Date.now();

  const interview = await measureStep("loadInterview", timings, () =>
    prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      include: {
        questions: { orderBy: { order: "asc" } },
        answers: { include: { question: true } },
      },
    })
  );

  if (!interview) throw new Error("Interview not found");

  const config: InterviewConfig = {
    type: interview.type as InterviewConfig["type"],
    difficulty: interview.difficulty as InterviewConfig["difficulty"],
    company: interview.company ?? undefined,
    customCompany: interview.customCompany ?? undefined,
    jobRole: interview.jobRole ?? undefined,
    experienceLevel: interview.experienceLevel ?? undefined,
    techStack: interview.techStack,
    duration: interview.duration,
    questionCount: interview.questionCount,
    language: interview.language,
    mode: interview.mode as InterviewConfig["mode"],
    cameraEnabled: interview.cameraEnabled,
    hintsEnabled: interview.hintsEnabled,
    ...(interview.metadata && typeof interview.metadata === "object"
      ? {
          topics: (interview.metadata as { topics?: TopicSelection[] }).topics,
          questionDistribution: (
            interview.metadata as {
              questionDistribution?: InterviewConfig["questionDistribution"];
            }
          ).questionDistribution,
        }
      : {}),
  };

  // Score pending answers in parallel — CPU-only heuristic, no transaction.
  const pendingAnswers = interview.answers.filter((a) => a.score == null);
  await measureStep("scorePendingAnswers", timings, async () => {
    if (pendingAnswers.length === 0) return;

    const scored = pendingAnswers.map((pending) => ({
      pending,
      analysis: buildHeuristicAnswerAnalysis(
        pending.question.content,
        pending.content,
        config
      ),
    }));

    await Promise.all(
      scored.map(({ pending, analysis }) =>
        prisma.answer.update({
          where: { id: pending.id },
          data: {
            score: analysis.score,
            isGood: analysis.isGood,
            weakPoints: analysis.weakPoints ?? analysis.whyWeak,
            strongPoints: analysis.strongPoints ?? analysis.whyGood,
            betterVersion: analysis.betterVersion,
            industryAnswer: analysis.industryAnswer,
            recruiterView: analysis.recruiterView,
            analysis: analysis as object,
          },
        })
      )
    );

    for (const { pending, analysis } of scored) {
      pending.score = analysis.score;
    }
  });

  const pastFeedback = await measureStep("loadPastFeedback", timings, () =>
    prisma.feedback.findMany({
      where: { interview: { userId: user.id } },
      select: { weakAreas: true },
      take: 20,
    })
  );
  const recurringWeakTopics = [
    ...new Set(pastFeedback.flatMap((f) => f.weakAreas)),
  ].slice(0, 10);

  const refreshedAnswers = await measureStep("loadAnswers", timings, () =>
    prisma.answer.findMany({
      where: { interviewId },
      include: { question: true },
      orderBy: { createdAt: "asc" },
    })
  );

  const transcript = refreshedAnswers.map((a) => ({
    question: a.question.content,
    answer: a.content,
    score: a.score ?? undefined,
    analysis: (a.analysis as AnswerAnalysis | null) ?? undefined,
  }));

  const feedbackData = await measureStep("generateFeedback", timings, () =>
    generateFeedback(transcript, config, recurringWeakTopics)
  );

  const coachingItems = refreshedAnswers.map((a) => ({
    question: a.question.content,
    answer: a.content,
    analysis: (a.analysis as AnswerAnalysis | null) ?? undefined,
  }));

  const coachings = await measureStep("generatePostInterviewCoaching", timings, () =>
    generatePostInterviewCoaching(coachingItems, config, recurringWeakTopics)
  );

  const transcriptWithCoaching = refreshedAnswers.map((a, i) => ({
    question: a.question.content,
    answer: a.content,
    score: a.score ?? undefined,
    analysis: (a.analysis as AnswerAnalysis | null) ?? undefined,
    coaching: coachings[i],
  }));

  const weakTopicTags = [
    ...new Set([
      ...feedbackData.weakTopics ?? feedbackData.weakAreas,
      ...transcript
        .filter((t) => (t.score ?? 100) < 60)
        .map((t) => t.analysis?.topicTag)
        .filter(Boolean) as string[],
    ]),
  ].slice(0, 10);

  const strongTopicTags = [
    ...new Set([
      ...feedbackData.strongTopics ?? feedbackData.strongAreas,
      ...transcript
        .filter((t) => (t.score ?? 0) >= 75)
        .map((t) => t.analysis?.topicTag)
        .filter(Boolean) as string[],
    ]),
  ].slice(0, 10);

  const topicPerformance = computeTopicPerformance(
    refreshedAnswers.map((a) => ({
      score: a.score,
      analysis: (a.analysis as AnswerAnalysis | null) ?? null,
      question: { topic: a.question.topic, content: a.question.content },
    }))
  );

  // Persist coaching per answer outside the atomic transaction (batched parallel writes).
  await measureStep("saveAnswerCoaching", timings, () =>
    batchUpdateAnswerCoaching(refreshedAnswers, coachings)
  );

  // Atomic DB writes only — no AI, no loops, no network I/O.
  await measureStep("atomicCompletionWrites", timings, () =>
    prisma.$transaction(
      [
        prisma.feedback.create({
          data: toFeedbackCreateData(interviewId, feedbackData, {
            weakTopics: weakTopicTags,
            strongTopics: strongTopicTags,
          }),
        }),
        prisma.interview.update({
          where: { id: interviewId },
          data: {
            status: "completed",
            completedAt: new Date(),
            currentPhase: "completed",
            overallScore: feedbackData.overallScore,
            communicationScore: feedbackData.communicationScore,
            technicalScore: feedbackData.technicalScore,
            behavioralScore: feedbackData.behaviorScore,
          },
        }),
        prisma.report.create({
          data: {
            interviewId,
            title: `${interview.title} Report`,
            content: {
              feedback: feedbackData,
              transcript: transcriptWithCoaching,
              coachings,
              interview: {
                type: interview.type,
                difficulty: interview.difficulty,
                company: interview.company,
              },
              strongTopics: strongTopicTags,
              weakTopics: weakTopicTags,
              mistakesMade: feedbackData.mistakesMade,
              questionsAnsweredWell: feedbackData.questionsAnsweredWell,
              questionsAnsweredPoorly: feedbackData.questionsAnsweredPoorly,
              recommendedStudyTopics: feedbackData.recommendedStudyTopics,
              improvementRoadmap: feedbackData.improvementRoadmap,
              recurringPatterns: feedbackData.recurringPatterns,
              topicPerformance,
            } as object,
          },
        }),
        prisma.progressSnapshot.create({
          data: {
            userId: user.id,
            interviewCount: 1,
            questionsSolved: refreshedAnswers.length,
            avgCommunicationScore: feedbackData.communicationScore,
            avgTechnicalScore: feedbackData.technicalScore,
            avgBehavioralScore: feedbackData.behaviorScore,
            weakTopics: weakTopicTags,
            strongTopics: strongTopicTags,
          },
        }),
      ],
      { timeout: 15_000, maxWait: 10_000 }
    )
  );

  timings.totalMs = Date.now() - totalStart;
  aiLogger.info("completeInterview:success", {
    interviewId,
    answerCount: refreshedAnswers.length,
    timings,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/interviews/${interviewId}`);
  revalidatePath(interviewSessionPath(interviewId));
  revalidatePath("/reports");

  return feedbackData;
}

export async function saveUploadedResume(data: {
  fileName: string;
  fileUrl: string;
  fileType: string;
}) {
  const { resumeLog } = await import("@/lib/resume/logger");
  try {
    if (!data.fileUrl?.trim()) {
      throw new Error("Missing file URL after upload");
    }
    if (!data.fileName?.trim()) {
      throw new Error("Missing file name after upload");
    }

    const user = await requireDbUser();
    resumeLog("database-saved", {
      stage: "metadata-only",
      fileName: data.fileName,
      fileType: data.fileType,
    });

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType || "application/pdf",
        status: "uploaded",
        processingError: null,
        isPrimary: true,
      },
    });

    await prisma.resume.updateMany({
      where: { userId: user.id, id: { not: resume.id } },
      data: { isPrimary: false },
    });

    revalidatePath("/resume");
    revalidatePath("/job-match");
    resumeLog("ui-updated", { resumeId: resume.id, status: "uploaded" });
    return resume;
  } catch (error) {
    resumeLog("error", {
      stage: "saveUploadedResume",
      message: error instanceof Error ? error.message : String(error),
    });
    throw toActionError(error);
  }
}

export async function analyzeSavedResume(data: {
  resumeId: string;
  rawText: string;
}) {
  const { resumeLog } = await import("@/lib/resume/logger");
  try {
    const user = await requireDbUser();
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId: user.id },
    });
    if (!resume) {
      throw new Error("Resume not found");
    }

    const rawText = data.rawText?.trim() ?? "";
    if (rawText.length < 40) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          status: "failed",
          processingError:
            "Could not read enough text from this resume. Upload a text-based PDF or DOCX.",
        },
      });
      throw new Error(
        "Could not read enough text from this resume. Upload a text-based PDF or DOCX."
      );
    }

    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        status: "analyzing",
        rawText,
        processingError: null,
      },
    });

    resumeLog("ai-request-sent", {
      resumeId: resume.id,
      chars: rawText.length,
    });
    const analysis = await analyzeResume(rawText);
    resumeLog("ats-analysis-generated", {
      resumeId: resume.id,
      atsScore: analysis.atsScore,
    });

    const updated = await prisma.resume.update({
      where: { id: resume.id },
      data: {
        rawText,
        skills: analysis.skills,
        projects: analysis.projects,
        education: analysis.education,
        experience: analysis.experience,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        atsScore: analysis.atsScore,
        missingSkills: analysis.missingSkills,
        suggestions: analysis.suggestions,
        analysis: analysis as object,
        status: "completed",
        processingError: null,
      },
    });

    resumeLog("database-saved", {
      resumeId: updated.id,
      atsScore: updated.atsScore,
      status: "completed",
    });
    revalidatePath("/resume");
    revalidatePath("/job-match");
    return updated;
  } catch (error) {
    resumeLog("error", {
      stage: "analyzeSavedResume",
      message: error instanceof Error ? error.message : String(error),
    });
    try {
      const user = await requireDbUser();
      await prisma.resume.updateMany({
        where: { id: data.resumeId, userId: user.id },
        data: {
          status: "failed",
          processingError:
            error instanceof Error
              ? error.message
              : "ATS analysis failed. Please try again.",
        },
      });
    } catch {
      // ignore secondary failure
    }
    throw toActionError(error);
  }
}

/** @deprecated Prefer saveUploadedResume + analyzeSavedResume */
export async function uploadAndAnalyzeResume(data: {
  fileName: string;
  fileUrl: string;
  fileType: string;
  rawText: string;
}) {
  const saved = await saveUploadedResume({
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    fileType: data.fileType,
  });
  return analyzeSavedResume({
    resumeId: saved.id,
    rawText: data.rawText,
  });
}

export async function rewriteResume(resumeId: string) {
  try {
    const user = await requireDbUser();
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    });
    if (!resume?.rawText) {
      throw new Error("Resume not found or has no extracted text");
    }

    const current = analysisFromResumeRecord(resume);
    const rewrites = await rewriteResumeContent(resume.rawText, current);
    const nextAnalysis: ResumeAnalysis = { ...current, rewrites };

    const updated = await prisma.resume.update({
      where: { id: resume.id },
      data: {
        analysis: nextAnalysis as object,
        suggestions: nextAnalysis.suggestions,
      },
    });

    revalidatePath("/resume");
    return { ...updated, analysis: nextAnalysis };
  } catch (error) {
    throw toActionError(error);
  }
}

export async function createJobMatch(data: unknown) {
  try {
    const user = await requireDbUser();
    const parsed = jobDescriptionSchema.parse(data);

    const primaryResume = await prisma.resume.findFirst({
      where: { userId: user.id, isPrimary: true },
    });

    if (!primaryResume?.rawText) {
      throw new Error("Please upload a resume first");
    }

    const jd = await prisma.jobDescription.create({
      data: {
        userId: user.id,
        title: parsed.title,
        company: parsed.company,
        rawText: parsed.rawText,
      },
    });

    const matchResult = await matchJobDescription(
      primaryResume.rawText,
      parsed.rawText
    );

    const match = await prisma.jobMatch.create({
      data: {
        resumeId: primaryResume.id,
        jobDescriptionId: jd.id,
        matchScore: matchResult.matchScore,
        missingSkills: matchResult.missingSkills,
        keywordAnalysis: {
          ...matchResult.keywordAnalysis,
          matchingSkills: matchResult.matchingSkills ?? [],
          sectionRecommendations: matchResult.sectionRecommendations ?? [],
        },
        atsImprovements: matchResult.atsImprovements,
        suggestions: matchResult.suggestions,
        interviewQuestions: matchResult.interviewQuestions,
      },
      include: {
        jobDescription: true,
      },
    });

    revalidatePath("/job-match");
    return {
      ...match,
      matchingSkills: matchResult.matchingSkills ?? [],
      sectionRecommendations: matchResult.sectionRecommendations ?? [],
    };
  } catch (error) {
    throw toActionError(error);
  }
}

export async function submitCode(data: {
  interviewId: string;
  language: string;
  code: string;
  problemStatement: string;
  testCases: { input: string; expectedOutput: string }[];
}) {
  const user = await requireDbUser();

  const interview = await prisma.interview.findFirst({
    where: { id: data.interviewId, userId: user.id },
  });

  if (!interview) throw new Error("Interview not found");

  const evaluation = await reviewCode(
    data.problemStatement,
    data.code,
    data.language,
    data.testCases
  );

  const session = await prisma.codingSession.create({
    data: {
      interviewId: data.interviewId,
      language: data.language,
      code: data.code,
      problemStatement: data.problemStatement,
      testCases: data.testCases,
      passedTests: evaluation.passedTests,
      totalTests: evaluation.totalTests,
      evaluation: evaluation as object,
      complexity: {
        time: evaluation.timeComplexity,
        space: evaluation.spaceComplexity,
      },
      alternatives: evaluation.alternativeSolutions,
    },
  });

  return { session, evaluation };
}

export async function generateWeeklyCoachPlan() {
  const user = await requireDbUser();

  const recentInterviews = await prisma.interview.findMany({
    where: { userId: user.id, status: "completed" },
    orderBy: { completedAt: "desc" },
    take: 10,
    include: { feedback: true },
  });

  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  const recentScores: number[] = [];

  recentInterviews.forEach((i) => {
    if (i.overallScore) recentScores.push(i.overallScore);
    if (i.feedback) {
      weakTopics.push(...i.feedback.weakAreas);
      strongTopics.push(...i.feedback.strongAreas);
    }
  });

  const plan = await generateCoachPlan({
    weakTopics: [...new Set(weakTopics)].slice(0, 10),
    strongTopics: [...new Set(strongTopics)].slice(0, 10),
    targetCompanies: user.targetCompanies,
    targetRole: user.targetRole ?? "Software Engineer",
    experienceLevel: user.experienceLevel ?? "Mid-Level",
    recentScores,
  });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  await prisma.coachPlan.create({
    data: {
      userId: user.id,
      weekStart,
      topics: plan.topics,
      projects: plan.projects,
      codingProblems: plan.codingProblems,
      behavioral: plan.behavioral,
      resumeTips: plan.resumeTips,
      companyRoadmap: plan.companyRoadmap,
      fullPlan: plan as object,
    },
  });

  revalidatePath("/coach");
  return plan;
}

export async function createNote(data: unknown) {
  const user = await requireDbUser();
  const parsed = noteSchema.parse(data);

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      ...parsed,
    },
  });

  revalidatePath("/notes");
  return note;
}

export async function updateProfile(data: unknown) {
  const user = await requireDbUser();
  const parsed = profileSchema.parse(data);

  await prisma.user.update({
    where: { id: user.id },
    data: parsed,
  });

  revalidatePath("/profile");
}

export async function updateSettings(data: unknown) {
  const user = await requireDbUser();
  const parsed = settingsSchema.parse(data);

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: parsed,
    create: { userId: user.id, ...parsed },
  });

  revalidatePath("/settings");
}

export async function deleteInterview(interviewId: string) {
  const user = await requireDbUser();

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId: user.id },
  });

  if (!interview) {
    throw new Error("Interview not found");
  }

  await prisma.interview.delete({
    where: { id: interviewId },
  });

  revalidatePath("/interviews/history");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return { success: true, id: interviewId };
}

export async function toggleFavorite(interviewId: string) {
  const user = await requireDbUser();

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId: user.id },
  });

  if (!interview) throw new Error("Interview not found");

  await prisma.interview.update({
    where: { id: interviewId },
    data: { isFavorite: !interview.isFavorite },
  });

  revalidatePath("/interviews/history");
}

export async function createBookmark(data: {
  type: string;
  resourceId: string;
  title: string;
  metadata?: object;
}) {
  const user = await requireDbUser();

  await prisma.bookmark.upsert({
    where: {
      userId_type_resourceId: {
        userId: user.id,
        type: data.type,
        resourceId: data.resourceId,
      },
    },
    update: { title: data.title, metadata: data.metadata },
    create: {
      userId: user.id,
      ...data,
    },
  });

  revalidatePath("/notes");
}
