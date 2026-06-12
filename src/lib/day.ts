import { createEmptySlots, getTodayDateKey } from "@/lib/time";
import type { DayRecord } from "@/types/canvas";

export type DayStatus = "today" | "past" | "future";

export function createEmptyDayRecord(dateKey: string): DayRecord {
  const now = new Date().toISOString();

  return {
    date: dateKey,
    slots: createEmptySlots(),
    projects: [],
    sleepBlocks: [],
    randomEventBlocks: [],
    tasks: [],
    taskDump: [],
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getDayStatus(dateKey: string): DayStatus {
  const todayDateKey = getTodayDateKey();

  if (dateKey < todayDateKey) {
    return "past";
  }

  if (dateKey > todayDateKey) {
    return "future";
  }

  return "today";
}

export function isDayEditable(
  dateKey: string,
  day?: DayRecord | null,
): boolean {
  return getDayStatus(dateKey) === "today" && day?.locked !== true;
}
