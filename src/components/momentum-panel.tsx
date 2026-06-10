"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateMomentum, type MomentumSummary } from "@/lib/momentum";
import { loadAllDayRecords } from "@/lib/storage";
import type { ProjectRecord } from "@/types/canvas";

type MomentumPanelProps = {
  projects: ProjectRecord[];
};

export function MomentumPanel({ projects }: MomentumPanelProps) {
  const [summary, setSummary] = useState<MomentumSummary | null>(null);

  useEffect(() => {
    setSummary(calculateMomentum(loadAllDayRecords(), { projects }));
  }, [projects]);

  const hasData = useMemo(
    () =>
      !!summary?.projects.some((project) =>
        project.dailyCells.some((day) => day.coloredCells > 0),
      ),
    [summary],
  );

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <p className="text-xs font-black uppercase text-[#2F5FBF]">
        Recent direction
      </p>
      <h2 className="mt-1 text-2xl font-black">Momentum Chain</h2>
      <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
        Momentum shows recent direction, not perfection. Missing a day is
        context, not judgment.
      </p>

      {!hasData ? (
        <p className="mt-4 border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3 text-sm font-bold">
          Save a few colored days and this panel will become more useful.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {summary?.projects.map((project) => (
          <article
            key={project.projectId}
            className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-black">{project.projectName}</h3>
                <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
                  {project.message}
                </p>
              </div>
              <span className="w-fit border-2 border-[#1A1A1A] bg-[#FFD91A] px-2 py-1 text-xs font-black capitalize">
                {project.trend.replace("-", " ")}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1">
              {project.dailyCells.length === 0 ? (
                <span className="col-span-7 text-xs font-bold">
                  No saved days in range.
                </span>
              ) : null}
              {project.dailyCells.map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.coloredCells} cells`}
                  className="h-8 border-2 border-[#1A1A1A] bg-white"
                  style={{
                    boxShadow:
                      day.coloredCells > 0
                        ? `inset 0 -${Math.min(day.coloredCells * 2, 28)}px 0 #8BCF3F`
                        : undefined,
                  }}
                  aria-label={`${day.date}, ${day.coloredCells} colored cells`}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
