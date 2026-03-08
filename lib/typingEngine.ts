import realWords from "../public/words.json" with { type: "json" };
import artificialWords from "../public/artificialWords.json" with { type: "json" };

export const ALPHABET = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
] as const;
export type Letter = (typeof ALPHABET)[number];

export type PracticeMode = "normal" | "targeted";
export type TargetType = "letter" | "finger";

export type FingerId =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky"
  | "thumbs";

export interface SessionConfig {
  mode: PracticeMode;
  durationSec: number;
  corpusMix: {
    real: number;
    artificial: number;
  };
  targetType?: TargetType;
  targetId?: string;
}

export interface SessionResult {
  startedAt: number;
  endedAt: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  charsTyped: number;
  errors: number;
  modeMeta: {
    mode: PracticeMode;
    targetType?: TargetType;
    targetId?: string;
  };
}

export interface LetterStat {
  letter: Letter;
  attempts: number;
  errors: number;
  accuracy: number;
  avgReactionMs: number;
  streakError: number;
  lastSeenAt: number | null;
  successes: number;
}

export interface ProgressSummary {
  totalSessions: number;
  avgNetWpm: number;
  avgAccuracy: number;
  last7AvgNetWpm: number;
  prev7AvgNetWpm: number;
  netWpmDelta: number;
  last7AvgAccuracy: number;
  prev7AvgAccuracy: number;
  accuracyDelta: number;
}

export interface WeakLetter {
  letter: Letter;
  score: number;
  stat: LetterStat;
}

export const FINGER_MAP: Record<FingerId, Letter[]> = {
  "left-pinky": ["q", "a", "z"],
  "left-ring": ["w", "s", "x"],
  "left-middle": ["e", "d", "c"],
  "left-index": ["r", "f", "v", "t", "g", "b"],
  "right-index": ["y", "h", "n", "u", "j", "m"],
  "right-middle": ["i", "k"],
  "right-ring": ["o", "l"],
  "right-pinky": ["p"],
  thumbs: [],
};

type CorpusKind = "real" | "artificial";
type CorpusByLetter = Record<Letter, string[]>;

function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z]/g, "");
}

function fallbackWordsForLetter(letter: Letter): string[] {
  if (letter === "q") {
    return ["quava", "quimer", "quonat", "quidel", "qumora", "quvex"];
  }
  if (letter === "x") {
    return ["xanor", "xevik", "xolum", "xirad", "xupet", "xemal"];
  }
  return [
    `${letter}avor`,
    `${letter}emid`,
    `${letter}inul`,
    `${letter}orat`,
    `${letter}upel`,
    `${letter}elix`,
  ];
}

function sanitizeCorpus(source: Record<Letter, string[]>): CorpusByLetter {
  return ALPHABET.reduce((acc, letter) => {
    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const word of source[letter] ?? []) {
      const normalized = normalizeWord(word);
      if (normalized.length < 3 || normalized.length > 14 || !normalized.includes(letter)) {
        continue;
      }
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      cleaned.push(normalized);
    }
    acc[letter] = cleaned.length > 0 ? cleaned : fallbackWordsForLetter(letter);
    return acc;
  }, {} as CorpusByLetter);
}

const realWordByLetter = sanitizeCorpus(realWords as Record<Letter, string[]>);
const artificialWordByLetter = sanitizeCorpus(artificialWords as Record<Letter, string[]>);

