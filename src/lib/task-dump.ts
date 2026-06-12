import { getWhiteCellIndices } from "@/lib/cells";
import type { DayRecord, TaskDumpItem } from "@/types/canvas";

export type TaskDumpItemInput = {
  taskName: string;
  note?: string;
  blockCount: number;
};

export type TaskDumpSummary = {
  freeBlocks: number;
  dumpedBlocks: number;
  availableDumpBlocks: number;
  overageBlocks: number;
  itemCount: number;
  isValid: boolean;
};

export function getTaskDumpItems(day?: DayRecord | null): TaskDumpItem[] {
  return Array.isArray(day?.taskDump) ? day.taskDump : [];
}

export function createTaskDumpItem(input: TaskDumpItemInput): TaskDumpItem {
  const now = new Date().toISOString();

  return {
    id: createTaskDumpId(),
    taskName: validateTaskDumpName(input.taskName),
    note: normalizeNote(input.note),
    blockCount: validateBlockCount(input.blockCount),
    createdAt: now,
    updatedAt: now,
  };
}

export function getTaskDumpSummary(day?: DayRecord | null): TaskDumpSummary {
  const freeBlocks = day ? getWhiteCellIndices(day.slots).length : 0;
  const dumpedBlocks = getTaskDumpItems(day).reduce(
    (total, item) => total + item.blockCount,
    0,
  );
  const availableDumpBlocks = freeBlocks - dumpedBlocks;
  const overageBlocks = Math.max(0, dumpedBlocks - freeBlocks);

  return {
    freeBlocks,
    dumpedBlocks,
    availableDumpBlocks,
    overageBlocks,
    itemCount: getTaskDumpItems(day).length,
    isValid: dumpedBlocks <= freeBlocks,
  };
}

export function addTaskDumpItem(
  day: DayRecord,
  input: TaskDumpItemInput,
): DayRecord {
  const item = createTaskDumpItem(input);

  validateTaskDumpCapacity(day, item.blockCount);

  return updateDayTaskDump(day, [...getTaskDumpItems(day), item]);
}

export function updateTaskDumpItem(
  day: DayRecord,
  itemId: string,
  input: TaskDumpItemInput,
): DayRecord {
  const items = getTaskDumpItems(day);
  const currentItem = items.find((item) => item.id === itemId);

  if (!currentItem) {
    return day;
  }

  const nextBlockCount = validateBlockCount(input.blockCount);
  const currentDumpedBlocks = items.reduce(
    (total, item) => total + item.blockCount,
    0,
  );
  const nextDumpedBlocks =
    currentDumpedBlocks - currentItem.blockCount + nextBlockCount;
  const freeBlocks = getWhiteCellIndices(day.slots).length;

  if (
    nextDumpedBlocks > freeBlocks &&
    nextDumpedBlocks >= currentDumpedBlocks
  ) {
    throw new Error("Task Dump cannot exceed current free blocks.");
  }

  return updateDayTaskDump(
    day,
    items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            taskName: validateTaskDumpName(input.taskName),
            note: normalizeNote(input.note),
            blockCount: nextBlockCount,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  );
}

export function deleteTaskDumpItem(day: DayRecord, itemId: string): DayRecord {
  return updateDayTaskDump(
    day,
    getTaskDumpItems(day).filter((item) => item.id !== itemId),
  );
}

export function clearTaskDump(day: DayRecord): DayRecord {
  return updateDayTaskDump(day, []);
}

export function normalizeTaskDumpItems(rawItems: unknown): TaskDumpItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .filter(isPlainObject)
    .map(normalizeTaskDumpItem)
    .filter((item): item is TaskDumpItem => !!item);
}

function updateDayTaskDump(
  day: DayRecord,
  taskDump: TaskDumpItem[],
): DayRecord {
  return {
    ...day,
    taskDump,
    updatedAt: new Date().toISOString(),
  };
}

function validateTaskDumpCapacity(day: DayRecord, blockCount: number): void {
  const summary = getTaskDumpSummary(day);

  if (summary.freeBlocks === 0) {
    throw new Error("No free blocks left on this canvas.");
  }

  if (summary.dumpedBlocks + blockCount > summary.freeBlocks) {
    throw new Error("Task Dump cannot exceed current free blocks.");
  }
}

function normalizeTaskDumpItem(
  item: Record<string, unknown>,
): TaskDumpItem | null {
  const taskName =
    normalizeOptionalString(item.taskName)?.trim() ||
    normalizeOptionalString(item.name)?.trim() ||
    normalizeOptionalString(item.title)?.trim();

  if (!taskName) {
    return null;
  }

  const blockCount = normalizeBlockCount(item.blockCount);
  const now = new Date().toISOString();

  return {
    id: normalizeOptionalString(item.id) ?? createTaskDumpId(),
    taskName,
    note:
      normalizeOptionalString(item.note)?.trim() ||
      normalizeOptionalString(item.description)?.trim() ||
      undefined,
    blockCount,
    createdAt: normalizeOptionalString(item.createdAt) ?? now,
    updatedAt:
      normalizeOptionalString(item.updatedAt) ??
      normalizeOptionalString(item.createdAt) ??
      now,
  };
}

function validateTaskDumpName(taskName: string): string {
  const normalizedName = taskName.trim();

  if (!normalizedName) {
    throw new Error("Task name is required.");
  }

  return normalizedName;
}

function validateBlockCount(blockCount: number): number {
  if (!Number.isInteger(blockCount) || blockCount < 1 || blockCount > 48) {
    throw new Error("Blocks must be a whole number from 1 to 48.");
  }

  return blockCount;
}

function normalizeBlockCount(blockCount: unknown): number {
  if (!Number.isInteger(blockCount) || typeof blockCount !== "number") {
    return 1;
  }

  return Math.min(48, Math.max(1, blockCount));
}

function normalizeNote(note: string | undefined): string | undefined {
  return note?.trim() || undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createTaskDumpId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-dump-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
