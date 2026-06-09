"use client";

import { useState, type ChangeEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import {
  calculateProjectFileProgress,
  type ProjectFile,
} from "@/lib/project-files";

type ProjectFileListProps = {
  files: ProjectFile[];
  selectedFileId: string;
  onSelectProjectFile: (projectFileId: string) => void;
  onImportProjectFile: (file: File) => Promise<void>;
};

export function ProjectFileList({
  files,
  selectedFileId,
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

      {files.length === 0 ? (
        <InlineMessage type="info" className="mt-4">
          No project files yet. Create one below or import an exported HTML file.
        </InlineMessage>
      ) : null}

      <div className="mt-4 grid gap-3">
        {files.map((projectFile) => {
          const progress = calculateProjectFileProgress(projectFile);
          const selected = projectFile.id === selectedFileId;

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
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-black">
                    {projectFile.projectName}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-[#2F5FBF]">
                    Target: {projectFile.targetDate}
                  </p>
                </div>
                <span className="shrink-0 border-2 border-[#1A1A1A] bg-[#FFD91A] px-2 py-1 text-xs font-black">
                  {progress.percentComplete}%
                </span>
              </div>

              <div className="mt-3 h-3 border-2 border-[#1A1A1A] bg-[#FBFBF7]">
                <div
                  className="h-full bg-[#8BCF3F] transition-[width]"
                  style={{ width: `${progress.percentComplete}%` }}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-3 grid gap-1 text-xs font-bold sm:grid-cols-2">
                <p>
                  Completed:{" "}
                  <span className="font-black">
                    {progress.completed}/{projectFile.totalTarget}
                  </span>
                </p>
                <p>
                  Today:{" "}
                  <span className="font-black">
                    {progress.requiredToday} {projectFile.unitName}
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
