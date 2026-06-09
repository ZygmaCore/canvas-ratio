"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import { ProjectFileBlockGrid } from "@/components/project-file-block-grid";
import { ProjectFileReviewButton } from "@/components/project-file-review-button";
import {
  buildProjectFileHtml,
  calculateProjectFileProgress,
  toggleProjectFileBlock,
  type ProjectFile,
} from "@/lib/project-files";

type ProjectFileDetailProps = {
  projectFile: ProjectFile | null;
  onUpdateProjectFile: (projectFile: ProjectFile) => void;
  onDeleteProjectFile: (projectFileId: string) => void;
};

const actionButtonClass =
  "min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]";

export function ProjectFileDetail({
  projectFile,
  onUpdateProjectFile,
  onDeleteProjectFile,
}: ProjectFileDetailProps) {
  const [todayDate, setTodayDate] = useState(projectFile?.todayDate ?? "");
  const [targetDate, setTargetDate] = useState(projectFile?.targetDate ?? "");
  const [notes, setNotes] = useState(projectFile?.notes ?? "");
  const [saved, setSaved] = useState(false);
  const progress = useMemo(
    () => (projectFile ? calculateProjectFileProgress(projectFile) : null),
    [projectFile],
  );

  useEffect(() => {
    setTodayDate(projectFile?.todayDate ?? "");
    setTargetDate(projectFile?.targetDate ?? "");
    setNotes(projectFile?.notes ?? "");
    setSaved(false);
  }, [
    projectFile?.id,
    projectFile?.todayDate,
    projectFile?.targetDate,
    projectFile?.notes,
  ]);

  if (!projectFile || !progress) {
    return (
      <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0_#1A1A1A]">
        <p className="text-xs font-black uppercase text-[#2F5FBF]">
          Project File
        </p>
        <h2 className="mt-1 text-2xl font-black">Select a project file</h2>
        <p className="mt-2 text-sm font-bold text-[#4a4a4a]">
          Create or import a project file, then use the block grid to track
          long-term progress.
        </p>
      </section>
    );
  }

  function handleToggleBlock(blockIndex: number) {
    if (!projectFile) {
      return;
    }

    onUpdateProjectFile(toggleProjectFileBlock(projectFile, blockIndex));
  }

  function handleSavePlanning(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectFile) {
      return;
    }

    onUpdateProjectFile({
      ...projectFile,
      todayDate,
      targetDate,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="grid min-w-0 gap-4">
      <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[5px_5px_0_#1A1A1A]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#2F5FBF]">
              Active Project File
            </p>
            <h1 className="mt-1 break-words text-3xl font-black sm:text-4xl">
              {projectFile.projectName}
            </h1>
            {projectFile.notes ? (
              <p className="mt-2 break-words text-sm font-bold text-[#4a4a4a]">
                {projectFile.notes}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <ProjectFileReviewButton
              projectFile={projectFile}
              className={actionButtonClass}
            />
            <button
              type="button"
              onClick={() => downloadProjectFileHtml(projectFile)}
              className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Export HTML
            </button>
          </div>
        </div>

        <div className="mt-5 h-5 border-2 border-[#1A1A1A] bg-[#FBFBF7]">
          <div
            className="h-full bg-[#8BCF3F] transition-[width]"
            style={{ width: `${progress.percentComplete}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Completed"
            value={`${progress.completed}/${projectFile.totalTarget}`}
            detail={projectFile.unitName}
          />
          <MetricCard
            label="Remaining"
            value={String(progress.remaining)}
            detail={projectFile.unitName}
          />
          <MetricCard
            label="Required today"
            value={String(progress.requiredToday)}
            detail={`${progress.completedToday} completed today`}
          />
          <MetricCard
            label="Days left"
            value={String(progress.daysLeftInclusive)}
            detail={`Target ${projectFile.targetDate}`}
          />
        </div>

        {progress.targetDatePassed ? (
          <InlineMessage type="warning" className="mt-4">
            Target date has passed. Today’s required work uses 1 day so the
            number stays practical.
          </InlineMessage>
        ) : progress.completedToday < progress.requiredToday ? (
          <InlineMessage type="info" className="mt-4">
            Do {progress.requiredToday - progress.completedToday} more{" "}
            {projectFile.unitName} today to match this plan.
          </InlineMessage>
        ) : (
          <InlineMessage type="info" className="mt-4">
            Today’s recommended work is covered.
          </InlineMessage>
        )}
      </section>

      <ProjectFileBlockGrid
        projectFile={projectFile}
        progress={progress}
        onToggleBlock={handleToggleBlock}
      />

      <details>
        <summary className="min-h-12 cursor-pointer border-2 border-[#1A1A1A] bg-white px-4 py-3 text-base font-black shadow-[4px_4px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]">
          Project File Settings
        </summary>
        <div className="mt-4 grid gap-4 rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
          <form
            onSubmit={handleSavePlanning}
            className="grid gap-4 md:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Today date
              </span>
              <input
                type="date"
                value={todayDate}
                onChange={(event) => setTodayDate(event.currentTarget.value)}
                className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Target date
              </span>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.currentTarget.value)}
                className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Notes
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.currentTarget.value)}
                rows={3}
                className="mt-2 w-full resize-none border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              />
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button type="submit" className={actionButtonClass}>
                Save Project File
              </button>
              <button
                type="button"
                onClick={() => onDeleteProjectFile(projectFile.id)}
                className="min-h-11 border-2 border-[#1A1A1A] bg-[#D62828] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#1A1A1A] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              >
                Delete Project File
              </button>
            </div>
          </form>

          {saved ? (
            <InlineMessage type="info">
              Project file saved.
            </InlineMessage>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3">
      <p className="text-xs font-black uppercase text-[#2F5FBF]">{label}</p>
      <p className="mt-1 break-words text-2xl font-black">{value}</p>
      <p className="mt-1 break-words text-xs font-bold text-[#4a4a4a]">
        {detail}
      </p>
    </div>
  );
}

function downloadProjectFileHtml(projectFile: ProjectFile) {
  const html = buildProjectFileHtml(projectFile);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `canvas-ratio-project-file-${slugify(
    projectFile.projectName,
  )}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "project-file"
  );
}