const allRealWords = ALPHABET.flatMap((letter) => realWordByLetter[letter]);
const allArtificialWords = ALPHABET.flatMap((letter) => artificialWordByLetter[letter]);

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomExcluding<T>(arr: readonly T[], exclude?: T): T {
  if (arr.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  if (exclude === undefined || arr.length === 1) {
    return pickRandom(arr);
  }
  const filtered = arr.filter((item) => item !== exclude);
  return filtered.length > 0 ? pickRandom(filtered) : pickRandom(arr);
}

function clampMix(mix: SessionConfig["corpusMix"]): SessionConfig["corpusMix"] {
  const real = Math.max(0, mix.real);
  const artificial = Math.max(0, mix.artificial);
  const sum = real + artificial;

  if (sum === 0) {
    return { real: 0.7, artificial: 0.3 };
  }

  return {
    real: real / sum,
    artificial: artificial / sum,
  };
}

function estimateWordCount(durationSec: number): number {
  return Math.max(20, Math.round(durationSec * 2.7));
}

function shuffledAlphabet(): Letter[] {
  const letters = [...ALPHABET];
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

function buildBalancedLetterPlan(wordCount: number): Letter[] {
  const plan: Letter[] = [];
  while (plan.length < wordCount) {
    plan.push(...shuffledAlphabet());
  }
  return plan.slice(0, wordCount);
}

function chooseCorpusKind(mix: SessionConfig["corpusMix"]): CorpusKind {
  return Math.random() < mix.real ? "real" : "artificial";
}

function resolveWordPool(letter: Letter, preferredKind: CorpusKind): string[] {
  const primaryByLetter = preferredKind === "real" ? realWordByLetter[letter] : artificialWordByLetter[letter];
  if (primaryByLetter.length > 0) {
    return primaryByLetter;
  }

  const secondaryByLetter = preferredKind === "real" ? artificialWordByLetter[letter] : realWordByLetter[letter];
  if (secondaryByLetter.length > 0) {
    return secondaryByLetter;
  }

  const primaryAll = preferredKind === "real" ? allRealWords : allArtificialWords;
  if (primaryAll.length > 0) {
    return primaryAll;
  }

  return preferredKind === "real" ? allArtificialWords : allRealWords;
}

function generatePromptFromLetterPlan(
  letterPlan: Letter[],
  mix: SessionConfig["corpusMix"],
): string {
  const normalizedMix = clampMix(mix);
  let previousWord: string | undefined;

  const words = letterPlan.map((focusLetter) => {
    const preferredKind = chooseCorpusKind(normalizedMix);
    const pool = resolveWordPool(focusLetter, preferredKind);
    const word = pickRandomExcluding(pool, previousWord);
    previousWord = word;
    return word;
  });

  return words.join(" ");
}

export function createDefaultLetterStats(): Record<Letter, LetterStat> {
  return ALPHABET.reduce((acc, letter) => {
    acc[letter] = {
      letter,
      attempts: 0,
      errors: 0,
      accuracy: 100,
      avgReactionMs: 0,
      streakError: 0,
      lastSeenAt: null,
      successes: 0,
    };
    return acc;
  }, {} as Record<Letter, LetterStat>);
}

export function isLetter(value: string): value is Letter {
  return value.length === 1 && ALPHABET.includes(value as Letter);
}

export function generateNormalPrompt(config: SessionConfig): string {
  const wordCount = estimateWordCount(config.durationSec);
  const letterPlan = buildBalancedLetterPlan(wordCount);
  return generatePromptFromLetterPlan(letterPlan, config.corpusMix);
}

function letterSetFromConfig(config: SessionConfig): Letter[] {
  if (config.targetType === "letter" && config.targetId && isLetter(config.targetId)) {
    return [config.targetId];
  }

  if (config.targetType === "finger" && config.targetId && config.targetId in FINGER_MAP) {
    const fingerLetters = FINGER_MAP[config.targetId as FingerId];
    return fingerLetters.length > 0 ? fingerLetters : [...ALPHABET];
  }

  return [...ALPHABET];
}

function buildTargetedLetterPlan(
  wordCount: number,
  targetLetters: Letter[],
  weakLetters: Letter[],
): Letter[] {
  const plan = buildBalancedLetterPlan(wordCount);
  const dedupedTargets = Array.from(new Set(targetLetters));
  const dedupedWeak = Array.from(new Set(weakLetters.filter((letter) => !dedupedTargets.includes(letter))));

  const focusBag: Letter[] = [];
  dedupedTargets.forEach((letter) =>
    focusBag.push(letter, letter, letter, letter, letter, letter, letter, letter),
  );
  dedupedWeak.forEach((letter) => focusBag.push(letter, letter, letter, letter));

  if (focusBag.length === 0) {
    return plan;
  }

  for (let i = 0; i < plan.length; i += 1) {
    const shouldInjectFocus = i % 2 === 0 || i < dedupedTargets.length * 2;
    if (shouldInjectFocus) {
      plan[i] = pickRandom(focusBag);
    }
  }

  return plan;
}

export function generateTargetedPrompt(
  config: SessionConfig,
  weakLetters: Letter[],
): string {
  const targetLetters = letterSetFromConfig(config);
  const wordCount = estimateWordCount(config.durationSec);
  const letterPlan = buildTargetedLetterPlan(wordCount, targetLetters, weakLetters);
  return generatePromptFromLetterPlan(letterPlan, config.corpusMix);
}

export function calculateMetrics(params: {
  startedAt: number;
  endedAt: number;
  correctChars: number;
  errors: number;
}): Pick<SessionResult, "grossWpm" | "netWpm" | "accuracy" | "charsTyped" | "errors"> {
  const elapsedMs = Math.max(params.endedAt - params.startedAt, 1);
  const elapsedMinutes = elapsedMs / 60000;
  const totalKeystrokes = params.correctChars + params.errors;

  const grossWpm = (totalKeystrokes / 5) / elapsedMinutes;
  const netWpm = Math.max(0, ((params.correctChars / 5) - params.errors) / elapsedMinutes);
  const accuracy = totalKeystrokes === 0 ? 100 : (params.correctChars / totalKeystrokes) * 100;

  return {
    grossWpm: roundTwo(grossWpm),
    netWpm: roundTwo(netWpm),
    accuracy: roundTwo(accuracy),
    charsTyped: params.correctChars,
    errors: params.errors,
  };
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function updateLetterStat(
  stat: LetterStat,
  update: {
    now: number;
    isError: boolean;
    reactionMs?: number;
  },
): LetterStat {
  const attempts = stat.attempts + 1;
  const errors = stat.errors + (update.isError ? 1 : 0);
  const successes = stat.successes + (update.isError ? 0 : 1);

  const nextAvgReactionMs =
    update.isError || typeof update.reactionMs !== "number"
      ? stat.avgReactionMs
      : stat.successes === 0
        ? update.reactionMs
        : ((stat.avgReactionMs * stat.successes) + update.reactionMs) / successes;

  return {
    ...stat,
    attempts,
    errors,
    successes,
    accuracy: roundTwo(((attempts - errors) / attempts) * 100),
    avgReactionMs: roundTwo(nextAvgReactionMs),
    streakError: update.isError ? stat.streakError + 1 : 0,
    lastSeenAt: update.now,
  };
}

function weakScore(stat: LetterStat): number {
  if (stat.attempts === 0) {
    return 0;
  }

  const errorRate = stat.errors / stat.attempts;
  const consistencyPenalty = Math.min(1, stat.streakError / 5);
  const confidence = Math.min(1, stat.attempts / 20);
  return (errorRate * 0.65 + consistencyPenalty * 0.35) * confidence;
}

export function rankWeakLetters(letterStats: Record<Letter, LetterStat>, limit = 5): WeakLetter[] {
  return Object.values(letterStats)
    .map((stat) => ({ letter: stat.letter, score: roundTwo(weakScore(stat)), stat }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildProgressSummary(
  sessionHistory: SessionResult[],
  window = 7,
): ProgressSummary {
  const sorted = [...sessionHistory].sort((a, b) => b.endedAt - a.endedAt);
  const recent = sorted.slice(0, window);
  const previous = sorted.slice(window, window * 2);

  const avgNetWpm = average(sorted.map((item) => item.netWpm));
  const avgAccuracy = average(sorted.map((item) => item.accuracy));

  const last7AvgNetWpm = average(recent.map((item) => item.netWpm));
  const prev7AvgNetWpm = average(previous.map((item) => item.netWpm));
  const last7AvgAccuracy = average(recent.map((item) => item.accuracy));
  const prev7AvgAccuracy = average(previous.map((item) => item.accuracy));

  return {
    totalSessions: sorted.length,
    avgNetWpm: roundTwo(avgNetWpm),
    avgAccuracy: roundTwo(avgAccuracy),
    last7AvgNetWpm: roundTwo(last7AvgNetWpm),
    prev7AvgNetWpm: roundTwo(prev7AvgNetWpm),
    netWpmDelta: roundTwo(last7AvgNetWpm - prev7AvgNetWpm),
    last7AvgAccuracy: roundTwo(last7AvgAccuracy),
    prev7AvgAccuracy: roundTwo(prev7AvgAccuracy),
    accuracyDelta: roundTwo(last7AvgAccuracy - prev7AvgAccuracy),
  };
}

export function pickWeakLettersForPrompt(letterStats: Record<Letter, LetterStat>, limit = 4): Letter[] {
  return rankWeakLetters(letterStats, limit)
    .filter((item) => item.score > 0)
    .map((item) => item.letter);
}
