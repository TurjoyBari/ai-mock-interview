export type FeatureStatus = "available" | "new" | "beta" | "coming_soon";

export type FeatureDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type FeatureTimeBucket = "under_5" | "5_15" | "15_30" | "30_plus";

export type AiSupportFlag = "ai" | "voice" | "resume" | "coding";

export type FeatureIconName =
  | "brain"
  | "mic"
  | "code"
  | "fileText"
  | "scan"
  | "target"
  | "sparkles"
  | "barChart"
  | "trendingUp"
  | "building"
  | "map"
  | "graduationCap"
  | "shield";

export interface FeatureScreenshot {
  id: string;
  title: string;
  caption: string;
  /** Visual theme for CSS mock panels (no external assets required). */
  theme: "interview" | "voice" | "coding" | "resume" | "analytics" | "coach";
}

export interface FeatureWorkflowStep {
  step: number;
  title: string;
  description: string;
}

export interface FeatureBenefit {
  title: string;
  description: string;
}

export interface FeatureFaq {
  question: string;
  answer: string;
}

/** Authoring shape before catalog enrichment. */
export interface FeatureSeed {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  icon: FeatureIconName;
  category: string;
  status: FeatureStatus;
  estimatedTime?: string;
  difficulty?: string;
  aiPowered: boolean;
  voiceSupport: boolean;
  screenshots: FeatureScreenshot[];
  workflow: FeatureWorkflowStep[];
  keyFeatures: string[];
  benefits: FeatureBenefit[];
  faqs: FeatureFaq[];
  relatedFeatures: string[];
}

export interface Feature extends FeatureSeed {
  id: string;
  keywords: string[];
  technologies: string[];
  aiSupport: AiSupportFlag[];
  estimatedTimeMinutes: number;
  estimatedTimeBucket: FeatureTimeBucket;
  difficulty: FeatureDifficulty;
  featured: boolean;
  createdAt: string;
  popularity: number;
}

export type FeatureSortOption =
  | "featured"
  | "popular"
  | "newest"
  | "oldest"
  | "az"
  | "za"
  | "time_asc"
  | "time_desc";

type FeatureEnrichment = {
  id: string;
  category: string;
  status: FeatureStatus;
  difficulty: FeatureDifficulty;
  keywords: string[];
  technologies: string[];
  aiSupport: AiSupportFlag[];
  estimatedTimeMinutes: number;
  featured: boolean;
  createdAt: string;
  popularity: number;
};

function timeBucketFromMinutes(minutes: number): FeatureTimeBucket {
  if (minutes < 5) return "under_5";
  if (minutes <= 15) return "5_15";
  if (minutes <= 30) return "15_30";
  return "30_plus";
}

const FEATURE_ENRICHMENT: Record<string, FeatureEnrichment> = {
  "ai-interviews": {
    id: "feat_ai_interviews",
    category: "AI Interview",
    status: "available",
    difficulty: "Intermediate",
    keywords: [
      "mock interview",
      "gemini",
      "follow-up",
      "adaptive",
      "practice",
    ],
    technologies: ["AI", "Gemini", "Next.js", "React"],
    aiSupport: ["ai", "voice"],
    estimatedTimeMinutes: 30,
    featured: true,
    createdAt: "2025-11-01T00:00:00.000Z",
    popularity: 98,
  },
  "voice-mode": {
    id: "feat_voice_mode",
    category: "Voice",
    status: "new",
    difficulty: "Beginner",
    keywords: ["speech", "tts", "stt", "microphone", "transcript"],
    technologies: ["AI", "JavaScript", "Next.js"],
    aiSupport: ["ai", "voice"],
    estimatedTimeMinutes: 25,
    featured: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    popularity: 92,
  },
  "coding-interview": {
    id: "feat_coding_interview",
    category: "Coding",
    status: "available",
    difficulty: "Advanced",
    keywords: ["monaco", "algorithms", "leetcode", "editor", "tests"],
    technologies: ["JavaScript", "TypeScript", "React", "AI"],
    aiSupport: ["ai", "coding"],
    estimatedTimeMinutes: 45,
    featured: true,
    createdAt: "2025-12-15T00:00:00.000Z",
    popularity: 88,
  },
  "resume-analyzer": {
    id: "feat_resume_analyzer",
    category: "Resume",
    status: "available",
    difficulty: "Beginner",
    keywords: ["upload", "pdf", "docx", "rewrite", "bullets"],
    technologies: ["AI", "Gemini", "Next.js"],
    aiSupport: ["ai", "resume"],
    estimatedTimeMinutes: 8,
    featured: false,
    createdAt: "2026-01-10T00:00:00.000Z",
    popularity: 85,
  },
  "ats-score": {
    id: "feat_ats_score",
    category: "Resume",
    status: "available",
    difficulty: "Beginner",
    keywords: ["ats", "keywords", "screening", "score"],
    technologies: ["AI", "Gemini"],
    aiSupport: ["ai", "resume"],
    estimatedTimeMinutes: 5,
    featured: false,
    createdAt: "2026-01-20T00:00:00.000Z",
    popularity: 80,
  },
  "job-match": {
    id: "feat_job_match",
    category: "Resume",
    status: "available",
    difficulty: "Beginner",
    keywords: ["job description", "jd", "match", "gap analysis"],
    technologies: ["AI", "Gemini", "PostgreSQL"],
    aiSupport: ["ai", "resume"],
    estimatedTimeMinutes: 10,
    featured: false,
    createdAt: "2026-02-01T00:00:00.000Z",
    popularity: 78,
  },
  "ai-feedback": {
    id: "feat_ai_feedback",
    category: "AI Interview",
    status: "available",
    difficulty: "Beginner",
    keywords: ["coaching", "score", "tips", "evaluation"],
    technologies: ["AI", "Gemini"],
    aiSupport: ["ai", "voice"],
    estimatedTimeMinutes: 2,
    featured: false,
    createdAt: "2025-11-20T00:00:00.000Z",
    popularity: 90,
  },
  "interview-report": {
    id: "feat_interview_report",
    category: "Analytics",
    status: "available",
    difficulty: "Beginner",
    keywords: ["report", "summary", "topics", "roadmap"],
    technologies: ["AI", "PostgreSQL", "Next.js"],
    aiSupport: ["ai"],
    estimatedTimeMinutes: 4,
    featured: false,
    createdAt: "2025-12-01T00:00:00.000Z",
    popularity: 82,
  },
  "progress-analytics": {
    id: "feat_progress_analytics",
    category: "Dashboard",
    status: "new",
    difficulty: "Intermediate",
    keywords: ["dashboard", "trends", "readiness", "streak", "charts"],
    technologies: ["React", "Next.js", "PostgreSQL", "AI"],
    aiSupport: ["ai"],
    estimatedTimeMinutes: 6,
    featured: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    popularity: 86,
  },
  "company-interviews": {
    id: "feat_company_interviews",
    category: "AI Interview",
    status: "available",
    difficulty: "Intermediate",
    keywords: ["google", "meta", "amazon", "company", "bar raiser"],
    technologies: ["AI", "Gemini", "React"],
    aiSupport: ["ai", "voice"],
    estimatedTimeMinutes: 35,
    featured: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    popularity: 84,
  },
  "learning-roadmap": {
    id: "feat_learning_roadmap",
    category: "Dashboard",
    status: "new",
    difficulty: "Intermediate",
    keywords: ["roadmap", "weak topics", "weekly plan"],
    technologies: ["AI", "React", "PostgreSQL"],
    aiSupport: ["ai"],
    estimatedTimeMinutes: 3,
    featured: false,
    createdAt: "2026-07-05T00:00:00.000Z",
    popularity: 75,
  },
  "career-coach": {
    id: "feat_career_coach",
    category: "Dashboard",
    status: "beta",
    difficulty: "Beginner",
    keywords: ["coach", "study plan", "projects", "schedule"],
    technologies: ["AI", "Gemini", "Next.js"],
    aiSupport: ["ai"],
    estimatedTimeMinutes: 12,
    featured: false,
    createdAt: "2026-04-15T00:00:00.000Z",
    popularity: 70,
  },
  authentication: {
    id: "feat_authentication",
    category: "Authentication",
    status: "coming_soon",
    difficulty: "Beginner",
    keywords: ["clerk", "sign in", "oauth", "security", "sso"],
    technologies: ["Next.js", "React"],
    aiSupport: [],
    estimatedTimeMinutes: 3,
    featured: false,
    createdAt: "2026-07-10T00:00:00.000Z",
    popularity: 40,
  },
};

