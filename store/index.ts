import { create } from "zustand";
import {
  ALPHABET,
  buildProgressSummary,
  calculateMetrics,
  createDefaultLetterStats,
  FINGER_MAP,
  generateNormalPrompt,
  generateTargetedPrompt,
  Letter,
  LetterStat,
  pickWeakLettersForPrompt,
  PracticeMode,
  ProgressSummary,
  rankWeakLetters,
  SessionConfig,
  SessionResult,
  TargetType,
  updateLetterStat,
  WeakLetter,
} from "@/lib/typingEngine";

const STORAGE_KEY = "typogym-progress-v1";

type SessionStatus = "idle" | "running" | "ended";
type EndReason = "completed" | "escape" | "manual";

interface PersistedProgress {
  sessionHistory: SessionResult[];
  letterStats: Record<Letter, LetterStat>;
}

interface TypingEngineState {
  config: SessionConfig;
  status: SessionStatus;
  prompt: string;
  cursorIndex: number;
  currentError: boolean;
  remainingSec: number;
  sessionStartedAt: number | null;
  sessionEndsAt: number | null;
  charFocusStartedAt: number | null;
  correctChars: number;
  errors: number;
  sessionHistory: SessionResult[];
  letterStats: Record<Letter, LetterStat>;
  lastResult: SessionResult | null;

  setMode: (mode: PracticeMode) => void;
  setDuration: (durationSec: number) => void;
  setTargetType: (targetType: TargetType) => void;
  setTargetId: (targetId: string) => void;

  initPrompt: () => void;
  resetSession: () => void;
  hydrateProgress: () => void;
  startSession: (configOverride?: Partial<SessionConfig>) => void;
  restartSession: () => void;
  endSession: (reason?: EndReason) => void;
  handleKeystroke: (key: string, ts: number) => void;
  tick: (now: number) => void;

  getWeakLetters: (limit: number) => WeakLetter[];
  getProgressSummary: (window: number) => ProgressSummary;
}

const DEFAULT_CONFIG: SessionConfig = {
  mode: "normal",
  durationSec: 60,
  corpusMix: { real: 1.0, artificial: 0.0 },
  targetType: "letter",
  targetId: "a",
};

function persistProgress(data: PersistedProgress) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function readProgress(): PersistedProgress | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedProgress;

    if (!parsed.letterStats || !parsed.sessionHistory) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function buildPrompt(config: SessionConfig, letterStats: Record<Letter, LetterStat>): string {
  if (config.mode === "targeted") {
    const weakLetters = pickWeakLettersForPrompt(letterStats);
    return generateTargetedPrompt(config, weakLetters);
  }

  return generateNormalPrompt(config);
}

function boundedHistory(history: SessionResult[]): SessionResult[] {
  return history.slice(-200);
}

