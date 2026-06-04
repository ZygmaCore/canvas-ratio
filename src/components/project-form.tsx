"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import { getProjectRatioTotal } from "@/lib/projects";
import type { ProjectRecord } from "@/types/canvas";

type ProjectRatioFormProps = {
  projects: ProjectRecord[];
  disabled?: boolean;
  onUpdateRatios: (ratios: Record<string, number>) => void;
};

export function ProjectRatioForm({
  projects,
  disabled = false,
  onUpdateRatios,
}: ProjectRatioFormProps) {
  const [draftRatios, setDraftRatios] = useState<Record<string, string>>({});
  const parsedRatios = useMemo(
    () =>
      Object.fromEntries(
        projects.map((project) => [
          project.id,
          Number(draftRatios[project.id] ?? project.ratio),
        ]),
      ),
    [draftRatios, projects],
  );
  const totalRatio = projects.reduce(
    (total, project) => total + (parsedRatios[project.id] || 0),
    0,
  );
  const savedTotalRatio = getProjectRatioTotal(projects);
  const ratiosAreWholeNumbers = projects.every((project) =>
    Number.isInteger(parsedRatios[project.id]),
  );

  useEffect(() => {
    setDraftRatios(
      Object.fromEntries(
        projects.map((project) => [project.id, String(project.ratio)]),
      ),
    );
  }, [projects]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUpdateRatios(parsedRatios);
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="project-ratio-form"
      className="rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Set your daily ratios</h2>
          <p className="mt-1 text-sm font-bold">
            Academic, Professional, and Personal stay fixed.
          </p>
        </div>
        <span
          className={`border-2 border-[#1A1A1A] px-3 py-1 text-sm font-black ${
            savedTotalRatio === 100 ? "bg-[#8BCF3F]" : "bg-[#FFD7BF]"
          }`}
        >
          Saved: {savedTotalRatio}/100
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {projects.map((project) => (
          <label
            key={project.id}
            className="grid gap-3 border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className="h-6 w-6 shrink-0 rounded-full border-2 border-[#1A1A1A]"
                style={{ backgroundColor: project.color }}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block break-words text-base font-black">
                  {project.name}
                </span>
                <span className="block text-xs font-black uppercase text-[#2F5FBF]">
                  {project.id}
                </span>
              </span>
            </span>
            <span className="block">
              <span className="sr-only">{project.name} ratio</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={draftRatios[project.id] ?? String(project.ratio)}
                disabled={disabled}
                data-testid={`project-ratio-${project.id}`}
                onChange={(event) =>
                  setDraftRatios((currentRatios) => ({
                    ...currentRatios,
                    [project.id]: event.currentTarget.value,
                  }))
                }
                onInput={(event) =>
                  setDraftRatios((currentRatios) => ({
                    ...currentRatios,
                    [project.id]: event.currentTarget.value,
                  }))
                }
                className="min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
              />
            </span>
          </label>
        ))}
      </div>

      {totalRatio !== 100 || !ratiosAreWholeNumbers ? (
        <InlineMessage type="warning" className="mt-3">
          Ratios must be whole numbers and total 100 before painting. Draft
          total: {Number.isFinite(totalRatio) ? totalRatio : 0}/100.
        </InlineMessage>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        data-testid="save-project-ratios"
        className="mt-4 min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-[#FFFFFF] shadow-[3px_3px_0_#FFD91A] disabled:cursor-not-allowed disabled:bg-[#8B4A3A]"
      >
        Save Ratios
      </button>
    </form>
  );
}
