"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnswerAnalysis } from "@/types";

interface AnswerEvaluationCardProps {
  evaluation: AnswerAnalysis;
  questionNumber: number;
}

export function AnswerEvaluationCard({
  evaluation,
  questionNumber,
}: AnswerEvaluationCardProps) {
  const scoreOutOf10 =
    evaluation.scoreOutOf10 ?? Math.round((evaluation.score ?? 0) / 10);
  const isStrong = scoreOutOf10 >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <Card
        className={
          isStrong
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        }
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {isStrong ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Target className="h-5 w-5 text-amber-500" />
              )}
              Answer Evaluation — Q{questionNumber}
            </CardTitle>
            <Badge variant={isStrong ? "default" : "secondary"} className="text-lg px-3">
              {scoreOutOf10}/10
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {evaluation.correctness && (
              <Metric label="Correctness" value={evaluation.correctness} />
            )}
            {evaluation.technicalAccuracy && (
              <Metric label="Technical Accuracy" value={evaluation.technicalAccuracy} />
            )}
            {evaluation.completeness && (
              <Metric label="Completeness" value={evaluation.completeness} />
            )}
            {evaluation.communicationQuality && (
              <Metric label="Communication" value={evaluation.communicationQuality} />
            )}
          </div>

          {evaluation.coachingTips && evaluation.coachingTips.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 font-medium text-primary">
                <Lightbulb className="h-4 w-4" />
                Coaching
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {evaluation.coachingTips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.incorrectStatements &&
            evaluation.incorrectStatements.length > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Incorrect or Misleading
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {evaluation.incorrectStatements.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

          {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
            <div>
              <p className="mb-1 font-medium">What You Missed</p>
              <ul className="space-y-1 text-muted-foreground">
                {evaluation.missingPoints.map((point, i) => (
                  <li key={i}>• {point}</li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.idealAnswerKeyPoints &&
            evaluation.idealAnswerKeyPoints.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Ideal Answer Should Include
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {evaluation.idealAnswerKeyPoints.map((point, i) => (
                    <li key={i}>• {point}</li>
                  ))}
                </ul>
              </div>
            )}

          {(evaluation.betterAnswer || evaluation.betterVersion) && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1 font-medium">How to Answer Better</p>
              <p className="text-muted-foreground">
                {evaluation.betterAnswer || evaluation.betterVersion}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
