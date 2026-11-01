"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ALPHABET,
  buildConsistencyCalendar,
  buildProgressSummary,
  calculateStreak,
  FINGER_MAP,
  FingerId,
  getAdaptiveWorkoutLetters,
  getLetterMastery,
  Letter,
  MasteryTier,
} from "@/lib/typingEngine";
import { useTypingSession } from "@/store";

const QWERTY_ROWS: Letter[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const FINGER_LABELS: Record<FingerId, string> = {
  "left-pinky": "Left Pinky (Q, A, Z)",
  "left-ring": "Left Ring (W, S, X)",
  "left-middle": "Left Middle (E, D, C)",
  "left-index": "Left Index (R, F, V, T, G, B)",
  "right-index": "Right Index (Y, H, N, U, J, M)",
  "right-middle": "Right Middle (I, K)",
  "right-ring": "Right Ring (O, L)",
  "right-pinky": "Right Pinky (P)",
  thumbs: "Thumbs",
};

export default function AnalyticsDashboard() {
  const isOpen = useTypingSession((state) => state.isAnalyticsOpen);
  const closeAnalytics = useTypingSession((state) => state.closeAnalytics);
  const letterStats = useTypingSession((state) => state.letterStats);
  const sessionHistory = useTypingSession((state) => state.sessionHistory);
  const startTargetedDrill = useTypingSession((state) => state.startTargetedDrill);

  // Active section tab in dashboard
  const [activeTab, setActiveTab] = useState<"overview" | "heatmap" | "engine" | "history">("overview");

  // Selected letter for heatmap inspection
  const [inspectedLetter, setInspectedLetter] = useState<Letter>("q");

  // Training Engine Local Config
  const [engineMode, setEngineMode] = useState<"single" | "cluster" | "finger" | "adaptive">("adaptive");
  const [selectedSingleLetter, setSelectedSingleLetter] = useState<Letter>("q");
  const [selectedCluster, setSelectedCluster] = useState<Letter[]>(["q", "x", "z"]);
  const [selectedFinger, setSelectedFinger] = useState<FingerId>("left-pinky");
  const [drillDuration, setDrillDuration] = useState<number>(30);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAnalytics();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAnalytics]);

  // Derived metrics
  const streak = useMemo(() => calculateStreak(sessionHistory), [sessionHistory]);
  const calendarDays = useMemo(() => buildConsistencyCalendar(sessionHistory, 12), [sessionHistory]);
  const masteryList = useMemo(
    () => ALPHABET.map((letter) => getLetterMastery(letterStats[letter])),
    [letterStats],
  );
  const adaptiveLetters = useMemo(() => getAdaptiveWorkoutLetters(letterStats), [letterStats]);
  const summary = useMemo(() => buildProgressSummary(sessionHistory, 7), [sessionHistory]);

  const weakLettersCount = useMemo(() => {
    return masteryList.filter(
      (m) => (m.stat.attempts > 0 && m.stat.accuracy < 85) || m.score > 0.2
    ).length;
  }, [masteryList]);

  const totalCharsTyped = useMemo(() => {
    return sessionHistory.reduce((sum, s) => sum + (s.charsTyped || 0), 0);
  }, [sessionHistory]);

  // Auto-set inspected letter to top weak key if available
  useEffect(() => {
    if (adaptiveLetters.weakLetters.length > 0) {
      setInspectedLetter(adaptiveLetters.weakLetters[0]);
      setSelectedSingleLetter(adaptiveLetters.weakLetters[0]);
      setSelectedCluster(adaptiveLetters.targetLetters.slice(0, 4));
    }
  }, [adaptiveLetters]);

  if (!isOpen) return null;

  const inspectedMastery = masteryList.find((m) => m.letter === inspectedLetter);

  // Key color helper
  const getKeyColor = (letter: Letter) => {
    const stat = letterStats[letter];
    if (!stat || stat.attempts < 3) {
      return "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600";
    }
    if (stat.accuracy >= 95) {
      return "border-emerald-600/60 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400";
    }
    if (stat.accuracy >= 88) {
      return "border-emerald-800/40 bg-zinc-900/80 text-emerald-400 hover:border-emerald-600";
    }
    if (stat.accuracy >= 75) {
      return "border-yellow-700/50 bg-yellow-950/20 text-yellow-300 hover:border-yellow-500";
    }
    if (stat.accuracy >= 60) {
      return "border-orange-700/60 bg-orange-950/30 text-orange-300 hover:border-orange-500";
    }
    return "border-rose-700 bg-rose-950/40 text-rose-300 font-bold hover:border-rose-500";
  };

  const handleLaunchDrill = () => {
    if (engineMode === "single") {
      startTargetedDrill({
        targetType: "letter",
        targetId: selectedSingleLetter,
        targetLetters: [selectedSingleLetter],
        durationSec: drillDuration,
      });
    } else if (engineMode === "cluster") {
      startTargetedDrill({
        targetType: "cluster",
        targetLetters: selectedCluster.length > 0 ? selectedCluster : ["q", "x", "z"],
        durationSec: drillDuration,
      });
    } else if (engineMode === "finger") {
      startTargetedDrill({
        targetType: "finger",
        targetId: selectedFinger,
        durationSec: drillDuration,
      });
    } else {
      // adaptive
      startTargetedDrill({
        targetType: "adaptive",
        targetLetters: adaptiveLetters.targetLetters,
        durationSec: drillDuration,
      });
    }
  };

  const toggleClusterLetter = (letter: Letter) => {
    setSelectedCluster((prev) =>
      prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]
    );
  };

  // Trajectory points for past sessions (up to 40)
  const trajectorySessions = sessionHistory.slice(-40);
  const maxWpm = Math.max(100, ...trajectorySessions.map((s) => s.netWpm));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117] font-mono text-zinc-200 shadow-2xl">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22]/90 px-4 py-3 select-none">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]/80" />
            <span className="ml-2 text-xs font-semibold tracking-wider text-zinc-400">
              typogym // telemetry & weakness engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400">
              [ESC] close
            </span>
            <button
              type="button"
              onClick={closeAnalytics}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 bg-zinc-900/40 px-4 py-2 text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            {(
              [
                { id: "overview", label: "📊 Overview" },
                { id: "heatmap", label: "⌨️ QWERTY Heatmap" },
                { id: "engine", label: "⚡ Weakness Engine" },
                { id: "history", label: "📈 Progress & Mastery" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded px-3 py-1.5 transition ${
                  activeTab === tab.id
                    ? "bg-zinc-800 font-semibold text-emerald-400 shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 rounded bg-zinc-800/60 px-2.5 py-1 text-emerald-400">
              <span>🔥</span>
              <span>{streak.currentStreak}d streak</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Hero Performance Trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Metric 1: Average Net WPM */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                    <span>Average Net WPM</span>
                    <span className="text-[10px] text-zinc-500">7-session rolling</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-400">{summary.last7AvgNetWpm || summary.avgNetWpm || 0}</span>
                    <span className="text-xs text-zinc-500">WPM</span>
                    {summary.netWpmDelta !== 0 && (
                      <span className={`text-xs font-semibold ${summary.netWpmDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {summary.netWpmDelta > 0 ? `+${summary.netWpmDelta} ↑` : `${summary.netWpmDelta} ↓`}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    All-time average: {summary.avgNetWpm} WPM across {summary.totalSessions} sessions
                  </p>
                </div>

                {/* Metric 2: All-Time Accuracy */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                    <span>All-Time Accuracy</span>
                    <span className="text-[10px] text-zinc-500">keystroke fidelity</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-cyan-400">{summary.avgAccuracy || 100}%</span>
                      {summary.accuracyDelta !== 0 && (
                        <span className={`text-xs font-semibold ${summary.accuracyDelta > 0 ? "text-cyan-400" : "text-rose-400"}`}>
                          {summary.accuracyDelta > 0 ? `+${summary.accuracyDelta}%` : `${summary.accuracyDelta}%`}
                        </span>
                      )}
                    </div>
                    {/* Mini Radial Indicator */}
                    <div className="relative h-10 w-10">
                      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-cyan-400"
                          strokeDasharray={`${summary.avgAccuracy || 100}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Total Characters: {totalCharsTyped.toLocaleString()}
                  </p>
                </div>

                {/* Metric 3: Weak Letters Count */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                    <span>Weakness Diagnostics</span>
                    <span className="text-[10px] text-zinc-500">&lt;85% acc</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold ${weakLettersCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {weakLettersCount}
                    </span>
                    <span className="text-xs text-zinc-500">keys need focus</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {adaptiveLetters.weakLetters.length > 0 ? (
                      adaptiveLetters.weakLetters.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => {
                            setInspectedLetter(l);
                            setActiveTab("heatmap");
                          }}
                          className="rounded bg-rose-950/40 border border-rose-800/60 px-1.5 py-0.5 text-[10px] uppercase font-bold text-rose-300 hover:bg-rose-900/50"
                        >
                          {l} ({letterStats[l].accuracy.toFixed(0)}%)
                        </button>
                      ))
                    ) : (
                      <span className="text-[11px] text-emerald-400">All calibrated keys above 85% accuracy ✨</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Quick Action: Smart Adaptive Workout Banner */}
              <div className="rounded-xl border border-emerald-800/60 bg-gradient-to-r from-emerald-950/30 via-zinc-900/40 to-zinc-900/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span className="text-sm font-bold text-emerald-400">Smart Adaptive Workout Ready</span>
                    <span className="rounded bg-emerald-950 border border-emerald-700/60 px-2 py-0.5 text-[10px] text-emerald-300">
                      Recommended
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 max-w-xl">
                    70% weakest keys + 20% spaced repetition review + 10% rhythm stabilizers.
                    Targets:{" "}
                    <span className="font-semibold text-zinc-200 uppercase">
                      {adaptiveLetters.targetLetters.join(", ")}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    startTargetedDrill({
                      targetType: "adaptive",
                      targetLetters: adaptiveLetters.targetLetters,
                      durationSec: 30,
                    });
                  }}
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-black transition active:scale-95 shadow-lg shadow-emerald-950/40 shrink-0"
                >
                  ⚡ Start Workout (30s)
                </button>
              </div>

              {/* Spaced Repetition Score Decay Notice (if any) */}
              {masteryList.some((m) => m.decayStatus === "needs-review" || m.decayStatus === "rusty") && (
                <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <span>⏳</span>
                    <span>Spaced Repetition Decay Alert</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    The following letters have not been practiced in 7+ days and their neuromuscular muscle memory is decaying:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {masteryList
                      .filter((m) => m.decayStatus === "needs-review" || m.decayStatus === "rusty")
                      .map((m) => (
                        <button
                          key={m.letter}
                          type="button"
                          onClick={() => {
                            startTargetedDrill({
                              targetType: "letter",
                              targetId: m.letter,
                              targetLetters: [m.letter],
                              durationSec: 30,
                            });
                          }}
                          className="flex items-center gap-1.5 rounded border border-amber-800/60 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-900/40"
                        >
                          <span className="uppercase font-bold">{m.letter}</span>
                          <span className="text-[10px] text-zinc-500">({m.daysSinceLastSeen}d ago)</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Heatmap Teaser */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-zinc-300">Keyboard Calibration Snapshot</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("heatmap")}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Open Full Heatmap →
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1.5 py-2">
                  {QWERTY_ROWS.map((row, idx) => (
                    <div key={`overview-row-${idx}`} className="flex gap-1.5">
                      {row.map((letter) => {
                        const stat = letterStats[letter];
                        const acc = stat.attempts >= 3 ? stat.accuracy : null;
                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => {
                              setInspectedLetter(letter);
                              setActiveTab("heatmap");
                            }}
                            className={`h-8 w-8 rounded border flex flex-col items-center justify-center text-xs font-bold uppercase transition ${getKeyColor(
                              letter
                            )}`}
                          >
                            <span>{letter}</span>
                            {acc !== null && (
                              <span className="text-[8px] font-normal opacity-70">
                                {acc.toFixed(0)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE QWERTY HEATMAP */}
          {activeTab === "heatmap" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Interactive QWERTY Keyboard Heatmap</h3>
                  <p className="text-xs text-zinc-400">Click any key to inspect reaction latency, error streaks, and launch targeted drill.</p>
                </div>
                {/* Heatmap Legend */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> &gt;95%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" /> 88-95%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-400" /> 75-88%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-orange-400" /> 60-75%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt;60%
                  </span>
                </div>
              </div>

              {/* QWERTY Key Board Display */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 flex flex-col items-center gap-2">
                {QWERTY_ROWS.map((row, rowIdx) => (
                  <div
                    key={`heatmap-row-${rowIdx}`}
                    className="flex gap-1.5 sm:gap-2 justify-center w-full"
                    style={{
                      paddingLeft: rowIdx === 1 ? "1rem" : rowIdx === 2 ? "2rem" : "0",
                    }}
                  >
                    {row.map((letter) => {
                      const isSelected = inspectedLetter === letter;
                      const stat = letterStats[letter];
                      const hasAttempts = stat && stat.attempts >= 3;

                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => setInspectedLetter(letter)}
                          className={`h-12 w-10 sm:h-14 sm:w-14 rounded-lg border flex flex-col items-center justify-between p-1.5 transition active:scale-95 ${getKeyColor(
                            letter
                          )} ${isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#0d1117] font-black scale-105" : ""}`}
                        >
                          <span className="text-xs sm:text-sm font-bold uppercase">{letter}</span>
                          <span className="text-[9px] sm:text-[10px] opacity-80">
                            {hasAttempts ? `${stat.accuracy.toFixed(0)}%` : "—"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Inspected Key Deep-Dive Card */}
              {inspectedMastery && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-2xl font-bold uppercase text-emerald-400">
                        {inspectedLetter}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-zinc-100 uppercase">Key &apos;{inspectedLetter}&apos; Diagnostics</h4>
                          <span className={`rounded px-2 py-0.5 text-[10px] uppercase font-bold ${
                            inspectedMastery.tier === "master"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                              : inspectedMastery.tier === "proficient"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                              : inspectedMastery.tier === "apprentice"
                              ? "bg-yellow-950 text-yellow-300 border border-yellow-700"
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {inspectedMastery.tier}
                          </span>
                          {inspectedMastery.decayStatus !== "fresh" && (
                            <span className="rounded bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 text-[10px]">
                              {inspectedMastery.decayStatus === "rusty" ? "⚠️ Rusty" : "⏳ Review Due"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">
                          Last practiced:{" "}
                          {inspectedMastery.daysSinceLastSeen !== null
                            ? `${inspectedMastery.daysSinceLastSeen} day(s) ago`
                            : "untested"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        startTargetedDrill({
                          targetType: "letter",
                          targetId: inspectedLetter,
                          targetLetters: [inspectedLetter],
                          durationSec: 30,
                        });
                      }}
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-black transition active:scale-95 shadow-md shadow-emerald-950/40"
                    >
                      ⚡ Drill Key &apos;{inspectedLetter.toUpperCase()}&apos; Now (30s)
                    </button>
                  </div>

                  {/* Diagnostic Metrics Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                      <div className="text-zinc-500 text-[11px]">Accuracy</div>
                      <div className="text-lg font-bold text-zinc-200">
                        {inspectedMastery.stat.accuracy.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {inspectedMastery.stat.successes} hit / {inspectedMastery.stat.attempts} total
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                      <div className="text-zinc-500 text-[11px]">Avg Reaction Latency</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {inspectedMastery.stat.avgReactionMs ? `${inspectedMastery.stat.avgReactionMs.toFixed(0)} ms` : "—"}
                      </div>
                      <div className="text-[10px] text-zinc-500">neuromuscular delay</div>
                    </div>

                    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                      <div className="text-zinc-500 text-[11px]">Errors & Streaks</div>
                      <div className="text-lg font-bold text-rose-400">
                        {inspectedMastery.stat.errors} errors
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Current error streak: {inspectedMastery.stat.streakError}
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                      <div className="text-zinc-500 text-[11px]">Weakness Score</div>
                      <div className="text-lg font-bold text-amber-400">
                        {inspectedMastery.score.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-zinc-500">0.0 (master) → 1.0 (critical)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEAKNESS TRAINING ENGINE */}
          {activeTab === "engine" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-800/80 pb-3">
                <h3 className="text-sm font-bold text-zinc-200">The Weakness Training Engine</h3>
                <p className="text-xs text-zinc-400">
                  Select your targeted acquisition workout. TypoGym biases corpus frequencies specifically around your training goals.
                </p>
              </div>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: "adaptive" as const,
                    title: "Smart Adaptive",
                    badge: "Recommended",
                    desc: "70% weakest + 20% decay review + 10% rhythm",
                  },
                  {
                    id: "single" as const,
                    title: "Single Key Drill",
                    badge: "Deep Focus",
                    desc: "Isolate 1 problematic letter with 60%+ density",
                  },
                  {
                    id: "cluster" as const,
                    title: "Weak Cluster",
                    badge: "Custom Mix",
                    desc: "Target custom combinations of 2-5 weak letters",
                  },
                  {
                    id: "finger" as const,
                    title: "Finger Zone",
                    badge: "Ergonomics",
                    desc: "Drill specific finger muscle memory groups",
                  },
                ].map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setEngineMode(card.id)}
                    className={`rounded-xl border p-3.5 text-left transition flex flex-col justify-between ${
                      engineMode === card.id
                        ? "border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-100">{card.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                          engineMode === card.id ? "bg-emerald-900/80 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Mode-Specific Configuration Panel */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                
                {/* 1. ADAPTIVE MODE */}
                {engineMode === "adaptive" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">Auto-assembled Training Target</span>
                      <span className="text-[11px] text-zinc-500">calibrated from your keystroke history</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3">
                        <div className="text-[11px] font-bold text-rose-300 mb-1">Weak Keys (70% weight)</div>
                        <div className="flex flex-wrap gap-1">
                          {adaptiveLetters.weakLetters.length > 0 ? (
                            adaptiveLetters.weakLetters.map((l) => (
                              <span key={l} className="rounded bg-rose-900/50 px-2 py-0.5 font-bold uppercase text-rose-200">
                                {l} ({letterStats[l].accuracy.toFixed(0)}%)
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-500">None detected</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
                        <div className="text-[11px] font-bold text-amber-300 mb-1">Decay Review (20% weight)</div>
                        <div className="flex flex-wrap gap-1">
                          {adaptiveLetters.reviewLetters.length > 0 ? (
                            adaptiveLetters.reviewLetters.map((l) => (
                              <span key={l} className="rounded bg-amber-900/50 px-2 py-0.5 font-bold uppercase text-amber-200">
                                {l}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-500">No decay</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
                        <div className="text-[11px] font-bold text-emerald-300 mb-1">Rhythm Anchors (10% weight)</div>
                        <div className="flex flex-wrap gap-1">
                          {adaptiveLetters.confidentLetters.map((l) => (
                            <span key={l} className="rounded bg-emerald-900/50 px-2 py-0.5 font-bold uppercase text-emerald-200">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SINGLE LETTER MODE */}
                {engineMode === "single" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Select Target Letter to Isolate</span>
                      <span className="text-[11px] text-zinc-500">Active: Key &apos;{selectedSingleLetter.toUpperCase()}&apos;</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ALPHABET.map((letter) => {
                        const isSelected = selectedSingleLetter === letter;
                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => setSelectedSingleLetter(letter)}
                            className={`h-9 w-9 rounded border font-bold uppercase text-xs transition ${
                              isSelected
                                ? "border-emerald-400 bg-emerald-500 text-black scale-105"
                                : getKeyColor(letter)
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. CLUSTER MODE */}
                {engineMode === "cluster" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-200">Build Your Weak Alphabet Cluster</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCluster(adaptiveLetters.weakLetters.slice(0, 3))}
                          className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-emerald-400 hover:bg-zinc-700"
                        >
                          Select Top 3 Weakest
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCluster(adaptiveLetters.targetLetters.slice(0, 5))}
                          className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                        >
                          Select Top 5 Weakest
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ALPHABET.map((letter) => {
                        const isSelected = selectedCluster.includes(letter);
                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => toggleClusterLetter(letter)}
                            className={`h-9 w-9 rounded border font-bold uppercase text-xs transition ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-500 text-black scale-105"
                                : getKeyColor(letter)
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-zinc-500">
                      Selected cluster ({selectedCluster.length}):{" "}
                      <span className="uppercase text-cyan-300 font-bold">
                        {selectedCluster.length > 0 ? selectedCluster.join(", ") : "none (select letters above)"}
                      </span>
                    </p>
                  </div>
                )}

                {/* 4. FINGER ZONE MODE */}
                {engineMode === "finger" && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-200">Select Finger Ergonomics Zone</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(Object.entries(FINGER_LABELS) as [FingerId, string][]).map(([fingerId, label]) => {
                        if (fingerId === "thumbs") return null;
                        const isSelected = selectedFinger === fingerId;
                        const letters = FINGER_MAP[fingerId] || [];
                        return (
                          <button
                            key={fingerId}
                            type="button"
                            onClick={() => setSelectedFinger(fingerId)}
                            className={`rounded-lg border p-3 text-left transition flex items-center justify-between ${
                              isSelected
                                ? "border-emerald-400 bg-emerald-950/30 text-emerald-300 font-bold"
                                : "border-zinc-800 bg-zinc-950/30 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <span>{label}</span>
                            <span className="text-[10px] uppercase text-zinc-500">
                              [{letters.join(", ")}]
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Session Duration Selector & Launch Button */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>Drill Duration:</span>
                    <div className="flex items-center gap-1">
                      {[15, 30, 60, 120].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setDrillDuration(sec)}
                          className={`rounded px-2 py-1 text-xs transition ${
                            drillDuration === sec
                              ? "bg-zinc-800 font-bold text-emerald-400"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchDrill}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-xs font-bold text-black transition active:scale-95 shadow-lg shadow-emerald-950/40"
                  >
                    <span>⚡</span>
                    <span>Launch Targeted Workout ({drillDuration}s)</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: PROGRESS, MASTERY & CALENDAR */}
          {activeTab === "history" && (
            <div className="space-y-6">
              
              {/* WPM & Accuracy Trajectory Chart */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">WPM & Accuracy Trajectory</h3>
                    <p className="text-xs text-zinc-500">Performance curve across past {trajectorySessions.length} sessions</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Net WPM
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" /> Accuracy %
                    </span>
                  </div>
                </div>

                {trajectorySessions.length >= 2 ? (
                  <div className="relative h-44 w-full pt-2">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="400" y2="30" stroke="#21262d" strokeDasharray="3 3" />
                      <line x1="0" y1="60" x2="400" y2="60" stroke="#21262d" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="400" y2="90" stroke="#21262d" strokeDasharray="3 3" />

                      {/* Area Fill for WPM */}
                      <polygon
                        fill="rgba(16, 185, 129, 0.12)"
                        points={`0,120 ${trajectorySessions
                          .map((s, i) => {
                            const x = (i / (trajectorySessions.length - 1)) * 400;
                            const y = 120 - (s.netWpm / maxWpm) * 110;
                            return `${x},${y}`;
                          })
                          .join(" ")} 400,120`}
                      />

                      {/* WPM Line */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={trajectorySessions
                          .map((s, i) => {
                            const x = (i / (trajectorySessions.length - 1)) * 400;
                            const y = 120 - (s.netWpm / maxWpm) * 110;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />

                      {/* Accuracy Line */}
                      <polyline
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        points={trajectorySessions
                          .map((s, i) => {
                            const x = (i / (trajectorySessions.length - 1)) * 400;
                            const y = 120 - (s.accuracy / 100) * 110;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />

                      {/* Points */}
                      {trajectorySessions.map((s, i) => {
                        const x = (i / (trajectorySessions.length - 1)) * 400;
                        const y = 120 - (s.netWpm / maxWpm) * 110;
                        return (
                          <circle
                            key={s.startedAt}
                            cx={x}
                            cy={y}
                            r="3"
                            className="fill-emerald-400 stroke-zinc-950"
                            strokeWidth="1.5"
                          />
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs text-zinc-500">
                    Complete 2 or more sessions to generate speed and accuracy progression curves.
                  </div>
                )}
              </div>

              {/* Consistency Calendar (GitHub-style 12 weeks) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">Practice Consistency (Past 12 Weeks)</h3>
                    <p className="text-xs text-zinc-500">
                      Active streak: <span className="font-bold text-emerald-400">{streak.currentStreak} days</span> • Longest streak:{" "}
                      <span className="font-bold text-zinc-300">{streak.longestStreak} days</span>
                    </p>
                  </div>

                  {/* Milestones */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {[
                      { days: 3, label: "3d" },
                      { days: 7, label: "7d" },
                      { days: 14, label: "14d" },
                      { days: 30, label: "30d" },
                    ].map((m) => (
                      <span
                        key={m.days}
                        className={`rounded px-1.5 py-0.5 border ${
                          streak.currentStreak >= m.days
                            ? "bg-emerald-950/80 border-emerald-600 text-emerald-300 font-bold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-600"
                        }`}
                      >
                        {streak.currentStreak >= m.days ? `🏆 ${m.label}` : m.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 12-week Calendar Grid (7 rows x 12 cols) */}
                <div className="overflow-x-auto pb-2">
                  <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
                    {calendarDays.map((day) => {
                      let levelClass = "bg-zinc-800/40 border-zinc-800";
                      if (day.level === 1) levelClass = "bg-emerald-950 border-emerald-800/60";
                      else if (day.level === 2) levelClass = "bg-emerald-800 border-emerald-600";
                      else if (day.level === 3) levelClass = "bg-emerald-600 border-emerald-500";
                      else if (day.level === 4) levelClass = "bg-emerald-400 border-emerald-300";

                      return (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.count} session(s), ${day.charsTyped} chars typed`}
                          className={`h-3.5 w-3.5 rounded-[3px] border transition-colors hover:scale-125 cursor-pointer ${levelClass}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>84-day training calendar</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-zinc-800/40 border border-zinc-800" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-950 border border-emerald-800" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-800 border border-emerald-600" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-600 border border-emerald-500" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300" />
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Mastery Matrix */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">Alphabet Mastery Matrix</h3>
                    <p className="text-xs text-zinc-500">
                      Mastered:{" "}
                      <span className="font-bold text-emerald-400">
                        {masteryList.filter((m) => m.tier === "master").length} / 26
                      </span>{" "}
                      letters
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  {(
                    [
                      { tier: "master" as MasteryTier, label: "Master (≥95% acc)", color: "text-emerald-400 border-emerald-800/60 bg-emerald-950/20" },
                      { tier: "proficient" as MasteryTier, label: "Proficient (≥88%)", color: "text-cyan-400 border-cyan-800/60 bg-cyan-950/20" },
                      { tier: "apprentice" as MasteryTier, label: "Apprentice (≥75%)", color: "text-yellow-400 border-yellow-800/60 bg-yellow-950/20" },
                      { tier: "novice" as MasteryTier, label: "Novice (&lt;75% / untested)", color: "text-zinc-400 border-zinc-800 bg-zinc-950/30" },
                    ] as const
                  ).map((col) => {
                    const lettersInTier = masteryList.filter((m) => m.tier === col.tier);
                    return (
                      <div key={col.tier} className={`rounded-lg border p-3 ${col.color}`}>
                        <div className="font-bold mb-2 flex items-center justify-between text-[11px]">
                          <span>{col.label}</span>
                          <span className="rounded bg-black/40 px-1.5 py-0.2">{lettersInTier.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {lettersInTier.length > 0 ? (
                            lettersInTier.map((m) => (
                              <button
                                key={m.letter}
                                type="button"
                                onClick={() => {
                                  setInspectedLetter(m.letter);
                                  setActiveTab("heatmap");
                                }}
                                className="h-6 w-6 rounded bg-black/50 border border-white/10 uppercase font-bold text-[10px] hover:border-white/40"
                              >
                                {m.letter}
                              </button>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-600">None</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
