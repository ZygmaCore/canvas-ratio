"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BackupPanel } from "@/components/backup-panel";
import { BlackBlockList } from "@/components/black-block-list";
import { CanvasSummaryGrid } from "@/components/canvas-summary-grid";
import { CellCanvas } from "@/components/cell-canvas";
import { DayDebugPanel } from "@/components/day-debug-panel";
import { DayStatusBadge } from "@/components/day-status-badge";
import { FinishColoringPanel } from "@/components/finish-coloring-panel";
import { GenerateImagePanel } from "@/components/generate-image-panel";
import { InlineMessage } from "@/components/inline-message";
import { JournalView } from "@/components/journal-view";
import { PomodoroPanel } from "@/components/pomodoro-panel";
import { ProjectForm } from "@/components/project-form";
import { ProjectList } from "@/components/project-list";
import { RandomEventForm } from "@/components/random-event-form";
import { SleepForm } from "@/components/sleep-form";
import { StoryModeView } from "@/components/story-mode-view";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { useDayRecord } from "@/hooks/use-day-record";
import { createTimeBlock } from "@/lib/blocks";
import { getCellState } from "@/lib/cells";
import { summarizeCanvas, summarizeSlots } from "@/lib/canvas-segments";
import { formatSeconds, getPomodoroState } from "@/lib/pomodoro";
import {
  getProjectRatioTotal,
  getProjectUsageFromSlots,
  removeProject,
  validateProjectRatios,
} from "@/lib/projects";
import { rebuildDaySlots } from "@/lib/rebuild";
import { createTaskRecord, type TaskRecordInput } from "@/lib/tasks";
import { getTodayDateKey } from "@/lib/time";
import type {
  DayRecord,
  GeneratedImageRecord,
  JournalRecord,
  ProjectRecord,
  TaskInputMode,
} from "@/types/canvas";

type CanvasPageClientProps = {
  initialDateKey: string;
};

type DrawerTab = "projects" | "paint" | "black" | "review" | "tools";
type MobileTab = "canvas" | "paint" | "black" | "review";

const drawerTabs: { id: DrawerTab; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "paint", label: "Paint" },
  { id: "black", label: "Black" },
  { id: "review", label: "Review" },
  { id: "tools", label: "Tools" },
];

const mobileTabs: { id: MobileTab; label: string }[] = [
  { id: "canvas", label: "Canvas" },
  { id: "paint", label: "Paint" },
  { id: "black", label: "Black" },
  { id: "review", label: "Review" },
];

