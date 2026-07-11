/** Centralized interview route helpers — keep navigation URLs in sync. */

export function interviewDetailPath(interviewId: string): string {
  return `/interviews/${interviewId}`;
}

export function interviewSessionPath(interviewId: string): string {
  return `/interview-session/${interviewId}`;
}

export function interviewHistoryPath(): string {
  return "/interviews/history";
}

export function newInterviewPath(): string {
  return "/interviews/new";
}
