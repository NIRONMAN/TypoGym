"use client";

import { ALPHABET } from "@/lib/typingEngine";
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
  const setTargetType = useTypingSession((state) => state.setTargetType);
  const setTargetId = useTypingSession((state) => state.setTargetId);
  const letterStats = useTypingSession((state) => state.letterStats);

  if (mode !== "targeted") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-800/60 py-2 font-mono text-xs text-zinc-500">
      {/* Target Type Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-zinc-600">focus:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTargetType("letter")}
            className={`rounded px-1.5 py-0.5 transition ${
              targetType === "letter"
                ? "bg-zinc-800 font-semibold text-emerald-400"
                : "hover:text-zinc-300"
            }`}
          >
            letter
          </button>
          <button
            type="button"
            onClick={() => setTargetType("finger")}
            className={`rounded px-1.5 py-0.5 transition ${
              targetType === "finger"
                ? "bg-zinc-800 font-semibold text-emerald-400"
                : "hover:text-zinc-300"
            }`}
          >
            finger
          </button>
        </div>
      </div>

      {/* Target Keys Strip */}
      {targetType === "letter" ? (
        <div className="flex flex-wrap items-center gap-1">
          {ALPHABET.map((letter) => {
            const isSelected = targetId === letter;
            const stat = letterStats[letter];
            const hasHighError = stat.attempts > 5 && stat.accuracy < 85;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  setTargetType("letter");
                  setTargetId(letter);
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
      ) : (
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
    </div>
  );
}
