"use client";

import { useMemo } from "react";
import { ALPHABET, buildProgressSummary, Letter, rankWeakLetters } from "@/lib/typingEngine";
import { useTypingSession } from "@/store";

interface AnalyticsProps {
  onRestart?: () => void;
  onSelectTargetLetter?: (letter: Letter) => void;
}

export default function Analytics({ onRestart, onSelectTargetLetter }: AnalyticsProps) {
  const sessionHistory = useTypingSession((state) => state.sessionHistory);
  const lastResult = useTypingSession((state) => state.lastResult);
  const letterStats = useTypingSession((state) => state.letterStats);
  const setMode = useTypingSession((state) => state.setMode);
  const setTargetType = useTypingSession((state) => state.setTargetType);
  const setTargetId = useTypingSession((state) => state.setTargetId);
  const restartSession = useTypingSession((state) => state.restartSession);

  const summary = useMemo(() => buildProgressSummary(sessionHistory, 7), [sessionHistory]);
  const weakLetters = useMemo(() => rankWeakLetters(letterStats, 5), [letterStats]);

  const handlePracticeLetter = (letter: Letter) => {
    setMode("targeted");
    setTargetType("letter");
    setTargetId(letter);
    if (onSelectTargetLetter) {
      onSelectTargetLetter(letter);
    }
    restartSession();
    if (onRestart) {
      onRestart();
    }
  };

  return (
    <div className="flex flex-col gap-6 font-mono text-zinc-300">
      {/* Primary Result Headline */}
      {lastResult ? (
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-baseline gap-6">
            <div>
              <span className="text-3xl font-bold text-emerald-400">{lastResult.netWpm}</span>
              <span className="ml-1 text-xs text-zinc-500">wpm</span>
            </div>
            <div>
              <span className="text-3xl font-bold text-zinc-200">{lastResult.accuracy}%</span>
              <span className="ml-1 text-xs text-zinc-500">acc</span>
            </div>
            <div>
              <span className="text-xl font-medium text-zinc-400">{lastResult.errors}</span>
              <span className="ml-1 text-xs text-zinc-500">err</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              restartSession();
              if (onRestart) onRestart();
            }}
            className="rounded border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-emerald-400 transition hover:bg-zinc-700 hover:text-white"
          >
            next session ↵
          </button>
        </div>
      ) : null}

      {/* 7-Session Trend & Weak Keys */}
      <div className="grid gap-4 sm:grid-cols-2 text-xs text-zinc-400">
        <div>
          <div className="text-zinc-500 mb-1">7-session average</div>
          <div className="text-sm text-zinc-300">
            {summary.avgNetWpm} wpm • {summary.avgAccuracy}% acc ({summary.totalSessions} sessions)
          </div>
        </div>

        <div>
          <div className="text-zinc-500 mb-1">focus keys</div>
          <div className="flex flex-wrap gap-1.5">
            {weakLetters.length > 0 ? (
              weakLetters.map((item) => (
                <button
                  key={item.letter}
                  type="button"
                  onClick={() => handlePracticeLetter(item.letter)}
                  className="rounded bg-zinc-800/60 px-2 py-0.5 text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400"
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

      {/* 26-Letter Heatmap */}
      <div className="border-t border-zinc-800/60 pt-3">
        <div className="text-[11px] text-zinc-500 mb-2">alphabet calibration</div>
        <div className="grid grid-cols-13 gap-1 max-[640px]:grid-cols-7 text-xs">
          {ALPHABET.map((letter) => {
            const stat = letterStats[letter];
            const hasData = stat.attempts > 0;
            const accuracy = stat.accuracy;

            let color = "text-zinc-600";
            if (hasData) {
              if (accuracy >= 95) color = "text-emerald-400";
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
