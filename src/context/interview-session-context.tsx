"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AnswerAnalysis, InterviewMode } from "@/types";

export type SessionMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type InterviewSessionStore = {
  activeMode: InterviewMode;
  messages: SessionMessage[];
  currentQuestionIndex: number;
  clarificationRound: number;
  elapsedTime: number;
  lastEvaluation: AnswerAnalysis | null;
  /** In-progress answer draft (typed or spoken) carried across mode switches. */
  draftAnswer: string;
  setActiveMode: (mode: InterviewMode) => void;
  setMessages: React.Dispatch<React.SetStateAction<SessionMessage[]>>;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  setClarificationRound: React.Dispatch<React.SetStateAction<number>>;
  setElapsedTime: React.Dispatch<React.SetStateAction<number>>;
  tickElapsed: () => void;
  setLastEvaluation: React.Dispatch<React.SetStateAction<AnswerAnalysis | null>>;
  setDraftAnswer: React.Dispatch<React.SetStateAction<string>>;
  syncFromVoice: (payload: {
    messages: SessionMessage[];
    questionIndex: number;
    clarificationRound: number;
    draftAnswer?: string;
    lastEvaluation?: AnswerAnalysis | null;
  }) => void;
};

const InterviewSessionContext = createContext<InterviewSessionStore | null>(
  null
);

export function InterviewSessionProvider({
  children,
  initialMode,
  initialMessages = [],
  initialQuestionIndex = 0,
}: {
  children: ReactNode;
  initialMode: InterviewMode;
  initialMessages?: SessionMessage[];
  initialQuestionIndex?: number;
}) {
  const [activeMode, setActiveMode] = useState<InterviewMode>(initialMode);
  const [messages, setMessages] = useState<SessionMessage[]>(initialMessages);
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(initialQuestionIndex);
  const [clarificationRound, setClarificationRound] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerAnalysis | null>(
    null
  );
  const [draftAnswer, setDraftAnswer] = useState("");

  const tickElapsed = useCallback(() => {
    setElapsedTime((t) => t + 1);
  }, []);

  const syncFromVoice = useCallback(
    (payload: {
      messages: SessionMessage[];
      questionIndex: number;
      clarificationRound: number;
      draftAnswer?: string;
      lastEvaluation?: AnswerAnalysis | null;
    }) => {
      setMessages(payload.messages);
      setCurrentQuestionIndex(payload.questionIndex);
      setClarificationRound(payload.clarificationRound);
      if (payload.draftAnswer !== undefined) {
        setDraftAnswer(payload.draftAnswer);
      }
      if (payload.lastEvaluation !== undefined) {
        setLastEvaluation(payload.lastEvaluation);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      activeMode,
      messages,
      currentQuestionIndex,
      clarificationRound,
      elapsedTime,
      lastEvaluation,
      draftAnswer,
      setActiveMode,
      setMessages,
      setCurrentQuestionIndex,
      setClarificationRound,
      setElapsedTime,
      tickElapsed,
      setLastEvaluation,
      setDraftAnswer,
      syncFromVoice,
    }),
    [
      activeMode,
      messages,
      currentQuestionIndex,
      clarificationRound,
      elapsedTime,
      lastEvaluation,
      draftAnswer,
      tickElapsed,
      syncFromVoice,
    ]
  );

  return (
    <InterviewSessionContext.Provider value={value}>
      {children}
    </InterviewSessionContext.Provider>
  );
}

export function useInterviewSession() {
  const ctx = useContext(InterviewSessionContext);
  if (!ctx) {
    throw new Error(
      "useInterviewSession must be used within InterviewSessionProvider"
    );
  }
  return ctx;
}
