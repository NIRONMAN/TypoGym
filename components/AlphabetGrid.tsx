"use client";

import { useMemo } from "react";
import { ALPHABET, Letter, TargetType } from "@/lib/typingEngine";
import { useTypingSession } from "@/store";

const FINGER_LABELS: Record<string, string> = {
  "left-pinky": "L-Pinky",
  "left-ring": "L-Ring",
  "left-middle": "L-Middle",
  "left-index": "L-Index",
  "right-index": "R-Index",
  "right-middle": "R-Middle",
  "right-ring": "R-Ring",
  "right-pinky": "R-Pinky",
};

export default function AlphabetGrid() {
  const mode = useTypingSession((state) => state.config.mode);
  const targetType = useTypingSession((state) => state.config.targetType ?? "letter");
  const targetId = useTypingSession((state) => state.config.targetId);
  const targetLetters = useTypingSession((state) => state.config.targetLetters ?? []);
  const setTargetType = useTypingSession((state) => state.setTargetType);
  const setTargetId = useTypingSession((state) => state.setTargetId);
  const setTargetLetters = useTypingSession((state) => state.setTargetLetters);
  const letterStats = useTypingSession((state) => state.letterStats);
  const getAdaptiveLetters = useTypingSession((state) => state.getAdaptiveLetters);

  const adaptive = useMemo(() => getAdaptiveLetters(), [getAdaptiveLetters]);

  if (mode !== "targeted") {
    return null;
  }

  const handleToggleClusterKey = (letter: Letter) => {
    const next = targetLetters.includes(letter)
      ? targetLetters.filter((l) => l !== letter)
      : [...targetLetters, letter];
    setTargetLetters(next.length > 0 ? next : [letter]);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-800/60 py-2 font-mono text-xs text-zinc-500">
      {/* Target Type Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-zinc-600">focus:</span>
        <div className="flex items-center gap-1">
          {(
            [
              { id: "letter" as TargetType, label: "letter" },
              { id: "cluster" as TargetType, label: "cluster" },
              { id: "finger" as TargetType, label: "finger" },
              { id: "adaptive" as TargetType, label: "adaptive" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTargetType(t.id);
                if (t.id === "cluster" && targetLetters.length === 0) {
                  setTargetLetters(adaptive.targetLetters.slice(0, 3));
                }
              }}
              className={`rounded px-1.5 py-0.5 transition ${
                targetType === t.id
                  ? "bg-zinc-800 font-semibold text-emerald-400"
                  : "hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Keys Strip */}
      {targetType === "letter" && (
        <div className="flex flex-wrap items-center gap-1">
          {ALPHABET.map((letter) => {
            const isSelected = targetId === letter;
            const stat = letterStats[letter];
            const hasHighError = stat.attempts > 3 && stat.accuracy < 85;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  setTargetType("letter");
                  setTargetId(letter);
                  setTargetLetters([letter]);
                }}
                className={`relative px-1.5 py-0.5 uppercase transition ${
                  isSelected
                    ? "rounded bg-zinc-800 font-bold text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {letter}
                {hasHighError && !isSelected ? (
                  <span className="absolute top-0 right-0 h-1 w-1 rounded-full bg-rose-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {targetType === "cluster" && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-zinc-600 mr-1">toggle:</span>
          {ALPHABET.map((letter) => {
            const isSelected = targetLetters.includes(letter);
            const stat = letterStats[letter];
            const hasHighError = stat.attempts > 3 && stat.accuracy < 85;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => handleToggleClusterKey(letter)}
                className={`relative px-1.5 py-0.5 uppercase transition ${
                  isSelected
                    ? "rounded bg-cyan-950 border border-cyan-700/80 font-bold text-cyan-300"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {letter}
                {hasHighError && !isSelected ? (
                  <span className="absolute top-0 right-0 h-1 w-1 rounded-full bg-rose-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {targetType === "finger" && (
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(FINGER_LABELS).map(([fingerKey, label]) => {
            const isSelected = targetId === fingerKey;

            return (
              <button
                key={fingerKey}
                type="button"
                onClick={() => {
                  setTargetType("finger");
                  setTargetId(fingerKey);
                }}
                className={`rounded px-2 py-0.5 text-[11px] transition ${
                  isSelected
                    ? "bg-zinc-800 font-bold text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {targetType === "adaptive" && (
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span>targets:</span>
          <div className="flex items-center gap-1">
            {adaptive.targetLetters.map((l) => (
              <span
                key={l}
                className="rounded bg-emerald-950 border border-emerald-700/60 px-1.5 py-0.2 font-bold uppercase text-emerald-300"
              >
                {l}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-zinc-600">(auto-balanced)</span>
        </div>
      )}
    </div>
  );
}
