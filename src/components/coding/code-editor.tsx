"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CODING_LANGUAGES } from "@/lib/constants";
import { submitCode } from "@/lib/actions";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-muted rounded-xl">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
});

interface CodingProblem {
  title: string;
  statement: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: { input: string; expectedOutput: string; hidden: boolean }[];
}

interface CodeEditorProps {
  interviewId: string;
  problem: CodingProblem;
}

export function CodeEditor({ interviewId, problem }: CodeEditorProps) {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(getDefaultCode("javascript"));
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    passedTests: number;
    totalTests: number;
    feedback: string;
    timeComplexity: string;
    spaceComplexity: string;
    score: number;
  } | null>(null);

  function getDefaultCode(lang: string) {
    const templates: Record<string, string> = {
      javascript: `function solution(input) {\n  // Your code here\n  return input;\n}`,
      typescript: `function solution(input: unknown): unknown {\n  // Your code here\n  return input;\n}`,
      python: `def solution(input):\n    # Your code here\n    return input`,
      java: `class Solution {\n    public Object solution(Object input) {\n        // Your code here\n        return input;\n    }\n}`,
      csharp: `public class Solution {\n    public object Solution(object input) {\n        // Your code here\n        return input;\n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}`,
      go: `package main\n\nfunc solution(input interface{}) interface{} {\n    // Your code here\n    return input\n}`,
      rust: `fn solution(input: &str) -> String {\n    // Your code here\n    input.to_string()\n}`,
      php: `<?php\nfunction solution($input) {\n    // Your code here\n    return $input;\n}`,
    };
    return templates[lang] ?? templates.javascript;
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(getDefaultCode(lang));
    setResult(null);
  };

  const handleRun = async () => {
    setEvaluating(true);
    try {
      const { evaluation } = await submitCode({
        interviewId,
        language,
        code,
        problemStatement: problem.statement,
        testCases: problem.testCases.map((t) => ({
          input: t.input,
          expectedOutput: t.expectedOutput,
        })),
      });
      setResult(evaluation);
      toast.success(
        evaluation.passed
          ? "All tests passed!"
          : `${evaluation.passedTests}/${evaluation.totalTests} tests passed`
      );
    } catch {
      toast.error("Failed to evaluate code");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{problem.title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {problem.statement}
          </p>
        </div>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODING_LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/50 p-4 text-sm">
            <p className="font-medium">Sample Input</p>
            <pre className="mt-1 font-mono text-xs">{problem.sampleInput}</pre>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-sm">
            <p className="font-medium">Sample Output</p>
            <pre className="mt-1 font-mono text-xs">{problem.sampleOutput}</pre>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <MonacoEditor
            height="400px"
            language={
              CODING_LANGUAGES.find((l) => l.value === language)?.monaco ??
              "javascript"
            }
            value={code}
            onChange={(v) => setCode(v ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Constraints: {problem.constraints}
          </p>
          <Button onClick={handleRun} disabled={evaluating}>
            {evaluating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run & Evaluate
          </Button>
        </div>

        {result && (
          <div className="space-y-3 rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <Badge variant={result.passed ? "success" : "warning"}>
                {result.passedTests}/{result.totalTests} passed
              </Badge>
              <Badge variant="secondary">Score: {result.score}%</Badge>
              <span className="text-xs text-muted-foreground">
                Time: {result.timeComplexity} | Space: {result.spaceComplexity}
              </span>
            </div>
            <p className="text-sm">{result.feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
