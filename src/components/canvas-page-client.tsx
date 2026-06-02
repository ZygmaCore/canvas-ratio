"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BlackBlockList } from "@/components/black-block-list";
import { CanvasCircle } from "@/components/canvas-circle";
import { CanvasLegend } from "@/components/canvas-legend";
import { CanvasSummaryGrid } from "@/components/canvas-summary-grid";
import { CellCanvas } from "@/components/cell-canvas";
import { DateSelector } from "@/components/date-selector";
import { DayDebugPanel } from "@/components/day-debug-panel";
import { DayStatusBadge } from "@/components/day-status-badge";
import { FinishColoringPanel } from "@/components/finish-coloring-panel";
import { JournalView } from "@/components/journal-view";
import { PomodoroPanel } from "@/components/pomodoro-panel";
import { ProjectForm } from "@/components/project-form";
import { ProjectList } from "@/components/project-list";
import { RandomEventForm } from "@/components/random-event-form";
import { SleepForm } from "@/components/sleep-form";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { useDayRecord } from "@/hooks/use-day-record";
import { createTimeBlock } from "@/lib/blocks";
import { getCellState } from "@/lib/cells";
import { summarizeCanvas, summarizeSlots } from "@/lib/canvas-segments";
import {
  getProjectUsageFromSlots,
  removeProject,
  validateProjectRatios,
} from "@/lib/projects";
import { rebuildDaySlots } from "@/lib/rebuild";
import { createTaskRecord, type TaskRecordInput } from "@/lib/tasks";
import type {
  JournalRecord,
  ProjectRecord,
  TaskInputMode,
} from "@/types/canvas";

type CanvasPageClientProps = {
  initialDateKey: string;
};

