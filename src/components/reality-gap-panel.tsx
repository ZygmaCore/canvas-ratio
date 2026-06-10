"use client";

import { InlineMessage } from "@/components/inline-message";
import {
  calculateRealityGap,
  ensureActualCells,
  savePlanSnapshot,
  type RealityMode,
} from "@/lib/reality-gap";
import type { DayRecord, ProjectRecord } from "@/types/canvas";

type RealityGapPanelProps = {
  day: DayRecord | null;
  projects: ProjectRecord[];
  editable: boolean;
  mode: RealityMode;
  onModeChange: (mode: RealityMode) => void;
  onSaveDay: (day: DayRecord) => void;
};

const modes: Array<{ id: RealityMode; label: string }> = [
  { id: "plan", label: "Plan" },
  { id: "actual", label: "Actual" },
  { id: "compare", label: "Compare" },
];

export function RealityGapPanel({
  day,
  projects,
  editable,
  mode,
  onModeChange,
  onSaveDay,
}: RealityGapPanelProps) {
  const summary = day ? calculateRealityGap(day, projects) : null;

  function handleSaveSnapshot() {
    if (!day || !editable) {
      return;
    }

    onSaveDay(savePlanSnapshot(day, projects));
  }

  function handleActualMode() {
    if (day && editable && !day.actualCells) {
      onSaveDay({
        ...day,
        actualCells: ensureActualCells(day, projects),
        actualUpdatedAt: new Date().toISOString(),
      });
    }

    onModeChange("actual");
  }

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Planned vs Actual
          </p>
          <h2 className="mt-1 text-2xl font-black">Reality Gap</h2>
          <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
            Reality Gap shows what changed between plan and real life.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveSnapshot}
          disabled={!day || !editable}
          className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200"
        >
          Save Plan Snapshot
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 border-2 border-[#1A1A1A]">
        {modes.map((modeOption) => (
          <button
            key={modeOption.id}
            type="button"
            aria-pressed={mode === modeOption.id}
            onClick={() =>
              modeOption.id === "actual"
                ? handleActualMode()
                : onModeChange(modeOption.id)
            }
            className={`min-h-11 border-r-2 border-[#1A1A1A] px-3 py-2 text-sm font-black last:border-r-0 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] ${
              mode === modeOption.id ? "bg-[#FFD91A]" : "bg-white"
            }`}
          >
            {modeOption.label}
          </button>
        ))}
      </div>

      {mode === "compare" ? (
        <InlineMessage type="info" className="mt-4">
          Compare mode is read-only.
        </InlineMessage>
      ) : mode === "actual" ? (
        <InlineMessage type="info" className="mt-4">
          Actual Mode paints what really happened. It does not change your plan
          tasks.
        </InlineMessage>
      ) : null}

      {summary ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label="Planned" value={`${summary.plannedColoredCells} cells`} />
          <Metric label="Actual" value={`${summary.actualColoredCells} cells`} />
          <Metric
            label="Gap"
            value={`${summary.difference >= 0 ? "+" : ""}${summary.difference}`}
          />
          <Metric label="Matched" value={`${summary.matchedCells} cells`} />
          <Metric label="Changed" value={`${summary.changedCells} cells`} />
          <Metric
            label="Missed planned"
            value={`${summary.missedPlannedCells} cells`}
          />
        </div>
      ) : (
        <InlineMessage type="info" className="mt-4">
          Save a plan snapshot to compare later.
        </InlineMessage>
      )}

      {summary ? (
        <div className="mt-4 grid gap-2">
          {summary.perProject.map((project) => (
            <p key={project.projectId} className="text-sm font-bold">
              {project.projectName}: planned{" "}
              <span className="font-black">{project.plannedCells}</span>,
              actual <span className="font-black">{project.actualCells}</span>,
              difference{" "}
              <span className="font-black">
                {project.difference >= 0 ? "+" : ""}
                {project.difference}
              </span>
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3">
      <p className="text-xs font-black uppercase text-[#2F5FBF]">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