function enrichFeature(seed: FeatureSeed): Feature {
  const meta = FEATURE_ENRICHMENT[seed.slug];
  const estimatedTimeMinutes = meta?.estimatedTimeMinutes ?? 15;
  return {
    ...seed,
    id: meta?.id ?? `feat_${seed.slug}`,
    category: meta?.category ?? seed.category,
    status: meta?.status ?? seed.status,
    difficulty: meta?.difficulty ?? "Intermediate",
    keywords: meta?.keywords ?? [],
    technologies: meta?.technologies ?? ["AI"],
    aiSupport: meta?.aiSupport ?? (seed.aiPowered ? ["ai"] : []),
    estimatedTimeMinutes,
    estimatedTimeBucket: timeBucketFromMinutes(estimatedTimeMinutes),
    featured: meta?.featured ?? false,
    createdAt: meta?.createdAt ?? "2026-01-01T00:00:00.000Z",
    popularity: meta?.popularity ?? 50,
    estimatedTime:
      seed.estimatedTime ??
      (estimatedTimeMinutes < 60
        ? `${estimatedTimeMinutes} min`
        : `${Math.round(estimatedTimeMinutes / 60)}h`),
  };
}

const FEATURE_SEEDS: FeatureSeed[] = [
  {
    slug: "ai-interviews",
    title: "AI-Powered Interviews",
    shortDescription:
      "Practice with an adaptive AI interviewer that asks follow-ups and mirrors real hiring conversations.",
    fullDescription:
      "Run realistic mock interviews powered by Google Gemini. The interviewer adapts to your answers, probes deeper when needed, and keeps the conversation natural across technical, behavioral, and role-specific sessions.",
    image: "ai-interviews",
    icon: "brain",
    category: "Interview Practice",
    status: "available",
    estimatedTime: "15–45 min",
    difficulty: "Adaptive",
    aiPowered: true,
    voiceSupport: true,
    screenshots: [
      {
        id: "ai-1",
        title: "Interview setup",
        caption: "Choose type, difficulty, and topics before you start.",
        theme: "interview",
      },
      {
        id: "ai-2",
        title: "Live conversation",
        caption: "Answer questions and get contextual follow-ups.",
        theme: "interview",
      },
      {
        id: "ai-3",
        title: "Instant scoring",
        caption: "See evaluation after each response.",
        theme: "analytics",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Create Interview",
        description: "Pick interview type, difficulty, company focus, and topics.",
      },
      {
        step: 2,
        title: "AI Generates Questions",
        description: "Gemini builds a structured question set mapped to your topics.",
      },
      {
        step: 3,
        title: "Answer by Voice or Text",
        description: "Respond naturally and switch modes anytime mid-session.",
      },
      {
        step: 4,
        title: "AI Evaluates Responses",
        description: "Get scoring, strengths, gaps, and coaching tips per answer.",
      },
      {
        step: 5,
        title: "View Detailed Report",
        description: "Review overall performance and a personalized improvement plan.",
      },
    ],
    keyFeatures: [
      "AI-generated questions",
      "Adaptive follow-ups",
      "Voice and text conversation",
      "Instant feedback",
      "Topic-aware scoring",
      "Detailed reports",
    ],
    benefits: [
      {
        title: "Time saving",
        description: "Practice whenever you want without scheduling a human coach.",
      },
      {
        title: "Personalized practice",
        description: "Sessions adapt to your stack, role, and weak topics.",
      },
      {
        title: "Better performance",
        description: "Build clarity and structure with repeated realistic drills.",
      },
      {
        title: "Improved confidence",
        description: "Walk into interviews already familiar with the pressure.",
      },
    ],
    faqs: [
      {
        question: "Which interview types are supported?",
        answer:
          "Technical, behavioral, HR, coding, system design, and stack-specific interviews such as React, Node.js, and Python.",
      },
      {
        question: "Does the AI ask follow-up questions?",
        answer:
          "Yes. When an answer is incomplete, the interviewer asks clarifying or deeper follow-ups before moving on.",
      },
      {
        question: "Can I practice for a specific company?",
        answer:
          "Yes. Choose a company focus and tech stack so questions and tone better match that hiring bar.",
      },
    ],
    relatedFeatures: ["voice-mode", "interview-report", "progress-analytics"],
  },
  {
    slug: "voice-mode",
    title: "Voice & Text Interviews",
    shortDescription:
      "Speak naturally or type your answers — switch modes anytime without losing progress.",
    fullDescription:
      "Interview like a real call with speech recognition and text-to-speech, or type when you prefer precision. Switch between Voice and Text mid-session while keeping the same question, timer, and conversation history.",
    image: "voice-mode",
    icon: "mic",
    category: "Interview Practice",
    status: "new",
    estimatedTime: "20–40 min",
    difficulty: "Beginner friendly",
    aiPowered: true,
    voiceSupport: true,
    screenshots: [
      {
        id: "voice-1",
        title: "Voice indicator",
        caption: "See when the AI is speaking or listening.",
        theme: "voice",
      },
      {
        id: "voice-2",
        title: "Live transcript",
        caption: "Edit your spoken answer before submitting.",
        theme: "voice",
      },
      {
        id: "voice-3",
        title: "Mode switch",
        caption: "Toggle Voice ↔ Text without restarting.",
        theme: "interview",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Start in either mode",
        description: "Begin with Voice or Text based on how you prefer to practice.",
      },
      {
        step: 2,
        title: "AI reads the question",
        description: "In Voice Mode, questions are spoken aloud with live UI context.",
      },
      {
        step: 3,
        title: "Answer your way",
        description: "Speak with live transcription or type a structured response.",
      },
      {
        step: 4,
        title: "Switch anytime",
        description: "Change input method without resetting the interview state.",
      },
      {
        step: 5,
        title: "Continue seamlessly",
        description: "The same question index, answers, and timer stay intact.",
      },
    ],
    keyFeatures: [
      "Browser speech recognition",
      "Natural text-to-speech",
      "Editable live transcript",
      "Instant Voice ↔ Text switching",
      "Preserved interview state",
      "Microphone permission handling",
    ],
    benefits: [
      {
        title: "Real conversation practice",
        description: "Train verbal delivery the way interviews actually happen.",
      },
      {
        title: "Flexible input",
        description: "Type when you need precision; speak when you need fluency.",
      },
      {
        title: "No lost progress",
        description: "Mode switches never recreate the session or drop answers.",
      },
      {
        title: "Faster iterations",
        description: "Move quickly through practice without restarting setups.",
      },
    ],
    faqs: [
      {
        question: "Which browsers support Voice Mode?",
        answer:
          "Chrome and Edge offer the best Web Speech API support. If voice is unavailable, you can continue in Text Mode.",
      },
      {
        question: "Can I edit a spoken answer?",
        answer:
          "Yes. After a pause, review and edit the transcript before confirming submission.",
      },
      {
        question: "Will switching modes reset my interview?",
        answer:
          "No. Question index, answers, timer, and AI context are preserved.",
      },
    ],
    relatedFeatures: ["ai-interviews", "ai-feedback", "coding-interview"],
  },
  {
    slug: "coding-interview",
    title: "Coding Interviews",
    shortDescription:
      "Solve problems in a Monaco editor with tests and AI code review.",
    fullDescription:
      "Practice coding rounds with a full editor experience — syntax highlighting, sample cases, and AI evaluation of correctness, complexity, and communication of your approach.",
    image: "coding-interview",
    icon: "code",
    category: "Technical Skills",
    status: "available",
    estimatedTime: "30–60 min",
    difficulty: "Intermediate+",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "code-1",
        title: "Problem statement",
        caption: "Read constraints and examples before coding.",
        theme: "coding",
      },
      {
        id: "code-2",
        title: "Monaco editor",
        caption: "Write and iterate with language-aware highlighting.",
        theme: "coding",
      },
      {
        id: "code-3",
        title: "AI review",
        caption: "Get feedback on correctness and complexity.",
        theme: "analytics",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Start a coding interview",
        description: "Select coding mode and difficulty for your target role.",
      },
      {
        step: 2,
        title: "Read the problem",
        description: "Review statement, constraints, and sample I/O.",
      },
      {
        step: 3,
        title: "Implement in the editor",
        description: "Write your solution with syntax highlighting and tests.",
      },
      {
        step: 4,
        title: "Submit for AI review",
        description: "Receive evaluation on correctness, edge cases, and clarity.",
      },
      {
        step: 5,
        title: "Improve and retry",
        description: "Apply coaching notes and practice similar patterns.",
      },
    ],
    keyFeatures: [
      "Monaco code editor",
      "Multi-language support",
      "Sample test cases",
      "AI code evaluation",
      "Complexity feedback",
      "Interview-style prompting",
    ],
    benefits: [
      {
        title: "Interview realism",
        description: "Practice under conditions similar to live coding rounds.",
      },
      {
        title: "Faster debugging habits",
        description: "Learn to validate edge cases before you submit.",
      },
      {
        title: "Clearer explanations",
        description: "Pair code with communication coaching from AI feedback.",
      },
      {
        title: "Skill tracking",
        description: "Connect coding performance with your overall progress.",
      },
    ],
    faqs: [
      {
        question: "Which languages are supported?",
        answer:
          "Common interview languages such as JavaScript, TypeScript, Python, and more depending on session setup.",
      },
      {
        question: "Does it run hidden tests?",
        answer:
          "Problems include sample and evaluation cases. AI review also comments on edge-case coverage.",
      },
      {
        question: "Can I mix coding with verbal explanation?",
        answer:
          "Yes. Use Voice or Text Mode alongside the editor to practice explaining your approach.",
      },
    ],
    relatedFeatures: ["ai-interviews", "ai-feedback", "progress-analytics"],
  },
  {
    slug: "resume-analyzer",
    title: "Resume Analyzer",
    shortDescription:
      "Upload your resume and get structured AI analysis with actionable rewrite tips.",
    fullDescription:
      "Upload a PDF or DOCX resume and receive a breakdown of strengths, gaps, wording issues, and suggested improvements tailored for software engineering roles.",
    image: "resume-analyzer",
    icon: "fileText",
    category: "Resume Tools",
    status: "available",
    estimatedTime: "5–10 min",
    difficulty: "Beginner",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "resume-1",
        title: "Upload",
        caption: "Drop a PDF or DOCX to begin analysis.",
        theme: "resume",
      },
      {
        id: "resume-2",
        title: "Insights",
        caption: "See strengths, gaps, and rewrite suggestions.",
        theme: "resume",
      },
      {
        id: "resume-3",
        title: "Next actions",
        caption: "Apply tips before matching to a job description.",
        theme: "coach",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Upload resume",
        description: "Securely upload your latest resume file.",
      },
      {
        step: 2,
        title: "AI extraction",
        description: "We parse content and structure for analysis.",
      },
      {
        step: 3,
        title: "Review insights",
        description: "Read strengths, weaknesses, and rewrite guidance.",
      },
      {
        step: 4,
        title: "Improve content",
        description: "Apply suggestions to bullets, skills, and impact metrics.",
      },
      {
        step: 5,
        title: "Continue to matching",
        description: "Use ATS score and JD match for targeted applications.",
      },
    ],
    keyFeatures: [
      "PDF & DOCX upload",
      "Structured resume parsing",
      "Strengths and gaps analysis",
      "Rewrite suggestions",
      "Role-aware feedback",
      "Fast turnaround",
    ],
    benefits: [
      {
        title: "Clearer positioning",
        description: "Highlight impact instead of task lists.",
      },
      {
        title: "Faster edits",
        description: "Know exactly which sections need work.",
      },
      {
        title: "Better screening odds",
        description: "Align language with modern ATS expectations.",
      },
      {
        title: "Interview readiness",
        description: "Stronger resumes lead into better mock interview focus.",
      },
    ],
    faqs: [
      {
        question: "What file types are supported?",
        answer: "PDF and DOCX resumes are supported for upload and extraction.",
      },
      {
        question: "Is my resume stored securely?",
        answer:
          "Uploads are tied to your account and used for analysis and matching features.",
      },
      {
        question: "Can I re-analyze after edits?",
        answer: "Yes. Upload an updated version anytime to refresh insights.",
      },
    ],
    relatedFeatures: ["ats-score", "job-match", "career-coach"],
  },
  {
    slug: "ats-score",
    title: "ATS Resume Score",
    shortDescription:
      "See how applicant tracking systems may interpret your resume before you apply.",
    fullDescription:
      "Get an ATS-oriented score with keyword coverage, formatting risk signals, and prioritized fixes so your resume survives automated screening.",
    image: "ats-score",
    icon: "scan",
    category: "Resume Tools",
    status: "available",
    estimatedTime: "3–8 min",
    difficulty: "Beginner",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "ats-1",
        title: "Score overview",
        caption: "Understand your ATS readiness at a glance.",
        theme: "resume",
      },
      {
        id: "ats-2",
        title: "Keyword gaps",
        caption: "Spot missing skills and role terms.",
        theme: "analytics",
      },
      {
        id: "ats-3",
        title: "Fix list",
        caption: "Follow ranked recommendations.",
        theme: "coach",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Analyze your resume",
        description: "Run analysis from an uploaded resume.",
      },
      {
        step: 2,
        title: "Review ATS score",
        description: "See how screening systems may rank your document.",
      },
      {
        step: 3,
        title: "Inspect keyword coverage",
        description: "Identify missing or underused role-critical terms.",
      },
      {
        step: 4,
        title: "Apply fixes",
        description: "Update formatting and wording for better parseability.",
      },
      {
        step: 5,
        title: "Re-check",
        description: "Upload again to confirm score improvements.",
      },
    ],
    keyFeatures: [
      "ATS readiness score",
      "Keyword coverage signals",
      "Formatting risk checks",
      "Prioritized fix list",
      "Role-aware recommendations",
      "Quick re-scoring",
    ],
    benefits: [
      {
        title: "Fewer silent rejections",
        description: "Improve odds of reaching a human recruiter.",
      },
      {
        title: "Targeted edits",
        description: "Focus on changes that move the score.",
      },
      {
        title: "Application confidence",
        description: "Submit knowing your resume is screening-ready.",
      },
      {
        title: "Time saving",
        description: "Skip guesswork on what ATS systems need.",
      },
    ],
    faqs: [
      {
        question: "Is ATS score the same as recruiter quality?",
        answer:
          "No. ATS score estimates screening readiness. Human reviewers still care about clarity and impact.",
      },
      {
        question: "Do I need a job description?",
        answer:
          "You can score a resume alone, then refine further with JD matching.",
      },
      {
        question: "How often should I re-score?",
        answer:
          "After major edits or when targeting a new role family.",
      },
    ],
    relatedFeatures: ["resume-analyzer", "job-match", "career-coach"],
  },
  {
    slug: "job-match",
    title: "Resume vs Job Description Match",
    shortDescription:
      "Compare your resume to a job description and close the gaps before applying.",
    fullDescription:
      "Paste a job description to see alignment score, missing skills, and recommended talking points so your resume and interview prep match the role.",
    image: "job-match",
    icon: "target",
    category: "Resume Tools",
    status: "available",
    estimatedTime: "5–12 min",
    difficulty: "Beginner",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "jd-1",
        title: "Paste JD",
        caption: "Import the posting you want to target.",
        theme: "resume",
      },
      {
        id: "jd-2",
        title: "Match score",
        caption: "See overlap between your resume and the role.",
        theme: "analytics",
      },
      {
        id: "jd-3",
        title: "Gap plan",
        caption: "Prioritize skills and stories to emphasize.",
        theme: "coach",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Upload resume",
        description: "Use an existing analyzed resume as the baseline.",
      },
      {
        step: 2,
        title: "Paste job description",
        description: "Add the full posting text for accurate matching.",
      },
      {
        step: 3,
        title: "Review match score",
        description: "See alignment across skills, experience, and keywords.",
      },
      {
        step: 4,
        title: "Close gaps",
        description: "Update resume bullets and prepare interview stories.",
      },
      {
        step: 5,
        title: "Practice targeted interviews",
        description: "Run mocks focused on the missing or critical topics.",
      },
    ],
    keyFeatures: [
      "Resume ↔ JD comparison",
      "Alignment score",
      "Missing skills list",
      "Talking point suggestions",
      "Application prioritization",
      "Interview focus cues",
    ],
    benefits: [
      {
        title: "Smarter applications",
        description: "Apply where your profile actually fits.",
      },
      {
        title: "Stronger resumes",
        description: "Rewrite toward what the posting emphasizes.",
      },
      {
        title: "Focused prep",
        description: "Practice the skills the role cares about most.",
      },
      {
        title: "Clear narratives",
        description: "Walk into interviews with role-specific stories ready.",
      },
    ],
    faqs: [
      {
        question: "How long should the job description be?",
        answer:
          "Paste the full posting when possible. More detail improves match quality.",
      },
      {
        question: "Can I match multiple jobs?",
        answer:
          "Yes. Run matching against each posting you are seriously considering.",
      },
      {
        question: "Does matching change my resume file?",
        answer:
          "No. It provides recommendations; you decide what to edit.",
      },
    ],
    relatedFeatures: ["resume-analyzer", "ats-score", "company-interviews"],
  },
  {
    slug: "ai-feedback",
    title: "AI Feedback",
    shortDescription:
      "Get per-answer coaching on clarity, confidence, technical depth, and structure.",
    fullDescription:
      "After each response, AI feedback highlights what worked, what was missing, and how to rephrase for a stronger interviewer impression.",
    image: "ai-feedback",
    icon: "sparkles",
    category: "Coaching",
    status: "available",
    estimatedTime: "Instant",
    difficulty: "All levels",
    aiPowered: true,
    voiceSupport: true,
    screenshots: [
      {
        id: "fb-1",
        title: "Score card",
        caption: "See score out of 10 with coaching tips.",
        theme: "analytics",
      },
      {
        id: "fb-2",
        title: "Strengths & gaps",
        caption: "Understand what to keep and what to fix.",
        theme: "coach",
      },
      {
        id: "fb-3",
        title: "Better answer",
        caption: "Compare against a stronger response pattern.",
        theme: "interview",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Answer a question",
        description: "Respond in Voice or Text Mode.",
      },
      {
        step: 2,
        title: "AI evaluates",
        description: "Your answer is scored across key interview dimensions.",
      },
      {
        step: 3,
        title: "Read coaching",
        description: "Review strengths, weaknesses, and missing points.",
      },
      {
        step: 4,
        title: "Apply immediately",
        description: "Use tips on the next question or clarification round.",
      },
      {
        step: 5,
        title: "Track improvement",
        description: "Watch feedback quality improve across sessions.",
      },
    ],
    keyFeatures: [
      "Per-answer scoring",
      "Strengths and weaknesses",
      "Missing concepts",
      "Better-answer guidance",
      "Communication tips",
      "Confidence signals",
    ],
    benefits: [
      {
        title: "Faster learning loops",
        description: "Improve within the same interview, not just afterward.",
      },
      {
        title: "Clearer structure",
        description: "Build STAR and technical explanation habits.",
      },
      {
        title: "Reduced blind spots",
        description: "Catch weak explanations before real interviews.",
      },
      {
        title: "Measurable growth",
        description: "Scores and tips accumulate into progress analytics.",
      },
    ],
    faqs: [
      {
        question: "Is feedback available for every answer?",
        answer:
          "Yes. Each submitted answer receives evaluation and coaching notes.",
      },
      {
        question: "Does feedback work in Voice Mode?",
        answer:
          "Yes. Spoken answers are transcribed and evaluated the same way.",
      },
      {
        question: "Can feedback be too harsh?",
        answer:
          "Feedback is direct and constructive, focused on interview-ready improvements.",
      },
    ],
    relatedFeatures: ["ai-interviews", "interview-report", "learning-roadmap"],
  },
  {
    slug: "interview-report",
    title: "Interview Reports",
    shortDescription:
      "Finish a session with a full report covering scores, topics, and next steps.",
    fullDescription:
      "Every completed interview produces a structured report with overall scores, topic performance, recurring patterns, and a recommended study focus.",
    image: "interview-report",
    icon: "barChart",
    category: "Analytics",
    status: "available",
    estimatedTime: "2–5 min review",
    difficulty: "All levels",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "rep-1",
        title: "Score summary",
        caption: "Overall and dimension scores in one place.",
        theme: "analytics",
      },
      {
        id: "rep-2",
        title: "Topic breakdown",
        caption: "See strong and weak topics from the session.",
        theme: "analytics",
      },
      {
        id: "rep-3",
        title: "Action plan",
        caption: "Leave with concrete next practice steps.",
        theme: "coach",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Complete interview",
        description: "Finish or end a mock session.",
      },
      {
        step: 2,
        title: "Report generation",
        description: "AI aggregates answers, scores, and patterns.",
      },
      {
        step: 3,
        title: "Review insights",
        description: "Read overall performance and topic-level results.",
      },
      {
        step: 4,
        title: "Save and revisit",
        description: "Open reports anytime from your reports library.",
      },
      {
        step: 5,
        title: "Practice again",
        description: "Retry weak topics or retake the interview.",
      },
    ],
    keyFeatures: [
      "Overall score summary",
      "Communication & technical scores",
      "Weak and strong topics",
      "Recurring patterns",
      "Improvement roadmap",
      "Shareable report view",
    ],
    benefits: [
      {
        title: "Post-interview clarity",
        description: "Know exactly what to improve next.",
      },
      {
        title: "Portfolio of practice",
        description: "Build a history of measurable sessions.",
      },
      {
        title: "Targeted retries",
        description: "Jump straight into weak topics.",
      },
      {
        title: "Motivation",
        description: "See progress across completed interviews.",
      },
    ],
    faqs: [
      {
        question: "When is a report created?",
        answer:
          "After you complete an interview session and feedback is generated.",
      },
      {
        question: "Can I revisit old reports?",
        answer: "Yes. All reports remain available in your Reports section.",
      },
      {
        question: "Do deleted interviews remove reports?",
        answer:
          "Deleting an interview removes associated report data for that session.",
      },
    ],
    relatedFeatures: ["progress-analytics", "ai-feedback", "learning-roadmap"],
  },
  {
    slug: "progress-analytics",
    title: "Progress Analytics",
    shortDescription:
      "Track scores, streaks, readiness, and topic mastery across every interview.",
    fullDescription:
      "The analytics dashboard turns completed interviews into actionable insight — trends, weak topics, readiness score, roadmap, and achievements based on real practice data.",
    image: "progress-analytics",
    icon: "trendingUp",
    category: "Analytics",
    status: "new",
    estimatedTime: "Ongoing",
    difficulty: "All levels",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "prog-1",
        title: "Overview cards",
        caption: "Interviews, scores, streak, and practice time.",
        theme: "analytics",
      },
      {
        id: "prog-2",
        title: "Trends",
        caption: "Watch confidence and communication improve over time.",
        theme: "analytics",
      },
      {
        id: "prog-3",
        title: "Readiness",
        caption: "See how close you are to interview-ready.",
        theme: "coach",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Complete interviews",
        description: "Practice regularly so analytics has real signal.",
      },
      {
        step: 2,
        title: "Open dashboard",
        description: "Review overview metrics and trends.",
      },
      {
        step: 3,
        title: "Inspect topics",
        description: "Identify strong, average, and weak areas.",
      },
      {
        step: 4,
        title: "Follow roadmap",
        description: "Practice suggested topics week by week.",
      },
      {
        step: 5,
        title: "Raise readiness",
        description: "Improve consistency until you reach the next level.",
      },
    ],
    keyFeatures: [
      "Score trends over time",
      "Topic performance map",
      "Interview readiness score",
      "Learning roadmap",
      "Achievements",
      "Practice streak tracking",
    ],
    benefits: [
      {
        title: "Data-driven prep",
        description: "Stop guessing what to practice next.",
      },
      {
        title: "Motivation",
        description: "Streaks and achievements reinforce consistency.",
      },
      {
        title: "Interview readiness",
        description: "Know when you are ready for real loops.",
      },
      {
        title: "Long-term growth",
        description: "See month-over-month improvement clearly.",
      },
    ],
    faqs: [
      {
        question: "Where does the data come from?",
        answer:
          "Only from your completed interviews, answers, and feedback — no placeholders.",
      },
      {
        question: "How often does analytics update?",
        answer:
          "Automatically after interviews are completed, deleted, or retaken.",
      },
      {
        question: "What is Interview Readiness?",
        answer:
          "A 0–100 score based on overall performance, consistency, and practice frequency.",
      },
    ],
    relatedFeatures: ["interview-report", "learning-roadmap", "ai-interviews"],
  },
  {
    slug: "company-interviews",
    title: "Company-specific Interviews",
    shortDescription:
      "Tailor mocks toward Google, Meta, Amazon, startups, and more.",
    fullDescription:
      "Configure company-focused interviews so question style, depth, and expectations better match the organizations you are targeting.",
    image: "company-interviews",
    icon: "building",
    category: "Interview Practice",
    status: "available",
    estimatedTime: "20–45 min",
    difficulty: "Adaptive",
    aiPowered: true,
    voiceSupport: true,
    screenshots: [
      {
        id: "co-1",
        title: "Company picker",
        caption: "Select a target company or add a custom one.",
        theme: "interview",
      },
      {
        id: "co-2",
        title: "Role focus",
        caption: "Align questions to the job you want.",
        theme: "interview",
      },
      {
        id: "co-3",
        title: "Style match",
        caption: "Practice tone and depth closer to that bar.",
        theme: "coach",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Choose company",
        description: "Pick from popular companies or enter a custom target.",
      },
      {
        step: 2,
        title: "Set role and stack",
        description: "Define job role, experience level, and technologies.",
      },
      {
        step: 3,
        title: "Generate interview",
        description: "AI builds a company-aware question set.",
      },
      {
        step: 4,
        title: "Practice the loop",
        description: "Answer with voice or text under interview pressure.",
      },
      {
        step: 5,
        title: "Review company fit",
        description: "Use the report to refine stories for that employer.",
      },
    ],
    keyFeatures: [
      "Popular company presets",
      "Custom company support",
      "Role and stack targeting",
      "Company-aware prompting",
      "Behavioral + technical mix",
      "Repeatable company drills",
    ],
    benefits: [
      {
        title: "Relevant practice",
        description: "Spend time on the interview style you will face.",
      },
      {
        title: "Stronger stories",
        description: "Shape experiences for company values and bar raisers.",
      },
      {
        title: "Less surprise",
        description: "Arrive familiar with expected depth and pacing.",
      },
      {
        title: "Broader readiness",
        description: "Rotate companies to diversify your prep.",
      },
    ],
    faqs: [
      {
        question: "Are questions copied from real company banks?",
        answer:
          "No. Questions are AI-generated to reflect style and topics, not leaked proprietary banks.",
      },
      {
        question: "Can I practice for startups?",
        answer:
          "Yes. Use a custom company name and role description for startup-style interviews.",
      },
      {
        question: "Does company choice change scoring?",
        answer:
          "Scoring stays consistent, while prompting and expectations adapt to the selected focus.",
      },
    ],
    relatedFeatures: ["ai-interviews", "job-match", "career-coach"],
  },
  {
    slug: "learning-roadmap",
    title: "Personalized Learning Roadmap",
    shortDescription:
      "Get a week-by-week plan built from your weak and average topics.",
    fullDescription:
      "After enough practice data exists, InterviewAI builds a roadmap that prioritizes weak topics first, then average ones, so every week of prep has a clear focus.",
    image: "learning-roadmap",
    icon: "map",
    category: "Coaching",
    status: "new",
    estimatedTime: "Weekly plan",
    difficulty: "All levels",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "map-1",
        title: "Weekly plan",
        caption: "See topics organized by week.",
        theme: "coach",
      },
      {
        id: "map-2",
        title: "Practice again",
        caption: "Launch focused interviews from roadmap items.",
        theme: "interview",
      },
      {
        id: "map-3",
        title: "Auto updates",
        caption: "Roadmap refreshes as your scores change.",
        theme: "analytics",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Build practice history",
        description: "Complete interviews across multiple topics.",
      },
      {
        step: 2,
        title: "Topic scoring",
        description: "Analytics identifies weak and average areas.",
      },
      {
        step: 3,
        title: "Roadmap generation",
        description: "Topics are sequenced into weekly focus blocks.",
      },
      {
        step: 4,
        title: "Practice the plan",
        description: "Run focused sessions for each recommended topic.",
      },
      {
        step: 5,
        title: "Automatic refresh",
        description: "As you improve, the roadmap reshuffles priorities.",
      },
    ],
    keyFeatures: [
      "Weak-topic prioritization",
      "Week-by-week structure",
      "One-click practice launches",
      "Auto updates after interviews",
      "Dashboard integration",
      "Clear next actions",
    ],
    benefits: [
      {
        title: "No more random practice",
        description: "Always know the highest-leverage topic next.",
      },
      {
        title: "Steady progress",
        description: "Weekly structure keeps momentum going.",
      },
      {
        title: "Efficient prep",
        description: "Spend time where scores are weakest.",
      },
      {
        title: "Confidence",
        description: "Watch weak topics move into average and strong.",
      },
    ],
    faqs: [
      {
        question: "When does a roadmap appear?",
        answer:
          "After you have topic scores from completed interview answers.",
      },
      {
        question: "How many topics per week?",
        answer:
          "Typically two focus topics per week, adjusted from your weak and average set.",
      },
      {
        question: "Can I ignore the roadmap?",
        answer:
          "Yes. It is guidance — you can still create any interview you want.",
      },
    ],
    relatedFeatures: ["progress-analytics", "career-coach", "ai-interviews"],
  },
  {
    slug: "career-coach",
    title: "AI Career Coach",
    shortDescription:
      "Generate weekly study plans, project ideas, and company roadmaps with AI.",
    fullDescription:
      "Your AI career coach turns goals into an actionable plan — topics to study, projects to build, coding drills, behavioral prep, and a weekly schedule.",
    image: "career-coach",
    icon: "graduationCap",
    category: "Coaching",
    status: "available",
    estimatedTime: "10–15 min",
    difficulty: "All levels",
    aiPowered: true,
    voiceSupport: false,
    screenshots: [
      {
        id: "coach-1",
        title: "Goal intake",
        caption: "Share role targets and current level.",
        theme: "coach",
      },
      {
        id: "coach-2",
        title: "Weekly schedule",
        caption: "Get a day-by-day prep plan.",
        theme: "coach",
      },
      {
        id: "coach-3",
        title: "Project ideas",
        caption: "Build portfolio work that supports interviews.",
        theme: "interview",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Set career goals",
        description: "Define target role, stack, and companies.",
      },
      {
        step: 2,
        title: "Generate coach plan",
        description: "AI produces topics, projects, and weekly tasks.",
      },
      {
        step: 3,
        title: "Follow the schedule",
        description: "Work through daily study and practice blocks.",
      },
      {
        step: 4,
        title: "Pair with mocks",
        description: "Use interviews to validate what you studied.",
      },
      {
        step: 5,
        title: "Refresh the plan",
        description: "Regenerate as goals or weak areas change.",
      },
    ],
    keyFeatures: [
      "Weekly study schedule",
      "Topic recommendations",
      "Project ideas",
      "Coding problem suggestions",
      "Behavioral prep cues",
      "Company roadmap notes",
    ],
    benefits: [
      {
        title: "Structure",
        description: "Replace ad-hoc studying with a clear weekly plan.",
      },
      {
        title: "Holistic prep",
        description: "Cover skills, projects, and soft skills together.",
      },
      {
        title: "Accountability",
        description: "Day-level tasks make progress visible.",
      },
      {
        title: "Career clarity",
        description: "Align daily work with the roles you want.",
      },
    ],
    faqs: [
      {
        question: "Is the coach plan personalized?",
        answer:
          "Yes. It uses your goals and profile inputs to shape recommendations.",
      },
      {
        question: "How is this different from the learning roadmap?",
        answer:
          "Roadmap prioritizes weak interview topics from practice data. Career Coach builds a broader weekly prep plan.",
      },
      {
        question: "Can I regenerate plans?",
        answer: "Yes. Create a new plan anytime your goals change.",
      },
    ],
    relatedFeatures: ["learning-roadmap", "resume-analyzer", "company-interviews"],
  },
  {
    slug: "authentication",
    title: "Secure Authentication",
    shortDescription:
      "Sign in with Clerk-powered auth, protected routes, and seamless session management.",
    fullDescription:
      "Authentication is built on Clerk with secure sign-in, sign-up, and session handling across the dashboard and interview flows. Advanced SSO options are planned.",
    image: "career-coach",
    icon: "shield",
    category: "Authentication",
    status: "coming_soon",
    estimatedTime: "Under 5 min",
    difficulty: "Beginner",
    aiPowered: false,
    voiceSupport: false,
    screenshots: [
      {
        id: "auth-1",
        title: "Sign in",
        caption: "Secure Clerk-hosted authentication.",
        theme: "coach",
      },
      {
        id: "auth-2",
        title: "Protected routes",
        caption: "Dashboard and interviews require a valid session.",
        theme: "analytics",
      },
      {
        id: "auth-3",
        title: "Profile menu",
        caption: "Manage account access from the navbar.",
        theme: "interview",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Create an account",
        description: "Sign up with email or a supported identity provider.",
      },
      {
        step: 2,
        title: "Verify session",
        description: "Clerk establishes a secure session for your browser.",
      },
      {
        step: 3,
        title: "Access the dashboard",
        description: "Protected pages unlock after authentication.",
      },
      {
        step: 4,
        title: "Practice securely",
        description: "Interview data stays tied to your account.",
      },
      {
        step: 5,
        title: "Sign out anytime",
        description: "End the session from the profile menu.",
      },
    ],
    keyFeatures: [
      "Clerk authentication",
      "Protected dashboard routes",
      "Secure session handling",
      "Profile management",
      "Sign-in / sign-up flows",
      "Coming soon: enterprise SSO",
    ],
    benefits: [
      {
        title: "Security",
        description: "Industry-standard auth without rolling your own.",
      },
      {
        title: "Speed",
        description: "Get into practice quickly with frictionless login.",
      },
      {
        title: "Privacy",
        description: "Your interviews and resumes stay account-scoped.",
      },
      {
        title: "Reliability",
        description: "Session handling works across devices and reloads.",
      },
    ],
    faqs: [
      {
        question: "Is authentication available now?",
        answer:
          "Core Clerk sign-in is live across the app. Extra SSO options are marked Coming Soon.",
      },
      {
        question: "Do I need an account to browse features?",
        answer:
          "No. Feature pages are public. Practice tools require sign-in.",
      },
      {
        question: "Which providers are supported?",
        answer:
          "Email-based Clerk auth is available today, with additional providers planned.",
      },
    ],
    relatedFeatures: ["progress-analytics", "ai-interviews", "resume-analyzer"],
  },
];