export function CanvasPageClient({ initialDateKey }: CanvasPageClientProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCellIndices, setSelectedCellIndices] = useState<number[]>([]);
  const [taskInputMode, setTaskInputMode] =
    useState<TaskInputMode>("manual-cell");
  const [cellError, setCellError] = useState("");
  const { day, status, editable, loading, saveDay, resetDay } =
    useDayRecord(selectedDateKey);

  const slotSummaries = useMemo(() => {
    const slots = day?.slots ?? [];

    return {
      amSummary: summarizeCanvas(slots, "am"),
      pmSummary: summarizeCanvas(slots, "pm"),
      fullDaySummary: summarizeSlots(slots),
    };
  }, [day]);
  const ratioValidation = useMemo(
    () => validateProjectRatios(day?.projects ?? []),
    [day],
  );
  const projectUsage = useMemo(
    () => (day ? getProjectUsageFromSlots(day) : []),
    [day],
  );
  const selectedProjectUsage = projectUsage.find(
    (usage) => usage.projectId === selectedProjectId,
  );
  const remainingQuotaCells = selectedProjectUsage?.remainingCells ?? 0;
  const manualPaintingActive = taskInputMode === "manual-cell";

  useEffect(() => {
    setSelectedCellIndices([]);
    setCellError("");
  }, [selectedDateKey]);

  useEffect(() => {
    if (!day?.projects.length) {
      setSelectedProjectId("");
      return;
    }

    if (!day.projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(day.projects[0].id);
    }
  }, [day, selectedProjectId]);

  function handleResetToday() {
    if (
      window.confirm(
        "Reset today’s canvas back to 1440 empty white slots?",
      )
    ) {
      setSelectedCellIndices([]);
      setCellError("");
      resetDay();
    }
  }

  function handleAddProject(project: ProjectRecord) {
    if (!day || !editable) {
      return;
    }

    saveDay({
      ...day,
      projects: [...day.projects, project],
      updatedAt: new Date().toISOString(),
    });
    setSelectedProjectId(project.id);
  }

  function handleDeleteProject(projectId: string) {
    if (!day || !editable) {
      return;
    }

    const project = day.projects.find((candidate) => candidate.id === projectId);
    const taskCount = day.tasks.filter((task) => task.projectId === projectId).length;
    const confirmed = window.confirm(
      taskCount > 0
        ? `Delete ${project?.name ?? "this project"} and ${taskCount} related task${taskCount === 1 ? "" : "s"}?`
        : `Delete ${project?.name ?? "this project"}?`,
    );

    if (!confirmed) {
      return;
    }

    const nextDay = rebuildDaySlots(removeProject(day, projectId));

    saveDay(nextDay);
    setSelectedCellIndices([]);

    if (selectedProjectId === projectId) {
      setSelectedProjectId(nextDay.projects[0]?.id ?? "");
    }
  }

  function handleAddSleep(input: {
    startMinute: number;
    endMinute: number;
    description?: string;
  }) {
    if (!day || !editable) {
      return;
    }

    const sleepBlock = createTimeBlock({
      type: "sleep",
      ...input,
    });

    saveDay(
      rebuildDaySlots({
        ...day,
        sleepBlocks: [...day.sleepBlocks, sleepBlock],
      }),
    );
    setSelectedCellIndices([]);
  }

  function handleAddRandomEvent(input: {
    title: string;
    startMinute: number;
    endMinute: number;
    description?: string;
  }) {
    if (!day || !editable) {
      return;
    }

    const randomEventBlock = createTimeBlock({
      type: "random-event",
      ...input,
    });

    saveDay(
      rebuildDaySlots({
        ...day,
        randomEventBlocks: [...day.randomEventBlocks, randomEventBlock],
      }),
    );
    setSelectedCellIndices([]);
  }

  function handleDeleteBlock(blockId: string) {
    if (!day || !editable) {
      return;
    }

    saveDay(
      rebuildDaySlots({
        ...day,
        sleepBlocks: day.sleepBlocks.filter((block) => block.id !== blockId),
        randomEventBlocks: day.randomEventBlocks.filter(
          (block) => block.id !== blockId,
        ),
      }),
    );
    setSelectedCellIndices([]);
  }

  function handleAddTask(input: TaskRecordInput) {
    if (!day || !editable) {
      return;
    }

    const task = createTaskRecord(input);

    saveDay(
      rebuildDaySlots({
        ...day,
        tasks: [...day.tasks, task],
      }),
    );
    setSelectedCellIndices([]);
  }

  function handleDeleteTask(taskId: string) {
    if (!day || !editable) {
      return;
    }

    saveDay(
      rebuildDaySlots({
        ...day,
        tasks: day.tasks.filter((task) => task.id !== taskId),
      }),
    );
    setSelectedCellIndices([]);
  }

  function handleJournalCreated(journal: JournalRecord) {
    if (!day || !editable) {
      return;
    }

    saveDay({
      ...day,
      journal,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleToggleCell(cellIndex: number) {
    setCellError("");

    if (!day || !editable || !manualPaintingActive) {
      return;
    }

    if (!ratioValidation.valid) {
      setCellError("Project ratios must total 100 before painting.");
      return;
    }

    if (!selectedProjectId) {
      setCellError("Select a project before painting cells.");
      return;
    }

    if (selectedCellIndices.includes(cellIndex)) {
      setSelectedCellIndices((currentCells) =>
        currentCells.filter((currentCell) => currentCell !== cellIndex),
      );
      return;
    }

    const cell = getCellState(day.slots, cellIndex);

    if (cell.state === "black") {
      setCellError("This cell contains black canvas.");
      return;
    }

    if (cell.state === "colored" || cell.isMixed) {
      setCellError("This cell is already painted.");
      return;
    }

    if (selectedCellIndices.length >= remainingQuotaCells) {
      setCellError("Project quota is already full.");
      return;
    }

    setSelectedCellIndices((currentCells) =>
      [...currentCells, cellIndex].sort(
        (firstCell, secondCell) => firstCell - secondCell,
      ),
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
      <header className="border-b-2 border-[#1A1A1A] bg-white/78 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex text-sm font-bold text-[#2F5FBF] underline-offset-4 hover:underline"
            >
              Back to tutorial
            </Link>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              Today’s Canvas
            </h1>
          </div>
          <DayStatusBadge status={status} editable={editable} />
        </div>
      </header>

      <section className="grid gap-5 py-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <DateSelector value={selectedDateKey} onChange={setSelectedDateKey} />
        {editable ? (
          <button
            type="button"
            onClick={handleResetToday}
            className="min-h-12 border-2 border-[#1A1A1A] bg-[#D62828] px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          >
            Reset Today
          </button>
        ) : null}
      </section>

      {status === "future" ? (
        <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0_#1A1A1A]">
          <h2 className="text-2xl font-black">
            Future canvas is not available yet.
          </h2>
          <p className="mt-3 text-sm font-bold text-[#4a4a4a]">
            Choose today or a past date to view stored canvas records.
          </p>
        </section>
      ) : (
        <>
          {status === "past" ? (
            <p className="mb-6 border-2 border-[#1A1A1A] bg-[#6FB6FF] px-4 py-3 text-sm font-black">
              Past canvas is read-only.
            </p>
          ) : null}

          {!ratioValidation.valid && day?.projects.length ? (
            <p className="mb-6 border-2 border-[#1A1A1A] bg-[#FFD7BF] px-4 py-3 text-sm font-black">
              {ratioValidation.message} Current total:{" "}
              {ratioValidation.total}/100.
            </p>
          ) : null}

          <section className="grid gap-6 pb-8 lg:grid-cols-2">
            <CellCanvas
              mode="am"
              day={day}
              selectedProjectId={selectedProjectId}
              selectedCellIndices={selectedCellIndices}
              editable={editable && manualPaintingActive}
              quotaReady={ratioValidation.valid}
              onToggleCell={handleToggleCell}
            />
            <CellCanvas
              mode="pm"
              day={day}
              selectedProjectId={selectedProjectId}
              selectedCellIndices={selectedCellIndices}
              editable={editable && manualPaintingActive}
              quotaReady={ratioValidation.valid}
              onToggleCell={handleToggleCell}
            />
          </section>

          {cellError ? (
            <p
              data-testid="cell-error"
              className="mb-6 border-2 border-[#1A1A1A] bg-[#FFD7BF] px-4 py-3 text-sm font-black"
            >
              {cellError}
            </p>
          ) : null}

          <section className="grid gap-6 pb-8 lg:grid-cols-2">
            <CanvasCircle
              title="Canvas A.M. Preview"
              subtitle="Minute-accurate SVG summary"
              mode="am"
              slots={day?.slots ?? []}
              readOnly={!editable}
            />
            <CanvasCircle
              title="Canvas P.M. Preview"
              subtitle="Minute-accurate SVG summary"
              mode="pm"
              slots={day?.slots ?? []}
              readOnly={!editable}
            />
          </section>

          {editable ? (
            <div className="mb-8">
              <ProjectForm
                projects={day?.projects ?? []}
                onAddProject={handleAddProject}
              />
            </div>
          ) : null}

          <div className="mb-8">
            <ProjectList
              day={day}
              editable={editable}
              onDeleteProject={handleDeleteProject}
            />
          </div>

          {editable ? (
            <div className="mb-8">
              <TaskForm
                projects={day?.projects ?? []}
                slots={day?.slots ?? []}
                selectedCellIndices={selectedCellIndices}
                selectedProjectId={selectedProjectId}
                quotaReady={ratioValidation.valid}
                remainingQuotaCells={remainingQuotaCells}
                onSelectedProjectChange={(projectId) => {
                  setSelectedProjectId(projectId);
                  setSelectedCellIndices([]);
                  setCellError("");
                }}
                onInputModeChange={(mode) => {
                  setTaskInputMode(mode);
                  setSelectedCellIndices([]);
                  setCellError("");
                }}
                onClearSelectedCells={() => setSelectedCellIndices([])}
                onAddTask={handleAddTask}
              />
            </div>
          ) : null}

          <div className="mb-8">
            <TaskList
              day={day}
              editable={editable}
              onDeleteTask={handleDeleteTask}
            />
          </div>

          {editable ? (
            <section className="mb-8 grid gap-6 lg:grid-cols-2">
              <SleepForm onAddSleep={handleAddSleep} />
              <RandomEventForm onAddRandomEvent={handleAddRandomEvent} />
            </section>
          ) : null}

          <div className="mb-8">
            <BlackBlockList
              sleepBlocks={day?.sleepBlocks ?? []}
              randomEventBlocks={day?.randomEventBlocks ?? []}
              editable={editable}
              onDeleteBlock={handleDeleteBlock}
            />
          </div>

          {day ? (
            <section
              className={`mb-8 grid gap-6 ${editable ? "lg:grid-cols-2" : ""}`}
            >
              {editable ? (
                <FinishColoringPanel
                  day={day}
                  editable={editable}
                  onJournalCreated={handleJournalCreated}
                />
              ) : null}
              <JournalView journal={day.journal} />
            </section>
          ) : null}

          <CanvasSummaryGrid
            amSummary={slotSummaries.amSummary}
            pmSummary={slotSummaries.pmSummary}
            fullDaySummary={slotSummaries.fullDaySummary}
          />

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <CanvasLegend
              title="A.M. legend"
              summary={slotSummaries.amSummary}
            />
            <CanvasLegend
              title="P.M. legend"
              summary={slotSummaries.pmSummary}
            />
          </section>

          <div className="mt-8">
            <PomodoroPanel day={day} readOnly={!editable} />
          </div>
        </>
      )}

      <DayDebugPanel
        dateKey={selectedDateKey}
        day={day}
        status={status}
        editable={editable}
        loading={loading}
      />
    </main>
  );
}
