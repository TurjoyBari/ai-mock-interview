import { notFound } from "next/navigation";
import { InterviewSessionClient } from "@/components/interview/interview-session-client";
import { getInterview } from "@/lib/queries";
import { aiLogger } from "@/lib/ai/logger";

export const dynamic = "force-dynamic";

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  aiLogger.info("interview-session:page", { interviewId: id });

  if (!id?.trim()) {
    aiLogger.error("interview-session:missing-id", new Error("Missing id param"));
    notFound();
  }

  const interview = await getInterview(id);

  aiLogger.info("interview-session:lookup", {
    interviewId: id,
    found: Boolean(interview),
    status: interview?.status,
    questionCount: interview?.questions?.length ?? 0,
  });

  if (!interview) {
    notFound();
  }

  if (!interview.questions.length) {
    aiLogger.error("interview-session:no-questions", new Error("No questions"), {
      interviewId: id,
    });
    notFound();
  }

  return <InterviewSessionClient interviewId={id} />;
}
