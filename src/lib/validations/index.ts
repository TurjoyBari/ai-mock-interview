import { z } from "zod";

export const interviewConfigSchema = z
  .object({
    type: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard", "senior", "staff"]),
    company: z.string().optional(),
    customCompany: z.string().optional(),
    jobRole: z.string().optional(),
    experienceLevel: z.string().optional(),
    techStack: z.array(z.string()),
    /** Auto-calculated from selected topics; still stored on the interview */
    duration: z.number().min(5).max(180),
    questionCount: z.number().min(1).max(50),
    language: z.string(),
    mode: z.enum(["text", "voice"]),
    cameraEnabled: z.boolean(),
    hintsEnabled: z.boolean(),
    topics: z
      .array(
        z.object({
          name: z.string().min(1),
          difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
          questionCount: z.number().int().min(1).max(20),
          isWeak: z.boolean().optional(),
        })
      )
      .min(1, "Select at least one interview topic"),
    questionDistribution: z.enum([
      "ai_decide",
      "even",
      "focus_weak",
      "random",
      "custom",
    ]),
  })
  .superRefine((data, ctx) => {
    const total = data.topics.reduce((sum, t) => sum + t.questionCount, 0);
    if (total < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total questions must be at least 1",
        path: ["topics"],
      });
    }
    if (total > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total questions cannot exceed 50",
        path: ["topics"],
      });
    }
    if (data.questionCount !== total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Question count must equal the sum of topic question counts",
        path: ["questionCount"],
      });
    }
  });

export const answerSchema = z.object({
  interviewId: z.string().min(1),
  questionId: z.string().min(1),
  content: z.string().min(1),
  duration: z.number().optional(),
});

export const messageSchema = z.object({
  interviewId: z.string().min(1),
  content: z.string().min(1),
});

export const noteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()),
});

export const profileSchema = z.object({
  targetRole: z.string().optional(),
  experienceLevel: z.string().optional(),
  preferredStack: z.array(z.string()),
  targetCompanies: z.array(z.string()),
  skills: z.array(z.string()),
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string(),
  voiceEnabled: z.boolean(),
  voiceId: z.string(),
  notifications: z.boolean(),
  hintsEnabled: z.boolean(),
  cameraDefault: z.boolean(),
});

export const jobDescriptionSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  rawText: z.string().min(50),
});

export const codingSubmissionSchema = z.object({
  interviewId: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
  sessionId: z.string().optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

export type InterviewConfigInput = z.infer<typeof interviewConfigSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type JobDescriptionInput = z.infer<typeof jobDescriptionSchema>;