export function CanvasPageClient({ initialDateKey }: CanvasPageClientProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCellIndices, setSelectedCellIndices] = useState<number[]>([]);
  const [taskInputMode, setTaskInputMode] =
    useState<TaskInputMode>("manual-cell");
  const [cellError, setCellError] = useState("");
  const [viewMode, setViewMode] = useState<"canvas" | "story">("canvas");
  const [activeDrawerTab, setActiveDrawerTab] =
    useState<DrawerTab>("projects");
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileTab>("canvas");
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { day, status, editable, loading, saveDay, resetDay, importDay } =
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
  const selectedProject =
    day?.projects.find((project) => project.id === selectedProjectId) ?? null;
  const remainingQuotaCells = selectedProjectUsage?.remainingCells ?? 0;
  const manualPaintingActive = taskInputMode === "manual-cell";
  const pomodoroState = now ? getPomodoroState(now) : null;
  const totalRatio = getProjectRatioTotal(day?.projects ?? []);
  const activePanelTab: DrawerTab = isDesktop
    ? activeDrawerTab
    : activeMobileTab === "paint"
      ? "paint"
      : activeMobileTab === "black"
        ? "black"
        : activeMobileTab === "review"
          ? "review"
          : activeDrawerTab;
  const canvasIsEmpty =
    !!day &&
    slotSummaries.fullDaySummary.totalMinutes > 0 &&
    slotSummaries.fullDaySummary.blackMinutes === 0 &&
    slotSummaries.fullDaySummary.coloredMinutes === 0;

  useEffect(() => {
    setSelectedCellIndices([]);
    setCellError("");
    setViewMode("canvas");
    setActiveMobileTab("canvas");
    setMobileToolsOpen(false);
  }, [selectedDateKey]);

  useEffect(() => {
    setNow(new Date());

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

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

  function handleImageCreated(image: GeneratedImageRecord) {
    if (!day || !editable) {
      return;
    }

    saveDay({
      ...day,
      generatedImage: image,
      updatedAt: new Date().toISOString(),
    });
    setViewMode("story");
  }


  function handleToggleCell(cellIndex: number) {
    setCellError("");

    if (!day || !editable || !manualPaintingActive) {
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
      setCellError("Black canvas is unavailable and cannot be painted.");
      return;
    }

    if (cell.state === "colored" || cell.isMixed) {
      setCellError("This cell is already painted and cannot be overwritten.");
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

  function renderCanvasWorkspace() {
    if (status === "future") {
      return (
        <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0_#1A1A1A]">
          <h2 className="text-2xl font-black">
            Future canvas is not available yet.
          </h2>
          <p className="mt-3 text-sm font-bold text-[#4a4a4a]">
            Choose today or a past date to view stored canvas records.
          </p>
        </section>
      );
    }

    if (viewMode === "story" && day) {
      return (
        <StoryModeView
          day={day}
          onBackToCanvas={() => setViewMode("canvas")}
        />
      );
    }

    return (
      <div className="space-y-4">
        {status === "past" ? (
          <InlineMessage type="info">
            Past canvas is read-only.
          </InlineMessage>
        ) : null}

        {!ratioValidation.valid && day?.projects.length ? (
          <InlineMessage type="warning">
            {ratioValidation.message} Current total:{" "}
            {ratioValidation.total}/100.
          </InlineMessage>
        ) : null}

        {canvasIsEmpty ? (
          <InlineMessage type="info">
            Your canvas is still empty.
          </InlineMessage>
        ) : null}

        <section className="grid min-w-0 gap-4 xl:grid-cols-2">
          <CellCanvas
            mode="am"
            day={day}
            selectedProjectId={selectedProjectId}
            selectedCellIndices={selectedCellIndices}
            editable={editable && manualPaintingActive}
            quotaReady={ratioValidation.valid}
            compact
            onToggleCell={handleToggleCell}
          />
          <CellCanvas
            mode="pm"
            day={day}
            selectedProjectId={selectedProjectId}
            selectedCellIndices={selectedCellIndices}
            editable={editable && manualPaintingActive}
            quotaReady={ratioValidation.valid}
            compact
            onToggleCell={handleToggleCell}
          />
        </section>

        {cellError ? (
          <InlineMessage type="warning">
            {cellError}
          </InlineMessage>
        ) : null}

        <SelectedProjectQuotaStrip
          project={selectedProject}
          usage={selectedProjectUsage}
          stagedCellCount={selectedCellIndices.length}
          quotaReady={ratioValidation.valid}
        />
      </div>
    );
  }

  function renderPanelContent(tab: DrawerTab) {
    if (tab === "projects") {
      return (
        <PanelStack>
          <PanelHeading
            eyebrow="Setup"
            title="Projects"
            description="Create the color ratios that divide the paintable day."
          />
          <RatioProgress totalRatio={totalRatio} />
          {editable ? (
            <ProjectForm
              projects={day?.projects ?? []}
              onAddProject={handleAddProject}
            />
          ) : (
            <InlineMessage type="info">
              This date is read-only. Project editing is disabled.
            </InlineMessage>
          )}
          <ProjectList
            day={day}
            editable={editable}
            onDeleteProject={handleDeleteProject}
          />
        </PanelStack>
      );
    }

    if (tab === "paint") {
      return (
        <PanelStack>
          <PanelHeading
            eyebrow="Daily work"
            title="Paint"
            description="Select a project, name the task, then click canvas cells."
          />
          <SelectedProjectQuotaStrip
            project={selectedProject}
            usage={selectedProjectUsage}
            stagedCellCount={selectedCellIndices.length}
            quotaReady={ratioValidation.valid}
          />
          {editable ? (
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
          ) : (
            <InlineMessage type="info">
              This date is read-only. Painting controls are disabled.
            </InlineMessage>
          )}
          <InlineMessage type="info">
            In manual mode, click free cells on the canvas to stage them.
          </InlineMessage>
          <TaskList
            day={day}
            editable={editable}
            onDeleteTask={handleDeleteTask}
          />
        </PanelStack>
      );
    }

    if (tab === "black") {
      return (
        <PanelStack>
          <PanelHeading
            eyebrow="Unavailable time"
            title="Black"
            description="Sleep and random events block cells without deleting tasks."
          />
          {editable ? (
            <div className="grid gap-4">
              <SleepForm onAddSleep={handleAddSleep} />
              <RandomEventForm onAddRandomEvent={handleAddRandomEvent} />
            </div>
          ) : (
            <InlineMessage type="info">
              This date is read-only. Black block editing is disabled.
            </InlineMessage>
          )}
          <BlackBlockList
            sleepBlocks={day?.sleepBlocks ?? []}
            randomEventBlocks={day?.randomEventBlocks ?? []}
            editable={editable}
            onDeleteBlock={handleDeleteBlock}
          />
        </PanelStack>
      );
    }

    if (tab === "review") {
      return (
        <PanelStack>
          <PanelHeading
            eyebrow="End of day"
            title="Review"
            description="Check the day, Pomodoro clock, journal, and pixel story."
          />
          <PomodoroPanel day={day} readOnly={!editable} compact />
          <CanvasSummaryGrid
            amSummary={slotSummaries.amSummary}
            pmSummary={slotSummaries.pmSummary}
            fullDaySummary={slotSummaries.fullDaySummary}
            compact
          />
          {day && (
            <section className="grid gap-4">
              {status === "today" ? (
                <>
                  <FinishColoringPanel
                    day={day}
                    editable={editable}
                    onJournalCreated={handleJournalCreated}
                  />
                  <GenerateImagePanel
                    day={day}
                    editable={editable}
                    onImageCreated={handleImageCreated}
                  />
                </>
              ) : null}
              <JournalView journal={day.journal} />
            </section>
          )}
          {day?.generatedImage ? (
            <button
              type="button"
              onClick={() => {
                setViewMode("story");
                setActiveMobileTab("canvas");
              }}
              className="min-h-12 border-2 border-[#1A1A1A] bg-[#FFD91A] px-5 py-3 text-sm font-black shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              View Story Mode
            </button>
          ) : null}
          {!isDesktop ? (
            <details
              onToggle={(event) =>
                setMobileToolsOpen(event.currentTarget.open)
              }
              className="rounded-lg border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0_#1A1A1A]"
            >
              <summary className="min-h-12 cursor-pointer px-4 py-3 text-base font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]">
                Tools
              </summary>
              {mobileToolsOpen ? (
                <div className="border-t-2 border-[#1A1A1A] p-4">
                  {renderPanelContent("tools")}
                </div>
              ) : null}
            </details>
          ) : null}
        </PanelStack>
      );
    }

    return (
      <PanelStack>
        <PanelHeading
          eyebrow="Maintenance"
          title="Tools"
          description="Backup, import, reset, and developer diagnostics live here."
        />
        {editable ? (
          <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
            <h2 className="text-xl font-black">Reset Today</h2>
            <p className="mt-2 text-sm font-bold text-[#4a4a4a]">
              Clear today back to a 1440-minute white canvas.
            </p>
            <button
              type="button"
              onClick={handleResetToday}
              className="mt-4 min-h-12 border-2 border-[#1A1A1A] bg-[#D62828] px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Reset Today
            </button>
          </section>
        ) : null}
        <BackupPanel
          currentDate={selectedDateKey}
          day={day}
          editable={editable}
          onImportDay={importDay}
        />
        <DayDebugPanel
          dateKey={selectedDateKey}
          day={day}
          status={status}
          editable={editable}
          loading={loading}
        />
      </PanelStack>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden pb-24 lg:pb-6">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FBFBF7]/95 shadow-[0_4px_0_rgba(26,26,26,0.18)] backdrop-blur">
        <div className="mx-auto grid max-w-[1600px] gap-2 px-4 py-2 sm:px-6 lg:grid-cols-[auto_auto_minmax(0,1fr)] lg:items-center lg:px-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black text-[#2F5FBF] shadow-[3px_3px_0_#FFD91A] underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              >
                Canvas Ratio
              </Link>
              <h1 className="text-2xl font-black leading-tight sm:text-3xl">
                Today’s Canvas
              </h1>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:justify-start">
              <label className="min-w-0">
                <span className="sr-only">Selected date</span>
                <input
                  type="date"
                  value={selectedDateKey}
                  onChange={(event) => {
                    if (event.currentTarget.value) {
                      setSelectedDateKey(event.currentTarget.value);
                    }
                  }}
                  onInput={(event) => {
                    if (event.currentTarget.value) {
                      setSelectedDateKey(event.currentTarget.value);
                    }
                  }}
                  className="min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] sm:w-auto"
                />
              </label>
              <button
                type="button"
                onClick={() => setSelectedDateKey(getTodayDateKey())}
                className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              >
                Today
              </button>
              <DayStatusBadge status={status} editable={editable} />
            </div>

          <div className="grid grid-cols-4 gap-2">
            <TopMetric
              label="White"
              value={formatDurationLabel(slotSummaries.fullDaySummary.whiteMinutes)}
              tone="white"
            />
            <TopMetric
              label="Black"
              value={formatDurationLabel(slotSummaries.fullDaySummary.blackMinutes)}
              tone="black"
            />
            <TopMetric
              label="Painted"
              value={formatDurationLabel(slotSummaries.fullDaySummary.coloredMinutes)}
              tone="painted"
            />
            <TopMetric
              label="Pomodoro"
              value={
                pomodoroState
                  ? `${pomodoroState.phase} ${formatSeconds(pomodoroState.remainingSeconds)} / ${pomodoroState.cycleIndex + 1}`
                  : "Syncing"
              }
              tone="pomodoro"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start lg:px-8 xl:grid-cols-[minmax(0,1fr)_470px]">
        <section
          className={`min-w-0 ${activeMobileTab === "canvas" ? "block" : "hidden"} lg:block`}
          aria-label="Canvas workspace"
        >
          {renderCanvasWorkspace()}
        </section>

        <aside
          className={`min-w-0 rounded-t-xl border-2 border-[#1A1A1A] bg-[#FBFBF7] shadow-[4px_4px_0_#1A1A1A] ${
            activeMobileTab === "canvas" ? "hidden" : "block"
          } lg:sticky lg:top-[7rem] lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-hidden lg:rounded-lg`}
          aria-label="Canvas controls"
        >
          <nav
            className="hidden grid-cols-5 border-b-2 border-[#1A1A1A] bg-white lg:grid"
            aria-label="Canvas control tabs"
          >
            {drawerTabs.map((tab) => (
              <DrawerTabButton
                key={tab.id}
                label={tab.label}
                active={activeDrawerTab === tab.id}
                onClick={() => setActiveDrawerTab(tab.id)}
              />
            ))}
          </nav>

          <div className="max-h-none overflow-visible p-4 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <p className="text-sm font-black uppercase text-[#2F5FBF]">
                {activeMobileTab}
              </p>
              <button
                type="button"
                onClick={() => setActiveMobileTab("canvas")}
                className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              >
                Back to Canvas
              </button>
            </div>
            {renderPanelContent(activePanelTab)}
          </div>
        </aside>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t-2 border-[#1A1A1A] bg-white lg:hidden"
        aria-label="Mobile canvas sections"
      >
        {mobileTabs.map((tab) => (
          <MobileTabButton
            key={tab.id}
            label={tab.label}
            active={activeMobileTab === tab.id}
            onClick={() => {
              setActiveMobileTab(tab.id);
              if (tab.id === "canvas") {
                setViewMode("canvas");
              }
            }}
          />
        ))}
      </nav>
    </main>
  );
}

type ProjectUsage = ReturnType<typeof getProjectUsageFromSlots>[number];

function PanelStack({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 gap-4">{children}</div>;
}

function PanelHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <p className="text-xs font-black uppercase text-[#2F5FBF]">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black">{title}</h2>
      <p className="mt-1 text-sm font-bold text-[#4a4a4a]">{description}</p>
    </div>
  );
}

function DrawerTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-12 border-r-2 border-[#1A1A1A] px-2 py-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] last:border-r-0 ${
        active ? "bg-[#FFD91A]" : "bg-white hover:bg-[#FBFBF7]"
      }`}
    >
      {label}
    </button>
  );
}

function MobileTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-16 border-r-2 border-[#1A1A1A] px-2 py-2 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] last:border-r-0 ${
        active ? "bg-[#FFD91A]" : "bg-white"
      }`}
    >
      {label}
    </button>
  );
}

function TopMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "white" | "black" | "painted" | "pomodoro";
}) {
  const toneClass = {
    white: "bg-white",
    black: "bg-[#1A1A1A] text-white",
    painted: "bg-[#8BCF3F]",
    pomodoro: "bg-[#6FB6FF]",
  }[tone];

  return (
    <div className={`min-w-0 border-2 border-[#1A1A1A] px-2 py-1.5 ${toneClass}`}>
      <p className="truncate text-[11px] font-black uppercase">{label}</p>
      <p className="truncate text-sm font-black sm:text-base">{value}</p>
    </div>
  );
}

