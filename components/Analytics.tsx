"use client";

import { useMemo } from "react";
import {
  ALPHABET,
  buildProgressSummary,
  calculateSessionDelta,
  Letter,
  rankWeakLetters,
} from "@/lib/typingEngine";
import { useTypingSession } from "@/store";

interface AnalyticsProps {
  onRestart?: () => void;
  onSelectTargetLetter?: (letter: Letter) => void;
}

export default function Analytics({ onRestart, onSelectTargetLetter }: AnalyticsProps) {
  const sessionHistory = useTypingSession((state) => state.sessionHistory);
  const lastResult = useTypingSession((state) => state.lastResult);
  const letterStats = useTypingSession((state) => state.letterStats);
  const restartSession = useTypingSession((state) => state.restartSession);
  const openAnalytics = useTypingSession((state) => state.openAnalytics);
  const startTargetedDrill = useTypingSession((state) => state.startTargetedDrill);

  const summary = useMemo(() => buildProgressSummary(sessionHistory, 7), [sessionHistory]);
  const weakLetters = useMemo(() => rankWeakLetters(letterStats, 5), [letterStats]);
  const delta = useMemo(
    () => (lastResult ? calculateSessionDelta(lastResult, sessionHistory, letterStats) : null),
    [lastResult, sessionHistory, letterStats],
  );

  const topWeakLetter = weakLetters[0]?.letter;

  const handlePracticeLetter = (letter: Letter) => {
    startTargetedDrill({
      targetType: "letter",
      targetId: letter,
      targetLetters: [letter],
    });
    if (onSelectTargetLetter) {
      onSelectTargetLetter(letter);
    }
    if (onRestart) {
      onRestart();
    }
  };

  return (
    <div className="flex flex-col gap-5 font-mono text-zinc-300">
      {/* Primary Result Headline */}
      {lastResult ? (
        <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-6">
              <div>
                <span className="text-3xl font-extrabold text-emerald-400">{lastResult.netWpm}</span>
                <span className="ml-1 text-xs text-zinc-500">wpm</span>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-zinc-200">{lastResult.accuracy}%</span>
                <span className="ml-1 text-xs text-zinc-500">acc</span>
              </div>
              <div>
                <span className="text-xl font-medium text-zinc-400">{lastResult.errors}</span>
                <span className="ml-1 text-xs text-zinc-500">err</span>
              </div>
              <div className="text-xs text-zinc-500">
                <span>{lastResult.grossWpm} gross</span>
              </div>
            </div>

            {/* High-impact CTAs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  restartSession();
                  if (onRestart) onRestart();
                }}
                className="rounded border border-emerald-600/80 bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-900/60 active:scale-95 shadow-sm"
              >
                ↵ Run Again
              </button>

              {topWeakLetter && (
                <button
                  type="button"
                  onClick={() => handlePracticeLetter(topWeakLetter)}
                  className="rounded border border-amber-700/60 bg-amber-950/30 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-900/40 active:scale-95"
                >
                  ⚡ Drill Weakest: &apos;{topWeakLetter.toUpperCase()}&apos;
                </button>
              )}

              <button
                type="button"
                onClick={openAnalytics}
                className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-zinc-700 hover:text-white"
              >
                📊 Open Full Dashboard
              </button>
            </div>
          </div>

          {/* Session Improvement Delta */}
          {delta && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-950/50 border border-zinc-800/80 px-3 py-1.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Session Delta:</span>
              <span className={delta.wpmDelta >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400"}>
                WPM: {delta.wpmDelta >= 0 ? `+${delta.wpmDelta}` : delta.wpmDelta} vs avg
              </span>
              <span className="text-zinc-600">•</span>
              <span className={delta.accuracyDelta >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400"}>
                Accuracy: {delta.accuracyDelta >= 0 ? `+${delta.accuracyDelta}%` : `${delta.accuracyDelta}%`}
              </span>
              {delta.targetLetterStats && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-cyan-300 font-medium">
                    Target &apos;{delta.targetLetterStats.letter.toUpperCase()}&apos;: {delta.targetLetterStats.currentAcc.toFixed(0)}% acc
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* 7-Session Trend & Weak Keys */}
      <div className="grid gap-4 sm:grid-cols-2 text-xs text-zinc-400">
        <div>
          <div className="text-zinc-500 mb-1">7-session rolling baseline</div>
          <div className="text-sm text-zinc-300">
            {summary.avgNetWpm} wpm • {summary.avgAccuracy}% acc ({summary.totalSessions} sessions logged)
          </div>
        </div>

        <div>
          <div className="text-zinc-500 mb-1">priority keys</div>
          <div className="flex flex-wrap gap-1.5">
            {weakLetters.length > 0 ? (
              weakLetters.map((item) => (
                <button
                  key={item.letter}
                  type="button"
                  onClick={() => handlePracticeLetter(item.letter)}
                  className="rounded bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400"
                >
                  {item.letter.toUpperCase()} ({item.stat.accuracy.toFixed(0)}%)
                </button>
              ))
            ) : (
              <span className="text-zinc-600">no weak keys calibrated</span>
            )}
          </div>
        </div>
      </div>

      {/* 26-Letter Calibration Mini Strip */}
      <div className="border-t border-zinc-800/60 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-zinc-500">alphabet calibration</span>
          <button
            type="button"
            onClick={openAnalytics}
            className="text-[11px] text-emerald-400 hover:underline"
          >
            deep analytics →
          </button>
        </div>
        <div className="grid grid-cols-13 gap-1 max-[640px]:grid-cols-7 text-xs">
          {ALPHABET.map((letter) => {
            const stat = letterStats[letter];
            const hasData = stat.attempts > 0;
            const accuracy = stat.accuracy;

            let color = "text-zinc-600";
            if (hasData) {
              if (accuracy >= 95) color = "text-emerald-400 font-bold";
              else if (accuracy >= 85) color = "text-amber-400";
              else color = "text-rose-400 font-bold";
            }

            return (
              <button
                key={letter}
                type="button"
                onClick={() => handlePracticeLetter(letter)}
                className={`py-1 text-center transition hover:bg-zinc-800/50 rounded ${color}`}
                title={`${letter.toUpperCase()} (${hasData ? `${accuracy}%` : "untested"})`}
              >
                {letter.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
