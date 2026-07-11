"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { startInterview, submitAnswer, completeInterview } from "@/lib/actions";
import { fetchApi } from "@/lib/api/client";
import { CodeEditor } from "@/components/coding/code-editor";
import { VoiceInterviewSession } from "@/components/interview/voice-interview-session";
import { AnswerEvaluationCard } from "@/components/interview/answer-evaluation-card";
import { interviewDetailPath } from "@/lib/routes";
import type { AnswerAnalysis } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Question {
  id: string;
  order: number;
  content: string;
  type: string;
  codingProblem?: Record<string, unknown> | null;
}

interface InterviewData {
  id: string;
  title: string;
  type: string;
  mode: string;
  language: string;
  status: string;
  duration: number;
  questions: Question[];
  messages: Message[];
  answers: { questionId: string }[];
}

function TextInterviewSession({
  interview,
  interviewId,
  messages,
  setMessages,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  elapsedTime,
}: {
  interview: InterviewData;
  interviewId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  elapsedTime: number;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCoding, setShowCoding] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerAnalysis | null>(null);
  const [clarificationRound, setClarificationRound] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `msg-${messageIdRef.current}`;
  };

  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / interview.questions.length) * 100;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmitAnswer = async () => {
    if (!input.trim() || !currentQuestion || !interview) return;

    setSubmitting(true);
    const userMessage: Message = {
      id: nextMessageId(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      await submitAnswer({
        interviewId,
        questionId: currentQuestion.id,
        content: userMessage.content,
        duration: elapsedTime,
      });

      const { response, evaluation, shouldAdvanceQuestion } = await fetchApi<{
        response: string;
        evaluation: AnswerAnalysis;
        shouldAdvanceQuestion: boolean;
      }>("/api/ai/interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          questionId: currentQuestion.id,
          answer: userMessage.content,
          clarificationRound,
        }),
      });

      if (!response?.trim()) {
        throw new Error("Empty interviewer response");
      }

      const assistantMessage: Message = {
        id: nextMessageId(),
        role: "assistant",
        content: response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLastEvaluation(evaluation);

      if (evaluation?.scoreOutOf10 != null) {
        toast.info(`Score: ${evaluation.scoreOutOf10}/10`, {
          description: evaluation.coachingTips?.[0],
        });
      }

      if (shouldAdvanceQuestion) {
        setClarificationRound(0);
        if (currentQuestionIndex < interview.questions.length - 1) {
          setCurrentQuestionIndex((i) => i + 1);
          setLastEvaluation(null);
        } else {
          await handleComplete();
        }
      } else {
        setClarificationRound((r) => r + 1);
        toast.info("Follow-up: the interviewer wants you to elaborate on this question.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message.includes("digest")
            ? "Failed to submit answer. Please try again."
            : error.message
          : "Failed to submit answer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await completeInterview(interviewId);
      toast.success("Interview completed! Generating feedback...");
      router.push(interviewDetailPath(interviewId));
    } catch {
      toast.error("Failed to complete interview. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{interview.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">
              {interview.type.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline">Text Mode</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
        <div className="w-48">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>
              Q{currentQuestionIndex + 1}/{interview.questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {currentQuestion?.type === "coding" && currentQuestion.codingProblem && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCoding(!showCoding)}
          className="self-start"
        >
          {showCoding ? "Hide" : "Open"} Code Editor
        </Button>
      )}

      {showCoding && currentQuestion?.codingProblem && (
        <CodeEditor
          interviewId={interviewId}
          problem={
            currentQuestion.codingProblem as {
              title: string;
              statement: string;
              constraints: string;
              sampleInput: string;
              sampleOutput: string;
              testCases: {
                input: string;
                expectedOutput: string;
                hidden: boolean;
              }[];
            }
          }
        />
      )}

      <Card className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {lastEvaluation && (
              <AnswerEvaluationCard
                evaluation={lastEvaluation}
                questionNumber={currentQuestionIndex + 1}
              />
            )}

            {currentQuestion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4"
              >
                <p className="mb-1 text-xs font-medium text-primary">
                  Current Question
                </p>
                <p className="text-sm">{currentQuestion.content}</p>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <CardContent className="border-t border-border/50 p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              disabled={submitting}
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                onClick={handleSubmitAnswer}
                disabled={submitting || !input.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleComplete}
          disabled={submitting}
        >
          End Interview
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function InterviewSessionClient({ interviewId }: { interviewId: string }) {
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [useTextMode, setUseTextMode] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInterview() {
      if (!interviewId) {
        setLoadError("Invalid interview ID");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchApi<InterviewData>(
          `/api/interviews/${interviewId}`
        );

        if (cancelled) return;

        if (!data.questions?.length) {
          setLoadError("This interview has no questions. Please create a new interview.");
          return;
        }

        if (data.status === "scheduled") {
          await startInterview(interviewId);
          const updatedData = await fetchApi<InterviewData>(
            `/api/interviews/${interviewId}`
          );
          if (cancelled) return;
          setInterview(updatedData);
          setMessages(
            (updatedData.messages ?? []).map((m, i) => ({
              id: m.id ?? `msg-${i}`,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        } else if (data.status === "completed") {
          setLoadError("This interview is already completed.");
          setInterview(data);
        } else {
          setInterview(data);
          setMessages(
            (data.messages ?? []).map((m, i) => ({
              id: m.id ?? `msg-${i}`,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
          setCurrentQuestionIndex(data.answers?.length ?? 0);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to load interview";
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInterview();

    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  useEffect(() => {
    if (interview?.status === "in_progress") {
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interview?.status]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError || !interview) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Unable to start interview</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {loadError ?? "Interview not found or you do not have access."}
        </p>
      </div>
    );
  }

  const isVoiceMode = interview.mode === "voice" && !useTextMode;

  if (isVoiceMode) {
    return (
      <VoiceInterviewSession
        interviewId={interviewId}
        title={interview.title}
        type={interview.type}
        language={interview.language}
        duration={interview.duration}
        questions={interview.questions}
        initialMessages={messages}
        initialQuestionIndex={currentQuestionIndex}
        elapsedTime={elapsedTime}
        onElapsedTimeTick={() => setElapsedTime((t) => t + 1)}
        onSwitchToTextMode={() => {
          toast.info("Switched to Text Mode for this session.");
          setUseTextMode(true);
        }}
      />
    );
  }

  return (
    <TextInterviewSession
      interview={interview}
      interviewId={interviewId}
      messages={messages}
      setMessages={setMessages}
      currentQuestionIndex={currentQuestionIndex}
      setCurrentQuestionIndex={setCurrentQuestionIndex}
      elapsedTime={elapsedTime}
    />
  );
}
