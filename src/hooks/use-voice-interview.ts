"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { submitAnswer } from "@/lib/actions";
import { fetchApi, ApiClientError } from "@/lib/api/client";
import {
  createSpeechRecognition,
  isVoiceInterviewSupported,
  requestMicrophonePermission,
  speakText,
  stopSpeaking,
  waitForVoices,
} from "@/lib/voice/browser-speech";
import { voiceLog } from "@/lib/voice/voice-logger";
import type { AnswerAnalysis } from "@/types";

export type VoiceInterviewState =
  | "idle"
  | "preparing"
  | "aiSpeaking"
  | "listening"
  | "userSpeaking"
  | "confirming"
  | "processing"
  | "generatingNextQuestion"
  | "interviewCompleted"
  | "unsupported"
  | "permission_denied";

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface VoiceQuestion {
  id: string;
  order: number;
  content: string;
  type: string;
}

interface UseVoiceInterviewOptions {
  interviewId: string;
  language: string;
  questions: VoiceQuestion[];
  initialMessages: VoiceMessage[];
  initialQuestionIndex: number;
  initialClarificationRound?: number;
  onMessagesChange: (messages: VoiceMessage[]) => void;
  onQuestionIndexChange: (index: number) => void;
  onClarificationRoundChange?: (round: number) => void;
  onDraftAnswerChange?: (draft: string) => void;
  onEvaluationChange?: (evaluation: AnswerAnalysis | null) => void;
  onComplete: () => Promise<void>;
  elapsedTime: number;
}

const SILENCE_SUBMIT_MS = 2000;
const MIN_TRANSCRIPT_LENGTH = 3;
const RECOGNITION_RESTART_DELAY_MS = 150;

function nextMessageId(ref: React.MutableRefObject<number>) {
  ref.current += 1;
  return `msg-${ref.current}`;
}

function mapLanguageCode(language: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    english: "en-US",
    es: "es-ES",
    spanish: "es-ES",
    fr: "fr-FR",
    french: "fr-FR",
    de: "de-DE",
    german: "de-DE",
    hi: "hi-IN",
    hindi: "hi-IN",
  };

  const normalized = language.trim().toLowerCase();
  return map[normalized] ?? (normalized.includes("-") ? language : "en-US");
}

