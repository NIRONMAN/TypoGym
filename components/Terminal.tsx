"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Analytics from "@/components/Analytics";
import { useTypingSession } from "@/store";

const CHARS_PER_LINE = 54;
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

interface TerminalProps {
  externalTab?: "arena" | "telemetry";
  onTabChange?: (tab: "arena" | "telemetry") => void;
}

export default function Terminal({ externalTab, onTabChange }: TerminalProps) {
  const prompt = useTypingSession((state) => state.prompt);
  const cursorIndex = useTypingSession((state) => state.cursorIndex);
  const currentError = useTypingSession((state) => state.currentError);
  const status = useTypingSession((state) => state.status);
  const startSession = useTypingSession((state) => state.startSession);
  const restartSession = useTypingSession((state) => state.restartSession);
  const endSession = useTypingSession((state) => state.endSession);
  const handleKeystroke = useTypingSession((state) => state.handleKeystroke);
  const tick = useTypingSession((state) => state.tick);

  const [activeTab, setActiveTabState] = useState<"arena" | "telemetry">("arena");
  const [windowStartLine, setWindowStartLine] = useState(0);

  const currentTab = externalTab ?? activeTab;
  const setTab = useCallback(
    (tab: "arena" | "telemetry") => {
      setActiveTabState(tab);
      if (onTabChange) {
        onTabChange(tab);
      }
    },
    [onTabChange],
  );

  // Switch to telemetry tab on session completion
  useEffect(() => {
    if (status === "ended") {
      setTab("telemetry");
    } else if (status === "running") {
      setTab("arena");
    }
  }, [status, setTab]);

  // Tick timer
  useEffect(() => {
    const timer = setInterval(() => {
      tick(Date.now());
    }, 200);

    return () => clearInterval(timer);
  }, [tick]);

  // Global keystroke handler
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

      // Tab: quick restart
      if (event.key === "Tab") {
        event.preventDefault();
        restartSession();
        setTab("arena");
        return;
      }

      // Enter: start / restart
      if (event.key === "Enter") {
        event.preventDefault();
        if (status === "ended") {
          restartSession();
        } else if (status === "idle") {
          startSession();
        } else {
          restartSession();
        }
        setTab("arena");
        return;
      }

      // Escape: abort running session
      if (event.key === "Escape" && status === "running") {
        event.preventDefault();
        endSession("escape");
        return;
      }

      // Idle mode: typing first key immediately starts session
      if (status === "idle") {
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          startSession();
          handleKeystroke(event.key, Date.now());
          setTab("arena");
          return;
        }
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
  }, [status, startSession, restartSession, endSession, handleKeystroke, setTab]);

  // Split prompt lines
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
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0d1117] shadow-xl">
      {/* Clean Window Titlebar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#161b22]/70 px-4 py-2.5 select-none">
        {/* Left: Clean Traffic Lights */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]/80" />
        </div>

        {/* Center: Quiet Window Title */}
        <div className="font-mono text-xs text-zinc-400">
          typogym
        </div>

        {/* Right: Tab view toggle */}
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setTab(currentTab === "arena" ? "telemetry" : "arena")}
            className="text-[11px] text-zinc-500 transition hover:text-zinc-300"
          >
            {currentTab === "arena" ? "stats" : "typing"}
          </button>
        </div>
      </div>

      {/* Terminal Screen Body */}
      <div className="flex min-h-[280px] flex-col justify-center p-6 md:p-8 font-mono">
        {currentTab === "telemetry" ? (
          <Analytics
            onRestart={() => setTab("arena")}
            onSelectTargetLetter={() => setTab("arena")}
          />
        ) : (
          <div className="flex flex-col justify-center">
            {prompt ? (
              <div>
                <div className="text-[24px] leading-[2.6rem] tracking-[0.02em] md:text-[28px] md:leading-[3rem]">
                  {visibleLines.map((line) => (
                    <p
                      key={`${line.start}-${line.end}`}
                      className="h-[3rem] overflow-hidden whitespace-pre [overflow-wrap:anywhere]"
                    >
                      {line.text.split("").map((char, localIndex) => {
                        const index = line.start + localIndex;
                        const isPast = index < cursorIndex;
                        const isCurrent = index === cursorIndex;

                        let charColor = "text-zinc-600";
                        if (isPast) {
                          charColor = "text-zinc-100";
                        }

                        let cursorStyle = "";
                        if (isCurrent) {
                          if (status === "running") {
                            cursorStyle = currentError
                              ? "bg-rose-500 text-white font-bold"
                              : "bg-emerald-400 text-black font-bold";
                          } else {
                            cursorStyle =
                              "bg-emerald-400 text-black font-bold terminal-cursor-blink";
                          }
                        }

                        return (
                          <span
                            key={`${index}-${char}`}
                            className={`rounded-[2px] transition-colors duration-75 ${charColor} ${cursorStyle}`}
                          >
                            {char === " " ? "\u00A0" : char}
                          </span>
                        );
                      })}
                    </p>
                  ))}

                  {Array.from({ length: fillerLineCount }).map((_, index) => (
                    <p key={`filler-${index}`} className="h-[3rem] text-transparent">
                      .
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Subtle Idle Instruction */}
            {status === "idle" ? (
              <div className="mt-4 text-xs text-zinc-600">
                type any key to start • <kbd className="text-zinc-500">tab</kbd> to restart
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
