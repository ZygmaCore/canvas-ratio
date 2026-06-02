import { getCellState, minuteToCellIndex } from "@/lib/cells";
import { getTaskProjectColor, getTaskProjectName } from "@/lib/projects";
import { formatCellLabel, cellIndexToMinuteRange } from "@/lib/cells";
import type { DayRecord, PomodoroState, TaskRecord } from "@/types/canvas";

export type PomodoroSession = {
  index: number;
  startMinute: number;
  endMinute: number;
  focusStartMinute: number;
  focusEndMinute: number;
  breakStartMinute: number;
  breakEndMinute: number;
};

export type UpcomingTaskItem = {
  taskId?: string;
  taskName: string;
  projectName: string;
  color: string;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  state: "white" | "black" | "colored";
};

const FOCUS_MINUTES = 25;
const CYCLE_MINUTES = 30;
const SESSIONS_PER_DAY = 48;

export function getMinutesSinceMidnight(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function getPomodoroState(date = new Date()): PomodoroState {
  const minutesSinceMidnight = getMinutesSinceMidnight(date);
  const cycleIndex = Math.floor(minutesSinceMidnight / CYCLE_MINUTES);
  const minuteInCycle = minutesSinceMidnight % CYCLE_MINUTES;
  const phase = minuteInCycle < FOCUS_MINUTES ? "focus" : "break";
  const phaseEndMinute =
    phase === "focus" ? FOCUS_MINUTES : CYCLE_MINUTES;
  const remainingSeconds =
    (phaseEndMinute - minuteInCycle) * 60 - date.getSeconds();

  return {
    cycleIndex,
    minuteInCycle,
    phase,
    remainingSeconds: Math.max(0, remainingSeconds),
  };
}

export function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function getPomodoroSessionsForDay(): PomodoroSession[] {
  return Array.from({ length: SESSIONS_PER_DAY }, (_, index) => {
    const startMinute = index * CYCLE_MINUTES;
    const endMinute = startMinute + CYCLE_MINUTES;

    return {
      index,
      startMinute,
      endMinute,
      focusStartMinute: startMinute,
      focusEndMinute: startMinute + FOCUS_MINUTES,
      breakStartMinute: startMinute + FOCUS_MINUTES,
      breakEndMinute: endMinute,
    };
  });
}

export function getCurrentActiveTask(
  day: DayRecord,
  date = new Date(),
): TaskRecord | null {
  const currentMinute = getMinutesSinceMidnight(date);
  const slot = day.slots[currentMinute];

  if (slot?.state !== "colored" || !slot.taskId) {
    return null;
  }

  return day.tasks.find((task) => task.id === slot.taskId) ?? null;
}

export function getUpcomingTaskQueue(
  day: DayRecord,
  date = new Date(),
  limit = 5,
): UpcomingTaskItem[] {
  const currentCell = minuteToCellIndex(getMinutesSinceMidnight(date));
  const items: UpcomingTaskItem[] = [];
  let previousKey = "";

  for (let cellIndex = currentCell + 1; cellIndex < SESSIONS_PER_DAY; cellIndex += 1) {
    const cell = getCellState(day.slots, cellIndex);

    if (cell.state !== "colored" || !cell.taskId) {
      previousKey = "";
      continue;
    }

    const task = day.tasks.find((candidateTask) => candidateTask.id === cell.taskId);

    if (!task) {
      previousKey = "";
      continue;
    }

    const key = `${task.id}:${cell.cellIndex}`;
    const contiguousKey = `${task.id}:${cell.cellIndex - 1}`;
    const { startMinute, endMinute } = cellIndexToMinuteRange(cell.cellIndex);

    if (previousKey === contiguousKey && items.length > 0) {
      const lastItem = items[items.length - 1];
      lastItem.endMinute = endMinute;
      lastItem.durationMinutes = lastItem.endMinute - lastItem.startMinute;
    } else {
      items.push({
        taskId: task.id,
        taskName: task.taskName,
        projectName: getTaskProjectName(day, task),
        color: getTaskProjectColor(day, task),
        startMinute,
        endMinute,
        durationMinutes: endMinute - startMinute,
        state: "colored",
      });
    }

    previousKey = key;

    if (items.length >= limit) {
      break;
    }
  }

  return items;
}

export function getCurrentCellLabel(date = new Date()): string {
  const currentCell = minuteToCellIndex(getMinutesSinceMidnight(date));
  const { startMinute, endMinute } = cellIndexToMinuteRange(currentCell);

  return formatCellLabel(startMinute, endMinute);
}
