export const RESUME_STATUSES = [
  "uploaded",
  "extracting",
  "analyzing",
  "completed",
  "failed",
] as const;

export type ResumeStatus = (typeof RESUME_STATUSES)[number];

export function isResumeStatus(value: unknown): value is ResumeStatus {
  return (
    typeof value === "string" &&
    (RESUME_STATUSES as readonly string[]).includes(value)
  );
}
