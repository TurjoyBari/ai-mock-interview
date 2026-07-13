import {
  Brain,
  Mic,
  Code,
  FileText,
  ScanSearch,
  Target,
  Sparkles,
  BarChart3,
  TrendingUp,
  Building2,
  Map,
  GraduationCap,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { FeatureIconName } from "@/data/features";

export const FEATURE_ICONS: Record<FeatureIconName, LucideIcon> = {
  brain: Brain,
  mic: Mic,
  code: Code,
  fileText: FileText,
  scan: ScanSearch,
  target: Target,
  sparkles: Sparkles,
  barChart: BarChart3,
  trendingUp: TrendingUp,
  building: Building2,
  map: Map,
  graduationCap: GraduationCap,
  shield: Shield,
};

const IMAGE_GRADIENTS: Record<string, string> = {
  "ai-interviews":
    "from-sky-600/90 via-cyan-700/80 to-slate-900",
  "voice-mode":
    "from-teal-600/90 via-emerald-800/70 to-slate-900",
  "coding-interview":
    "from-indigo-700/90 via-slate-800 to-slate-950",
  "resume-analyzer":
    "from-amber-700/80 via-orange-900/70 to-slate-900",
  "ats-score":
    "from-rose-700/80 via-slate-800 to-slate-950",
  "job-match":
    "from-cyan-700/80 via-blue-900/70 to-slate-950",
  "ai-feedback":
    "from-emerald-700/80 via-teal-900/70 to-slate-950",
  "interview-report":
    "from-blue-700/80 via-slate-800 to-slate-950",
  "progress-analytics":
    "from-sky-700/80 via-cyan-900/60 to-slate-950",
  "company-interviews":
    "from-stone-600/80 via-slate-800 to-slate-950",
  "learning-roadmap":
    "from-lime-800/70 via-teal-900/70 to-slate-950",
  "career-coach":
    "from-cyan-800/80 via-slate-800 to-slate-950",
  authentication:
    "from-slate-600/80 via-slate-800 to-slate-950",
};

export function getFeatureGradient(imageKey: string): string {
  return IMAGE_GRADIENTS[imageKey] ?? "from-slate-700 via-slate-800 to-slate-950";
}
