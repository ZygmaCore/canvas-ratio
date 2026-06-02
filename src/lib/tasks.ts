import { expandMinuteRange } from "@/lib/blocks";
import {
  CELLS_PER_DAY,
  MINUTES_PER_CELL,
  assertThirtyMinuteBoundary,
  cellIndexToMinuteRange,
  getCellRange,
  getCellState,
  getWhiteCellIndices,
  validateCellIndex,
} from "@/lib/cells";
import {
  MINUTES_PER_DAY,
  validateMinuteOfDay,
} from "@/lib/time";
import type {
  CanvasSlot,
  TargetCanvas,
  TaskInputMode,
  TaskRecord,
} from "@/types/canvas";

export type TaskRecordInput = {
  projectId: string;
  taskName: string;
  inputMode: TaskInputMode;
  assignedMinutes: number[];
  targetCanvas?: TargetCanvas;
  projectName?: string;
  color?: string;
  ratio?: number;
  startMinute?: number;
  endMinute?: number;
  durationMinutes?: number;
  description?: string;
};

export type ManualCellTaskInput = {
  projectId: string;
  taskName: string;
  cellIndices: number[];
  description?: string;
  projectName?: string;
  color?: string;
};

const taskInputModes = new Set<TaskInputMode>([
  "manual-cell",
  "ratio",
  "time-range",
  "duration",
]);
const targetCanvases = new Set<TargetCanvas>(["am", "pm", "full"]);

export function createTaskRecord(input: TaskRecordInput): TaskRecord {
  const projectId = validateRequiredText(input.projectId, "Project");
  const taskName = validateRequiredText(input.taskName, "Task name");
  validateTaskInputMode(input.inputMode);
  validateTargetCanvas(input.targetCanvas ?? "full");
  const assignedMinutes = validateAssignedMinutes(input.assignedMinutes);
  validateTaskDetails(input);

  return {
    id: createTaskId(),
    projectId,
    projectName: input.projectName?.trim() || undefined,
    taskName,
    color: input.color,
    inputMode: input.inputMode,
    targetCanvas: input.targetCanvas ?? "full",
    assignedMinutes,
    ratio: input.ratio,
    startMinute: input.startMinute,
    endMinute: input.endMinute,
    durationMinutes: input.durationMinutes,
    description: input.description?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
}

export function createTaskFromManualCells(
  slots: CanvasSlot[],
  input: ManualCellTaskInput,
): TaskRecord {
  return createTaskRecord({
    projectId: input.projectId,
    projectName: input.projectName,
    taskName: input.taskName,
    color: input.color,
    inputMode: "manual-cell",
    assignedMinutes: assignMinutesByCellIndices(slots, input.cellIndices),
    description: input.description,
    targetCanvas: "full",
  });
}

export function assignMinutesByCellIndices(
  slots: CanvasSlot[],
  cellIndices: number[],
): number[] {
  if (cellIndices.length === 0) {
    throw new Error("Select at least one canvas cell.");
  }

  const uniqueCellIndices = Array.from(new Set(cellIndices)).sort(
    (firstCell, secondCell) => firstCell - secondCell,
  );

  for (const cellIndex of uniqueCellIndices) {
    validateCellIndex(cellIndex);
    const cell = getCellState(slots, cellIndex);

    if (cell.state === "black") {
      throw new Error("This cell contains black canvas.");
    }

    if (cell.state === "colored" || cell.isMixed) {
      throw new Error("This cell is already painted.");
    }
  }

  return uniqueCellIndices.flatMap((cellIndex) => {
    const { startMinute, endMinute } = cellIndexToMinuteRange(cellIndex);

    return createMinuteRange(startMinute, endMinute);
  });
}

export function assignMinutesByDuration(
  slots: CanvasSlot[],
  durationMinutes: number,
  targetCanvas: TargetCanvas = "full",
): number[] {
  validateAssignedDuration(durationMinutes);

  const cellCount = Math.ceil(durationMinutes / MINUTES_PER_CELL);
  const whiteCellIndices = getWhiteCellIndicesForTarget(slots, targetCanvas);

  if (whiteCellIndices.length < cellCount) {
    throw new Error("Not enough free canvas time.");
  }

  return assignMinutesByCellIndices(slots, whiteCellIndices.slice(0, cellCount));
}

export function assignMinutesByRatio(
  slots: CanvasSlot[],
  ratio: number,
  targetCanvas: TargetCanvas = "full",
): number[] {
  validateRatio(ratio);

  const whiteCellIndices = getWhiteCellIndicesForTarget(slots, targetCanvas);

  if (whiteCellIndices.length === 0) {
    throw new Error("Not enough free canvas time.");
  }

  const requestedCells = Math.max(
    1,
    Math.round((whiteCellIndices.length * ratio) / 100),
  );

  return assignMinutesByCellIndices(
    slots,
    whiteCellIndices.slice(0, requestedCells),
  );
}

export function assignMinutesByTimeRange(
  slots: CanvasSlot[],
  startMinute: number,
  endMinute: number,
  targetCanvas: TargetCanvas = "full",
): number[] {
  assertThirtyMinuteBoundary(startMinute);
  assertThirtyMinuteBoundary(endMinute === MINUTES_PER_DAY ? 0 : endMinute);

  if (startMinute === endMinute) {
    throw new Error("Start and end time must be different.");
  }

  const requestedMinutes = expandMinuteRange(startMinute, endMinute);
  const cellIndices = Array.from(
    new Set(
      requestedMinutes.map((minute) => Math.floor(minute / MINUTES_PER_CELL)),
    ),
  );
  const range = getCellRange(targetCanvas);

  if (
    targetCanvas !== "full" &&
    cellIndices.some(
      (cellIndex) => cellIndex < range.startCell || cellIndex >= range.endCell,
    )
  ) {
    throw new Error("This range is outside the selected canvas.");
  }

  return assignMinutesByCellIndices(slots, cellIndices);
}

export function applyTaskToSlots(
  slots: CanvasSlot[],
  task: TaskRecord,
  color: string,
): CanvasSlot[] {
  const assignedMinutes = new Set(task.assignedMinutes ?? []);

  return slots.map((slot) => {
    if (!assignedMinutes.has(slot.minute) || slot.state === "black") {
      return { ...slot };
    }

    if (slot.state === "colored" && slot.taskId !== task.id) {
      return { ...slot };
    }

    return {
      minute: slot.minute,
      state: "colored",
      color,
      taskId: task.id,
      blockId: slot.blockId,
    };
  });
}

export function getTaskEffectivePaintedMinutes(
  slots: CanvasSlot[],
  taskId: string,
): number {
  return slots.filter(
    (slot) => slot.state === "colored" && slot.taskId === taskId,
  ).length;
}

export function validateRatio(ratio: number): void {
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 100) {
    throw new Error("Ratio must be between 1 and 100.");
  }
}

