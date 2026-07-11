import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, GeminiError } from "@/lib/gemini";
import { requireDbUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api/response";

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

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    const voice = settings?.voiceId ?? "Kore";
    const { audio, mimeType } = await synthesizeSpeech(text, voice);

    return new NextResponse(audio, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": audio.byteLength.toString(),
      },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      const friendly =
        error.status === 429
          ? "Text-to-speech is temporarily unavailable due to AI quota limits."
          : "Text-to-speech is temporarily unavailable. Please try again.";
      return apiError(friendly, error.status ?? 502);
    }
    return apiError("Unable to generate speech. Please try again.", 500);
  }
}
