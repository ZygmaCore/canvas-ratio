import {
  getAssignedCellCount,
  getEffectivePaintedCellCount,
  getTaskProjectColor,
  getTaskProjectName,
} from "@/lib/projects";
import { InlineMessage } from "@/components/inline-message";
import { formatMinuteRange } from "@/lib/time";
import type {
  DayRecord,
  TargetCanvas,
  TaskInputMode,
  TaskRecord,
} from "@/types/canvas";

type TaskListProps = {
  day: DayRecord | null;
  editable: boolean;
  compact?: boolean;
  onDeleteTask: (taskId: string) => void;
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

export function TaskList({
  day,
  editable,
  compact = false,
  onDeleteTask,
}: TaskListProps) {
  const tasks = day?.tasks ?? [];

  return (
    <section
      className={`rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] shadow-[4px_4px_0_#1A1A1A] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>
            Task List
          </h2>
          <p className="mt-1 text-sm font-bold">
            Tasks color project cells and stay assigned under unavailable time.
          </p>
        </div>
        <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </span>
      </div>

      {tasks.length === 0 ? (
        <InlineMessage type="warning" className="mt-4">
          No painted tasks yet.
        </InlineMessage>
      ) : null}

      <div className="mt-4 grid gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            day={day}
            editable={editable}
            compact={compact}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  day,
  editable,
  compact,
  onDeleteTask,
}: {
  task: TaskRecord;
  day: DayRecord | null;
  editable: boolean;
  compact: boolean;
  onDeleteTask: (taskId: string) => void;
}) {
  const assignedCells = getAssignedCellCount(task);
  const effectiveCells = day ? getEffectivePaintedCellCount(day, task) : 0;
  const assignedMinutes = task.assignedMinutes?.length ?? 0;
  const effectiveMinutes = effectiveCells * 30;
  const coveredCells = Math.max(0, assignedCells - effectiveCells);
  const projectName = day ? getTaskProjectName(day, task) : task.projectName;
  const projectColor = day ? getTaskProjectColor(day, task) : task.color;

  return (
    <article className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="h-5 w-5 shrink-0 rounded-full border-2 border-[#1A1A1A]"
              style={{ backgroundColor: projectColor ?? "#FFFFFF" }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3 className="break-words text-base font-black">
                {task.taskName}
              </h3>
              <p className="break-words text-sm font-bold text-[#2F5FBF]">
                {projectName ?? "Untitled Project"}
              </p>
            </div>
          </div>

          {compact ? (
            <p className="mt-3 text-sm font-bold">
              Colored:{" "}
              <span className="font-black">
                {effectiveCells} cells / {effectiveMinutes} min
              </span>
            </p>
          ) : (
            <div className="mt-3 grid gap-2 text-sm font-bold sm:grid-cols-2">
              <p>
                Mode:{" "}
                <span className="font-black">
                  {inputModeLabels[task.inputMode] ?? "Task"}
                </span>
              </p>
              <p>
                Requested:{" "}
                <span className="font-black">{getRequestedLabel(task)}</span>
              </p>
              <p>
                Target:{" "}
                <span className="font-black">
                  {targetCanvasLabels[task.targetCanvas ?? "full"]}
                </span>
              </p>
              <p>
                Assigned:{" "}
                <span className="font-black">
                  {assignedCells} cells / {assignedMinutes} min
                </span>
              </p>
              <p>
                Colored:{" "}
                <span className="font-black">
                  {effectiveCells} cells / {effectiveMinutes} min
                </span>
              </p>
            </div>
          )}

          {coveredCells > 0 ? (
            <InlineMessage type="warning" className="mt-3">
              Partially covered by black canvas. {coveredCells} cell
              {coveredCells === 1 ? "" : "s"} hidden.
            </InlineMessage>
          ) : null}

          {task.description ? (
            <p className="mt-3 break-words text-sm font-bold">
              {task.description}
            </p>
          ) : null}
        </div>

        {editable ? (
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            aria-label={`Delete task ${task.taskName}`}
            className="min-h-10 shrink-0 border-2 border-[#1A1A1A] bg-[#D62828] px-3 py-2 text-sm font-black text-[#FFFFFF]"
          >
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}

function getRequestedLabel(task: TaskRecord): string {
  if (task.inputMode === "manual-cell") {
    return `${getAssignedCellCount(task)} cells`;
  }

  if (task.inputMode === "duration") {
    return `${task.durationMinutes ?? task.assignedMinutes?.length ?? 0} min`;
  }

  if (task.inputMode === "ratio") {
    return `${task.ratio ?? 0}%`;
  }

  if (typeof task.startMinute === "number" && typeof task.endMinute === "number") {
    return formatMinuteRange(task.startMinute, task.endMinute);
  }

  return inputModeLabels[task.inputMode] ?? "Task";
}
