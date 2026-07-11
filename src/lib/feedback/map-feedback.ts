import type { InterviewReportData } from "@/types";
import type { Prisma } from "@/generated/prisma/client";

export function toFeedbackCreateData(
  interviewId: string,
  data: InterviewReportData,
  topicOverrides?: { weakTopics?: string[]; strongTopics?: string[] }
): Prisma.FeedbackCreateInput {
  return {
    interview: { connect: { id: interviewId } },
    overallScore: data.overallScore,
    communicationScore: data.communicationScore,
    confidenceScore: data.confidenceScore,
    technicalScore: data.technicalScore,
    problemSolvingScore: data.problemSolvingScore,
    behaviorScore: data.behaviorScore,
    grammarScore: data.grammarScore ?? null,
    pronunciationScore: data.pronunciationScore ?? null,
    fluencyScore: data.fluencyScore ?? null,
    vocabularyScore: data.vocabularyScore ?? null,
    leadershipScore: data.leadershipScore ?? null,
    criticalThinkingScore: data.criticalThinkingScore ?? null,
    timeManagementScore: data.timeManagementScore ?? null,
    weakAreas: data.weakAreas ?? [],
    strongAreas: data.strongAreas ?? [],
    weakTopics: topicOverrides?.weakTopics ?? data.weakTopics ?? data.weakAreas ?? [],
    strongTopics: topicOverrides?.strongTopics ?? data.strongTopics ?? data.strongAreas ?? [],
    suggestions: data.suggestions ?? [],
    mistakesMade: data.mistakesMade ?? [],
    recommendedStudyTopics: data.recommendedStudyTopics ?? [],
    recurringPatterns: data.recurringPatterns ?? [],
    questionsAnsweredWell: data.questionsAnsweredWell ?? undefined,
    questionsAnsweredPoorly: data.questionsAnsweredPoorly ?? undefined,
    improvementRoadmap: data.improvementRoadmap ?? undefined,
    detailedExplanation: data.detailedExplanation,
    confidenceGraph: data.confidenceGraph ?? undefined,
  };
}
