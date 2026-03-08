"use client";

import { useMemo } from "react";
import { ALPHABET } from "@/lib/typingEngine";
import { buildProgressSummary, rankWeakLetters } from "@/lib/typingEngine";
import { useTypingSession } from "@/store";

type AnalyticsProps = {
  side: "left" | "right";
};

function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function Analytics({ side }: AnalyticsProps) {
  const sessionHistory = useTypingSession((state) => state.sessionHistory);
  const lastResult = useTypingSession((state) => state.lastResult);
  const letterStats = useTypingSession((state) => state.letterStats);
  const summary = useMemo(() => buildProgressSummary(sessionHistory, 7), [sessionHistory]);
  const weakLetters = useMemo(() => rankWeakLetters(letterStats, 8), [letterStats]);

  if (side === "left") {
    return (
      <section className="flex h-full flex-col gap-3 rounded-xl border border-slate-800 bg-[#0f1117] p-3 text-slate-100">
        <div className="grid gap-2">
          <Metric label="Last Net WPM" value={lastResult ? String(lastResult.netWpm) : "-"} />
          <Metric label="Last Accuracy" value={lastResult ? `${lastResult.accuracy}%` : "-"} />
          <Metric label="Avg Net WPM" value={String(summary.avgNetWpm)} />
          <Metric label="Sessions" value={String(summary.totalSessions)} />
        </div>

        <div className="rounded border border-slate-700 bg-slate-950/40 p-3">
          <div className="font-mono text-xs text-slate-400">7-SESSION TREND</div>
          <div className="mt-2 font-mono text-sm text-slate-200">
            Net WPM Delta:{" "}
            <span className={summary.netWpmDelta >= 0 ? "text-emerald-300" : "text-red-300"}>
              {formatDelta(summary.netWpmDelta)}
            </span>
          </div>
          <div className="font-mono text-sm text-slate-200">
            Accuracy Delta:{" "}
            <span className={summary.accuracyDelta >= 0 ? "text-emerald-300" : "text-red-300"}>
              {formatDelta(summary.accuracyDelta)}%
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-3 rounded-xl border border-slate-800 bg-[#0f1117] p-3 text-slate-100">
      <div className="rounded border border-slate-700 bg-slate-950/40 p-3">
        <div className="font-mono text-xs text-slate-400">WEAK LETTERS</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {weakLetters.length > 0 ? (
            weakLetters.map((item) => (
              <span
                key={item.letter}
                className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-xs text-red-200"
              >
                {item.letter.toUpperCase()} • {item.stat.accuracy.toFixed(1)}%
              </span>
            ))
          ) : (
            <span className="font-mono text-xs text-slate-500">
              No weak letters yet. Complete a few sessions.
            </span>
          )}
        </div>
      </div>

      <div className="rounded border border-slate-700 bg-slate-950/40 p-3">
        <div className="mb-2 font-mono text-xs text-slate-400">LETTER HEAT STRIP</div>
        <div className="grid grid-cols-6 gap-1">
          {ALPHABET.map((letter) => {
            const stat = letterStats[letter];
            const errorRate = stat.attempts === 0 ? 0 : stat.errors / stat.attempts;
            const intensity = Math.min(1, errorRate * 2 + stat.streakError * 0.1);
            const bg = `rgba(239, 68, 68, ${0.1 + intensity * 0.55})`;

            return (
              <div
                key={letter}
                className="rounded border border-slate-700 px-1 py-1 text-center font-mono text-xs"
                style={{ background: bg }}
                title={`${letter.toUpperCase()} | attempts: ${stat.attempts}, errors: ${stat.errors}, accuracy: ${stat.accuracy}%`}
              >
                {letter.toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-700 bg-slate-950/40 p-3">
      <div className="font-mono text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-base text-slate-100">{value}</div>
    </div>
  );
}

export default Analytics;
