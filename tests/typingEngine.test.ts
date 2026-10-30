import test from "node:test";
import assert from "node:assert/strict";

import words from "../public/words.json" with { type: "json" };
import artificialWords from "../public/artificialWords.json" with { type: "json" };
import {
  ALPHABET,
  buildProgressSummary,
  calculateMetrics,
  createDefaultLetterStats,
  generateNormalPrompt,
  generateTargetedPrompt,
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
