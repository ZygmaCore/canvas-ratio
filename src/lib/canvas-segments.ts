import {
  AM_END_MINUTE,
  AM_START_MINUTE,
  PM_END_MINUTE,
  PM_START_MINUTE,
} from "@/lib/time";
import type { CanvasSlot, CanvasSlotState } from "@/types/canvas";

export type CanvasMode = "am" | "pm";

export type CanvasSegment = {
  id: string;
  startMinute: number;
  endMinute: number;
  startOffset: number;
  endOffset: number;
  durationMinutes: number;
  color: string;
  state: CanvasSlotState;
  taskId?: string;
  blockId?: string;
};

export type CanvasSummary = {
  totalMinutes: number;
  whiteMinutes: number;
  blackMinutes: number;
  coloredMinutes: number;
  whitePercent: number;
  blackPercent: number;
  coloredPercent: number;
  colorUsage: ColorUsage[];
};

export type ColorUsage = {
  color: string;
  state: CanvasSlotState;
  minutes: number;
  percent: number;
};

type CanvasRange = {
  start: number;
  end: number;
};

export function getCanvasRange(mode: CanvasMode): CanvasRange {
  if (mode === "am") {
    return {
      start: AM_START_MINUTE,
      end: AM_END_MINUTE,
    };
  }

  return {
    start: PM_START_MINUTE,
    end: PM_END_MINUTE,
  };
}

export function getSlotsForCanvas(
  slots: CanvasSlot[],
  mode: CanvasMode,
): CanvasSlot[] {
  const range = getCanvasRange(mode);

  return slots
    .filter((slot) => slot.minute >= range.start && slot.minute < range.end)
    .sort((firstSlot, secondSlot) => firstSlot.minute - secondSlot.minute);
}

export function createCanvasSegments(
  slots: CanvasSlot[],
  mode: CanvasMode,
): CanvasSegment[] {
  const range = getCanvasRange(mode);
  const canvasSlots = getSlotsForCanvas(slots, mode);

  if (canvasSlots.length === 0) {
    return [];
  }

  const segments: CanvasSegment[] = [];
  let segmentStartSlot = canvasSlots[0];
  let previousSlot = canvasSlots[0];

  for (const slot of canvasSlots.slice(1)) {
    const isSameSegment =
      slot.minute === previousSlot.minute + 1 &&
      slot.color === previousSlot.color &&
      slot.state === previousSlot.state &&
      slot.taskId === previousSlot.taskId &&
      slot.blockId === previousSlot.blockId;

    if (!isSameSegment) {
      segments.push(createSegment(segmentStartSlot, previousSlot, range, mode));
      segmentStartSlot = slot;
    }

    previousSlot = slot;
  }

  segments.push(createSegment(segmentStartSlot, previousSlot, range, mode));

  return segments;
}

export function summarizeSlots(slots: CanvasSlot[]): CanvasSummary {
  const totalMinutes = slots.length;
  const whiteMinutes = countSlotsByState(slots, "white");
  const blackMinutes = countSlotsByState(slots, "black");
  const coloredMinutes = countSlotsByState(slots, "colored");

  return {
    totalMinutes,
    whiteMinutes,
    blackMinutes,
    coloredMinutes,
    whitePercent: getPercent(whiteMinutes, totalMinutes),
    blackPercent: getPercent(blackMinutes, totalMinutes),
    coloredPercent: getPercent(coloredMinutes, totalMinutes),
    colorUsage: getColorUsage(slots),
  };
}

export function summarizeCanvas(
  slots: CanvasSlot[],
  mode: CanvasMode,
): CanvasSummary {
  return summarizeSlots(getSlotsForCanvas(slots, mode));
}

export function getColorUsage(slots: CanvasSlot[]): ColorUsage[] {
  const usageMap = new Map<string, Omit<ColorUsage, "percent">>();

  for (const slot of slots) {
    const key = `${slot.state}:${slot.color}`;
    const currentUsage = usageMap.get(key);

    if (currentUsage) {
      currentUsage.minutes += 1;
    } else {
      usageMap.set(key, {
        color: slot.color,
        state: slot.state,
        minutes: 1,
      });
    }
  }

  return Array.from(usageMap.values())
    .map((usage) => ({
      ...usage,
      percent: getPercent(usage.minutes, slots.length),
    }))
    .sort((firstUsage, secondUsage) => {
      if (secondUsage.minutes !== firstUsage.minutes) {
        return secondUsage.minutes - firstUsage.minutes;
      }

      return firstUsage.color.localeCompare(secondUsage.color);
    });
}

function createSegment(
  startSlot: CanvasSlot,
  endSlot: CanvasSlot,
  range: CanvasRange,
  mode: CanvasMode,
): CanvasSegment {
  const startOffset = startSlot.minute - range.start;
  const endOffset = endSlot.minute - range.start + 1;

  return {
    id: `${mode}-${startSlot.minute}-${endSlot.minute + 1}-${startSlot.state}-${startSlot.color}-${startSlot.taskId ?? "none"}-${startSlot.blockId ?? "none"}`,
    startMinute: startSlot.minute,
    endMinute: endSlot.minute + 1,
    startOffset,
    endOffset,
    durationMinutes: endOffset - startOffset,
    color: startSlot.color,
    state: startSlot.state,
    taskId: startSlot.taskId,
    blockId: startSlot.blockId,
  };
}

function countSlotsByState(
  slots: CanvasSlot[],
  state: CanvasSlotState,
): number {
  return slots.filter((slot) => slot.state === state).length;
}

function getPercent(minutes: number, totalMinutes: number): number {
  if (totalMinutes === 0) {
    return 0;
  }

  return Math.round((minutes / totalMinutes) * 1000) / 10;
}
