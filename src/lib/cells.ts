import { BLACK_CANVAS, WHITE_CANVAS } from "@/lib/palette";
import {
  AM_END_MINUTE,
  AM_START_MINUTE,
  MINUTES_PER_DAY,
  PM_END_MINUTE,
  PM_START_MINUTE,
  minuteToTime,
  validateMinuteOfDay,
} from "@/lib/time";
import type { CanvasSlot, CanvasSlotState, TargetCanvas } from "@/types/canvas";

export const CELLS_PER_DAY = 48;
export const MINUTES_PER_CELL = 30;
export const AM_CELL_START = 0;
export const AM_CELL_END = 24;
export const PM_CELL_START = 24;
export const PM_CELL_END = 48;

export type CellCanvasMode = "am" | "pm";

export type CellView = {
  cellIndex: number;
  startMinute: number;
  endMinute: number;
  label: string;
  state: CanvasSlotState;
  color: string;
  taskId?: string;
  blockId?: string;
  isMixed: boolean;
};

export function cellIndexToMinuteRange(cellIndex: number): {
  startMinute: number;
  endMinute: number;
} {
  validateCellIndex(cellIndex);

  const startMinute = cellIndex * MINUTES_PER_CELL;

  return {
    startMinute,
    endMinute: startMinute + MINUTES_PER_CELL,
  };
}

export function minuteToCellIndex(minute: number): number {
  validateMinuteOfDay(minute);

  return Math.floor(minute / MINUTES_PER_CELL);
}

export function getCellRange(mode: TargetCanvas): {
  startCell: number;
  endCell: number;
} {
  if (mode === "am") {
    return {
      startCell: AM_CELL_START,
      endCell: AM_CELL_END,
    };
  }

  if (mode === "pm") {
    return {
      startCell: PM_CELL_START,
      endCell: PM_CELL_END,
    };
  }

  return {
    startCell: 0,
    endCell: CELLS_PER_DAY,
  };
}

export function getCellState(slots: CanvasSlot[], cellIndex: number): CellView {
  const { startMinute, endMinute } = cellIndexToMinuteRange(cellIndex);
  const cellSlots = getSlotsForCell(slots, cellIndex);
  const blackSlot = cellSlots.find((slot) => slot.state === "black");

  if (blackSlot) {
    return {
      cellIndex,
      startMinute,
      endMinute,
      label: formatCellLabel(startMinute, endMinute),
      state: "black",
      color: BLACK_CANVAS.hex,
      taskId: blackSlot.taskId,
      blockId: blackSlot.blockId,
      isMixed: cellSlots.some(
        (slot) =>
          slot.state !== "black" ||
          slot.blockId !== blackSlot.blockId ||
          slot.color !== blackSlot.color,
      ),
    };
  }

  if (cellSlots.length === 0) {
    return createFallbackCellView(cellIndex, startMinute, endMinute);
  }

  const firstSlot = cellSlots[0];
  const allSame = cellSlots.every(
    (slot) =>
      slot.state === firstSlot.state &&
      slot.color === firstSlot.color &&
      slot.taskId === firstSlot.taskId &&
      slot.blockId === firstSlot.blockId,
  );

  if (allSame) {
    return {
      cellIndex,
      startMinute,
      endMinute,
      label: formatCellLabel(startMinute, endMinute),
      state: firstSlot.state,
      color: firstSlot.color,
      taskId: firstSlot.taskId,
      blockId: firstSlot.blockId,
      isMixed: false,
    };
  }

  const dominantSlot = getDominantVisibleSlot(cellSlots);

  return {
    cellIndex,
    startMinute,
    endMinute,
    label: formatCellLabel(startMinute, endMinute),
    state: dominantSlot.state,
    color: dominantSlot.color,
    taskId: dominantSlot.taskId,
    blockId: dominantSlot.blockId,
    isMixed: true,
  };
}

