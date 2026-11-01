"use client";

import { useMemo } from "react";
import {
  calculateStreak,
  getAdaptiveWorkoutLetters,
  Letter,
  PracticeMode,
} from "@/lib/typingEngine";
import { useTypingSession } from "@/store";

const DURATIONS = [15, 30, 60, 120];

function formatClock(totalSec: number): string {
  const safe = Math.max(0, totalSec);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function TopControls() {
  const config = useTypingSession((state) => state.config);
  const status = useTypingSession((state) => state.status);
  const remainingSec = useTypingSession((state) => state.remainingSec);
  const setMode = useTypingSession((state) => state.setMode);
  const setDuration = useTypingSession((state) => state.setDuration);
  const openAnalytics = useTypingSession((state) => state.openAnalytics);
  const sessionHistory = useTypingSession((state) => state.sessionHistory);
  const letterStats = useTypingSession((state) => state.letterStats);
  const startTargetedDrill = useTypingSession((state) => state.startTargetedDrill);

  const isRunning = status === "running";
  const clockSeconds = status === "idle" ? config.durationSec : remainingSec;

  const streak = useMemo(() => calculateStreak(sessionHistory), [sessionHistory]);
  const adaptive = useMemo(() => getAdaptiveWorkoutLetters(letterStats), [letterStats]);

  // Identify primary weak letter
  const primaryWeak = adaptive.weakLetters[0] as Letter | undefined;
  const primaryStat = primaryWeak ? letterStats[primaryWeak] : null;

  return (
    <div className="flex flex-col gap-2 font-mono">
      {/* Top Header Row */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 py-1 text-xs transition-opacity duration-300 ${
          isRunning ? "opacity-60 hover:opacity-100" : "opacity-100"
        }`}
      >
        {/* Brand & Left Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Streak Pill */}
          <button
            type="button"
            onClick={openAnalytics}
            title={`${streak.currentStreak} day streak. Click for analytics.`}
            className="flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 transition hover:bg-emerald-900/50"
          >
            <span>🔥</span>
            <span>{streak.currentStreak}d</span>
          </button>

          {/* Stats Button */}
          <button
            type="button"
            onClick={openAnalytics}
            className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] font-bold text-zinc-300 transition hover:border-zinc-700 hover:text-emerald-400"
          >
            <span>📊</span>
            <span>STATS</span>
          </button>

          {/* Mode Selector */}
          <div className="flex items-center gap-2 text-zinc-500 pl-2">
            <span className="text-[11px] text-zinc-600">mode</span>
            <div className="flex items-center gap-1">
              {(["normal", "targeted"] as PracticeMode[]).map((mode) => {
                const selected = config.mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMode(mode)}
                    className={`rounded px-2 py-0.5 transition ${
                      selected
                        ? "bg-zinc-800 font-semibold text-emerald-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-[11px] text-zinc-600">time</span>
            <div className="flex items-center gap-1">
              {DURATIONS.map((sec) => {
                const selected = config.durationSec === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDuration(sec)}
                    className={`rounded px-1.5 py-0.5 transition ${
                      selected
                        ? "bg-zinc-800 font-semibold text-cyan-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Focused Timer */}
        <div className="flex items-center gap-2 font-mono">
          <span
            className={`text-sm font-semibold tracking-wider transition-colors ${
              isRunning ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {formatClock(clockSeconds)}
          </span>
        </div>
      </div>

      {/* Subtle Weakness Quick-Action (Preserves pristine typing arena: fades out 100% when running) */}
      <div
        className={`flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-400 transition-all duration-300 ${
          isRunning ? "opacity-0 pointer-events-none h-0 py-0 overflow-hidden border-transparent" : "opacity-100"
        }`}
      >
        {primaryWeak && primaryStat ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-amber-400">💡 Weakness Detected:</span>
            <span className="font-bold uppercase text-zinc-200">&apos;{primaryWeak}&apos;</span>
            <span className="text-zinc-500">({primaryStat.accuracy.toFixed(0)}% acc)</span>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={() => {
                startTargetedDrill({
                  targetType: "letter",
                  targetId: primaryWeak,
                  targetLetters: [primaryWeak],
                });
              }}
              className="rounded bg-zinc-800/80 px-2 py-0.5 font-semibold text-emerald-400 transition hover:bg-zinc-700 hover:text-white"
            >
              ⚡ Train &apos;{primaryWeak.toUpperCase()}&apos;
            </button>
            <button
              type="button"
              onClick={() => {
                startTargetedDrill({
                  targetType: "cluster",
                  targetLetters: adaptive.targetLetters.slice(0, 3),
                });
              }}
              className="rounded bg-zinc-800/80 px-2 py-0.5 font-semibold text-cyan-400 transition hover:bg-zinc-700 hover:text-white"
            >
              🎯 Train Top 3
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <span>✨ Keys calibrated & stable</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                startTargetedDrill({
                  targetType: "adaptive",
                  targetLetters: adaptive.targetLetters,
                });
              }}
              className="rounded bg-zinc-800/60 px-2 py-0.5 text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400"
            >
              ⚡ Adaptive Workout
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={openAnalytics}
          className="text-[11px] text-zinc-500 hover:text-emerald-400"
        >
          open analytics →
        </button>
      </div>
    </div>
  );
}

interface BottomControlsProps {
  onToggleStats?: () => void;
  showStats?: boolean;
}

export function BottomControls({ onToggleStats }: BottomControlsProps) {
  const status = useTypingSession((state) => state.status);
  const restartSession = useTypingSession((state) => state.restartSession);
  const endSession = useTypingSession((state) => state.endSession);
  const openAnalytics = useTypingSession((state) => state.openAnalytics);

  const isRunning = status === "running";

  const handleStatsClick = () => {
    openAnalytics();
    if (onToggleStats) {
      onToggleStats();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2 font-mono text-xs text-zinc-500">
      {/* Quick Action Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={restartSession}
          className="flex items-center gap-1.5 rounded border border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 text-zinc-300 transition hover:border-zinc-700 hover:text-white active:scale-95"
        >
          <span>↺</span>
          <span>restart</span>
        </button>

        {isRunning ? (
          <button
            type="button"
            onClick={() => endSession("manual")}
            className="flex items-center gap-1.5 rounded border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-rose-300 transition hover:bg-rose-950/40 active:scale-95"
          >
            <span>⏹</span>
            <span>stop</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleStatsClick}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-emerald-400"
        >
          <span>📊 stats</span>
        </button>
      </div>

      {/* Quiet Key Shortcuts Hint */}
      <div className="flex items-center gap-3 text-[11px] text-zinc-600">
        <span>
          <kbd className="text-zinc-400">tab</kbd> restart
        </span>
        <span>•</span>
        <span>
          <kbd className="text-zinc-400">esc</kbd> stop
        </span>
      </div>
    </div>
  );
}

export default function ModeControls() {
  return (
    <div className="flex flex-col gap-2">
      <TopControls />
      <BottomControls />
    </div>
  );
}
