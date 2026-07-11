export const INTERVIEW_TYPES = [
  { value: "hr", label: "HR Interview", icon: "Users" },
  { value: "behavioral", label: "Behavioral Interview", icon: "MessageSquare" },
  { value: "technical", label: "Technical Interview", icon: "Cpu" },
  { value: "coding", label: "Coding Interview", icon: "Code" },
  { value: "system_design", label: "System Design Interview", icon: "Network" },
  { value: "frontend", label: "Frontend Interview", icon: "Layout" },
  { value: "backend", label: "Backend Interview", icon: "Server" },
  { value: "fullstack", label: "Full Stack Interview", icon: "Layers" },
  { value: "database", label: "Database Interview", icon: "Database" },
  { value: "javascript", label: "JavaScript Interview", icon: "FileCode" },
  { value: "react", label: "React Interview", icon: "Atom" },
  { value: "nextjs", label: "Next.js Interview", icon: "Globe" },
  { value: "nodejs", label: "Node.js Interview", icon: "Hexagon" },
  { value: "typescript", label: "TypeScript Interview", icon: "FileType" },
  { value: "python", label: "Python Interview", icon: "Snake" },
  { value: "dotnet", label: ".NET Interview", icon: "Box" },
  { value: "devops", label: "DevOps Interview", icon: "Cloud" },
  { value: "aiml", label: "AI/ML Interview", icon: "Brain" },
  { value: "custom", label: "Custom Interview", icon: "Sparkles" },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", color: "text-emerald-500" },
  { value: "medium", label: "Medium", color: "text-amber-500" },
  { value: "hard", label: "Hard", color: "text-orange-500" },
  { value: "senior", label: "Senior", color: "text-red-500" },
  { value: "staff", label: "Staff Engineer", color: "text-purple-500" },
] as const;

export const COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Netflix",
  "Apple",
  "OpenAI",
  "Stripe",
  "Shopify",
  "Uber",
  "Airbnb",
  "Oracle",
  "IBM",
  "Tesla",
  "Spotify",
  "Cloudflare",
  "Custom",
] as const;

export const EXPERIENCE_LEVELS = [
  "Intern",
  "Junior",
  "Mid-Level",
  "Senior",
  "Staff",
  "Principal",
] as const;

export const TOPIC_DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
] as const;

export const QUESTION_DISTRIBUTION_OPTIONS = [
  {
    value: "ai_decide",
    label: "AI Decide",
    description: "AI balances topics by relevance and difficulty",
  },
  {
    value: "even",
    label: "Even Distribution",
    description: "Equal questions across selected topics",
  },
  {
    value: "focus_weak",
    label: "Focus on Weak Topics",
    description: "More questions on topics marked weak or hard",
  },
  {
    value: "random",
    label: "Random",
    description: "Random mix within selected topics only",
  },
  {
    value: "custom",
    label: "Custom",
    description: "You set exact question counts per topic",
  },
] as const;

export const CODING_LANGUAGES = [
  { value: "javascript", label: "JavaScript", monaco: "javascript" },
  { value: "typescript", label: "TypeScript", monaco: "typescript" },
  { value: "python", label: "Python", monaco: "python" },
  { value: "java", label: "Java", monaco: "java" },
  { value: "csharp", label: "C#", monaco: "csharp" },
  { value: "cpp", label: "C++", monaco: "cpp" },
  { value: "go", label: "Go", monaco: "go" },
  { value: "rust", label: "Rust", monaco: "rust" },
  { value: "php", label: "PHP", monaco: "php" },
] as const;

export const INTERVIEW_PHASES = [
  "introduction",
  "warmup",
  "main",
  "followup",
  "coding",
  "behavioral",
  "hr",
  "final",
  "completed",
] as const;

export const VOICE_OPTIONS = [
  { value: "Kore", label: "Kore (Neutral)" },
  { value: "Puck", label: "Puck (Upbeat)" },
  { value: "Aoede", label: "Aoede (Warm)" },
  { value: "Charon", label: "Charon (Deep)" },
  { value: "Leda", label: "Leda (Bright)" },
  { value: "Zephyr", label: "Zephyr (Soft)" },
] as const;

export const ACHIEVEMENT_TYPES = {
  FIRST_INTERVIEW: "first_interview",
  STREAK_7: "streak_7",
  STREAK_30: "streak_30",
  SCORE_90: "score_90",
  CODING_MASTER: "coding_master",
  BEHAVIORAL_PRO: "behavioral_pro",
  INTERVIEW_10: "interview_10",
  INTERVIEW_50: "interview_50",
} as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/interviews/new", label: "New Interview", icon: "PlusCircle" },
  { href: "/interviews/history", label: "History", icon: "History" },
  { href: "/resume", label: "Resume", icon: "FileText" },
  { href: "/job-match", label: "Job Match", icon: "Target" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/coach", label: "AI Coach", icon: "GraduationCap" },
  { href: "/notes", label: "Notes", icon: "StickyNote" },
  { href: "/search", label: "Search", icon: "Search" },
  { href: "/profile", label: "Profile", icon: "User" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
