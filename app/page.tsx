"use client";

import { useEffect, useState } from "react";
import AlphabetGrid from "@/components/AlphabetGrid";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { BottomControls, TopControls } from "@/components/ModeControls";
import Terminal from "@/components/Terminal";
import { useTypingSession } from "@/store";

export default function HomePage() {
  const hydrateProgress = useTypingSession((state) => state.hydrateProgress);
  const initPrompt = useTypingSession((state) => state.initPrompt);

  const [activeTab, setActiveTab] = useState<"arena" | "telemetry">("arena");

  useEffect(() => {
    hydrateProgress();
    initPrompt();
  }, [hydrateProgress, initPrompt]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 text-zinc-100">
      {/* Centered Minimal Workstation */}
      <div className="flex w-full max-w-[980px] flex-col gap-3">
        {/* Top Control Strip */}
        <TopControls />

        {/* Targeted Mode Key Strip (Only shown when mode is targeted) */}
        <AlphabetGrid />

        {/* Central Terminal Window */}
        <Terminal
          externalTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* Bottom Action Strip */}
        <BottomControls
          showStats={activeTab === "telemetry"}
          onToggleStats={() =>
            setActiveTab((prev) => (prev === "arena" ? "telemetry" : "arena"))
          }
        />
      </div>

      {/* Dedicated Analytics & Weakness Engine Modal */}
      <AnalyticsDashboard />
    </main>
  );
}
