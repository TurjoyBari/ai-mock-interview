import { GoogleGenAI, Modality, type Content, type Schema } from "@google/genai";
import { aiLogger } from "@/lib/ai/logger";
import { parseGeminiApiError, sleep } from "@/lib/gemini/errors";

export const AI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const TTS_MODEL =
  process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";

const GEMINI_VOICE_MAP: Record<string, string> = {
  alloy: "Kore",
  echo: "Puck",
  fable: "Aoede",
  onyx: "Charon",
  nova: "Leda",
  shimmer: "Zephyr",
  Kore: "Kore",
  Puck: "Puck",
  Aoede: "Aoede",
  Charon: "Charon",
  Leda: "Leda",
  Zephyr: "Zephyr",
};

let geminiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
}

function normalizeGeminiContents(messages: ChatMessage[]): Content[] {
  const turns = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      text: m.content.trim(),
    }))
    .filter((m) => m.text.length > 0);

  if (turns.length === 0) {
    return [{ role: "user", parts: [{ text: "Continue the interview." }] }];
  }

  const merged: { role: "user" | "model"; text: string }[] = [];
  for (const turn of turns) {
    const previous = merged[merged.length - 1];
    if (previous && previous.role === turn.role) {
      previous.text = `${previous.text}\n\n${turn.text}`;
    } else {
      merged.push({ ...turn });
    }
  }

  // Gemini multi-turn conversations must start with a user turn.
  if (merged[0]?.role === "model") {
    merged.unshift({
      role: "user",
      text: "I am ready to begin the interview.",
    });
  }

  return merged.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));
}

function buildGeminiRequest(messages: ChatMessage[]) {
  const systemParts = messages
    .filter((m) => m.role === "system" || m.role === "developer")
    .map((m) => m.content)
    .join("\n\n");

  const contents = normalizeGeminiContents(messages);

  return {
    contents,
    config: {
      ...(systemParts ? { systemInstruction: systemParts } : {}),
    },
  };
}

function extractText(response: Awaited<
  ReturnType<GoogleGenAI["models"]["generateContent"]>
>): string {
  return response.text?.trim() ?? "";
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown,
    public readonly retryAfterMs?: number,
    public readonly userMessage?: string
  ) {
    super(userMessage ?? message);
    this.name = "GeminiError";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

function wrapGeminiError(error: unknown): never {
  if (error instanceof GeminiError) throw error;

  const parsed = parseGeminiApiError(error);

  aiLogger.error("gemini:api-error", error, {
    status: parsed.status,
    retryAfterMs: parsed.retryAfterMs,
    rawMessage: parsed.rawMessage.slice(0, 500),
  });

  throw new GeminiError(
    parsed.rawMessage,
    parsed.status,
    error,
    parsed.retryAfterMs,
    parsed.userMessage
  );
}

const MAX_RATE_LIMIT_RETRIES = 1;
const MAX_RETRY_WAIT_MS = 12_000;

export async function createChatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    responseSchema?: Schema;
    logContext?: string;
  }
): Promise<string> {
  const logContext = options?.logContext ?? "chat-completion";

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const ai = getGemini();
      const { contents, config } = buildGeminiRequest(messages);

      aiLogger.info(`${logContext}:request`, {
        model: AI_MODEL,
        messageCount: messages.length,
        contentTurns: contents.length,
        jsonMode: options?.jsonMode ?? false,
        hasSchema: Boolean(options?.responseSchema),
        attempt,
      });

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents,
        config: {
          ...config,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4096,
          ...(options?.jsonMode
            ? {
                responseMimeType: "application/json",
                ...(options.responseSchema
                  ? { responseSchema: options.responseSchema }
                  : {}),
              }
            : {}),
        },
      });

      const text = extractText(response);
      const finishReason = response.candidates?.[0]?.finishReason;

      aiLogger.info(`${logContext}:response`, {
        textLength: text.length,
        finishReason: finishReason ?? "unknown",
        preview: text.slice(0, 200),
      });

      if (!text) {
        throw new GeminiError(
          `Gemini returned an empty response (finishReason: ${finishReason ?? "unknown"})`,
          undefined,
          undefined,
          undefined,
          "The AI returned an empty response. Please try again."
        );
      }

      return text;
    } catch (error) {
      const parsed = parseGeminiApiError(error);

      if (
        parsed.isRateLimited &&
        parsed.retryAfterMs &&
        attempt < MAX_RATE_LIMIT_RETRIES
      ) {
        const waitMs = Math.min(parsed.retryAfterMs + 500, MAX_RETRY_WAIT_MS);
        aiLogger.info(`${logContext}:rate-limit-retry`, {
          attempt: attempt + 1,
          waitMs,
        });
        await sleep(waitMs);
        continue;
      }

      aiLogger.error(`${logContext}:error`, error, {
        model: AI_MODEL,
        messageCount: messages.length,
        attempt,
        status: parsed.status,
      });
      wrapGeminiError(error);
    }
  }

  throw new GeminiError(
    "Gemini request failed after retries",
    429,
    undefined,
    undefined,
    "The AI service is busy. Please try again in a moment."
  );
}

export async function* streamChatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string> {
  try {
    const ai = getGemini();
    const { contents, config } = buildGeminiRequest(messages);

    const stream = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents,
      config: {
        ...config,
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    wrapGeminiError(error);
  }
}

export async function transcribeAudio(audioFile: File | Blob) {
  try {
    const ai = getGemini();
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || "audio/webm";

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe the spoken audio verbatim. Return only the transcription text with no commentary.",
            },
            {
              inlineData: {
                mimeType,
                data: buffer.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    return {
      text: extractText(response),
      duration: null as number | null,
    };
  } catch (error) {
    wrapGeminiError(error);
  }
}

function resolveGeminiVoice(voice: string): string {
  return GEMINI_VOICE_MAP[voice] ?? "Kore";
}

export async function synthesizeSpeech(
  text: string,
  voice: string = "Kore"
): Promise<{ audio: ArrayBuffer; mimeType: string }> {
  try {
    const ai = getGemini();
    const voiceName = resolveGeminiVoice(voice);

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
    });

    const inlineData =
      response.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData?.data
      )?.inlineData;

    if (!inlineData?.data) {
      throw new GeminiError("Gemini TTS response did not include audio data");
    }

    const audioBytes = Buffer.from(inlineData.data, "base64");
    return {
      audio: audioBytes.buffer.slice(
        audioBytes.byteOffset,
        audioBytes.byteOffset + audioBytes.byteLength
      ),
      mimeType: inlineData.mimeType ?? "audio/wav",
    };
  } catch (error) {
    wrapGeminiError(error);
  }
}
