import { NextRequest, NextResponse } from "next/server";
import { streamChatCompletion, GeminiError } from "@/lib/gemini";
import { requireDbUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { interviewerSystemPrompt } from "@/lib/prompts";
import type { InterviewConfig } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const user = await requireDbUser();
    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { interviewId, messages, phase } = await request.json();

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
    });

    if (!interview) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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
    };

    const systemPrompt = interviewerSystemPrompt(config);
    const allMessages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "system" as const,
        content: `Current phase: ${phase ?? "main"}`,
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChatCompletion(allMessages)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          const message =
            error instanceof GeminiError
              ? "AI is temporarily unavailable. Please try again shortly."
              : "Unable to stream response. Please try again.";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Please try again shortly." },
        { status: error.status ?? 502 }
      );
    }
    return NextResponse.json(
      { error: "Unable to start stream. Please try again." },
      { status: 500 }
    );
  }
}
