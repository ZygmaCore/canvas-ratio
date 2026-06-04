import { BLACK_CANVAS } from "@/lib/palette";
import { getCellIndicesForMinutes } from "@/lib/cells";
import { rebuildDaySlots } from "@/lib/rebuild";
import {
  MINUTES_PER_DAY,
  validateMinuteOfDay,
} from "@/lib/time";
import type { CanvasSlot, DayRecord, TaskRecord, TimeBlock } from "@/types/canvas";

type TimeBlockInput = {
  type: "sleep" | "random-event";
  title?: string;
  startMinute: number;
  endMinute: number;
  description?: string;
};

export function createTimeBlock(input: TimeBlockInput): TimeBlock {
  validateBlockRange(input.startMinute, input.endMinute);

  const title = input.title?.trim();

  return {
    id: createBlockId(),
    type: input.type,
    title:
      title ||
      (input.type === "sleep" ? "Sleep" : "Random Event"),
    startMinute: input.startMinute,
    endMinute: input.endMinute,
    color: BLACK_CANVAS.hex,
    description: input.description?.trim() || undefined,
  };
}

export function expandMinuteRange(
  startMinute: number,
  endMinute: number,
): number[] {
  validateBlockRange(startMinute, endMinute);

  if (startMinute < endMinute) {
    return createMinuteRange(startMinute, endMinute);
  }

  return [
    ...createMinuteRange(startMinute, MINUTES_PER_DAY),
    ...createMinuteRange(0, endMinute),
  ];
}

export function applyBlackBlockToSlots(
  slots: CanvasSlot[],
  block: TimeBlock,
): CanvasSlot[] {
  const blackMinutes = new Set(expandMinuteRange(block.startMinute, block.endMinute));

  return slots.map((slot) => {
    if (!blackMinutes.has(slot.minute)) {
      return { ...slot };
    }

    return {
      minute: slot.minute,
      state: "black",
      color: BLACK_CANVAS.hex,
      blockId: block.id,
    };
  });
}

export function removeBlockAndRebuildSlots(
  day: DayRecord,
  blockId: string,
): DayRecord {
  return rebuildDaySlots({
    ...day,
    sleepBlocks: day.sleepBlocks.filter((block) => block.id !== blockId),
    randomEventBlocks: day.randomEventBlocks.filter(
      (block) => block.id !== blockId,
    ),
  });
}

export function rebuildBlackSlots(day: DayRecord): DayRecord {
  return rebuildDaySlots(day);
}

export function applyRandomEventReplan(
  day: DayRecord,
  randomEventBlock: TimeBlock,
): DayRecord {
  const boundaryMinute = randomEventBlock.endMinute;

  return rebuildDaySlots({
    ...day,
    randomEventBlocks: [...day.randomEventBlocks, randomEventBlock],
    tasks: day.tasks
      .map((task) => trimTaskAtBoundary(task, boundaryMinute))
      .filter((task): task is TaskRecord => !!task),
  });
}

function trimTaskAtBoundary(
  task: TaskRecord,
  boundaryMinute: number,
): TaskRecord | null {
  // Wrapped random events use their end minute as the MVP boundary.
  const assignedMinutes = (task.assignedMinutes ?? []).filter(
    (minute) => minute < boundaryMinute,
  );

  if (assignedMinutes.length === 0) {
    return null;
  }

  const assignedCellDuration =
    getCellIndicesForMinutes(assignedMinutes).length * 30;
  const endMinute =
    task.inputMode === "time-range" &&
    typeof task.startMinute === "number" &&
    typeof task.endMinute === "number" &&
    task.startMinute < task.endMinute
      ? Math.min(task.endMinute, boundaryMinute)
      : task.endMinute;

  return {
    ...task,
    assignedMinutes,
    effectivePaintedMinutes: undefined,
    durationMinutes:
      task.inputMode === "duration"
        ? assignedCellDuration
        : task.durationMinutes,
    endMinute,
  };
}

function validateBlockRange(startMinute: number, endMinute: number): void {
  validateMinuteOfDay(startMinute);
  validateMinuteOfDay(endMinute);

  if (startMinute === endMinute) {
    throw new Error("Start and end time must be different.");
  }
}

function createMinuteRange(startMinute: number, endMinute: number): number[] {
  return Array.from(
    { length: endMinute - startMinute },
    (_, index) => startMinute + index,
  );
}

function createBlockId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
