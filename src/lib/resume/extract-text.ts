import mammoth from "mammoth";
import { resumeLog, withTimeout } from "@/lib/resume/logger";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  DOCX_MIME,
  "text/plain",
]);

const MAX_BYTES = 8 * 1024 * 1024;
const PDF_EXTRACT_TIMEOUT_MS = 180_000;

export function assertResumeFileType(type: string, fileName?: string): void {
  const normalized = type.toLowerCase();
  const byExt = fileName?.toLowerCase().endsWith(".docx")
    ? DOCX_MIME
    : fileName?.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : fileName?.toLowerCase().endsWith(".txt")
        ? "text/plain"
        : normalized;

  if (!ALLOWED_TYPES.has(normalized) && !ALLOWED_TYPES.has(byExt)) {
    throw new Error(
      "Unsupported file type. Please upload a PDF (.pdf) or Word (.docx) file."
    );
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
  return joined.replace(/\u0000/g, "").trim();
}

export async function extractTextFromFile(
  url: string,
  type: string,
  fileName?: string
): Promise<string> {
  assertResumeFileType(type, fileName);
  resumeLog("extract-started", { type, fileName, urlHost: safeHost(url) });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download resume file (${response.status}). Please try uploading again.`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Uploaded file is empty. Please upload a valid resume.");
  }
  if (arrayBuffer.byteLength > MAX_BYTES) {
    throw new Error("File is too large. Maximum size is 8MB.");
  }

  const buffer = Buffer.from(arrayBuffer);
  const mime = type.toLowerCase();
  const name = (fileName ?? "").toLowerCase();

  try {
    if (mime === "text/plain" || name.endsWith(".txt")) {
      const text = buffer.toString("utf-8").trim();
      resumeLog("extract-completed", { bytes: buffer.length, chars: text.length, kind: "txt" });
      return text;
    }

    if (mime === DOCX_MIME || name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (text.length < 40) {
        throw new Error(
          "Could not extract enough text from this Word document. Ensure it is not image-only."
        );
      }
      resumeLog("extract-completed", { bytes: buffer.length, chars: text.length, kind: "docx" });
      return text;
    }

    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      const text = await withTimeout(
        extractPdfText(buffer),
        PDF_EXTRACT_TIMEOUT_MS,
        "PDF text extraction timed out. Try a smaller text-based PDF or DOCX."
      );
      if (text.length < 40) {
        throw new Error(
          "Could not extract enough text from this PDF. It may be scanned or image-based. Try a text-based PDF or DOCX."
        );
      }
      resumeLog("extract-completed", { bytes: buffer.length, chars: text.length, kind: "pdf" });
      return text;
    }
  } catch (error) {
    resumeLog("error", {
      stage: "extract",
      message: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && /extract|timed out|Unsupported|empty|too large/i.test(error.message)) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? `Resume text extraction failed: ${error.message}`
        : "Resume text extraction failed. Please try another file."
    );
  }

  throw new Error(
    "Unsupported file type. Please upload a PDF (.pdf) or Word (.docx) file."
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}
