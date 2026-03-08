"use client";

import { FINGER_MAP, useTypingSession } from "@/store";
import { ALPHABET, PracticeMode, TargetType } from "@/lib/typingEngine";

const DURATIONS = [30, 60, 120];

function ModeControls() {
  const config = useTypingSession((state) => state.config);
  const status = useTypingSession((state) => state.status);

  const setMode = useTypingSession((state) => state.setMode);
  const setDuration = useTypingSession((state) => state.setDuration);
  const setTargetType = useTypingSession((state) => state.setTargetType);
  const setTargetId = useTypingSession((state) => state.setTargetId);
  const startSession = useTypingSession((state) => state.startSession);
  const restartSession = useTypingSession((state) => state.restartSession);
  const endSession = useTypingSession((state) => state.endSession);

  const isRunning = status === "running";

  return (
    <section className="rounded-xl border border-emerald-700/70 bg-[#0b1210] p-4 text-emerald-100">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="rounded-lg border border-emerald-900/70 bg-emerald-950/20 p-3">
          <div className="font-mono text-xs tracking-wide text-emerald-400">MODE</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {["normal", "targeted"].map((mode) => {
              const typedMode = mode as PracticeMode;
              const selected = config.mode === typedMode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(typedMode)}
                  className={`rounded border px-3 py-2 font-mono text-sm transition ${
                    selected
                      ? "border-emerald-300 bg-emerald-300/20 text-emerald-100"
                      : "border-emerald-900 bg-emerald-950/40 text-emerald-400 hover:border-emerald-700"
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-cyan-900/60 bg-cyan-950/20 p-3">
          <div className="font-mono text-xs tracking-wide text-cyan-400">DURATION</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DURATIONS.map((duration) => {
              const selected = config.durationSec === duration;
              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setDuration(duration)}
                  className={`rounded border px-3 py-2 font-mono text-sm transition ${
                    selected
                      ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                      : "border-cyan-900 bg-cyan-950/40 text-cyan-400 hover:border-cyan-700"
                  }`}
                >
                  {duration}s
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-end gap-2">
          <button
            type="button"
            onClick={() => startSession()}
            className="rounded border border-emerald-500 bg-emerald-500/20 px-3 py-2 font-mono text-sm text-emerald-100"
          >
            START
          </button>
          <button
            type="button"
            onClick={restartSession}
            className="rounded border border-amber-500 bg-amber-500/20 px-3 py-2 font-mono text-sm text-amber-100"
          >
            RESTART
          </button>
          <button
            type="button"
            onClick={() => endSession("manual")}
            disabled={!isRunning}
            className="rounded border border-red-500 bg-red-500/20 px-3 py-2 font-mono text-sm text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            END
          </button>
        </div>
      </div>

      {config.mode === "targeted" ? (
        <div className="mt-3 grid gap-2 rounded-lg border border-slate-800 bg-[#0a1016] p-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="font-mono text-xs tracking-wide text-slate-400">TARGET MODE</label>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={config.targetType ?? "letter"}
              onChange={(event) => setTargetType(event.target.value as TargetType)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 font-mono text-sm text-slate-100"
            >
              <option value="letter">LETTER</option>
              <option value="finger">FINGER</option>
            </select>

            {config.targetType === "finger" ? (
              <select
                value={config.targetId ?? "left-index"}
                onChange={(event) => setTargetId(event.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 font-mono text-sm text-slate-100"
              >
                {Object.keys(FINGER_MAP).map((finger) => (
                  <option key={finger} value={finger}>
                    {finger}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={config.targetId ?? "a"}
                onChange={(event) => setTargetId(event.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 font-mono text-sm text-slate-100"
              >
                {ALPHABET.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ModeControls;
