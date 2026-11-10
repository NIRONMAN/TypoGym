import test from "node:test";
import assert from "node:assert/strict";

import words from "../public/words.json" with { type: "json" };
import artificialWords from "../public/artificialWords.json" with { type: "json" };
import {
  ALPHABET,
  buildConsistencyCalendar,
  buildProgressSummary,
  calculateMetrics,
  calculatePersonalBests,
  calculateSessionDelta,
  calculateStreak,
  createDefaultLetterStats,
  generateNormalPrompt,
  generateTargetedPrompt,
  getAdaptiveWorkoutLetters,
  getLetterMastery,
  rankWeakLetters,
  updateLetterStat,
} from "../lib/typingEngine.ts";
import type { SessionConfig } from "../lib/typingEngine.ts";

test("corpora are valid for all letters", () => {
  const corpora = [
    { name: "real", data: words as Record<string, string[]> },
    { name: "artificial", data: artificialWords as Record<string, string[]> },
  ];

  for (const corpus of corpora) {
    for (const letter of ALPHABET) {
      const entries = corpus.data[letter];
      assert.ok(Array.isArray(entries), `${corpus.name}:${letter} missing list`);
      assert.ok(entries.length >= 20, `${corpus.name}:${letter} should include at least 20 words`);

      const normalized = entries.map((entry) => entry.toLowerCase());
      const unique = new Set(normalized);
      assert.equal(unique.size, entries.length, `${corpus.name}:${letter} has duplicates`);
      assert.ok(
        normalized.every((entry) => entry.includes(letter)),
        `${corpus.name}:${letter} has words without the key letter`,
      );
      assert.ok(
        normalized.every((entry) => /^[a-z]+$/.test(entry)),
        `${corpus.name}:${letter} contains non-alphabetic words`,
      );
    }
  }
});

test("generateNormalPrompt respects duration sizing and uses 100% real words", () => {
  const config: SessionConfig = {
    mode: "normal",
    durationSec: 60,
    corpusMix: { real: 1.0, artificial: 0.0 },
  };

  const prompt = generateNormalPrompt(config);
  const wordsList = prompt.split(" ");

  assert.ok(wordsList.length >= 20);
  assert.equal(wordsList.some((word) => word.length > 0), true);
  // Ensure every generated word consists of valid English letters
  for (const word of wordsList) {
    assert.ok(/^[a-z]{3,14}$/.test(word), `Generated unexpected word format: ${word}`);
  }
});

test("generateNormalPrompt covers all letters in long prompts", () => {
  const config: SessionConfig = {
    mode: "normal",
    durationSec: 60,
    corpusMix: { real: 1.0, artificial: 0.0 },
  };

  const prompt = generateNormalPrompt(config);
  for (const letter of ALPHABET) {
    assert.ok(prompt.includes(letter), `missing letter ${letter}`);
  }
});

test("generateTargetedPrompt biases target letters", () => {
  const config: SessionConfig = {
    mode: "targeted",
    durationSec: 60,
    corpusMix: { real: 1.0, artificial: 0.0 },
    targetType: "letter",
    targetId: "q",
  };

  const prompt = generateTargetedPrompt(config, ["q"]);
  const wordsList = prompt.split(" ").filter((word) => word.length > 0);
  const qWords = wordsList.filter((word) => word.includes("q"));

  assert.ok(prompt.length > 0);
  assert.ok(qWords.length >= Math.floor(wordsList.length * 0.3));
});

test("calculateMetrics computes expected numbers", () => {
  const metrics = calculateMetrics({
    startedAt: 0,
    endedAt: 60000,
    correctChars: 250,
    errors: 10,
  });

  assert.equal(metrics.grossWpm, 52);
  assert.equal(metrics.netWpm, 40);
  assert.equal(metrics.accuracy, 96.15);
  assert.equal(metrics.charsTyped, 250);
  assert.equal(metrics.errors, 10);
});

test("weak letter ranking prioritizes higher error rates", () => {
  const stats = createDefaultLetterStats();

  stats.a = updateLetterStat(stats.a, { now: Date.now(), isError: true });
  stats.a = updateLetterStat(stats.a, { now: Date.now(), isError: true });
  stats.a = updateLetterStat(stats.a, { now: Date.now(), isError: false, reactionMs: 320 });

  stats.e = updateLetterStat(stats.e, { now: Date.now(), isError: false, reactionMs: 180 });
  stats.e = updateLetterStat(stats.e, { now: Date.now(), isError: false, reactionMs: 190 });

  const weak = rankWeakLetters(stats, 3);
  assert.equal(weak[0].letter, "a");
});

test("buildProgressSummary computes 7-window deltas", () => {
  const history = Array.from({ length: 14 }, (_, i) => ({
    startedAt: i,
    endedAt: i + 1,
    grossWpm: 50,
    netWpm: i < 7 ? 40 : 60,
    accuracy: i < 7 ? 90 : 95,
    charsTyped: 200,
    errors: 10,
    modeMeta: {
      mode: "normal" as const,
    },
  }));

  const summary = buildProgressSummary(history, 7);

  assert.equal(summary.totalSessions, 14);
  assert.ok(summary.netWpmDelta > 0);
  assert.ok(summary.accuracyDelta > 0);
});

