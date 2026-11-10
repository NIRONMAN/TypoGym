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
export type TargetType = "letter" | "finger" | "cluster" | "adaptive";

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
  targetLetters?: Letter[];
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
    targetLetters?: Letter[];
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

export type MasteryTier = "novice" | "apprentice" | "proficient" | "master";
export type DecayStatus = "fresh" | "needs-review" | "rusty";

export interface LetterMasteryInfo {
  letter: Letter;
  tier: MasteryTier;
  decayStatus: DecayStatus;
  daysSinceLastSeen: number | null;
  score: number;
  stat: LetterStat;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastPracticedDate: string | null;
}

export interface CalendarDay {
  date: string;
  count: number;
  charsTyped: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface PersonalBestRecord {
  bestNetWpm: number;
  bestAccuracy: number;
  date: string;
}

export interface PersonalBests {
  byDuration: Record<number, PersonalBestRecord>;
  overallBestWpm: number;
}

export interface SessionDelta {
  wpmDelta: number;
  accuracyDelta: number;
  targetLetterStats?: {
    letter: Letter;
    currentAcc: number;
  };
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

const REAL_FALLBACK_WORDS: Record<Letter, string[]> = {
  a: ["about", "after", "again", "almost", "always", "answer"],
  b: ["before", "better", "between", "black", "bring", "bright"],
  c: ["change", "circle", "clean", "clear", "close", "common"],
  d: ["dance", "decide", "direct", "discover", "divide", "doctor"],
  e: ["early", "earth", "effect", "either", "enough", "every"],
  f: ["family", "father", "field", "figure", "finger", "friend"],
  g: ["garden", "gather", "general", "gentle", "glance", "ground"],
  h: ["happen", "harbor", "health", "heart", "history", "humble"],
  i: ["inside", "island", "impact", "image", "intend", "invite"],
  j: ["jacket", "journey", "joyful", "junior", "justice", "adjust"],
  k: ["kitchen", "kitten", "knight", "knock", "knuckle", "kingdom"],
  l: ["ladder", "language", "laughter", "leader", "legacy", "little"],
  m: ["machine", "market", "matter", "meadow", "memory", "middle"],
  n: ["narrow", "native", "nature", "nearly", "network", "number"],
  o: ["object", "observe", "office", "online", "orange", "outcome"],
  p: ["paddle", "palace", "pencil", "people", "person", "planet"],
  q: ["quick", "quiet", "quaint", "quench", "quiver", "equal"],
  r: ["rabbit", "random", "rapid", "reason", "recent", "record"],
  s: ["safety", "school", "screen", "search", "season", "secret"],
  t: ["talent", "target", "teacher", "temple", "tennis", "travel"],
  u: ["umbrella", "unable", "uncle", "under", "unique", "useful"],
  v: ["vacant", "valley", "velvet", "venture", "vibrant", "village"],
  w: ["wallet", "warmth", "warrior", "weather", "window", "winter"],
  x: ["extra", "exact", "expect", "expert", "relax", "complex"],
  y: ["yellow", "yearly", "yeast", "yonder", "young", "journey"],
  z: ["blaze", "breeze", "freeze", "puzzle", "wizard", "zephyr"],
};

function fallbackWordsForLetter(letter: Letter): string[] {
  return REAL_FALLBACK_WORDS[letter] ?? ["quick", "brave", "relax", "bright", "jump"];
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
    return { real: 1.0, artificial: 0.0 };
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

function letterSetFromConfig(
  config: SessionConfig,
  letterStats?: Record<Letter, LetterStat>,
): Letter[] {
  if (config.targetType === "cluster" && config.targetLetters && config.targetLetters.length > 0) {
    return config.targetLetters;
  }

  if (config.targetType === "adaptive") {
    if (letterStats) {
      const adaptive = getAdaptiveWorkoutLetters(letterStats);
      return adaptive.targetLetters;
    }
    return config.targetLetters && config.targetLetters.length > 0 ? config.targetLetters : ["q", "x", "z"];
  }

  if (config.targetType === "letter") {
    if (config.targetLetters && config.targetLetters.length > 0) {
      return [config.targetLetters[0]];
    }
    if (config.targetId && isLetter(config.targetId)) {
      return [config.targetId];
    }
    return ["a"];
  }

  if (config.targetType === "finger" && config.targetId && config.targetId in FINGER_MAP) {
    const fingerLetters = FINGER_MAP[config.targetId as FingerId];
    return fingerLetters.length > 0 ? fingerLetters : [...ALPHABET];
  }

  if (config.targetLetters && config.targetLetters.length > 0) {
    return config.targetLetters;
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
  letterStats?: Record<Letter, LetterStat>,
): string {
  const targetLetters = letterSetFromConfig(config, letterStats);
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

export function getLetterMastery(stat: LetterStat, now = Date.now()): LetterMasteryInfo {
  const daysSinceLastSeen =
    stat.lastSeenAt !== null
      ? Math.max(0, Math.floor((now - stat.lastSeenAt) / (1000 * 60 * 60 * 24)))
      : null;

  let decayStatus: DecayStatus = "fresh";
  if (daysSinceLastSeen !== null && stat.attempts >= 5) {
    if (daysSinceLastSeen >= 14) {
      decayStatus = "rusty";
    } else if (daysSinceLastSeen >= 7) {
      decayStatus = "needs-review";
    }
  }

  let tier: MasteryTier = "novice";
  if (stat.attempts >= 15 && stat.accuracy >= 95) {
    tier = "master";
  } else if (stat.attempts >= 10 && stat.accuracy >= 88) {
    tier = "proficient";
  } else if (stat.attempts >= 5 && stat.accuracy >= 75) {
    tier = "apprentice";
  } else {
    tier = "novice";
  }

  return {
    letter: stat.letter,
    tier,
    decayStatus,
    daysSinceLastSeen,
    score: roundTwo(weakScore(stat)),
    stat,
  };
}

export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDaysBetweenDateStrings(d1: string, d2: string): number {
  const [y1, m1, day1] = d1.split("-").map(Number);
  const [y2, m2, day2] = d2.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, day1);
  const utc2 = Date.UTC(y2, m2 - 1, day2);
  return Math.round((utc2 - utc1) / (24 * 60 * 60 * 1000));
}

export function calculatePersonalBests(sessionHistory: SessionResult[]): PersonalBests {
  const byDuration: Record<number, PersonalBestRecord> = {};
  let overallBestWpm = 0;

  for (const session of sessionHistory) {
    if (session.netWpm > overallBestWpm) {
      overallBestWpm = session.netWpm;
    }
    const duration = Math.max(1, Math.round((session.endedAt - session.startedAt) / 1000));
    const standardDurations = [15, 30, 60, 120];
    const closest = standardDurations.reduce((prev, curr) =>
      Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev,
    );

    const existing = byDuration[closest];
    if (!existing || session.netWpm > existing.bestNetWpm) {
      const d = new Date(session.endedAt);
      byDuration[closest] = {
        bestNetWpm: session.netWpm,
        bestAccuracy: session.accuracy,
        date: formatDateString(d),
      };
    }
  }

  return { byDuration, overallBestWpm };
}

export function calculateStreak(sessionHistory: SessionResult[], now = Date.now()): StreakInfo {
  if (sessionHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastPracticedDate: null };
  }

  const dateSet = new Set<string>();
  sessionHistory.forEach((s) => {
    dateSet.add(formatDateString(new Date(s.endedAt)));
  });

  const uniqueDays = Array.from(dateSet).sort().reverse();
  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastPracticedDate: null };
  }

