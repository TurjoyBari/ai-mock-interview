"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  Clock,
  Volume2,
  AlertCircle,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { completeInterview } from "@/lib/actions";
import { interviewDetailPath } from "@/lib/routes";
import {
  useVoiceInterview,
  type VoiceInterviewState,
  type VoiceMessage,
  type VoiceQuestion,
} from "@/hooks/use-voice-interview";
import { QuotaExceededAlert } from "@/components/ai/quota-exceeded-alert";
import { AnswerEvaluationCard } from "@/components/interview/answer-evaluation-card";
import { InterviewModeSwitch } from "@/components/interview/interview-mode-switch";
import type { AnswerAnalysis, InterviewMode } from "@/types";

interface VoiceInterviewSessionProps {
  interviewId: string;
  title: string;
  type: string;
  language: string;
  questions: VoiceQuestion[];
  initialMessages: VoiceMessage[];
  initialQuestionIndex: number;
  initialClarificationRound: number;
  elapsedTime: number;
  onMessagesChange: (messages: VoiceMessage[]) => void;
  onQuestionIndexChange: (index: number) => void;
  onClarificationRoundChange: (round: number) => void;
  onDraftAnswerChange: (draft: string) => void;
  onEvaluationChange: (evaluation: AnswerAnalysis | null) => void;
  onSwitchMode: (mode: InterviewMode) => void;
  switching?: boolean;
}

const STATE_LABELS: Record<VoiceInterviewState, string> = {
  idle: "Ready",
  preparing: "Preparing voice interview…",
  aiSpeaking: "AI is speaking…",
  listening: "Listening — speak your answer",
  userSpeaking: "Hearing you…",
  confirming: "Review your answer",
  processing: "Processing your answer…",
  generatingNextQuestion: "AI is generating the next question…",
  interviewCompleted: "Interview completed",
  unsupported: "Voice not supported",
  permission_denied: "Microphone access required",
};

