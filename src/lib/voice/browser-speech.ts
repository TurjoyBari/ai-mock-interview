export type BrowserSpeechSupport = {
  synthesis: boolean;
  recognition: boolean;
};

export function checkBrowserSpeechSupport(): BrowserSpeechSupport {
  if (typeof window === "undefined") {
    return { synthesis: false, recognition: false };
  }

  return {
    synthesis: "speechSynthesis" in window,
    recognition:
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
  };
}

export function isVoiceInterviewSupported(): boolean {
  const { synthesis, recognition } = checkBrowserSpeechSupport();
  return synthesis && recognition;
}

export function createSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;

  const Ctor =
    window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;

  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const langPrefix = lang.split("-")[0];
  const ranked = voices
    .filter((v) => v.lang.startsWith(langPrefix))
    .sort((a, b) => {
      const aScore =
        (a.localService ? 2 : 0) +
        (a.default ? 1 : 0) +
        (a.name.includes("Natural") ? 1 : 0);
      const bScore =
        (b.localService ? 2 : 0) +
        (b.default ? 1 : 0) +
        (b.name.includes("Natural") ? 1 : 0);
      return bScore - aScore;
    });

  return ranked[0] ?? voices[0];
}

export function waitForVoices(timeoutMs = 3000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const timer = setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve(window.speechSynthesis.getVoices());
    }, timeoutMs);

    const onVoices = () => {
      const loaded = window.speechSynthesis.getVoices();
      if (loaded.length > 0) {
        clearTimeout(timer);
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        resolve(loaded);
      }
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
  });
}

export function speakText(
  text: string,
  options?: { lang?: string; signal?: AbortSignal }
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!text.trim()) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = options?.lang ?? "en-US";
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;

    let finished = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

    const finish = (reason: string) => {
      if (finished) return;
      finished = true;
      if (pollInterval) clearInterval(pollInterval);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      cleanup();
      console.log(`[Voice:speech:end]`, { reason, textLength: text.length });
      resolve();
    };

    const onAbort = () => {
      synth.cancel();
      if (finished) return;
      finished = true;
      if (pollInterval) clearInterval(pollInterval);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      cleanup();
      reject(new DOMException("Speech synthesis aborted", "AbortError"));
    };

    const cleanup = () => {
      options?.signal?.removeEventListener("abort", onAbort);
    };

    if (options?.signal?.aborted) {
      onAbort();
      return;
    }
    options?.signal?.addEventListener("abort", onAbort);

    console.log(`[Voice:speech:start]`, { textLength: text.length, lang });

    utterance.onstart = () => {
      console.log(`[Voice:speech:started]`);
    };

    utterance.onend = () => finish("onend");

    utterance.onerror = (event) => {
      if (finished) return;
      cleanup();
      if (pollInterval) clearInterval(pollInterval);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      finished = true;
      if (event.error === "interrupted" || event.error === "canceled") {
        reject(new DOMException("Speech synthesis aborted", "AbortError"));
        return;
      }
      console.error(`[Voice:speech:error]`, { error: event.error });
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    // Chrome/Edge sometimes skip onend for long utterances — poll as fallback.
    pollInterval = setInterval(() => {
      if (finished) return;
      if (!synth.speaking && !synth.pending) {
        finish("poll");
      }
    }, 300);

    // Safety cap so we never hang forever in aiSpeaking.
    const estimatedMs = Math.min(120_000, Math.max(15_000, text.length * 60));
    safetyTimeout = setTimeout(() => {
      if (!finished) {
        synth.cancel();
        finish("timeout");
      }
    }, estimatedMs);

    synth.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}