  const nowDate = new Date(now);
  const todayStr = formatDateString(nowDate);

  const yesterdayDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 1);
  const yesterdayStr = formatDateString(yesterdayDate);

  const lastPracticed = uniqueDays[0];
  let currentStreak = 0;

  if (lastPracticed === todayStr || lastPracticed === yesterdayStr) {
    const startObj = lastPracticed === todayStr ? nowDate : yesterdayDate;
    let checkDate = new Date(startObj.getFullYear(), startObj.getMonth(), startObj.getDate());
    while (true) {
      const checkStr = formatDateString(checkDate);
      if (dateSet.has(checkStr)) {
        currentStreak += 1;
        checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let longestStreak = 0;
  let running = 0;
  const sortedAsc = Array.from(dateSet).sort();
  for (let i = 0; i < sortedAsc.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const diffDays = getDaysBetweenDateStrings(sortedAsc[i - 1], sortedAsc[i]);
      if (diffDays === 1) {
        running += 1;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastPracticedDate: lastPracticed,
  };
}

export function buildConsistencyCalendar(
  sessionHistory: SessionResult[],
  weeks = 12,
  now = Date.now(),
): CalendarDay[] {
  const totalDays = weeks * 7;
  const daysMap = new Map<string, { count: number; charsTyped: number }>();

  sessionHistory.forEach((s) => {
    const dateStr = formatDateString(new Date(s.endedAt));
    const existing = daysMap.get(dateStr) ?? { count: 0, charsTyped: 0 };
    daysMap.set(dateStr, {
      count: existing.count + 1,
      charsTyped: existing.charsTyped + (s.charsTyped || 0),
    });
  });

  const result: CalendarDay[] = [];
  const nowDate = new Date(now);
  const dayOfWeek = nowDate.getDay();
  const endOffsetDays = 6 - dayOfWeek;
  const endDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + endOffsetDays);

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - i);
    const dateStr = formatDateString(d);
    const data = daysMap.get(dateStr) ?? { count: 0, charsTyped: 0 };
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (data.count >= 6) level = 4;
    else if (data.count >= 4) level = 3;
    else if (data.count >= 2) level = 2;
    else if (data.count >= 1) level = 1;

    result.push({
      date: dateStr,
      count: data.count,
      charsTyped: data.charsTyped,
      level,
    });
  }

  return result;
}

export function getAdaptiveWorkoutLetters(
  letterStats: Record<Letter, LetterStat>,
  now = Date.now(),
): {
  targetLetters: Letter[];
  weakLetters: Letter[];
  reviewLetters: Letter[];
  confidentLetters: Letter[];
} {
  const allMastery = ALPHABET.map((letter) => getLetterMastery(letterStats[letter], now));

  const sortedWeak = [...allMastery]
    .filter((m) => m.score > 0 || (m.stat.attempts > 0 && m.stat.accuracy < 85))
    .sort((a, b) => b.score - a.score || a.stat.accuracy - b.stat.accuracy);

  const weakLetters = sortedWeak.slice(0, 3).map((m) => m.letter);

  const reviewCandidates = allMastery.filter(
    (m) =>
      !weakLetters.includes(m.letter) &&
      (m.decayStatus === "needs-review" ||
        m.decayStatus === "rusty" ||
        (m.stat.attempts > 0 && (m.daysSinceLastSeen ?? 0) >= 7)),
  );
  const reviewLetters = reviewCandidates.slice(0, 2).map((m) => m.letter);

  const confidentCandidates = allMastery.filter(
    (m) =>
      !weakLetters.includes(m.letter) &&
      !reviewLetters.includes(m.letter) &&
      (m.tier === "master" || m.tier === "proficient" || m.stat.accuracy >= 90),
  );
  const confidentLetters = confidentCandidates.slice(0, 2).map((m) => m.letter);

  const fallbackLetters = ALPHABET.filter(
    (l) => !weakLetters.includes(l) && !reviewLetters.includes(l) && !confidentLetters.includes(l),
  );

  const targetLetters = Array.from(
    new Set([
      ...(weakLetters.length > 0 ? weakLetters : fallbackLetters.slice(0, 2)),
      ...(reviewLetters.length > 0 ? reviewLetters : fallbackLetters.slice(2, 4)),
      ...(confidentLetters.length > 0 ? confidentLetters : fallbackLetters.slice(4, 5)),
    ]),
  );

  return {
    targetLetters,
    weakLetters,
    reviewLetters,
    confidentLetters,
  };
}

export function calculateSessionDelta(
  lastResult: SessionResult,
  sessionHistory: SessionResult[],
  letterStats: Record<Letter, LetterStat>,
): SessionDelta {
  const previousSessions = sessionHistory
    .filter((s) => s.startedAt !== lastResult.startedAt)
    .slice(-7);

  const avgPrevWpm =
    previousSessions.length > 0
      ? previousSessions.reduce((sum, s) => sum + s.netWpm, 0) / previousSessions.length
      : lastResult.netWpm;
  const avgPrevAcc =
    previousSessions.length > 0
      ? previousSessions.reduce((sum, s) => sum + s.accuracy, 0) / previousSessions.length
      : lastResult.accuracy;

  const wpmDelta = roundTwo(lastResult.netWpm - avgPrevWpm);
  const accuracyDelta = roundTwo(lastResult.accuracy - avgPrevAcc);

  let targetLetterStats: SessionDelta["targetLetterStats"] | undefined;
  const targetCandidate =
    lastResult.modeMeta.targetId && isLetter(lastResult.modeMeta.targetId)
      ? (lastResult.modeMeta.targetId as Letter)
      : lastResult.modeMeta.targetLetters?.[0];

  if (targetCandidate && letterStats[targetCandidate]) {
    const stat = letterStats[targetCandidate];
    targetLetterStats = {
      letter: targetCandidate,
      currentAcc: stat.accuracy,
    };
  }

  return {
    wpmDelta,
    accuracyDelta,
    targetLetterStats,
  };
}