function VoiceIndicator({ state }: { state: VoiceInterviewState }) {
  const isActive =
    state === "listening" ||
    state === "userSpeaking" ||
    state === "aiSpeaking" ||
    state === "generatingNextQuestion" ||
    state === "processing" ||
    state === "confirming";

  const isListening = state === "listening" || state === "userSpeaking";
  const isSpeaking =
    state === "aiSpeaking" ||
    state === "generatingNextQuestion" ||
    state === "processing";

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative flex h-28 w-28 items-center justify-center">
        {isActive && (
          <>
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isListening ? "bg-primary/20" : "bg-violet-500/20"
              }`}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className={`absolute inset-2 rounded-full ${
                isListening ? "bg-primary/30" : "bg-violet-500/30"
              }`}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
        <div
          className={`relative flex h-20 w-20 items-center justify-center rounded-full ${
            isListening
              ? "bg-primary text-primary-foreground"
              : isSpeaking
                ? "bg-violet-600 text-white"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {isSpeaking ? (
            <Volume2 className="h-8 w-8" />
          ) : isListening ? (
            <Mic className="h-8 w-8" />
          ) : state === "permission_denied" ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </div>
      </div>
      <p className="text-center text-sm font-medium text-muted-foreground">
        {STATE_LABELS[state]}
      </p>
    </div>
  );
}

export function VoiceInterviewSession({
  interviewId,
  title,
  type,
  language,
  questions,
  initialMessages,
  initialQuestionIndex,
  initialClarificationRound,
  elapsedTime,
  onMessagesChange,
  onQuestionIndexChange,
  onClarificationRoundChange,
  onDraftAnswerChange,
  onEvaluationChange,
  onSwitchMode,
  switching,
}: VoiceInterviewSessionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ending, setEnding] = useState(false);

  const handleComplete = useCallback(async () => {
    await completeInterview(interviewId);
    toast.success("Interview completed! Generating feedback...");
    router.push(interviewDetailPath(interviewId));
  }, [interviewId, router]);

  const {
    voiceState,
    transcript,
    setTranscript,
    interimTranscript,
    errorMessage,
    quotaError,
    isQuotaRetrying,
    messages: voiceMessages,
    currentQuestionIndex,
    currentQuestion,
    stopInterview,
    pauseVoice,
    confirmTranscript,
    discardConfirmTranscript,
    continueSpeaking,
    retryAfterQuota,
    dismissQuotaError,
    lastEvaluation,
  } = useVoiceInterview({
    interviewId,
    language,
    questions,
    initialMessages,
    initialQuestionIndex,
    initialClarificationRound,
    onMessagesChange,
    onQuestionIndexChange,
    onClarificationRoundChange,
    onDraftAnswerChange,
    onEvaluationChange,
    onComplete: handleComplete,
    elapsedTime,
  });

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceMessages, transcript, interimTranscript]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleModeChange = (mode: InterviewMode) => {
    if (mode === "voice" || switching) return;
    pauseVoice();
    onSwitchMode("text");
  };

  const handleEndInterview = async () => {
    setEnding(true);
    await stopInterview();
    try {
      await completeInterview(interviewId);
      toast.success("Interview ended. Generating feedback...");
      router.push(interviewDetailPath(interviewId));
    } catch {
      toast.error("Failed to complete interview");
    } finally {
      setEnding(false);
    }
  };

  const showFallback =
    voiceState === "unsupported" || voiceState === "permission_denied";

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{type.replace(/_/g, " ")}</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <InterviewModeSwitch
            mode="voice"
            onChange={handleModeChange}
            disabled={ending || switching || voiceState === "interviewCompleted"}
          />
          <div className="w-40">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>
                Q{currentQuestionIndex + 1}/{questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>
      </div>

      {quotaError && (
        <QuotaExceededAlert
          message={quotaError.message}
          retryAfterSeconds={quotaError.retryAfterSeconds}
          onRetry={retryAfterQuota}
          onDismiss={dismissQuotaError}
          isRetrying={isQuotaRetrying}
        />
      )}

      {showFallback ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold">Voice Mode Unavailable</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {errorMessage}
              </p>
            </div>
            <Button variant="outline" onClick={() => handleModeChange("text")}>
              Switch to Text Mode
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-1 flex-col overflow-hidden">
          <VoiceIndicator state={voiceState} />

          <ScrollArea className="flex-1 border-t border-border/50 p-4">
            <div className="space-y-4">
              <AnimatePresence>
                {voiceMessages.map((message) => (
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

              {(transcript || interimTranscript || voiceState === "confirming") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-border/50 bg-card p-4"
                >
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {voiceState === "confirming"
                      ? "Edit your answer, then confirm to submit"
                      : "Your Answer (live transcript)"}
                  </p>
                  {voiceState === "confirming" ? (
                    <div className="space-y-3">
                      <Textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="min-h-[100px] resize-none"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => void confirmTranscript(transcript)}
                          disabled={transcript.trim().length < 3}
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Confirm & Submit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void continueSpeaking()}
                        >
                          <Mic className="mr-1.5 h-3.5 w-3.5" />
                          Keep Speaking
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void discardConfirmTranscript()}
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Discard
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">
                      {transcript}
                      {interimTranscript && (
                        <span className="text-muted-foreground">
                          {transcript ? " " : ""}
                          {interimTranscript}
                        </span>
                      )}
                    </p>
                  )}
                </motion.div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <CardContent className="border-t border-border/50 p-4">
            <p className="text-center text-xs text-muted-foreground">
              {voiceState === "confirming"
                ? "Review the transcript, edit if needed, then confirm."
                : voiceState === "listening" || voiceState === "userSpeaking"
                  ? "Speak naturally. After a brief pause you can review before submitting."
                  : voiceState === "aiSpeaking"
                    ? "Please wait while the interviewer speaks…"
                    : voiceState === "generatingNextQuestion"
                      ? "Generating your next question…"
                      : "Voice interview in progress"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={handleEndInterview}
          disabled={ending || voiceState === "interviewCompleted"}
        >
          {ending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          Stop Interview
        </Button>
      </div>
    </div>
  );
}
