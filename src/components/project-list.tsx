import {
  getProjectTaskCount,
  getProjectUsageFromSlots,
} from "@/lib/projects";
import { InlineMessage } from "@/components/inline-message";
import type { DayRecord } from "@/types/canvas";

type ProjectListProps = {
  day: DayRecord | null;
  projects: DayRecord["projects"];
  editable: boolean;
  selectedProjectId?: string;
};

export function ProjectList({
  day,
  projects,
  editable,
  selectedProjectId,
}: ProjectListProps) {
  const usage = day ? getProjectUsageFromSlots(day, projects) : [];

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Set your daily ratios</h2>
          <p className="mt-1 text-sm font-bold">
            Ratios split non-black paintable canvas time.
          </p>
        </div>
        <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          Fixed projects
        </span>
      </div>

      {projects.length === 0 ? (
        <InlineMessage type="warning" className="mt-4">
          Project settings could not be loaded.
        </InlineMessage>
      ) : null}

      <div className="mt-4 grid gap-3">
        {projects.map((project) => {
          const projectUsage = usage.find(
            (usageItem) => usageItem.projectId === project.id,
          );
          const taskCount = day ? getProjectTaskCount(day, project.id) : 0;
          const selected = project.id === selectedProjectId;
          const recommendedCells =
            projectUsage?.recommendedCells ?? projectUsage?.quotaCells ?? 0;
          const coloredCells = projectUsage?.paintedCells ?? 0;
          const differenceCells = coloredCells - recommendedCells;

          return (
            <article
              key={project.id}
              className={`project-card border-2 border-[#1A1A1A] p-4 ${
                selected
                  ? "project-card--selected"
                  : "bg-[#FBFBF7] hover:bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="project-color-dot h-6 w-6 shrink-0 rounded-full border-2 border-[#1A1A1A]"
                      style={{ backgroundColor: project.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-black">
                        {project.name}
                      </h3>
                      <p className="text-sm font-bold text-[#2F5FBF]">
                        {project.ratio}% ratio / {taskCount} task
                        {taskCount === 1 ? "" : "s"}
                        {selected ? " / selected" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm font-bold sm:grid-cols-3">
                    <p>
                      Recommended:{" "}
                      <span className="font-black">
                        {recommendedCells} cells
                      </span>
                    </p>
                    <p>
                      Colored:{" "}
                      <span className="font-black">
                        {coloredCells} cells
                      </span>
                    </p>
                    <p>
                      Difference:{" "}
                      <span className="font-black">
                        {getRecommendationDifferenceLabel(differenceCells)}
                      </span>
                    </p>
                  </div>

                  {differenceCells > 0 ? (
                    <InlineMessage type="warning" className="animate-attention-once mt-3">
                      Over recommendation by {differenceCells}{" "}
                      {differenceCells === 1 ? "cell" : "cells"}. You can
                      still paint freely.
                    </InlineMessage>
                  ) : null}

                  {project.description ? (
                    <p className="mt-3 break-words text-sm font-bold">
                      {project.description}
                    </p>
                  ) : null}
                </div>

                {editable ? (
                  <span className="min-h-10 shrink-0 border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black">
                    Fixed
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getRecommendationDifferenceLabel(differenceCells: number): string {
  if (differenceCells > 0) {
    return `Over by ${differenceCells}`;
  }

  if (differenceCells < 0) {
    return `Under by ${Math.abs(differenceCells)}`;
  }

  return "On recommendation";
}
