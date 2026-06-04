"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import { getCellIndicesForMinutes } from "@/lib/cells";
import {
  assignMinutesByCellIndices,
  assignMinutesByDuration,
  assignMinutesByRatio,
  assignMinutesByTimeRange,
  type TaskRecordInput,
} from "@/lib/tasks";
import { parseTimeToMinute } from "@/lib/time";
import type {
  CanvasSlot,
  ProjectRecord,
  TargetCanvas,
  TaskInputMode,
} from "@/types/canvas";

type TaskFormProps = {
  projects: ProjectRecord[];
  slots: CanvasSlot[];
  selectedCellIndices: number[];
  selectedProjectId: string;
  quotaReady: boolean;
  remainingQuotaCells: number;
  disabled?: boolean;
  onSelectedProjectChange: (projectId: string) => void;
  onInputModeChange: (mode: TaskInputMode) => void;
  onClearSelectedCells: () => void;
  onAddTask: (input: TaskRecordInput) => void;
};

const inputModeLabels: Record<TaskInputMode, string> = {
  "manual-cell": "Manual Cells",
  duration: "Fixed Duration",
  ratio: "Ratio",
  "time-range": "Time Range",
};

const targetCanvasLabels: Record<TargetCanvas, string> = {
  full: "Full Day",
  am: "A.M.",
  pm: "P.M.",
};

