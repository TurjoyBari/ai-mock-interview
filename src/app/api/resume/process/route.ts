import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromFile } from "@/lib/resume/extract-text";
import { resumeLog, withTimeout } from "@/lib/resume/logger";
import { analyzeResume } from "@/lib/ai/services";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  resumeId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let resumeId = "";
  try {
    const user = await requireDbUser();
    const body = bodySchema.parse(await request.json());
    resumeId = body.resumeId;

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    });
    if (!resume) {
      return apiError("Resume not found", 404);
    }

    resumeLog("extract-started", {
      resumeId,
      fileName: resume.fileName,
      fileType: resume.fileType,
    });

    await prisma.resume.update({
      where: { id: resume.id },
      data: { status: "extracting", processingError: null },
    });

    const text = await withTimeout(
      extractTextFromFile(resume.fileUrl, resume.fileType, resume.fileName),
      180_000,
      "Resume text extraction timed out. Try a smaller text-based PDF or DOCX."
    );

    if (!text || text.trim().length < 40) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          status: "failed",
          processingError:
            "Could not extract enough text from this file. Try a text-based PDF or DOCX.",
        },
      });
      return apiError(
        "Could not extract enough text from this file. Try a text-based PDF or DOCX.",
        400
      );
    }

    resumeLog("extract-completed", {
      resumeId,
      characterCount: text.length,
    });

    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        status: "analyzing",
        rawText: text,
        processingError: null,
      },
    });

    resumeLog("ai-request-sent", { resumeId, chars: text.length });
    const analysis = await analyzeResume(text);
    resumeLog("ats-analysis-generated", {
      resumeId,
      atsScore: analysis.atsScore,
    });

    const updated = await prisma.resume.update({
      where: { id: resume.id },
      data: {
        rawText: text,
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

    return apiSuccess(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume processing failed";
    resumeLog("error", { stage: "process-route", resumeId, message });

    if (resumeId) {
      try {
        const user = await requireDbUser();
        await prisma.resume.updateMany({
          where: { id: resumeId, userId: user.id },
          data: { status: "failed", processingError: message },
        });
      } catch {
        // ignore
      }
    }

    const status =
      message === "Unauthorized"
        ? 401
        : /extract|timed out|Unsupported|empty|too large/i.test(message)
          ? 400
          : 500;
    return apiError(message, status);
  }
}
