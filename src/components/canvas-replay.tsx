"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReplayControls, type ReplaySpeed } from "@/components/replay-controls";
import { ReplayDayView } from "@/components/replay-day-view";
import { ReplaySummary } from "@/components/replay-summary";
import {
  buildReplayReviewPrompt,
  summarizeReplayRange,
  type ReplayRange,
} from "@/lib/replay";
import { loadSettings, type CanvasSettings } from "@/lib/settings";
import { loadAllDayRecords } from "@/lib/storage";
import type { DayRecord } from "@/types/canvas";

const speedDurations: Record<ReplaySpeed, number> = {
  slow: 1800,
  normal: 1000,
  fast: 520,
};

export function CanvasReplay() {
  const [days, setDays] = useState<DayRecord[]>([]);
  const [rangeDays, setRangeDays] = useState<ReplayRange>(7);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>("normal");
  const [hydrated, setHydrated] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [settings, setSettings] = useState<CanvasSettings>(() => ({
    projects: [],
  }));
  const replayData = useMemo(
    () => summarizeReplayRange(days, rangeDays, settings.projects),
    [days, rangeDays, settings.projects],
  );
  const replayDays = useMemo(
    () =>
      days
        .filter((day) =>
          replayData.daySummaries.some((summary) => summary.date === day.date),
        )
        .sort((first, second) => first.date.localeCompare(second.date)),
    [days, replayData.daySummaries],
  );
  const activeDay = replayDays[activeIndex] ?? replayDays[0] ?? null;
  const canMove = replayDays.length > 1;

  useEffect(() => {
    setDays(loadAllDayRecords());
    setSettings(loadSettings());
    setHydrated(true);
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    setPlaying(false);
  }, [rangeDays]);

  useEffect(() => {
    if (!playing || reducedMotion || replayDays.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex >= replayDays.length - 1 ? 0 : currentIndex + 1,
      );
    }, speedDurations[speed]);

    return () => window.clearInterval(intervalId);
  }, [playing, reducedMotion, replayDays.length, speed]);

  async function handleCopyReplayPrompt() {
    try {
      await copyPlainText(
        buildReplayReviewPrompt({
          summary: replayData.summary,
          daySummaries: replayData.daySummaries,
        }),
      );
      setCopyStatus("Replay review prompt copied.");
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Could not copy replay review prompt.");
    }
  }

  function handlePrevious() {
    setActiveIndex((currentIndex) =>
      currentIndex <= 0 ? Math.max(0, replayDays.length - 1) : currentIndex - 1,
    );
  }

  function handleNext() {
    setActiveIndex((currentIndex) =>
      currentIndex >= replayDays.length - 1 ? 0 : currentIndex + 1,
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden pb-8">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FBFBF7]/95 shadow-[0_4px_0_rgba(26,26,26,0.18)] backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-[#2F5FBF]">
              Canvas Ratio
            </p>
            <h1 className="mt-1 text-3xl font-black">Canvas Replay</h1>
            <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
              Replay lets you watch your week as a canvas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyReplayPrompt}
              className="min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Copy Replay Review Prompt
            </button>
            <Link
              href="/canvas"
              className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Back to Canvas
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {copyStatus ? (
          <p className="rounded-lg border-2 border-[#1A1A1A] bg-white p-3 text-sm font-black shadow-[3px_3px_0_#1A1A1A]">
            {copyStatus}
          </p>
        ) : null}

        {!hydrated ? (
          <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0_#1A1A1A]">
            <h2 className="text-2xl font-black">Loading local replay...</h2>
          </section>
        ) : null}

        {hydrated ? (
          <>
            <ReplayControls
              rangeDays={rangeDays}
              speed={speed}
              playing={playing}
              reducedMotion={reducedMotion}
              canMove={canMove}
              onRangeChange={setRangeDays}
              onSpeedChange={setSpeed}
              onPlayPause={() => setPlaying((current) => !current)}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
              <ReplayDayView day={activeDay} projects={settings.projects} />
              <ReplaySummary summary={replayData.summary} />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

async function copyPlainText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that expose Clipboard API but deny write access.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Copy command failed.");
  }
}
