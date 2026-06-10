"use client";

import { getCellState } from "@/lib/cells";
import { getTaskProjectName } from "@/lib/projects";
import type { DayRecord, ProjectRecord } from "@/types/canvas";

type ReplayDayViewProps = {
  day: DayRecord | null;
  projects: ProjectRecord[];
};

export function ReplayDayView({ day, projects }: ReplayDayViewProps) {
  if (!day) {
    return (
      <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0_#1A1A1A]">
        <h2 className="text-2xl font-black">No saved day in this range.</h2>
        <p className="mt-2 text-sm font-bold text-[#4a4a4a]">
          Replay uses local saved Canvas Ratio days.
        </p>
      </section>
    );
  }

  const taskById = new Map(day.tasks.map((task) => [task.id, task]));

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Replay Day
          </p>
          <h2 className="mt-1 text-3xl font-black">{day.date}</h2>
          {day.themeDayName ? (
            <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
              Theme: {day.themeDayName}
            </p>
          ) : null}
        </div>
        <span className="w-fit border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          Read-only
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
        {Array.from({ length: 48 }, (_, cellIndex) => {
          const cell = getCellState(day.slots, cellIndex);
          const task = cell.taskId ? taskById.get(cell.taskId) : undefined;
          const label =
            cell.state === "black"
              ? "Unavailable"
              : cell.state === "colored" && task
                ? getTaskProjectName(day, task, projects)
                : "Free";

          return (
            <div
              key={cell.cellIndex}
              aria-label={`${cell.label}, ${label}`}
              className={`cell-button min-h-12 border-2 border-[#1A1A1A] p-1.5 text-left ${
                cell.state === "black"
                  ? "cell-button--black text-white"
                  : cell.state === "colored"
                    ? "cell-button--colored shadow-[2px_2px_0_#1A1A1A]"
                    : "cell-button--free"
              }`}
              style={{
                backgroundColor: cell.color,
                backgroundImage:
                  cell.state === "black"
                    ? "repeating-linear-gradient(135deg, #1A1A1A 0, #1A1A1A 6px, #3A3A3A 6px, #3A3A3A 12px)"
                    : undefined,
              }}
            >
              <span className="block text-[10px] font-black leading-tight">
                {cell.label}
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-bold leading-tight">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
