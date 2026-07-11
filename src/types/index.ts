export type InterviewType =
  | "hr"
  | "behavioral"
  | "technical"
  | "coding"
  | "system_design"
  | "frontend"
  | "backend"
  | "fullstack"
  | "database"
  | "javascript"
  | "react"
  | "nextjs"
  | "nodejs"
  | "typescript"
  | "python"
  | "dotnet"
  | "devops"
  | "aiml"
  | "custom";

export type Difficulty = "easy" | "medium" | "hard" | "senior" | "staff";

export type InterviewMode = "text" | "voice";

export type InterviewStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type InterviewPhase =
  | "introduction"
  | "warmup"
  | "main"
  | "followup"
  | "coding"
  | "behavioral"
  | "hr"
  | "final"
  | "completed";

export type TopicDifficulty = "easy" | "medium" | "hard" | "mixed";

export type QuestionDistribution =
  | "ai_decide"
  | "even"
  | "focus_weak"
  | "random"
  | "custom";

export interface TopicSelection {
  name: string;
  difficulty: TopicDifficulty;
  questionCount: number;
  /** Used by Focus on Weak Topics distribution */
  isWeak?: boolean;
}

export interface InterviewConfig {
  type: InterviewType;
  difficulty: Difficulty;
  company?: string;
  customCompany?: string;
  jobRole?: string;
  experienceLevel?: string;
  techStack: string[];
  duration: number;
  questionCount: number;
  language: string;
  mode: InterviewMode;
  cameraEnabled: boolean;
  hintsEnabled: boolean;
  /** User-selected interview topics (optional — AI picks balanced set if empty) */
  topics?: TopicSelection[];
  questionDistribution?: QuestionDistribution;
}

export interface AnswerAnalysis {
  score: number;
  scoreOutOf10?: number;
  scorePercent?: number;
  isGood: boolean;
  correctness?: string;
  technicalAccuracy?: string;
  completeness?: string;
  communicationQuality?: string;
  confidence?: string;
  strengths?: string[];
  weaknesses?: string[];
  missingPoints?: string[];
  incorrectStatements?: string[];
  idealAnswerKeyPoints?: string[];
  bestPractices?: string[];
  commonMistakes?: string[];
  interviewerExpectations?: string;
  coachingTips?: string[];
  betterAnswer?: string;
  whyGood: string[];
  whyWeak: string[];
  betterVersion: string;
  industryAnswer: string;
  recruiterView: string;
  weakPoints: string[];
  strongPoints: string[];
  followUpType?: "clarification" | "deeper" | "next_question";
  followUpQuestion?: string | null;
  shouldAdvanceQuestion?: boolean;
  interviewerResponse?: string;
  topicTag?: string;
}

export interface AnswerCoachingComparison {
  whatMissed: string[];
  whatToImprove: string[];
  pointsToAdd: string[];
  partsToRemoveOrSimplify: string[];
}

export interface AnswerCoachingMistakes {
  incorrectStatements: string[];
  missingConcepts: string[];
  missingKeywords: string[];
  weakExplanations: string[];
  missingTechnicalDetails: string[];
  communicationProblems: string[];
  whyItMatters: string;
}

export interface AnswerCoaching {
  question: string;
  answer: string;
  scoreOutOf10: number;
  technicalAccuracy: string;
  communication: string;
  confidence: string;
  completeness: string;
  clarity: string;
  whatYouDidWell: string[];
  whatYouMissed: AnswerCoachingMistakes;
  idealInterviewAnswer: string;
  whyStrongAnswer: string;
  comparison: AnswerCoachingComparison;
  practiceVersion: string;
  /** @deprecated Use practiceVersion — kept for older saved reports */
  betterSpeakingVersion?: string;
  interviewTips: string[];
  difficultyLevel: "easy" | "medium" | "hard";
  difficultyExplanation: string;
  recommendedPractice: string[];
  topicTag?: string;
}