export const FEATURES: Feature[] = FEATURE_SEEDS.map(enrichFeature);

export function getFeatureBySlug(slug: string): Feature | undefined {
  return FEATURES.find((f) => f.slug === slug);
}

export function getRelatedFeatures(feature: Feature): Feature[] {
  return feature.relatedFeatures
    .map((slug) => getFeatureBySlug(slug))
    .filter((f): f is Feature => Boolean(f));
}

export function getAllFeatureSlugs(): string[] {
  return FEATURES.map((f) => f.slug);
}

export function getFeatureStatusLabel(status: FeatureStatus): string {
  if (status === "available") return "Available";
  if (status === "new") return "New";
  if (status === "beta") return "Beta";
  return "Coming Soon";
}

export function getAiSupportLabel(flag: AiSupportFlag): string {
  if (flag === "ai") return "AI Enabled";
  if (flag === "voice") return "Voice Enabled";
  if (flag === "resume") return "Resume Enabled";
  return "Coding Enabled";
}

export function getTimeBucketLabel(bucket: FeatureTimeBucket): string {
  if (bucket === "under_5") return "Under 5 minutes";
  if (bucket === "5_15") return "5–15 minutes";
  if (bucket === "15_30") return "15–30 minutes";
  return "30+ minutes";
}

export function getSortOptionLabel(sort: FeatureSortOption): string {
  const labels: Record<FeatureSortOption, string> = {
    featured: "Featured",
    popular: "Most Popular",
    newest: "Newest",
    oldest: "Oldest",
    az: "Alphabetical (A–Z)",
    za: "Alphabetical (Z–A)",
    time_asc: "Estimated Time (Low → High)",
    time_desc: "Estimated Time (High → Low)",
  };
  return labels[sort];
}