export const useTypingSession = create<TypingEngineState>((set, get) => ({
  config: DEFAULT_CONFIG,
  status: "idle",
  prompt: "",
  cursorIndex: 0,
  currentError: false,
  remainingSec: DEFAULT_CONFIG.durationSec,
  sessionStartedAt: null,
  sessionEndsAt: null,
  charFocusStartedAt: null,
  correctChars: 0,
  errors: 0,
  sessionHistory: [],
  letterStats: createDefaultLetterStats(),
  lastResult: null,

  setMode: (mode) =>
    set((state) => {
      const targetType = mode === "targeted" ? state.config.targetType ?? "letter" : undefined;
      const targetId =
        mode === "targeted"
          ? state.config.targetId ?? (targetType === "finger" ? "left-index" : "a")
          : undefined;

      const nextConfig: SessionConfig = {
        ...state.config,
        mode,
        targetType,
        targetId,
      };

      const nextPrompt =
        state.status === "idle"
          ? buildPrompt(nextConfig, state.letterStats)
          : state.prompt;

      return {
        config: nextConfig,
        prompt: nextPrompt,
        cursorIndex: state.status === "idle" ? 0 : state.cursorIndex,
        currentError: state.status === "idle" ? false : state.currentError,
      };
    }),

  setDuration: (durationSec) =>
    set((state) => {
      const nextConfig: SessionConfig = {
        ...state.config,
        durationSec,
      };
      const nextPrompt =
        state.status === "idle"
          ? buildPrompt(nextConfig, state.letterStats)
          : state.prompt;

      return {
        config: nextConfig,
        remainingSec: state.status === "running" ? state.remainingSec : durationSec,
        prompt: nextPrompt,
        cursorIndex: state.status === "idle" ? 0 : state.cursorIndex,
        currentError: state.status === "idle" ? false : state.currentError,
      };
    }),

  setTargetType: (targetType) =>
    set((state) => {
      const nextConfig: SessionConfig = {
        ...state.config,
        targetType,
        targetId: targetType === "finger" ? "left-index" : "a",
      };
      const nextPrompt =
        state.status === "idle"
          ? buildPrompt(nextConfig, state.letterStats)
          : state.prompt;

      return {
        config: nextConfig,
        prompt: nextPrompt,
        cursorIndex: state.status === "idle" ? 0 : state.cursorIndex,
        currentError: state.status === "idle" ? false : state.currentError,
      };
    }),

  setTargetId: (targetId) =>
    set((state) => {
      const nextConfig: SessionConfig = {
        ...state.config,
        targetId,
      };
      const nextPrompt =
        state.status === "idle"
          ? buildPrompt(nextConfig, state.letterStats)
          : state.prompt;

      return {
        config: nextConfig,
        prompt: nextPrompt,
        cursorIndex: state.status === "idle" ? 0 : state.cursorIndex,
        currentError: state.status === "idle" ? false : state.currentError,
      };
    }),

  initPrompt: () => {
    const state = get();
    if (!state.prompt || state.status === "idle") {
      const prompt = buildPrompt(state.config, state.letterStats);
      set({ prompt, cursorIndex: 0, currentError: false });
    }
  },

  resetSession: () => {
    const state = get();
    const prompt = buildPrompt(state.config, state.letterStats);
    set({
      status: "idle",
      prompt,
      cursorIndex: 0,
      currentError: false,
      remainingSec: state.config.durationSec,
      sessionStartedAt: null,
      sessionEndsAt: null,
      charFocusStartedAt: null,
      correctChars: 0,
      errors: 0,
      lastResult: null,
    });
  },

  hydrateProgress: () => {
    const persisted = readProgress();
    const fallbackStats = createDefaultLetterStats();
    const mergedStats = { ...fallbackStats };

    if (persisted) {
      ALPHABET.forEach((letter) => {
        if (persisted.letterStats[letter]) {
          mergedStats[letter] = {
            ...fallbackStats[letter],
            ...persisted.letterStats[letter],
          };
        }
      });
    }

    const currentState = get();
    const prompt = currentState.prompt || buildPrompt(currentState.config, mergedStats);

    set({
      sessionHistory: persisted ? persisted.sessionHistory : currentState.sessionHistory,
      letterStats: mergedStats,
      prompt,
    });
  },

  startSession: (configOverride) => {
    const state = get();
    const now = Date.now();
    const config = {
      ...state.config,
      ...configOverride,
    } as SessionConfig;

    const prompt =
      state.status === "idle" && state.prompt && !configOverride
        ? state.prompt
        : buildPrompt(config, state.letterStats);

    set({
      config,
      status: "running",
      prompt,
      cursorIndex: 0,
      currentError: false,
      remainingSec: config.durationSec,
      sessionStartedAt: now,
      sessionEndsAt: now + config.durationSec * 1000,
      charFocusStartedAt: now,
      correctChars: 0,
      errors: 0,
      lastResult: null,
    });
  },

  restartSession: () => {
    get().startSession();
  },

  endSession: (reason = "manual") => {
    const state = get();
    if (state.status !== "running" || !state.sessionStartedAt) {
      return;
    }

    const endedAt = Date.now();
    const metrics = calculateMetrics({
      startedAt: state.sessionStartedAt,
      endedAt,
      correctChars: state.correctChars,
      errors: state.errors,
    });

    const result: SessionResult = {
      startedAt: state.sessionStartedAt,
      endedAt,
      ...metrics,
      modeMeta: {
        mode: state.config.mode,
        targetType: state.config.targetType,
        targetId: state.config.targetId,
      },
    };

    set((prev) => {
      const nextHistory = boundedHistory([...prev.sessionHistory, result]);
      const nextState = {
        status: "ended" as SessionStatus,
        remainingSec: 0,
        sessionEndsAt: null,
        charFocusStartedAt: null,
        sessionHistory: nextHistory,
        lastResult: result,
      };

      persistProgress({
        sessionHistory: nextHistory,
        letterStats: prev.letterStats,
      });

      return nextState;
    });

    if (reason === "completed") {
      return;
    }
  },

  handleKeystroke: (rawKey, ts) => {
    const state = get();
    if (state.status !== "running" || !state.prompt) {
      return;
    }

    const key = rawKey.toLowerCase();
    const expected = state.prompt[state.cursorIndex];

    if (!expected) {
      get().endSession("completed");
      return;
    }

    if (key === "backspace") {
      if (state.cursorIndex > 0) {
        set({
          cursorIndex: state.cursorIndex - 1,
          correctChars: Math.max(0, state.correctChars - 1),
          currentError: false,
          charFocusStartedAt: ts,
        });
      }
      return;
    }

    if (key.length !== 1) {
      return;
    }

    const normalizedExpected = expected.toLowerCase();
    const expectedLetter = normalizedExpected;

    if (normalizedExpected === key) {
      const isExpectedLetter = expectedLetter >= "a" && expectedLetter <= "z";
      if (isExpectedLetter) {
        const letter = expectedLetter as Letter;
        const currentStat = state.letterStats[letter];
        const updatedStat = updateLetterStat(currentStat, {
          now: ts,
          isError: false,
          reactionMs: state.charFocusStartedAt ? ts - state.charFocusStartedAt : undefined,
        });

        const nextLetterStats = {
          ...state.letterStats,
          [letter]: updatedStat,
        };

        set({
          letterStats: nextLetterStats,
        });

        persistProgress({
          sessionHistory: state.sessionHistory,
          letterStats: nextLetterStats,
        });
      }

      const nextIndex = state.cursorIndex + 1;
      set({
        cursorIndex: nextIndex,
        correctChars: state.correctChars + 1,
        currentError: false,
        charFocusStartedAt: ts,
      });

      if (nextIndex >= state.prompt.length) {
        get().endSession("completed");
      }
      return;
    }

    if (expectedLetter >= "a" && expectedLetter <= "z") {
      const letter = expectedLetter as Letter;
      const currentStat = state.letterStats[letter];
      const updatedStat = updateLetterStat(currentStat, {
        now: ts,
        isError: true,
      });

      const nextLetterStats = {
        ...state.letterStats,
        [letter]: updatedStat,
      };

      set({
        letterStats: nextLetterStats,
      });

      persistProgress({
        sessionHistory: state.sessionHistory,
        letterStats: nextLetterStats,
      });
    }

    set({
      errors: state.errors + 1,
      currentError: true,
    });
  },

  tick: (now) => {
    const state = get();
    if (state.status !== "running" || !state.sessionEndsAt) {
      return;
    }

    const remainingMs = state.sessionEndsAt - now;
    if (remainingMs <= 0) {
      set({ remainingSec: 0 });
      get().endSession("completed");
      return;
    }

    const remainingSec = Math.ceil(remainingMs / 1000);
    if (remainingSec !== state.remainingSec) {
      set({ remainingSec });
    }
  },

  getWeakLetters: (limit) => rankWeakLetters(get().letterStats, limit),

  getProgressSummary: (window) => buildProgressSummary(get().sessionHistory, window),
}));

export { FINGER_MAP };