export function validateAssignedDuration(durationMinutes: number): void {
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > MINUTES_PER_DAY
  ) {
    throw new Error("Duration must be between 1 and 1440 minutes.");
  }
}

function getWhiteCellIndicesForTarget(
  slots: CanvasSlot[],
  targetCanvas: TargetCanvas,
): number[] {
  const range = getCellRange(targetCanvas);

  return getWhiteCellIndices(slots).filter(
    (cellIndex) => cellIndex >= range.startCell && cellIndex < range.endCell,
  );
}

function validateTaskDetails(input: TaskRecordInput): void {
  if (input.inputMode === "manual-cell") {
    if (input.assignedMinutes.length === 0) {
      throw new Error("Select at least one canvas cell.");
    }
    return;
  }

  if (input.inputMode === "duration") {
    validateAssignedDuration(input.durationMinutes ?? 0);
    return;
  }

  if (input.inputMode === "ratio") {
    validateRatio(input.ratio ?? 0);
    return;
  }

  if (
    typeof input.startMinute !== "number" ||
    typeof input.endMinute !== "number"
  ) {
    throw new Error("Task time range is required.");
  }

  validateMinuteOfDay(input.startMinute);
  validateMinuteOfDay(input.endMinute);

  if (input.startMinute === input.endMinute) {
    throw new Error("Start and end time must be different.");
  }
}

function validateAssignedMinutes(assignedMinutes: number[]): number[] {
  if (!Array.isArray(assignedMinutes)) {
    throw new Error("Assigned minutes are required.");
  }

  const uniqueMinutes = Array.from(new Set(assignedMinutes));

  for (const minute of uniqueMinutes) {
    validateMinuteOfDay(minute);
  }

  return uniqueMinutes.sort(
    (firstMinute, secondMinute) => firstMinute - secondMinute,
  );
}

function validateRequiredText(value: string, label: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${label} is required.`);
  }

  if (trimmedValue.length > 80) {
    throw new Error(`${label} must be 80 characters or fewer.`);
  }

  return trimmedValue;
}

function validateTaskInputMode(inputMode: TaskInputMode): void {
  if (!taskInputModes.has(inputMode)) {
    throw new Error("Choose a valid task input mode.");
  }
}

function validateTargetCanvas(targetCanvas: TargetCanvas): void {
  if (!targetCanvases.has(targetCanvas)) {
    throw new Error("Choose a valid target canvas.");
  }
}

function createMinuteRange(startMinute: number, endMinute: number): number[] {
  return Array.from(
    { length: endMinute - startMinute },
    (_, index) => startMinute + index,
  );
}

function createTaskId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
