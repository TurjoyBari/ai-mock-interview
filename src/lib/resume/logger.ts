type ResumeLogStep =
  | "file-selected"
  | "upload-started"
  | "upload-completed"
  | "file-url-received"
  | "extract-started"
  | "extract-completed"
  | "ai-request-sent"
  | "ai-response-received"
  | "ats-analysis-generated"
  | "database-saved"
  | "ui-updated"
  | "error";

export function resumeLog(
  step: ResumeLogStep,
  details?: Record<string, unknown>
): void {
  const payload = {
    scope: "resume-pipeline",
    step,
    ts: new Date().toISOString(),
    ...details,
  };

  if (step === "error") {
    console.error("[resume]", payload);
    return;
  }

  console.info("[resume]", payload);
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
