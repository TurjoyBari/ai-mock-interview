"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { InterviewModeSwitch } from "@/components/interview/interview-mode-switch";
import {
  InterviewSessionProvider,
  useInterviewSession,
  type SessionMessage,
} from "@/context/interview-session-context";
import { interviewDetailPath } from "@/lib/routes";
import { isVoiceInterviewSupported } from "@/lib/voice/browser-speech";
import type { AnswerAnalysis, InterviewMode } from "@/types";

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
  messages: SessionMessage[];
  answers: { questionId: string }[];
}

function estimateSpeakingSeconds(text: string): number {
  // ~150 words/min ≈ 12.5 chars/sec for English prose
  const chars = text.trim().length;
  if (!chars) return 0;
  return Math.max(1, Math.round(chars / 12.5));
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function TextInterviewSession({
  interview,
  interviewId,
  onSwitchMode,
  switching,
}: {
  interview: InterviewData;
  interviewId: string;
  onSwitchMode: (mode: InterviewMode) => void;
  switching?: boolean;
}) {
  const router = useRouter();
  const {
    messages,
    setMessages,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    clarificationRound,
    setClarificationRound,
    elapsedTime,
    lastEvaluation,
    setLastEvaluation,
    draftAnswer,
    setDraftAnswer,
  } = useInterviewSession();

  const [input, setInput] = useState(draftAnswer);
  const [submitting, setSubmitting] = useState(false);
  const [showCoding, setShowCoding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(messages.length);

  useEffect(() => {
    setDraftAnswer(input);
  }, [input, setDraftAnswer]);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `msg-${messageIdRef.current}`;
  };

  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / interview.questions.length) * 100;
  const speakingEstimate = estimateSpeakingSeconds(input);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmitAnswer = async () => {
    if (!input.trim() || !currentQuestion || submitting) return;

    setSubmitting(true);
    const userMessage: SessionMessage = {
      id: nextMessageId(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setDraftAnswer("");

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

      const assistantMessage: SessionMessage = {
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
        toast.info(
          "Follow-up: the interviewer wants you to elaborate on this question."
        );
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">{interview.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {interview.type.replace(/_/g, " ")}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <InterviewModeSwitch
            mode="text"
            onChange={onSwitchMode}
            disabled={submitting || switching}
          />
          <div className="w-40">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>
                Q{currentQuestionIndex + 1}/{interview.questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
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
            <div className="flex-1 space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer… (Enter to submit, Shift+Enter for new line)"
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmitAnswer();
                  }
                }}
                disabled={submitting}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{input.length} characters</span>
                <span>
                  ~{speakingEstimate}s speaking time
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                onClick={() => void handleSubmitAnswer()}
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
          onClick={() => void handleComplete()}
          disabled={submitting}
        >
          End Interview
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function InterviewSessionBody({
  interview,
  interviewId,
}: {
  interview: InterviewData;
  interviewId: string;
}) {
  const {
    activeMode,
    setActiveMode,
    messages,
    setMessages,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    clarificationRound,
    setClarificationRound,
    elapsedTime,
    setDraftAnswer,
    setLastEvaluation,
  } = useInterviewSession();

  const [switching, setSwitching] = useState(false);
  const voiceMountKey = useRef(0);

  const handleSwitchMode = useCallback(
    (mode: InterviewMode) => {
      if (mode === activeMode) return;

      if (mode === "voice" && !isVoiceInterviewSupported()) {
        toast.error(
          "Voice Mode needs Chrome or Edge with Speech Recognition support. Staying in Text Mode."
        );
        return;
      }

      setSwitching(true);
      if (mode === "voice") {
        voiceMountKey.current += 1;
      }
      setActiveMode(mode);
      toast.success(
        mode === "voice" ? "Switched to Voice Mode" : "Switched to Text Mode"
      );
      // Allow animation frame for smooth transition
      requestAnimationFrame(() => setSwitching(false));
    },
    [activeMode, setActiveMode]
  );

  return (
    <AnimatePresence mode="wait">
      {activeMode === "voice" ? (
        <motion.div
          key={`voice-${voiceMountKey.current}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <VoiceInterviewSession
            interviewId={interviewId}
            title={interview.title}
            type={interview.type}
            language={interview.language}
            questions={interview.questions}
            initialMessages={messages}
            initialQuestionIndex={currentQuestionIndex}
            initialClarificationRound={clarificationRound}
            elapsedTime={elapsedTime}
            onMessagesChange={setMessages}
            onQuestionIndexChange={setCurrentQuestionIndex}
            onClarificationRoundChange={setClarificationRound}
            onDraftAnswerChange={setDraftAnswer}
            onEvaluationChange={setLastEvaluation}
            onSwitchMode={handleSwitchMode}
            switching={switching}
          />
        </motion.div>
      ) : (
        <motion.div
          key="text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <TextInterviewSession
            interview={interview}
            interviewId={interviewId}
            onSwitchMode={handleSwitchMode}
            switching={switching}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InterviewSessionShell({
  interview,
  interviewId,
}: {
  interview: InterviewData;
  interviewId: string;
}) {
  const { setElapsedTime } = useInterviewSession();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (interview.status === "in_progress") {
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interview.status, setElapsedTime]);

  return (
    <InterviewSessionBody interview={interview} interviewId={interviewId} />
  );
}

export function InterviewSessionClient({ interviewId }: { interviewId: string }) {
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bootMessages, setBootMessages] = useState<SessionMessage[]>([]);
  const [bootQuestionIndex, setBootQuestionIndex] = useState(0);

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
          setLoadError(
            "This interview has no questions. Please create a new interview."
          );
          return;
        }

        if (data.status === "scheduled") {
          await startInterview(interviewId);
          const updatedData = await fetchApi<InterviewData>(
            `/api/interviews/${interviewId}`
          );
          if (cancelled) return;
          setInterview(updatedData);
          setBootMessages(
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
          setBootMessages(
            (data.messages ?? []).map((m, i) => ({
              id: m.id ?? `msg-${i}`,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
          setBootQuestionIndex(data.answers?.length ?? 0);
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

  const initialMode = useMemo<InterviewMode>(() => {
    return interview?.mode === "voice" ? "voice" : "text";
  }, [interview?.mode]);

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

  return (
    <InterviewSessionProvider
      initialMode={initialMode}
      initialMessages={bootMessages}
      initialQuestionIndex={bootQuestionIndex}
    >
      <InterviewSessionShell interview={interview} interviewId={interviewId} />
    </InterviewSessionProvider>
  );
}
