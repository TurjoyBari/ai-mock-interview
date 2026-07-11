import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { extractTextFromFile } from "@/lib/resume/extract-text";
import { resumeLog, withTimeout } from "@/lib/resume/logger";
import { requireDbUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const extractSchema = z.object({
  url: z.string().url(),
  type: z.string().min(1),
  fileName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireDbUser();
    const body = extractSchema.parse(await request.json());
    resumeLog("extract-started", {
      type: body.type,
      fileName: body.fileName,
    });

    const text = await withTimeout(
      extractTextFromFile(body.url, body.type, body.fileName),
      170_000,
      "Resume text extraction timed out. Please try again with a smaller file."
    );

    if (!text || text.trim().length < 40) {
      resumeLog("error", { stage: "extract", message: "insufficient-text" });
      return apiError(
        "Could not extract enough text from this file. Try a text-based PDF or DOCX.",
        400
      );
    }

    resumeLog("extract-completed", { characterCount: text.length });
    return apiSuccess({ text, characterCount: text.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Extraction failed";
    resumeLog("error", { stage: "extract-route", message });
    const status =
      message === "Unauthorized"
        ? 401
        : /Unsupported|too large|empty|extract|timed out/i.test(message)
          ? 400
          : 500;
    return apiError(message, status);
  }
}