export function TaskForm({
  projects,
  slots,
  selectedCellIndices,
  selectedProjectId,
  quotaReady,
  remainingQuotaCells,
  disabled = false,
  onSelectedProjectChange,
  onInputModeChange,
  onClearSelectedCells,
  onAddTask,
}: TaskFormProps) {
  const [taskName, setTaskName] = useState("");
  const [inputMode, setInputMode] = useState<TaskInputMode>("manual-cell");
  const [targetCanvas, setTargetCanvas] = useState<TargetCanvas>("full");
  const [durationHours, setDurationHours] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [ratio, setRatio] = useState("50");
  const [startValue, setStartValue] = useState("09:00");
  const [endValue, setEndValue] = useState("10:00");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const formDisabled = disabled || projects.length === 0 || !quotaReady;

  useEffect(() => {
    if (!selectedProjectId && projects[0]) {
      onSelectedProjectChange(projects[0].id);
    }
  }, [onSelectedProjectChange, projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProject && inputMode === "ratio") {
      setRatio(String(selectedProject.ratio));
    }
  }, [inputMode, selectedProject]);

  function handleInputModeChange(mode: TaskInputMode) {
    setInputMode(mode);
    onInputModeChange(mode);
    setAdvancedOpen(true);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (!selectedProject) {
        throw new Error("Create projects and ratios first.");
      }

      if (!quotaReady) {
        throw new Error("Project ratios must total 100 before painting.");
      }

      const assignedMinutes = getAssignedMinutes();
      const assignedCellCount = getCellIndicesForMinutes(assignedMinutes).length;

      if (assignedCellCount > remainingQuotaCells) {
        throw new Error("Painting this task would exceed project quota.");
      }

      onAddTask({
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        color: selectedProject.color,
        taskName,
        inputMode,
        targetCanvas,
        assignedMinutes,
        description: description.trim() || undefined,
        ratio: inputMode === "ratio" ? Number(ratio) : undefined,
        startMinute:
          inputMode === "time-range" ? parseTimeToMinute(startValue) : undefined,
        endMinute:
          inputMode === "time-range" ? parseTimeToMinute(endValue) : undefined,
        durationMinutes:
          inputMode === "duration" ? assignedCellCount * 30 : undefined,
      });

      setTaskName("");
      setDescription("");
      onClearSelectedCells();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Please enter a valid task.",
      );
    }
  }

  function getAssignedMinutes(): number[] {
    if (inputMode === "manual-cell") {
      return assignMinutesByCellIndices(slots, selectedCellIndices);
    }

    if (inputMode === "duration") {
      return assignMinutesByDuration(
        slots,
        getDurationMinutes(),
        targetCanvas,
      );
    }

    if (inputMode === "ratio") {
      return assignMinutesByRatio(slots, Number(ratio), targetCanvas);
    }

    return assignMinutesByTimeRange(
      slots,
      parseTimeToMinute(startValue),
      parseTimeToMinute(endValue),
      targetCanvas,
    );
  }

  function getDurationMinutes(): number {
    const hours = Number(durationHours || "0");
    const minutes = Number(durationMinutes || "0");

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new Error("Duration must use whole hours and 0-59 minutes.");
    }

    return hours * 60 + minutes;
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="task-form"
      className="rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Paint Your Day</h2>
          <p className="mt-1 text-sm font-bold">
            Choose a project, name the task, then click Free cells on the canvas.
          </p>
        </div>
        <span
          className="h-8 w-8 rounded-full border-2 border-[#1A1A1A]"
          style={{ backgroundColor: selectedProject?.color ?? "#FFFFFF" }}
          aria-hidden="true"
        />
      </div>

      {projects.length === 0 ? (
        <InlineMessage type="warning" className="mt-4">
          Add projects first. Ratios must total 100 before painting.
        </InlineMessage>
      ) : null}

      {!quotaReady && projects.length > 0 ? (
        <InlineMessage type="warning" className="mt-4">
          Your project ratios are not complete yet. Finish them before painting.
        </InlineMessage>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Project
          </span>
          <select
            value={selectedProjectId}
            disabled={disabled || projects.length === 0}
            data-testid="task-project"
            onChange={(event) => onSelectedProjectChange(event.currentTarget.value)}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} / {project.ratio}%
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Task
          </span>
          <input
            type="text"
            value={taskName}
            disabled={formDisabled}
            data-testid="task-name"
            onChange={(event) => setTaskName(event.currentTarget.value)}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
            placeholder="DSA, deep work, client call"
          />
        </label>
      </div>

      {inputMode === "manual-cell" ? (
        <p className="mt-4 border-2 border-[#1A1A1A] bg-[#FBFBF7] px-4 py-3 text-sm font-black">
          Selected cells: {selectedCellIndices.length}. Remaining quota:{" "}
          {remainingQuotaCells} cells.
        </p>
      ) : null}

      <label className="mt-4 block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          Note
        </span>
        <textarea
          value={description}
          disabled={formDisabled}
          data-testid="task-description"
          onChange={(event) => setDescription(event.currentTarget.value)}
          rows={3}
          className="mt-2 w-full resize-none border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
          placeholder="Optional"
        />
      </label>

      <details
        open={advancedOpen}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
        className="mt-4"
      >
        <summary className="min-h-11 cursor-pointer border-2 border-[#1A1A1A] bg-[#FBFBF7] px-4 py-2 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]">
          More ways to paint
        </summary>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Mode
              </span>
              <select
                value={inputMode}
                disabled={formDisabled}
                data-testid="task-mode"
                onChange={(event) =>
                  handleInputModeChange(event.currentTarget.value as TaskInputMode)
                }
                className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
              >
                {Object.entries(inputModeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Target
              </span>
              <select
                value={targetCanvas}
                disabled={formDisabled || inputMode === "manual-cell"}
                data-testid="task-target"
                onChange={(event) =>
                  setTargetCanvas(event.currentTarget.value as TargetCanvas)
                }
                className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
              >
                {Object.entries(targetCanvasLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {inputMode === "duration" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black uppercase text-[#2F5FBF]">
                  Hours
                </span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={durationHours}
                  disabled={formDisabled}
                  data-testid="task-duration-hours"
                  onChange={(event) =>
                    setDurationHours(event.currentTarget.value)
                  }
                  onInput={(event) => setDurationHours(event.currentTarget.value)}
                  className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black uppercase text-[#2F5FBF]">
                  Minutes
                </span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  disabled={formDisabled}
                  data-testid="task-duration-minutes"
                  onChange={(event) =>
                    setDurationMinutes(event.currentTarget.value)
                  }
                  onInput={(event) =>
                    setDurationMinutes(event.currentTarget.value)
                  }
                  className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
                />
              </label>
            </div>
          ) : null}

          {inputMode === "ratio" ? (
            <label className="block">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Ratio %
              </span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={ratio}
                disabled={formDisabled}
                data-testid="task-ratio"
                onChange={(event) => setRatio(event.currentTarget.value)}
                onInput={(event) => setRatio(event.currentTarget.value)}
                className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
              />
            </label>
          ) : null}

          {inputMode === "time-range" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black uppercase text-[#2F5FBF]">
                  Start
                </span>
                <input
                  type="time"
                  step="1800"
                  value={startValue}
                  disabled={formDisabled}
                  data-testid="task-start"
                  onChange={(event) => setStartValue(event.currentTarget.value)}
                  onInput={(event) => setStartValue(event.currentTarget.value)}
                  className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black uppercase text-[#2F5FBF]">
                  End
                </span>
                <input
                  type="time"
                  step="1800"
                  value={endValue}
                  disabled={formDisabled}
                  data-testid="task-end"
                  onChange={(event) => setEndValue(event.currentTarget.value)}
                  onInput={(event) => setEndValue(event.currentTarget.value)}
                  className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
                />
              </label>
            </div>
          ) : null}

          <p className="text-sm font-bold text-[#4a4a4a]">
            Canvas painting uses 30-minute cells. Duration mode rounds up to
            the next full cell; time ranges must align to 30-minute boundaries.
          </p>
        </div>
      </details>

      {error ? (
        <InlineMessage type="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}

      <button
        type="submit"
        disabled={formDisabled}
        data-testid="add-task"
        className="mt-4 min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-[#FFFFFF] shadow-[3px_3px_0_#FFD91A] disabled:cursor-not-allowed disabled:bg-[#8B4A3A]"
      >
        {inputMode === "manual-cell" ? "Paint Selected Cells" : "Add Task"}
      </button>
    </form>
  );
}
