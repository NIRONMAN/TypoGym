"use client";

import { PracticeMode } from "@/lib/typingEngine";
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

  const isRunning = status === "running";
  const clockSeconds = status === "idle" ? config.durationSec : remainingSec;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 py-1 font-mono text-xs transition-opacity duration-300 ${
        isRunning ? "opacity-60 hover:opacity-100" : "opacity-100"
      }`}
    >
      {/* Mode & Duration Selectors */}
      <div className="flex flex-wrap items-center gap-6 text-zinc-500">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
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
  );
}

interface BottomControlsProps {
  onToggleStats?: () => void;
  showStats?: boolean;
}

export function BottomControls({ onToggleStats, showStats }: BottomControlsProps) {
  const status = useTypingSession((state) => state.status);
  const restartSession = useTypingSession((state) => state.restartSession);
  const endSession = useTypingSession((state) => state.endSession);

  const isRunning = status === "running";

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

        {onToggleStats ? (
          <button
            type="button"
            onClick={onToggleStats}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 transition ${
              showStats
                ? "bg-zinc-800 text-cyan-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span>{showStats ? "⌨ typing" : "📊 stats"}</span>
          </button>
        ) : null}
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
