"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import { PROJECT_COLORS } from "@/lib/palette";
import { getProjectRatioTotal } from "@/lib/projects";
import { createProjectSetting, getActiveProjects } from "@/lib/settings";
import type { ProjectRecord } from "@/types/canvas";

type ProjectRatioFormProps = {
  projects: ProjectRecord[];
  disabled?: boolean;
  usedProjectIds?: Set<string>;
  onSaveProjects: (projects: ProjectRecord[]) => void;
};

type DraftProject = ProjectRecord & {
  draftKey: string;
};

export function ProjectRatioForm({
  projects,
  disabled = false,
  usedProjectIds = new Set(),
  onSaveProjects,
}: ProjectRatioFormProps) {
  const [draftProjects, setDraftProjects] = useState<DraftProject[]>([]);
  const activeDraftProjects = useMemo(
    () => getActiveProjects(draftProjects),
    [draftProjects],
  );
  const totalRatio = getProjectRatioTotal(draftProjects);
  const ratiosAreWholeNumbers = draftProjects.every((project) =>
    Number.isInteger(project.ratio),
  );

  useEffect(() => {
    setDraftProjects(
      projects.map((project) => ({
        ...project,
        draftKey: project.id,
      })),
    );
  }, [projects]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const now = new Date().toISOString();

    onSaveProjects(
      draftProjects
        .map(({ draftKey: _draftKey, ...project }, index) => ({
          ...project,
          name: project.name.trim() || "Untitled Project",
          ratio: normalizeDraftRatio(project.ratio),
          order: index,
          updatedAt: now,
        }))
        .sort((first, second) => first.order - second.order),
    );
  }

  function addProject() {
    const project = createProjectSetting(
      {
        name: "New Project",
        ratio: 0,
        color:
          PROJECT_COLORS.find(
            (color) =>
              !draftProjects.some(
                (projectItem) =>
                  projectItem.color.toLowerCase() === color.hex.toLowerCase(),
              ),
          )?.hex ?? PROJECT_COLORS[0].hex,
      },
      draftProjects,
    );

    setDraftProjects((currentProjects) => [
      ...currentProjects,
      {
        ...project,
        draftKey: project.id,
      },
    ]);
  }

  function updateProject(projectId: string, update: Partial<ProjectRecord>) {
    setDraftProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...project, ...update } : project,
      ),
    );
  }

  function moveProject(projectId: string, direction: -1 | 1) {
    setDraftProjects((currentProjects) => {
      const nextProjects = [...currentProjects];
      const index = nextProjects.findIndex((project) => project.id === projectId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= nextProjects.length) {
        return currentProjects;
      }

      [nextProjects[index], nextProjects[nextIndex]] = [
        nextProjects[nextIndex],
        nextProjects[index],
      ];

      return nextProjects.map((project, order) => ({ ...project, order }));
    });
  }

  function removeOrArchiveProject(projectId: string) {
    if (usedProjectIds.has(projectId)) {
      updateProject(projectId, { archived: true });
      return;
    }

    setDraftProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId),
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="project-ratio-form"
      className="animate-panel-enter rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Projects</h2>
          <p className="mt-1 text-sm font-bold">
            Ratios are recommendations, not limits.
          </p>
        </div>
        <span
          className={`border-2 border-[#1A1A1A] px-3 py-1 text-sm font-black ${
            totalRatio === 100 ? "bg-[#8BCF3F]" : "bg-[#FFD7BF]"
          }`}
        >
          Active: {totalRatio}/100
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={addProject}
          className="min-h-10 border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:shadow-none"
        >
          Add Project
        </button>
        <button
          type="submit"
          disabled={disabled}
          data-testid="save-project-ratios"
          className="min-h-10 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-3 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a] disabled:shadow-none"
        >
          Save Projects
        </button>
      </div>

      {activeDraftProjects.length === 0 ? (
        <InlineMessage type="warning" className="mt-3">
          Create your first project to start painting.
        </InlineMessage>
      ) : null}

      {totalRatio !== 100 || !ratiosAreWholeNumbers ? (
        <InlineMessage type="warning" className="mt-3">
          Ratios should total 100% for clean recommendations. Current active
          total: {Number.isFinite(totalRatio) ? totalRatio : 0}/100.
          Recommendations are normalized.
        </InlineMessage>
      ) : null}

      <div className="mt-4 grid gap-3">
        {draftProjects.map((project, index) => {
          const archived = project.archived === true;
          const used = usedProjectIds.has(project.id);

          return (
            <article
              key={project.draftKey}
              className={`border-2 border-[#1A1A1A] p-4 ${
                archived ? "bg-[#EFEDE4] opacity-80" : "bg-[#FBFBF7]"
              }`}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px]">
                <label className="block">
                  <span className="text-xs font-black uppercase text-[#2F5FBF]">
                    Project
                  </span>
                  <input
                    value={project.name}
                    disabled={disabled}
                    onChange={(event) =>
                      updateProject(project.id, {
                        name: event.currentTarget.value,
                      })
                    }
                    className="mt-1 min-h-10 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-gray-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase text-[#2F5FBF]">
                    Ratio
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={project.ratio}
                    disabled={disabled || archived}
                    onChange={(event) =>
                      updateProject(project.id, {
                        ratio: Number(event.currentTarget.value),
                      })
                    }
                    className="mt-1 min-h-10 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-gray-100"
                  />
                </label>
              </div>

              <div className="mt-3">
                <p className="text-xs font-black uppercase text-[#2F5FBF]">
                  Color
                </p>
                <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {PROJECT_COLORS.map((color) => {
                    const selected =
                      color.hex.toLowerCase() === project.color.toLowerCase();

                    return (
                      <button
                        key={color.hex}
                        type="button"
                        disabled={disabled || archived}
                        onClick={() =>
                          updateProject(project.id, { color: color.hex })
                        }
                        aria-label={`${project.name} color ${color.name}`}
                        className={`aspect-square min-h-8 border-2 border-[#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed ${
                          selected
                            ? "shadow-[3px_3px_0_#1A1A1A] ring-4 ring-[#FFD91A]"
                            : ""
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => moveProject(project.id, -1)}
                  className="min-h-10 border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:bg-gray-200"
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={disabled || index === draftProjects.length - 1}
                  onClick={() => moveProject(project.id, 1)}
                  className="min-h-10 border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:bg-gray-200"
                >
                  Down
                </button>
                {archived ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updateProject(project.id, { archived: false })
                    }
                    className="min-h-10 border-2 border-[#1A1A1A] bg-[#8BCF3F] px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:bg-gray-200"
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeOrArchiveProject(project.id)}
                    className="min-h-10 border-2 border-[#1A1A1A] bg-[#D62828] px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a]"
                  >
                    {used ? "Archive" : "Delete"}
                  </button>
                )}
                {archived ? (
                  <span className="min-h-10 border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black">
                    Archived
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </form>
  );
}

function normalizeDraftRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(ratio)));
}
