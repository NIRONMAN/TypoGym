"use client";

import { ALPHABET } from "@/lib/typingEngine";
import { useTypingSession } from "@/store";

function AlphabetGrid() {
  const mode = useTypingSession((state) => state.config.mode);
  const targetType = useTypingSession((state) => state.config.targetType);
  const targetId = useTypingSession((state) => state.config.targetId);
  const setTargetType = useTypingSession((state) => state.setTargetType);
  const setTargetId = useTypingSession((state) => state.setTargetId);

  if (mode !== "targeted" || targetType !== "letter") {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-[#10141a] p-3">
      <div className="mb-2 text-xs font-mono tracking-wide text-slate-400">
        LETTER TARGET GRID
      </div>
      <div
        className="grid gap-2 max-[900px]:grid-cols-8 max-[560px]:grid-cols-6"
        style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
      >
        {ALPHABET.map((letter) => {
          const selected = targetId === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => {
                setTargetType("letter");
                setTargetId(letter);
              }}
              className={`rounded border px-2 py-1 font-mono text-sm transition ${
                selected
                  ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              {letter.toUpperCase()}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default AlphabetGrid;
