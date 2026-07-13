export type DashboardRange = "7d" | "30d" | "90d" | "all";

export interface DashboardOverview {
  totalInterviews: number;
  totalQuestionsAnswered: number;
  averageOverallScore: number;
  practiceStreak: number;
  totalPracticeMinutes: number;
  bestScore: number;
  averageConfidenceScore: number;
  averageCommunicationScore: number;
  averageTechnicalScore: number;
  averageBehavioralScore: number;
}

export interface DashboardTrendPoint {
  date: string;
  dateKey: string;
  overall: number;
  confidence: number;
  communication: number;
  technical: number;
  behavioral: number;
}

export interface DashboardTopicStat {
  topic: string;
  score: number;
  level: "strong" | "average" | "weak";
  answeredCount: number;
  catalog: string;
}

export interface DashboardHistoryItem {
  id: string;
  date: string;
  completedAt: string | null;
  title: string;
  type: string;
  typeLabel: string;
  techStack: string[];
  difficulty: string;
  questionCount: number;
  answersCount: number;
  duration: number;
  overallScore: number | null;
  reportId: string | null;
}

export interface DashboardInsight {
  id: string;
  text: string;
  tone: "positive" | "neutral" | "warning";
}

export interface DashboardReadiness {
  score: number;
  level: "Beginner" | "Intermediate" | "Interview Ready" | "Job Ready";
  nextLevel: string | null;
  nextLevelAt: number | null;
  tips: string[];
}

export interface DashboardRoadmapWeek {
  week: number;
  topics: string[];
}

export interface DashboardAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface DashboardAnalytics {
  overview: DashboardOverview;
  trends: DashboardTrendPoint[];
  topics: DashboardTopicStat[];
  weakTopics: string[];
  strongTopics: string[];
  history: DashboardHistoryItem[];
  insights: DashboardInsight[];
  readiness: DashboardReadiness;
  roadmap: DashboardRoadmapWeek[];
  achievements: DashboardAchievement[];
  /** Total completed interviews regardless of the selected range filter. */
  allTimeInterviewCount: number;
}
