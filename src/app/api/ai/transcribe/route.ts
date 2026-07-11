import { NextRequest } from "next/server";
import { transcribeAudio, GeminiError } from "@/lib/gemini";
import { requireDbUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireDbUser();
    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429);
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return apiError("No audio provided", 400);
    }

    const transcription = await transcribeAudio(audio);

    return apiSuccess({
      text: transcription.text ?? "",
      duration: "duration" in transcription ? transcription.duration : null,
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      const friendly =
        error.status === 429
          ? "Speech transcription is temporarily unavailable due to AI quota limits."
          : "Speech transcription is temporarily unavailable. Please try again.";
      return apiError(friendly, error.status ?? 502);
    }
    const status =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return apiError("Unable to transcribe audio. Please try again.", status);
  }
}