export function deriveFeatureFilterOptions(features: Feature[] = FEATURES) {
  const categories = [...new Set(features.map((f) => f.category))].sort();
  const statuses = [...new Set(features.map((f) => f.status))];
  const difficulties = [
    ...new Set(features.map((f) => f.difficulty)),
  ] as FeatureDifficulty[];
  const technologies = [
    ...new Set(features.flatMap((f) => f.technologies)),
  ].sort();
  const aiSupport = [
    ...new Set(features.flatMap((f) => f.aiSupport)),
  ] as AiSupportFlag[];
  const timeBuckets = [
    ...new Set(features.map((f) => f.estimatedTimeBucket)),
  ] as FeatureTimeBucket[];

  const statusOrder: FeatureStatus[] = [
    "available",
    "new",
    "beta",
    "coming_soon",
  ];
  const difficultyOrder: FeatureDifficulty[] = [
    "Beginner",
    "Intermediate",
    "Advanced",
  ];
  const timeOrder: FeatureTimeBucket[] = [
    "under_5",
    "5_15",
    "15_30",
    "30_plus",
  ];
  const aiOrder: AiSupportFlag[] = ["ai", "voice", "resume", "coding"];

  return {
    categories,
    statuses: statusOrder.filter((s) => statuses.includes(s)),
    difficulties: difficultyOrder.filter((d) => difficulties.includes(d)),
    technologies,
    aiSupport: aiOrder.filter((a) => aiSupport.includes(a)),
    timeBuckets: timeOrder.filter((t) => timeBuckets.includes(t)),
  };
}