export function useVoiceInterview({
  interviewId,
  language,
  questions,
  initialMessages,
  initialQuestionIndex,
  initialClarificationRound = 0,
  onMessagesChange,
  onQuestionIndexChange,
  onClarificationRoundChange,
  onDraftAnswerChange,
  onEvaluationChange,
  onComplete,
  elapsedTime,
}: UseVoiceInterviewOptions) {
  const [voiceState, setVoiceState] = useState<VoiceInterviewState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<{
    message: string;
    retryAfterSeconds: number;
  } | null>(null);
  const [isQuotaRetrying, setIsQuotaRetrying] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>(initialMessages);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerAnalysis | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(initialQuestionIndex);

  const messageIdRef = useRef(initialMessages.length);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speakAbortRef = useRef<AbortController | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const sessionActiveRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const transcriptRef = useRef("");
  const messagesRef = useRef(messages);
  const questionIndexRef = useRef(currentQuestionIndex);
  const voiceStateRef = useRef<VoiceInterviewState>("idle");
  const answerSavedForQuestionRef = useRef<string | null>(null);
  const pendingInterviewerPayloadRef = useRef<{
    questionId: string;
    answer: string;
    clarificationRound: number;
  } | null>(null);
  const clarificationRoundRef = useRef(initialClarificationRound);
  const langCode = mapLanguageCode(language);

  useEffect(() => {
    messagesRef.current = messages;
    questionIndexRef.current = currentQuestionIndex;
    transcriptRef.current = transcript;
    voiceStateRef.current = voiceState;
  }, [messages, currentQuestionIndex, transcript, voiceState]);

  useEffect(() => {
    onDraftAnswerChange?.(transcript);
  }, [transcript, onDraftAnswerChange]);

  const setEvaluation = useCallback(
    (evaluation: AnswerAnalysis | null) => {
      setLastEvaluation(evaluation);
      onEvaluationChange?.(evaluation);
    },
    [onEvaluationChange]
  );

  const syncClarificationRound = useCallback(
    (round: number) => {
      clarificationRoundRef.current = round;
      onClarificationRoundChange?.(round);
    },
    [onClarificationRoundChange]
  );

  const transitionTo = useCallback((next: VoiceInterviewState, detail?: string) => {
    voiceLog("state", {
      from: voiceStateRef.current,
      to: next,
      detail,
    });
    voiceStateRef.current = next;
    setVoiceState(next);
  }, []);

  const syncMessages = useCallback(
    (next: VoiceMessage[]) => {
      messagesRef.current = next;
      setMessages(next);
      onMessagesChange(next);
    },
    [onMessagesChange]
  );

  const syncQuestionIndex = useCallback(
    (index: number) => {
      questionIndexRef.current = index;
      setCurrentQuestionIndex(index);
      onQuestionIndexChange(index);
    },
    [onQuestionIndexChange]
  );

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRecognitionRestartTimer = useCallback(() => {
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    clearRecognitionRestartTimer();
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, [clearRecognitionRestartTimer]);

  const stopAllVoice = useCallback(() => {
    sessionActiveRef.current = false;
    clearSilenceTimer();
    clearRecognitionRestartTimer();
    speakAbortRef.current?.abort();
    speakAbortRef.current = null;
    stopSpeaking();
    stopRecognition();
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
  }, [clearRecognitionRestartTimer, clearSilenceTimer, stopRecognition]);

  /** Stop STT/TTS without ending the interview — used for mode switches. */
  const pauseVoice = useCallback(() => {
    clearSilenceTimer();
    clearRecognitionRestartTimer();
    speakAbortRef.current?.abort();
    speakAbortRef.current = null;
    stopSpeaking();
    stopRecognition();
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    sessionActiveRef.current = false;
    transitionTo("idle", "paused-for-mode-switch");

    const snapshot = {
      messages: messagesRef.current,
      questionIndex: questionIndexRef.current,
      clarificationRound: clarificationRoundRef.current,
      draftAnswer: transcriptRef.current.trim(),
      lastEvaluation,
    };

    onMessagesChange(snapshot.messages);
    onQuestionIndexChange(snapshot.questionIndex);
    onClarificationRoundChange?.(snapshot.clarificationRound);
    onDraftAnswerChange?.(snapshot.draftAnswer);
    onEvaluationChange?.(snapshot.lastEvaluation);

    return snapshot;
  }, [
    clearRecognitionRestartTimer,
    clearSilenceTimer,
    lastEvaluation,
    onClarificationRoundChange,
    onDraftAnswerChange,
    onEvaluationChange,
    onMessagesChange,
    onQuestionIndexChange,
    stopRecognition,
    transitionTo,
  ]);

  const buildQuestionSpeech = useCallback(
    (questionIndex: number) => {
      const question = questions[questionIndex];
      return question?.content ?? "";
    },
    [questions]
  );

  const buildInitialSpeech = useCallback(() => {
    const questionSpeech = buildQuestionSpeech(questionIndexRef.current);

    // Resuming after a mode switch — only re-read the current question.
    if (messagesRef.current.length > 0 || questionIndexRef.current > 0) {
      return questionSpeech
        ? `Continuing from where we left off. ${questionSpeech}`
        : "Continuing from where we left off. Please share your answer.";
    }

    const lastAssistant = [...messagesRef.current]
      .reverse()
      .find((m) => m.role === "assistant");

    if (lastAssistant && questionSpeech) {
      return `${lastAssistant.content} ${questionSpeech}`;
    }
    return lastAssistant?.content ?? questionSpeech;
  }, [buildQuestionSpeech]);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim() || !sessionActiveRef.current) return;

      stopRecognition();
      isSpeakingRef.current = true;
      transitionTo("aiSpeaking", "speak-start");

      const controller = new AbortController();
      speakAbortRef.current = controller;

      try {
        await waitForVoices();
        await speakText(text, { lang: langCode, signal: controller.signal });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          voiceLog("speech:aborted");
          return;
        }
        throw error;
      } finally {
        isSpeakingRef.current = false;
        speakAbortRef.current = null;
      }
    },
    [langCode, stopRecognition, transitionTo]
  );

  const startListening = useCallback(
    (opts?: { keepTranscript?: boolean }) => {
      if (!sessionActiveRef.current) {
        voiceLog("recognition:blocked", { reason: "session-inactive" });
        return;
      }

      if (isSpeakingRef.current) {
        voiceLog("recognition:blocked", { reason: "still-speaking" });
        return;
      }

      if (isProcessingRef.current) {
        voiceLog("recognition:blocked", { reason: "still-processing" });
        return;
      }

      const recognition = recognitionRef.current;
      if (!recognition) {
        voiceLog("recognition:blocked", { reason: "no-recognition" });
        return;
      }

      if (isListeningRef.current) {
        voiceLog("recognition:already-active");
        return;
      }

      if (!opts?.keepTranscript) {
        setTranscript("");
        setInterimTranscript("");
        transcriptRef.current = "";
      } else {
        setInterimTranscript("");
      }

      isListeningRef.current = true;
      transitionTo("listening", "mic-start");

      try {
        recognition.lang = langCode;
        recognition.start();
        voiceLog("recognition:start");
      } catch (error) {
        isListeningRef.current = false;
        voiceLog("recognition:start-failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [langCode, transitionTo]
  );

  const resumeListening = useCallback(async () => {
    if (!sessionActiveRef.current) return;

    // Ensure speech synthesis queue is fully drained before opening mic.
    await new Promise((resolve) => setTimeout(resolve, RECOGNITION_RESTART_DELAY_MS));

    if (!sessionActiveRef.current || isSpeakingRef.current || isProcessingRef.current) {
      return;
    }

    transitionTo("listening", "resume-after-speech");
    startListening();
  }, [startListening, transitionTo]);

  const processInterviewerResponse = useCallback(
    async (payload: {
      questionId: string;
      answer: string;
      clarificationRound: number;
      userMessage: VoiceMessage;
      priorMessages: VoiceMessage[];
    }) => {
      const { response, evaluation, shouldAdvanceQuestion } = await fetchApi<{
        response: string;
        evaluation: AnswerAnalysis;
        shouldAdvanceQuestion: boolean;
      }>("/api/ai/interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          questionId: payload.questionId,
          answer: payload.answer,
          clarificationRound: payload.clarificationRound,
        }),
      });

      voiceLog("gemini:response", {
        length: response.length,
        scoreOutOf10: evaluation?.scoreOutOf10,
        shouldAdvanceQuestion,
        preview: response.slice(0, 120),
      });

      const assistantMessage: VoiceMessage = {
        id: nextMessageId(messageIdRef),
        role: "assistant",
        content: response,
      };

      syncMessages([...payload.priorMessages, assistantMessage]);
      setEvaluation(evaluation);
      answerSavedForQuestionRef.current = null;
      pendingInterviewerPayloadRef.current = null;
      setQuotaError(null);

      if (evaluation?.scoreOutOf10 != null) {
        toast.info(`Score: ${evaluation.scoreOutOf10}/10`, {
          description: evaluation.coachingTips?.[0],
        });
      }

      const isLastQuestion =
        questionIndexRef.current >= questions.length - 1;

      isProcessingRef.current = false;

      if (shouldAdvanceQuestion && isLastQuestion) {
        transitionTo("interviewCompleted", "last-question");
        await speak(
          `${response} That concludes our interview. Thank you for your time.`
        );
        await onComplete();
        return;
      }

      if (!shouldAdvanceQuestion) {
        syncClarificationRound(clarificationRoundRef.current + 1);
        transitionTo("aiSpeaking", "clarification-follow-up");
        await speak(response);
        await resumeListening();
        return;
      }

      syncClarificationRound(0);
      const nextIndex = questionIndexRef.current + 1;
      syncQuestionIndex(nextIndex);
      setEvaluation(null);

      const nextQuestionSpeech = buildQuestionSpeech(nextIndex);
      const speech = nextQuestionSpeech
        ? `${response} ${nextQuestionSpeech}`
        : response;

      await speak(speech);
      await resumeListening();
    },
    [
      buildQuestionSpeech,
      interviewId,
      onComplete,
      questions.length,
      resumeListening,
      setEvaluation,
      speak,
      syncClarificationRound,
      syncMessages,
      syncQuestionIndex,
      transitionTo,
    ]
  );

  const submitTranscript = useCallback(async (overrideText?: string) => {
    const finalText = (overrideText ?? transcriptRef.current).trim();
    const question = questions[questionIndexRef.current];

    if (
      !finalText ||
      finalText.length < MIN_TRANSCRIPT_LENGTH ||
      !question ||
      isProcessingRef.current
    ) {
      return;
    }

    isProcessingRef.current = true;
    clearSilenceTimer();
    stopRecognition();
    transitionTo("processing", "submit-transcript");

    voiceLog("transcript:final", {
      length: finalText.length,
      preview: finalText.slice(0, 120),
      questionId: question.id,
    });

    const userMessage: VoiceMessage = {
      id: nextMessageId(messageIdRef),
      role: "user",
      content: finalText,
    };

    const nextMessages = [...messagesRef.current, userMessage];
    syncMessages(nextMessages);
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
    onDraftAnswerChange?.("");

    try {
      transitionTo("generatingNextQuestion", "gemini-request");

      const alreadySaved = answerSavedForQuestionRef.current === question.id;

      if (!alreadySaved) {
        await submitAnswer({
          interviewId,
          questionId: question.id,
          content: finalText,
          duration: elapsedTime,
        });
        answerSavedForQuestionRef.current = question.id;
        voiceLog("answer:saved", { questionId: question.id });
      }

      pendingInterviewerPayloadRef.current = {
        questionId: question.id,
        answer: finalText,
        clarificationRound: clarificationRoundRef.current,
      };
      await processInterviewerResponse({
        questionId: question.id,
        answer: finalText,
        clarificationRound: clarificationRoundRef.current,
        userMessage,
        priorMessages: nextMessages,
      });
    } catch (error) {
      isProcessingRef.current = false;

      const isRateLimited =
        error instanceof ApiClientError && error.isRateLimited;

      const message = isRateLimited
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to process your answer. Please try again.";

      voiceLog("pipeline:error", {
        message,
        isRateLimited,
        retryAfterSeconds:
          error instanceof ApiClientError
            ? error.retryAfterSeconds
            : undefined,
      });

      if (isRateLimited) {
        setQuotaError({
          message,
          retryAfterSeconds: error.retryAfterSeconds ?? 60,
        });
        transitionTo("idle", "rate-limited");
        return;
      }

      toast.error(message);

      if (sessionActiveRef.current) {
        await resumeListening();
      }
    }
  }, [
    clearSilenceTimer,
    elapsedTime,
    interviewId,
    onDraftAnswerChange,
    processInterviewerResponse,
    questions,
    resumeListening,
    stopRecognition,
    syncMessages,
    transitionTo,
  ]);

  const prepareConfirmTranscript = useCallback(() => {
    const text = transcriptRef.current.trim();
    if (!text || text.length < MIN_TRANSCRIPT_LENGTH) {
      return;
    }
    clearSilenceTimer();
    stopRecognition();
    transitionTo("confirming", "awaiting-user-confirm");
  }, [clearSilenceTimer, stopRecognition, transitionTo]);

  const confirmTranscript = useCallback(
    async (editedText?: string) => {
      const text = (editedText ?? transcriptRef.current).trim();
      if (editedText != null) {
        transcriptRef.current = editedText;
        setTranscript(editedText);
      }
      await submitTranscript(text);
    },
    [submitTranscript]
  );

  const discardConfirmTranscript = useCallback(async () => {
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
    onDraftAnswerChange?.("");
    if (sessionActiveRef.current) {
      await resumeListening();
    }
  }, [onDraftAnswerChange, resumeListening]);

  const continueSpeaking = useCallback(async () => {
    if (sessionActiveRef.current) {
      transitionTo("listening", "continue-after-confirm");
      startListening({ keepTranscript: true });
    }
  }, [startListening, transitionTo]);

  const retryAfterQuota = useCallback(async () => {
    const pending = pendingInterviewerPayloadRef.current;
    if (!pending || isQuotaRetrying) return;

    setIsQuotaRetrying(true);
    setQuotaError(null);
    isProcessingRef.current = true;
    transitionTo("generatingNextQuestion", "quota-retry");

    try {
      const userMessage: VoiceMessage = {
        id: nextMessageId(messageIdRef),
        role: "user",
        content: pending.answer,
      };
      await processInterviewerResponse({
        ...pending,
        userMessage,
        priorMessages: messagesRef.current,
      });
    } catch (error) {
      isProcessingRef.current = false;
      const isRateLimited =
        error instanceof ApiClientError && error.isRateLimited;

      if (isRateLimited) {
        setQuotaError({
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds ?? 60,
        });
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Retry failed. Please try again."
        );
        await resumeListening();
      }
    } finally {
      setIsQuotaRetrying(false);
    }
  }, [
    isQuotaRetrying,
    processInterviewerResponse,
    resumeListening,
    transitionTo,
  ]);

  const scheduleSubmitOnSilence = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      prepareConfirmTranscript();
    }, SILENCE_SUBMIT_MS);
  }, [clearSilenceTimer, prepareConfirmTranscript]);

  const scheduleRecognitionRestart = useCallback(() => {
    clearRecognitionRestartTimer();
    recognitionRestartTimerRef.current = setTimeout(() => {
      if (
        sessionActiveRef.current &&
        !isSpeakingRef.current &&
        !isProcessingRef.current &&
        voiceStateRef.current !== "confirming" &&
        (voiceStateRef.current === "listening" ||
          voiceStateRef.current === "userSpeaking")
      ) {
        voiceLog("recognition:auto-restart");
        startListening();
      }
    }, RECOGNITION_RESTART_DELAY_MS);
  }, [clearRecognitionRestartTimer, startListening]);

  const setupRecognition = useCallback(() => {
    const recognition = createSpeechRecognition();
    if (!recognition) return null;

    recognition.onstart = () => {
      voiceLog("recognition:started");
      if (
        !isSpeakingRef.current &&
        !isProcessingRef.current &&
        sessionActiveRef.current
      ) {
        transitionTo("listening");
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (
        isSpeakingRef.current ||
        isProcessingRef.current ||
        !sessionActiveRef.current
      ) {
        return;
      }

      let interim = "";
      let finalChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += text;
        } else {
          interim += text;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
        transitionTo("userSpeaking", "interim");
        clearSilenceTimer();
      }

      if (finalChunk) {
        const updated = `${transcriptRef.current}${finalChunk}`.trim();
        transcriptRef.current = updated ? `${updated} ` : "";
        setTranscript(transcriptRef.current);
        setInterimTranscript("");
        transitionTo("userSpeaking", "final-chunk");
        voiceLog("transcript:chunk", { chunk: finalChunk });
        scheduleSubmitOnSilence();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      voiceLog("recognition:error", { error: event.error });

      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }

      if (event.error === "not-allowed") {
        transitionTo("permission_denied");
        setErrorMessage(
          "Microphone permission was denied. Enable microphone access in your browser settings to continue in Voice Mode."
        );
        stopRecognition();
        return;
      }

      if (event.error === "network") {
        toast.error("Speech recognition network error. Retrying...");
        scheduleRecognitionRestart();
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      voiceLog("recognition:ended", { state: voiceStateRef.current });

      if (
        sessionActiveRef.current &&
        !isSpeakingRef.current &&
        !isProcessingRef.current &&
        voiceStateRef.current !== "confirming" &&
        (voiceStateRef.current === "listening" ||
          voiceStateRef.current === "userSpeaking")
      ) {
        scheduleRecognitionRestart();
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [
    clearSilenceTimer,
    scheduleRecognitionRestart,
    scheduleSubmitOnSilence,
    stopRecognition,
    transitionTo,
  ]);

  const beginVoiceInterview = useCallback(async () => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    sessionActiveRef.current = true;

    transitionTo("preparing");

    if (!isVoiceInterviewSupported()) {
      transitionTo("unsupported");
      setErrorMessage(
        "Voice Mode requires Chrome or Edge with Web Speech API support."
      );
      return;
    }

    const micGranted = await requestMicrophonePermission();
    if (!micGranted) {
      transitionTo("permission_denied");
      setErrorMessage(
        "Microphone access is required for Voice Mode. Please allow microphone access and reload."
      );
      return;
    }

    setupRecognition();

    try {
      await waitForVoices();
      const speech = buildInitialSpeech();
      await speak(speech);
      await resumeListening();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Failed to start voice interview");
      transitionTo("idle");
      hasInitializedRef.current = false;
    }
  }, [
    buildInitialSpeech,
    resumeListening,
    setupRecognition,
    speak,
    transitionTo,
  ]);

  const beginVoiceInterviewRef = useRef(beginVoiceInterview);

  useEffect(() => {
    beginVoiceInterviewRef.current = beginVoiceInterview;
  }, [beginVoiceInterview]);

  useEffect(() => {
    void beginVoiceInterviewRef.current();

    return () => {
      stopAllVoice();
      hasInitializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopInterview = useCallback(async () => {
    const partial = transcriptRef.current.trim();
    const question = questions[questionIndexRef.current];

    stopAllVoice();
    transitionTo("interviewCompleted", "user-stopped");

    if (partial && question && partial.length >= MIN_TRANSCRIPT_LENGTH) {
      try {
        const userMessage: VoiceMessage = {
          id: nextMessageId(messageIdRef),
          role: "user",
          content: partial,
        };
        syncMessages([...messagesRef.current, userMessage]);
        await submitAnswer({
          interviewId,
          questionId: question.id,
          content: partial,
          duration: elapsedTime,
        });
        toast.success("Your last answer was saved.");
      } catch {
        toast.error("Could not save your last answer.");
      }
    }
  }, [
    elapsedTime,
    interviewId,
    questions,
    stopAllVoice,
    syncMessages,
    transitionTo,
  ]);

  return {
    voiceState,
    transcript,
    setTranscript: (value: string) => {
      transcriptRef.current = value;
      setTranscript(value);
      onDraftAnswerChange?.(value);
    },
    interimTranscript,
    errorMessage,
    quotaError,
    isQuotaRetrying,
    messages,
    currentQuestionIndex,
    currentQuestion: questions[currentQuestionIndex] ?? null,
    stopInterview,
    pauseVoice,
    beginVoiceInterview,
    confirmTranscript,
    discardConfirmTranscript,
    continueSpeaking,
    retryAfterQuota,
    dismissQuotaError: () => setQuotaError(null),
    lastEvaluation,
  };
}
