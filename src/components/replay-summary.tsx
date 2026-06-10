"use client";

import type { ReplaySummary as ReplaySummaryData } from "@/lib/replay";

type ReplaySummaryProps = {
  summary: ReplaySummaryData;
};

export function ReplaySummary({ summary }: ReplaySummaryProps) {
  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <p className="text-xs font-black uppercase text-[#2F5FBF]">
        Pattern summary
      </p>
      <h2 className="mt-1 text-2xl font-black">
        {summary.rangeStart} to {summary.rangeEnd}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Saved days" value={String(summary.daysCount)} />
        <Metric label="Colored cells" value={String(summary.totalColoredCells)} />
        <Metric
          label="Unavailable cells"
          value={String(summary.totalUnavailableCells)}
        />
        <Metric
          label="Average colored"
          value={`${summary.averageColoredCellsPerDay}/day`}
        />
      </div>

      <div className="mt-4 grid gap-2 text-sm font-bold sm:grid-cols-2">
        <p>
          Most used project:{" "}
          <span className="font-black">
            {summary.mostUsedProject ?? "No colored data yet"}
          </span>
        </p>
        <p>
          Most common theme:{" "}
          <span className="font-black">
            {summary.mostCommonTheme ?? "No theme data yet"}
          </span>
        </p>
        <p>
          Highest unavailable day:{" "}
          <span className="font-black">
            {summary.highestUnavailableDay ?? "None"}
          </span>
        </p>
        <p>
          Highest School / Work / Personal:{" "}
          <span className="font-black">
            {summary.highestAcademicDay ?? "None"} /{" "}
            {summary.highestProfessionalDay ?? "None"} /{" "}
            {summary.highestPersonalDay ?? "None"}
          </span>
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3">
      <p className="text-xs font-black uppercase text-[#2F5FBF]">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
