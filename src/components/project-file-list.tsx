"use client";

import { useState, type ChangeEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import {
  calculateProjectFileProgress,
  getReadableTextColor,
  resolveProjectFileProject,
  type ProjectFile,
} from "@/lib/project-files";
import type { ProjectRecord } from "@/types/canvas";

type ProjectFileListProps = {
  files: ProjectFile[];
  totalFileCount: number;
  selectedFileId: string;
  projects: ProjectRecord[];
  activeProjects: ProjectRecord[];
  filterProjectId: string;
  onFilterProjectId: (projectId: string) => void;
  onSelectProjectFile: (projectFileId: string) => void;
  onImportProjectFile: (file: File) => Promise<void>;
};

export function ProjectFileList({
  files,
  totalFileCount,
  selectedFileId,
  projects,
  activeProjects,
  filterProjectId,
  onFilterProjectId,
  onSelectProjectFile,
  onImportProjectFile,
}: ProjectFileListProps) {
  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Long-term progress
          </p>
          <h2 className="mt-1 text-2xl font-black">Project Files</h2>
        </div>
        <ProjectFileImportControl onImportProjectFile={onImportProjectFile} />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-black uppercase text-[#2F5FBF]">
          Filter by project
        </span>
        <select
          value={filterProjectId}
          onChange={(event) => onFilterProjectId(event.currentTarget.value)}
          className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        >
          <option value="all">All projects</option>
          <option value="unlinked">Unlinked</option>
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      {totalFileCount === 0 ? (
        <InlineMessage type="info" className="mt-4">
          No project files yet. Create one below or import an exported HTML file.
        </InlineMessage>
      ) : files.length === 0 ? (
        <InlineMessage type="info" className="mt-4">
          No project files match this filter.
        </InlineMessage>
      ) : null}

      <div className="mt-4 grid gap-3">
        {files.map((projectFile) => {
          const progress = calculateProjectFileProgress(projectFile);
          const linkedProject = resolveProjectFileProject(projectFile, projects);
          const selected = projectFile.id === selectedFileId;
          const textColor = getReadableTextColor(linkedProject.color);

          return (
            <button
              key={projectFile.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectProjectFile(projectFile.id)}
              className={`project-card min-w-0 border-2 border-[#1A1A1A] p-3 text-left focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] ${
                selected
                  ? "project-card--selected bg-[#FBFBF7]"
                  : "bg-white hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1A1A1A]"
              }`}
              style={{
                borderLeftColor: linkedProject.color,
                borderLeftWidth: 8,
                boxShadow: selected
                  ? `4px 4px 0 ${linkedProject.color}`
                  : undefined,
              }}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-black">
                    {projectFile.projectName}
                  </h3>
                  <LinkedProjectBadge
                    name={linkedProject.name}
                    color={linkedProject.color}
                    textColor={textColor}
                    archived={linkedProject.archived}
                    snapshotName={linkedProject.snapshotName}
                  />
                </div>
                <span className="shrink-0 border-2 border-[#1A1A1A] bg-[#FFD91A] px-2 py-1 text-xs font-black">
                  {progress.percentComplete}%
                </span>
              </div>

              <div className="mt-3 h-3 border-2 border-[#1A1A1A] bg-[#FBFBF7]">
                <div
                  className="h-full transition-[width]"
                  style={{
                    width: `${progress.percentComplete}%`,
                    backgroundColor: linkedProject.color,
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-3 grid gap-1 text-xs font-bold sm:grid-cols-2">
                <p>
                  Progress:{" "}
                  <span className="font-black">
                    {progress.completed}/{projectFile.totalTarget}
                  </span>
                </p>
                <p>
                  Required today:{" "}
                  <span className="font-black">
                    {progress.requiredToday} {projectFile.unitName}
                  </span>
                </p>
                <p>
                  Remaining:{" "}
                  <span className="font-black">{progress.remaining}</span>
                </p>
                <p>
                  Days left:{" "}
                  <span className="font-black">
                    {progress.daysLeftInclusive}
                  </span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LinkedProjectBadge({
  name,
  color,
  textColor,
  archived,
  snapshotName,
}: {
  name: string;
  color: string;
  textColor: string;
  archived: boolean;
  snapshotName?: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span
        className="inline-flex min-h-7 max-w-full items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 text-xs font-black"
        style={{ backgroundColor: color, color: textColor }}
        title={
          snapshotName && name === "Unlinked project"
            ? `Previously linked to ${snapshotName}`
            : name
        }
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full border border-current bg-current"
          aria-hidden="true"
        />
        <span className="min-w-0 break-words">{name}</span>
      </span>
      {archived ? (
        <span className="border-2 border-[#1A1A1A] bg-[#EFEDE4] px-2 py-1 text-xs font-black">
          Archived
        </span>
      ) : null}
    </div>
  );
}

function ProjectFileImportControl({
  onImportProjectFile,
}: {
  onImportProjectFile: (file: File) => Promise<void>;
}) {
  const [status, setStatus] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setStatus("Importing...");

    try {
      await onImportProjectFile(file);
      setStatus("Imported");
      window.setTimeout(() => setStatus(""), 1800);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed");
    } finally {
      event.currentTarget.value = "";
    }
  }

  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] transition hover:-translate-y-0.5 focus-within:ring-4 focus-within:ring-[#6FB6FF]">
      Import HTML
      <input
        type="file"
        accept=".html,.json,text/html,application/json"
        onChange={handleChange}
        className="sr-only"
      />
      {status ? <span className="sr-only">{status}</span> : null}
    </label>
  );
}
