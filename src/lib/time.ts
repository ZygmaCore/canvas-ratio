import { WHITE_CANVAS } from "@/lib/palette";
import type { CanvasSlot } from "@/types/canvas";

export const MINUTES_PER_DAY = 1440;
export const AM_START_MINUTE = 0;
export const AM_END_MINUTE = 720;
export const PM_START_MINUTE = 720;
export const PM_END_MINUTE = 1440;

export function parseTimeToMinute(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);

  if (!match) {
    throw new Error("Time must use HH:mm format.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    throw new Error("Time must be between 00:00 and 23:59.");
  }

  return hours * 60 + minutes;
}

export function minuteToTime(minute: number): string {
  validateMinuteOfDay(minute);

  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function validateMinuteOfDay(minute: number): void {
  if (!Number.isInteger(minute) || minute < 0 || minute >= MINUTES_PER_DAY) {
    throw new Error("Minute must be an integer between 0 and 1439.");
  }
}

export function formatMinuteRange(
  startMinute: number,
  endMinute: number,
): string {
  validateMinuteOfDay(startMinute);
  validateMinuteOfDay(endMinute);

  return `${minuteToTime(startMinute)}–${minuteToTime(endMinute)}`;
}

export function getTodayDateKey(): string {
  return createDateKey(new Date());
}

export function isToday(dateKey: string): boolean {
  return dateKey === getTodayDateKey();
}

export function isPastDate(dateKey: string): boolean {
  return dateKey < getTodayDateKey();
}

export function isFutureDate(dateKey: string): boolean {
  return dateKey > getTodayDateKey();
}

export function createEmptySlots(): CanvasSlot[] {
  return Array.from({ length: MINUTES_PER_DAY }, (_, minute) => ({
    minute,
    state: "white",
    color: WHITE_CANVAS.hex,
  }));
}

function createDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