export interface FeedbackScores {
  overallScore: number;
  communicationScore: number;
  confidenceScore: number;
  grammarScore?: number;
  pronunciationScore?: number;
  fluencyScore?: number;
  vocabularyScore?: number;
  technicalScore: number;
  problemSolvingScore: number;
  behaviorScore: number;
  leadershipScore?: number;
  criticalThinkingScore?: number;
  timeManagementScore?: number;
  weakAreas: string[];
  strongAreas: string[];
  weakTopics?: string[];
  strongTopics?: string[];
  suggestions: string[];
  mistakesMade?: string[];
  questionsAnsweredWell?: { question: string; score: number; reason?: string }[];
  questionsAnsweredPoorly?: { question: string; score: number; issue?: string }[];
  recommendedStudyTopics?: string[];
  improvementRoadmap?: {
    topic: string;
    priority: "high" | "medium" | "low";
    actions: string[];
    resources?: string[];
  }[];
  recurringPatterns?: string[];
  detailedExplanation: string;
  confidenceGraph?: { time: number; score: number }[];
}

/** Alias for AI-generated end-of-interview feedback (same shape as FeedbackScores). */
export type InterviewReportData = FeedbackScores;

export interface ResumeSectionFeedback {
  status: "strong" | "adequate" | "weak" | "missing";
  strengths: string[];
  weaknesses: string[];
  missing: string[];
  improvements: string[];
}

export interface ResumeScoreBreakdown {
  overall: number;
  strength: number;
  formatting: number;
  keywordMatch: number;
  skills: number;
  experience: number;
  education: number;
  projects: number;
  readability: number;
}

export interface ResumeKeywordAnalysis {
  strong: string[];
  weak: string[];
  missing: string[];
  suggested: string[];
}

export interface ResumeImprovementSuggestion {
  title: string;
  detail: string;
  whyItHelpsAts: string;
  priority: "high" | "medium" | "low";
}

export interface ResumeRewriteSuggestions {
  professionalSummary: string;
  experienceBullets: string[];
  projectDescriptions: string[];
  skillsSection: string[];
}

export interface ResumeAnalysis {
  fullName?: string;
  professionalTitle?: string;
  summary?: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  skills: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  certifications?: string[];
  languages?: string[];
  achievements?: string[];
  projects: { name: string; description: string; technologies: string[] }[];
  education: { institution: string; degree: string; year: string }[];
  experience: {
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }[];
  strengths: string[];
  weaknesses: string[];
  atsScore: number;
  scores?: ResumeScoreBreakdown;
  sectionFeedback?: {
    summary?: ResumeSectionFeedback;
    skills?: ResumeSectionFeedback;
    experience?: ResumeSectionFeedback;
    projects?: ResumeSectionFeedback;
    education?: ResumeSectionFeedback;
    certifications?: ResumeSectionFeedback;
  };
  keywordAnalysis?: ResumeKeywordAnalysis;
  missingSkills: string[];
  suggestions: string[];
  improvementSuggestions?: ResumeImprovementSuggestion[];
  actionPlan?: string[];
  rewrites?: ResumeRewriteSuggestions;
}

export interface JobMatchResult {
  matchScore: number;
  missingSkills: string[];
  matchingSkills?: string[];
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    density: number;
  };
  atsImprovements: string[];
  suggestions: string[];
  interviewQuestions: string[];
  sectionRecommendations?: {
    section: string;
    recommendation: string;
  }[];
}

export interface CodingProblem {
  title: string;
  statement: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: { input: string; expectedOutput: string; hidden: boolean }[];
  hints: string[];
  topics: string[];
}

export interface CodingEvaluation {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  timeComplexity: string;
  spaceComplexity: string;
  feedback: string;
  alternativeSolutions: string[];
  score: number;
}

export interface DashboardStats {
  upcomingPractice: { id: string; title: string; scheduledAt: Date }[];
  recentInterviews: {
    id: string;
    title: string;
    score: number | null;
    date: Date;
    type: string;
  }[];
  averageScore: number;
  communicationScore: number;
  technicalScore: number;
  behavioralScore: number;
  weakTopics: string[];
  strongTopics: string[];
  recentFeedback: string[];
  progressData: { date: string; score: number }[];
  practiceStreak: number;
  totalInterviews: number;
}

export interface CoachPlanData {
  topics: string[];
  projects: string[];
  codingProblems: string[];
  behavioral: string[];
  resumeTips: string[];
  companyRoadmap: Record<string, string[]>;
  weeklySchedule: { day: string; tasks: string[] }[];
}

export interface SearchResult {
  type: "interview" | "question" | "report" | "feedback" | "company";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}
