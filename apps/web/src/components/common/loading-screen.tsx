"use client";

import { useEffect, useState } from "react";
import { CircleDot } from "lucide-react";

export default function LoadingScreen() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--lumon-terminal-bg)] font-mono">
      <div className="relative h-64 w-64">
        {/* CRT screen effect overlay */}
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] mix-blend-overlay" />

        {/* Outer rings - more geometric/digital looking */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-48 animate-[spin_4s_linear_infinite] rounded-none border-4 border-[var(--lumon-terminal-text)]/20 shadow-[0_0_15px_rgba(171,255,233,0.1)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-40 rotate-45 animate-[spin_6s_linear_infinite] rounded-none border-4 border-[var(--lumon-terminal-text)]/30" />
        </div>

        {/* Center icon with terminal-like effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-32 w-32">
            <CircleDot className="h-full w-full animate-pulse text-[var(--lumon-terminal-text)] drop-shadow-[0_0_5px_rgba(171,255,233,0.5)]" />
          </div>
        </div>

        {/* Loading text with terminal effect */}
        <div className="absolute inset-x-0 -bottom-20 text-center">
          <h2 className="mb-2 text-2xl font-bold text-[var(--lumon-terminal-text)] [text-shadow:0_0_10px_rgba(171,255,233,0.3)]">
            MACRO DATA REFINEMENT
          </h2>
          <p className="font-mono text-lg text-[var(--lumon-terminal-text)]/80">
            INITIALIZING TERMINAL{dots}
          </p>
        </div>
      </div>
    </div>
  );
}