test("getLetterMastery categorizes tiers and handles decay", () => {
  const stats = createDefaultLetterStats();
  const now = Date.now();

  // Novice (< 5 attempts)
  const noviceMastery = getLetterMastery(stats.a, now);
  assert.equal(noviceMastery.tier, "novice");
  assert.equal(noviceMastery.decayStatus, "fresh");

  // Master: 20 attempts, 0 errors, recent practice
  let masterStat = stats.b;
  for (let i = 0; i < 20; i++) {
    masterStat = updateLetterStat(masterStat, { now: now - 1000, isError: false });
  }
  const masterInfo = getLetterMastery(masterStat, now);
  assert.equal(masterInfo.tier, "master");
  assert.equal(masterInfo.decayStatus, "fresh");

  // Decay: practiced 10 days ago -> needs-review
  const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
  const decayStat = { ...masterStat, lastSeenAt: tenDaysAgo };
  const decayInfo = getLetterMastery(decayStat, now);
  assert.equal(decayInfo.decayStatus, "needs-review");

  // Rusty: practiced 20 days ago -> rusty
  const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000;
  const rustyStat = { ...masterStat, lastSeenAt: twentyDaysAgo };
  const rustyInfo = getLetterMastery(rustyStat, now);
  assert.equal(rustyInfo.decayStatus, "rusty");
});

test("calculateStreak computes consecutive practice days", () => {
  const now = new Date("2026-11-01T12:00:00Z").getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  // 3 consecutive days ending today
  const history = [
    { endedAt: now - 2 * oneDay, startedAt: now - 2 * oneDay - 60000, netWpm: 60, grossWpm: 60, accuracy: 95, charsTyped: 100, errors: 2, modeMeta: { mode: "normal" as const } },
    { endedAt: now - oneDay, startedAt: now - oneDay - 60000, netWpm: 65, grossWpm: 65, accuracy: 96, charsTyped: 100, errors: 1, modeMeta: { mode: "normal" as const } },
    { endedAt: now, startedAt: now - 60000, netWpm: 70, grossWpm: 70, accuracy: 98, charsTyped: 100, errors: 0, modeMeta: { mode: "normal" as const } },
  ];

  const streak = calculateStreak(history, now);
  assert.equal(streak.currentStreak, 3);
  assert.equal(streak.longestStreak, 3);
});

test("buildConsistencyCalendar generates 12 weeks of data", () => {
  const now = new Date("2026-11-01T12:00:00Z").getTime();
  const history = [
    { endedAt: now, startedAt: now - 60000, netWpm: 60, grossWpm: 60, accuracy: 95, charsTyped: 150, errors: 2, modeMeta: { mode: "normal" as const } },
  ];

  const calendar = buildConsistencyCalendar(history, 12, now);
  assert.equal(calendar.length, 84);
  const activeDays = calendar.filter((d) => d.count > 0);
  assert.equal(activeDays.length, 1);
  assert.equal(activeDays[0].charsTyped, 150);
});

test("getAdaptiveWorkoutLetters provides balanced practice mix", () => {
  const stats = createDefaultLetterStats();
  const now = Date.now();

  // Create a weak letter
  stats.q = updateLetterStat(stats.q, { now, isError: true });
  stats.q = updateLetterStat(stats.q, { now, isError: true });

  const adaptive = getAdaptiveWorkoutLetters(stats, now);
  assert.ok(adaptive.targetLetters.length >= 3);
  assert.ok(adaptive.targetLetters.includes("q"));
});

test("calculateSessionDelta computes delta against rolling window", () => {
  const history = [
    { endedAt: 1000, startedAt: 0, netWpm: 50, grossWpm: 50, accuracy: 90, charsTyped: 100, errors: 5, modeMeta: { mode: "normal" as const } },
  ];
  const lastResult = {
    endedAt: 2000,
    startedAt: 1001,
    netWpm: 65,
    grossWpm: 65,
    accuracy: 95,
    charsTyped: 120,
    errors: 2,
    modeMeta: { mode: "targeted" as const, targetId: "x" },
  };
  const stats = createDefaultLetterStats();

  const delta = calculateSessionDelta(lastResult, [...history, lastResult], stats);
  assert.equal(delta.wpmDelta, 15);
  assert.equal(delta.accuracyDelta, 5);
  assert.equal(delta.targetLetterStats?.letter, "x");
});

test("generateTargetedPrompt supports cluster targetType", () => {
  const config: SessionConfig = {
    mode: "targeted",
    durationSec: 30,
    corpusMix: { real: 1.0, artificial: 0.0 },
    targetType: "cluster",
    targetLetters: ["z", "q", "x"],
  };

  const prompt = generateTargetedPrompt(config, ["z"]);
  const words = prompt.split(" ");
  assert.ok(words.length >= 15);
  const hasClusterLetters = words.some((w) => w.includes("z") || w.includes("q") || w.includes("x"));
  assert.ok(hasClusterLetters);
});

test("calculatePersonalBests identifies highest net WPM and accuracy by duration", () => {
  const sessions = [
    { startedAt: 0, endedAt: 30000, netWpm: 75, grossWpm: 78, accuracy: 96, charsTyped: 200, errors: 2, modeMeta: { mode: "normal" as const } },
    { startedAt: 100000, endedAt: 130000, netWpm: 88, grossWpm: 90, accuracy: 98, charsTyped: 220, errors: 1, modeMeta: { mode: "normal" as const } },
    { startedAt: 200000, endedAt: 260000, netWpm: 82, grossWpm: 85, accuracy: 97, charsTyped: 410, errors: 3, modeMeta: { mode: "normal" as const } },
  ];

  const pbs = calculatePersonalBests(sessions);
  assert.equal(pbs.overallBestWpm, 88);
  assert.equal(pbs.byDuration[30]?.bestNetWpm, 88);
  assert.equal(pbs.byDuration[30]?.bestAccuracy, 98);
  assert.equal(pbs.byDuration[60]?.bestNetWpm, 82);
});
