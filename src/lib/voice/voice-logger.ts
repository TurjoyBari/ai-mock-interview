type VoiceLogContext = Record<string, unknown>;

export function voiceLog(stage: string, context?: VoiceLogContext) {
  if (typeof window !== "undefined") {
    console.log(`[Voice:${stage}]`, context ?? "");
  }
}
