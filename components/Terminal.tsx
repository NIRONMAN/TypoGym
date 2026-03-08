"use client";

import { useEffect, useMemo, useState } from "react";
import Analytics from "@/components/Analytics";
import { useTypingSession } from "@/store";

const CHARS_PER_LINE = 58;
const VISIBLE_LINES = 3;
const SHIFT_LINES = 2;

type PromptLine = {
  start: number;
  end: number;
  text: string;
};

function splitPromptIntoLines(prompt: string, maxChars: number): PromptLine[] {
  if (!prompt) {
    return [];
  }

  const lines: PromptLine[] = [];
  let start = 0;

  while (start < prompt.length) {
    let end = Math.min(prompt.length, start + maxChars);

    if (end < prompt.length) {
      const breakIndex = prompt.lastIndexOf(" ", end);
      if (breakIndex > start) {
        end = breakIndex + 1;
      }
    }

    if (end === start) {
      end = Math.min(prompt.length, start + maxChars);
    }

    lines.push({
      start,
      end,
      text: prompt.slice(start, end),
    });

    start = end;
  }

  return lines;
}

function findActiveLine(lines: PromptLine[], cursorIndex: number): number {
  if (lines.length === 0) {
    return 0;
  }

  const lineIndex = lines.findIndex((line) => cursorIndex < line.end);
  return lineIndex === -1 ? lines.length - 1 : lineIndex;
}

function Terminal() {
  const prompt = useTypingSession((state) => state.prompt);
  const cursorIndex = useTypingSession((state) => state.cursorIndex);
  const currentError = useTypingSession((state) => state.currentError);
  const status = useTypingSession((state) => state.status);
  const config = useTypingSession((state) => state.config);
  const startSession = useTypingSession((state) => state.startSession);
  const restartSession = useTypingSession((state) => state.restartSession);
  const endSession = useTypingSession((state) => state.endSession);
  const handleKeystroke = useTypingSession((state) => state.handleKeystroke);
  const tick = useTypingSession((state) => state.tick);

  const [windowStartLine, setWindowStartLine] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      tick(Date.now());
    }, 200);

    return () => clearInterval(timer);
  }, [tick]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isInteractiveTag =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT" ||
        activeElement?.isContentEditable;
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      const isShortcutChord = hasModifier || event.isComposing;

      if (isShortcutChord || isInteractiveTag) {
        return;
      }

      if (event.key === "Enter" && status !== "running") {
        event.preventDefault();
        if (status === "ended") {
          restartSession();
        } else {
          startSession();
        }
        return;
      }

      if (event.key === "Escape" && status === "running") {
        event.preventDefault();
        endSession("escape");
        return;
      }

      if (status !== "running") {
        return;
      }

      if (event.key.length === 1 || event.key === "Backspace") {
        event.preventDefault();
        handleKeystroke(event.key, Date.now());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, startSession, restartSession, endSession, handleKeystroke]);

  const header = useMemo(() => {
    if (status === "running") {
      return `RUNNING ${config.mode.toUpperCase()}`;
    }
    if (status === "ended") {
      return "SESSION COMPLETE";
    }
    return "READY";
  }, [status, config.mode]);

  const promptLines = useMemo(() => splitPromptIntoLines(prompt, CHARS_PER_LINE), [prompt]);
  const activeLineIndex = useMemo(
    () => findActiveLine(promptLines, cursorIndex),
    [promptLines, cursorIndex],
  );

  useEffect(() => {
    setWindowStartLine(0);
  }, [prompt]);

  useEffect(() => {
    if (promptLines.length === 0) {
      return;
    }

    const maxStart = Math.max(0, promptLines.length - VISIBLE_LINES);

    if (activeLineIndex < windowStartLine) {
      setWindowStartLine(Math.max(0, activeLineIndex - 1));
      return;
    }

    const shiftThreshold = windowStartLine + (VISIBLE_LINES - 1);
    if (activeLineIndex >= shiftThreshold && windowStartLine < maxStart) {
      const nextStart = Math.min(windowStartLine + SHIFT_LINES, maxStart);
      if (nextStart !== windowStartLine) {
        setWindowStartLine(nextStart);
      }
    }
  }, [activeLineIndex, promptLines.length, windowStartLine]);

  const visibleLines = useMemo(
    () => promptLines.slice(windowStartLine, windowStartLine + VISIBLE_LINES),
    [promptLines, windowStartLine],
  );

  const fillerLineCount = Math.max(0, VISIBLE_LINES - visibleLines.length);

  return (
    <section className="flex h-full w-full flex-col rounded-2xl border border-emerald-800 bg-[#060b0a] shadow-[0_24px_80px_-35px_rgba(16,185,129,0.5)]">
      <div className="flex items-center justify-between border-b border-emerald-900/70 px-5 py-2 font-mono text-xs tracking-wide text-emerald-400">
        <span>{header}</span>
        <span className="text-[10px] text-emerald-600">3-line fixed corpus</span>
      </div>

      {status === "ended" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid min-h-full gap-3 xl:grid-cols-2">
            <Analytics side="left" />
            <Analytics side="right" />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden px-5 py-5 font-mono text-[24px] leading-[2.2rem] tracking-[0.015em] text-slate-200 md:text-[28px] md:leading-[2.4rem]">
          <div className="mx-auto flex h-full w-full max-w-[98ch] flex-col justify-center">
            {prompt ? (
              <div className="rounded-xl border border-emerald-900/70 bg-black/20 px-4 py-4">
                {visibleLines.map((line) => (
                  <p
                    key={`${line.start}-${line.end}`}
                    className="h-[2.4rem] overflow-hidden whitespace-pre [overflow-wrap:anywhere]"
                  >
                    {line.text.split("").map((char, localIndex) => {
                      const index = line.start + localIndex;
                      const isPast = index < cursorIndex;
                      const isCurrent = index === cursorIndex;

                      return (
                        <span
                          key={`${index}-${char}`}
                          className={`${isPast ? "text-slate-600" : "text-slate-200"} ${
                            isCurrent && currentError && status === "running"
                              ? "rounded-sm border-b-2 border-red-400 bg-red-400/15 text-red-200"
                              : ""
                          } ${
                            isCurrent && !currentError && status === "running"
                              ? "rounded-sm border-b-2 border-emerald-300 bg-emerald-300/10"
                              : ""
                          }`}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      );
                    })}
                  </p>
                ))}
                {Array.from({ length: fillerLineCount }).map((_, index) => (
                  <p key={`filler-${index}`} className="h-[2.4rem] text-transparent">
                    .
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-900/70 bg-black/20 px-4 py-6 font-mono text-base text-slate-500">
                Press <span className="text-emerald-400">Enter</span> or use <span className="text-emerald-400">START</span>.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-emerald-900/70 px-5 py-2 font-mono text-xs text-slate-400">
        {status === "ended"
          ? "Session analytics loaded. Press Enter or START to begin a new run."
          : `Esc: end session • Backspace: previous char • Mode: ${config.mode}`}
      </div>
    </section>
  );
}

export default Terminal;
