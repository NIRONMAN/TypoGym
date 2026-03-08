"use client";

import { useEffect } from "react";
import ModeControls from "@/components/ModeControls";
import Terminal from "@/components/Terminal";
import { useTypingSession } from "@/store";

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

export default function HomePage() {
  const hydrateProgress = useTypingSession((state) => state.hydrateProgress);
  const status = useTypingSession((state) => state.status);
  const config = useTypingSession((state) => state.config);
  const remainingSec = useTypingSession((state) => state.remainingSec);
  const isRunning = status === "running";
  const clockSeconds = status === "idle" ? config.durationSec : remainingSec;

  useEffect(() => {
    hydrateProgress();
  }, [hydrateProgress]);

  return (
    <main className="h-screen overflow-hidden bg-[#050706] px-3 py-3 text-slate-100 md:px-5">
      <div className="mx-auto grid h-full w-full max-w-[1480px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
        <header className="rounded-xl border border-emerald-900/70 bg-[#0b1210]/75 px-4 py-3">
          <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4">
            <div className="font-mono">
              <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-500">Practice Arena</p>
              <h1 className="text-2xl font-semibold tracking-[0.08em] text-emerald-200 md:text-3xl">TypoGym</h1>
            </div>

            <div className="flex w-[150px] flex-col rounded-xl border border-emerald-900 bg-[#07100d] px-4 py-3 font-mono">
              <span className="text-xs tracking-wide text-emerald-500">TIMER</span>
              <span
                className={`text-right text-3xl leading-none tracking-widest ${
                  isRunning ? "text-emerald-200" : "text-emerald-400"
                }`}
              >
                {formatClock(clockSeconds)}
              </span>
              <span className="pt-2 text-right text-[11px] uppercase tracking-wide text-emerald-600">
                {status}
              </span>
            </div>
          </div>
        </header>

        <section className="min-h-0 flex items-center justify-center">
          <div className="h-full w-full max-w-[1180px] md:max-h-[640px]">
            <Terminal />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px]">
          <div
            className={`transition-opacity duration-500 ${
              isRunning ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <ModeControls />
          </div>
        </section>
      </div>
    </main>
  );
}
