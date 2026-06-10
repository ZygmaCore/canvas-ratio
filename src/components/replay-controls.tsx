"use client";

import type { ReplayRange } from "@/lib/replay";

type ReplaySpeed = "slow" | "normal" | "fast";

type ReplayControlsProps = {
  rangeDays: ReplayRange;
  speed: ReplaySpeed;
  playing: boolean;
  reducedMotion: boolean;
  canMove: boolean;
  onRangeChange: (rangeDays: ReplayRange) => void;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function ReplayControls({
  rangeDays,
  speed,
  playing,
  reducedMotion,
  canMove,
  onRangeChange,
  onSpeedChange,
  onPlayPause,
  onPrevious,
  onNext,
}: ReplayControlsProps) {
  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-end">
        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Range
          </span>
          <select
            value={rangeDays}
            onChange={(event) => onRangeChange(Number(event.currentTarget.value) as ReplayRange)}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Speed
          </span>
          <select
            value={speed}
            onChange={(event) => onSpeedChange(event.currentTarget.value as ReplaySpeed)}
            disabled={reducedMotion}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-[#FFD7BF]"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onPrevious}
          disabled={!canMove}
          className="min-h-11 border-2 border-[#1A1A1A] bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200"
        >
          Previous Day
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          disabled={!canMove || reducedMotion}
          className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canMove}
          className="min-h-11 border-2 border-[#1A1A1A] bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200"
        >
          Next Day
        </button>
      </div>

      {reducedMotion ? (
        <p className="mt-3 text-sm font-bold text-[#4a4a4a]">
          Reduced motion is on. Use Previous Day and Next Day to step through
          replay.
        </p>
      ) : null}
    </section>
  );
}

export type { ReplaySpeed };