export function getCellsForCanvas(
  slots: CanvasSlot[],
  mode: CellCanvasMode,
): CellView[] {
  const range = getCellRange(mode);

  return Array.from(
    { length: range.endCell - range.startCell },
    (_, index) => getCellState(slots, range.startCell + index),
  );
}

export function isCellBlack(slots: CanvasSlot[], cellIndex: number): boolean {
  return getCellState(slots, cellIndex).state === "black";
}

export function isCellWhite(slots: CanvasSlot[], cellIndex: number): boolean {
  const cell = getCellState(slots, cellIndex);

  return cell.state === "white" && !cell.isMixed;
}

export function isCellColored(slots: CanvasSlot[], cellIndex: number): boolean {
  return getCellState(slots, cellIndex).state === "colored";
}

export function getPaintableCellIndices(slots: CanvasSlot[]): number[] {
  return Array.from({ length: CELLS_PER_DAY }, (_, cellIndex) => cellIndex)
    .filter((cellIndex) => !isCellBlack(slots, cellIndex));
}

export function getBlackCellIndices(slots: CanvasSlot[]): number[] {
  return getCellIndicesByState(slots, "black");
}

export function getWhiteCellIndices(slots: CanvasSlot[]): number[] {
  return getCellIndicesByState(slots, "white").filter((cellIndex) =>
    isCellWhite(slots, cellIndex),
  );
}

export function getColoredCellIndices(slots: CanvasSlot[]): number[] {
  return getCellIndicesByState(slots, "colored");
}

export function getCellIndicesForMinutes(minutes: number[]): number[] {
  return Array.from(
    new Set(minutes.map((minute) => minuteToCellIndex(minute))),
  ).sort((firstCell, secondCell) => firstCell - secondCell);
}

export function formatCellLabel(
  startMinute: number,
  endMinute: number,
): string {
  const endLabelMinute = endMinute >= MINUTES_PER_DAY ? 0 : endMinute;

  return `${minuteToTime(startMinute)}-${minuteToTime(endLabelMinute)}`;
}

export function validateCellIndex(cellIndex: number): void {
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= CELLS_PER_DAY) {
    throw new Error("Cell index must be an integer between 0 and 47.");
  }
}

export function assertThirtyMinuteBoundary(minute: number): void {
  validateMinuteOfDay(minute);

  if (minute % MINUTES_PER_CELL !== 0) {
    throw new Error("Canvas painting must align to 30-minute cells.");
  }
}

function getSlotsForCell(slots: CanvasSlot[], cellIndex: number): CanvasSlot[] {
  const { startMinute, endMinute } = cellIndexToMinuteRange(cellIndex);

  return slots.filter(
    (slot) => slot.minute >= startMinute && slot.minute < endMinute,
  );
}

function getCellIndicesByState(
  slots: CanvasSlot[],
  state: CanvasSlotState,
): number[] {
  return Array.from({ length: CELLS_PER_DAY }, (_, cellIndex) => cellIndex)
    .filter((cellIndex) => getCellState(slots, cellIndex).state === state);
}

function createFallbackCellView(
  cellIndex: number,
  startMinute: number,
  endMinute: number,
): CellView {
  return {
    cellIndex,
    startMinute,
    endMinute,
    label: formatCellLabel(startMinute, endMinute),
    state: "white",
    color: WHITE_CANVAS.hex,
    isMixed: false,
  };
}

function getDominantVisibleSlot(slots: CanvasSlot[]): CanvasSlot {
  const usageMap = new Map<string, { slot: CanvasSlot; count: number }>();

  for (const slot of slots) {
    const key = `${slot.state}:${slot.color}:${slot.taskId ?? ""}:${slot.blockId ?? ""}`;
    const usage = usageMap.get(key);

    if (usage) {
      usage.count += 1;
    } else {
      usageMap.set(key, {
        slot,
        count: 1,
      });
    }
  }

  return Array.from(usageMap.values()).sort(
    (firstUsage, secondUsage) => secondUsage.count - firstUsage.count,
  )[0].slot;
}
