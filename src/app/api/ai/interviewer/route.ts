import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { evaluateAndCoachAnswer } from "@/lib/ai/services";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess } from "@/lib/api/response";
import type { InterviewConfig } from "@/types";
import { aiLogger } from "@/lib/ai/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await requireDbUser();
    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.success) {
      return apiError("Too many requests. Please wait a moment and try again.", 429);
    }

    const { interviewId, questionId, answer, clarificationRound } = await request.json();

    if (!interviewId || !questionId || !answer?.trim()) {
      return apiError("Missing interview, question, or answer", 400);
    }

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      include: {
        questions: { orderBy: { order: "asc" } },
        answers: true,
      },
    });

    if (!interview) {
      return apiError("Interview not found", 404);
    }

    const question = interview.questions.find((q) => q.id === questionId);
    if (!question) {
      return apiError("Question not found", 404);
    }

    const answerCount = interview.answers.filter(
      (a) => a.questionId !== questionId || a.id
    ).length;
    const answeredOtherCount = interview.answers.filter(
      (a) => a.questionId !== questionId
    ).length;
    const questionIndex = interview.questions.findIndex((q) => q.id === questionId);
    const isLastQuestion = questionIndex >= interview.questions.length - 1;
    const nextQuestion =
      questionIndex < interview.questions.length - 1
        ? interview.questions[questionIndex + 1]
        : null;

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
            topics:
              (interview.metadata as { topics?: InterviewConfig["topics"] })
                .topics ??
              (
                interview.metadata as {
                  selectedTopics?: string[];
                  topicDifficulty?: Record<string, string>;
                  topicQuestionCount?: Record<string, number>;
                }
              ).selectedTopics?.map((name) => ({
                name,
                difficulty: ((
                  interview.metadata as {
                    topicDifficulty?: Record<string, string>;
                  }
                ).topicDifficulty?.[name] ?? "medium") as NonNullable<
                  InterviewConfig["topics"]
                >[number]["difficulty"],
                questionCount:
                  (
                    interview.metadata as {
                      topicQuestionCount?: Record<string, number>;
                    }
                  ).topicQuestionCount?.[name] ?? 1,
              })),
            questionDistribution: ((
              interview.metadata as {
                questionDistribution?: InterviewConfig["questionDistribution"];
                distributionMode?: InterviewConfig["questionDistribution"];
              }
            ).questionDistribution ??
              (
                interview.metadata as {
                  distributionMode?: InterviewConfig["questionDistribution"];
                }
              ).distributionMode) as InterviewConfig["questionDistribution"],
          }
        : {}),
    };

    const result = await evaluateAndCoachAnswer({
      config,
      question: question.content,
      answer: answer.trim(),
      nextQuestionContent: nextQuestion?.content,
      isLastQuestion,
      clarificationRound: clarificationRound ?? 0,
    });

    // Persist evaluation on the answer record
    const existingAnswer = await prisma.answer.findFirst({
      where: { interviewId, questionId },
      orderBy: { createdAt: "desc" },
    });

    const answerData = {
      score: result.score,
      isGood: result.isGood,
      weakPoints: result.weakPoints ?? result.weaknesses ?? [],
      strongPoints: result.strongPoints ?? result.strengths ?? [],
      betterVersion: result.betterVersion || result.betterAnswer || null,
      industryAnswer: result.industryAnswer ?? null,
      recruiterView: result.recruiterView ?? null,
      analysis: result as object,
    };

    if (existingAnswer) {
      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          content: answer.trim(),
          ...answerData,
        },
      });
    }

    await prisma.interviewMessage.create({
      data: {
        interviewId,
        role: "assistant",
        content: result.interviewerResponse ?? "",
        phase: result.shouldAdvanceQuestion ? "main" : "followup",
      },
    });

    aiLogger.info("interviewer:evaluated", {
      interviewId,
      questionId,
      scoreOutOf10: result.scoreOutOf10,
      shouldAdvance: result.shouldAdvanceQuestion,
      usedFallback: result.usedFallback,
      answeredOtherCount,
      answerCount,
    });

    return apiSuccess({
      response: result.interviewerResponse,
      evaluation: result,
      shouldAdvanceQuestion: result.shouldAdvanceQuestion ?? true,
      usedFallback: result.usedFallback,
    });
  } catch (error) {
    aiLogger.error("interviewer:error", error);
    return apiError(
      "Unable to evaluate your answer right now. Please try again.",
      500
    );
  }
}