function RatioProgress({ totalRatio }: { totalRatio: number }) {
  const cappedRatio = Math.min(Math.max(totalRatio, 0), 100);
  const ready = totalRatio === 100;

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Total ratio
          </p>
          <p className="mt-1 text-xl font-black">{totalRatio}/100</p>
        </div>
        <span
          className={`border-2 border-[#1A1A1A] px-3 py-1 text-sm font-black ${
            ready ? "bg-[#8BCF3F]" : "bg-[#FFD7BF]"
          }`}
        >
          {ready ? "Ready" : "Needs 100"}
        </span>
      </div>
      <div className="mt-3 h-4 border-2 border-[#1A1A1A] bg-[#FBFBF7]">
        <div
          className="h-full bg-[#FFD91A]"
          style={{ width: `${cappedRatio}%` }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

function SelectedProjectQuotaStrip({
  project,
  usage,
  stagedCellCount,
  quotaReady,
}: {
  project: ProjectRecord | null;
  usage?: ProjectUsage;
  stagedCellCount: number;
  quotaReady: boolean;
}) {
  const quotaCells = usage?.quotaCells ?? 0;
  const paintedCells = usage?.paintedCells ?? 0;
  const remainingCells = usage?.remainingCells ?? 0;
  const stagedWithinQuota = Math.min(stagedCellCount, remainingCells);
  const progress =
    quotaCells > 0
      ? Math.min(((paintedCells + stagedWithinQuota) / quotaCells) * 100, 100)
      : 0;

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Selected project quota
          </p>
          <div className="mt-2 flex min-w-0 items-center gap-3">
            <span
              className="h-7 w-7 shrink-0 rounded-full border-2 border-[#1A1A1A]"
              style={{ backgroundColor: project?.color ?? "#FFFFFF" }}
              aria-hidden="true"
            />
            <p className="truncate text-lg font-black">
              {project?.name ?? "No project selected"}
            </p>
          </div>
        </div>
        <span
          className={`w-fit border-2 border-[#1A1A1A] px-3 py-1 text-sm font-black ${
            quotaReady ? "bg-[#8BCF3F]" : "bg-[#FFD7BF]"
          }`}
        >
          {quotaReady ? "Quota ready" : "Ratios not ready"}
        </span>
      </div>

      <div className="mt-3 h-4 border-2 border-[#1A1A1A] bg-[#FBFBF7]">
        <div
          className="h-full bg-[#2F5FBF]"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 grid gap-2 text-sm font-bold sm:grid-cols-4">
        <p>
          Quota: <span className="font-black">{quotaCells}</span>
        </p>
        <p>
          Painted: <span className="font-black">{paintedCells}</span>
        </p>
        <p>
          Staged: <span className="font-black">{stagedCellCount}</span>
        </p>
        <p>
          Left: <span className="font-black">{remainingCells}</span>
        </p>
      </div>
    </section>
  );
}

function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
