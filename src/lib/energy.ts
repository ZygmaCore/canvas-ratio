import { expandMinuteRange } from "@/lib/blocks";
import { cellIndexToMinuteRange } from "@/lib/cells";
import { parseTimeToMinute, minuteToTime } from "@/lib/time";
import type { DayRecord, EnergyBlock, EnergyLevel } from "@/types/canvas";

export type EnergyBlockInput = {
  level: EnergyLevel;
  startTime: string;
  endTime: string;
  note?: string;
};

export type CellEnergy = {
  level: EnergyLevel | "unspecified";
  note?: string;
  blockId?: string;
};

export const ENERGY_LEVEL_LABELS: Record<EnergyLevel | "unspecified", string> = {
  high: "High energy",
  medium: "Medium energy",
  low: "Low energy",
  unspecified: "Energy unspecified",
};

const energyLevels = new Set<EnergyLevel>(["high", "medium", "low"]);

export function createEnergyBlock(input: EnergyBlockInput): EnergyBlock {
  const startMinute = parseTimeToMinute(input.startTime);
  const endMinute = parseTimeToMinute(input.endTime);

  if (startMinute === endMinute) {
    throw new Error("Energy start and end time must be different.");
  }

  const now = new Date().toISOString();

  return {
    id: createEnergyBlockId(),
    level: input.level,
    startTime: minuteToTime(startMinute),
    endTime: minuteToTime(endMinute),
    note: input.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function addEnergyBlock(day: DayRecord, block: EnergyBlock): DayRecord {
  return {
    ...day,
    energyBlocks: [...(day.energyBlocks ?? []), block],
    updatedAt: new Date().toISOString(),
  };
}

export function deleteEnergyBlock(
  day: DayRecord,
  energyBlockId: string,
): DayRecord {
  return {
    ...day,
    energyBlocks: (day.energyBlocks ?? []).filter(
      (block) => block.id !== energyBlockId,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function getEnergyForCell(
  day: DayRecord | null | undefined,
  cellIndex: number,
): CellEnergy {
  const blocks = day?.energyBlocks ?? [];

  if (blocks.length === 0) {
    return {
      level: "unspecified",
    };
  }

  const { startMinute, endMinute } = cellIndexToMinuteRange(cellIndex);
  const newestMatch = [...blocks]
    .filter((block) => energyBlockTouchesRange(block, startMinute, endMinute))
    .sort((first, second) =>
      getEnergyTimestamp(second).localeCompare(getEnergyTimestamp(first)),
    )[0];

  if (!newestMatch) {
    return {
      level: "unspecified",
    };
  }

  return {
    level: newestMatch.level,
    note: newestMatch.note,
    blockId: newestMatch.id,
  };
}

export function getEnergyByCellIndex(
  day: DayRecord | null | undefined,
): Map<number, CellEnergy> {
  return new Map(
    Array.from({ length: 48 }, (_, cellIndex) => [
      cellIndex,
      getEnergyForCell(day, cellIndex),
    ]),
  );
}

export function normalizeEnergyBlocks(raw: unknown): EnergyBlock[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(isPlainObject)
    .map(normalizeEnergyBlock)
    .filter((block): block is EnergyBlock => !!block);
}

function normalizeEnergyBlock(raw: Record<string, unknown>): EnergyBlock | null {
  const level = raw.level;
  const startTime = normalizeOptionalString(raw.startTime);
  const endTime = normalizeOptionalString(raw.endTime);

  if (!energyLevels.has(level as EnergyLevel) || !startTime || !endTime) {
    return null;
  }

  try {
    const startMinute = parseTimeToMinute(startTime);
    const endMinute = parseTimeToMinute(endTime);

    if (startMinute === endMinute) {
      return null;
    }

    const now = new Date().toISOString();

    return {
      id: normalizeOptionalString(raw.id) ?? createEnergyBlockId(),
      level: level as EnergyLevel,
      startTime: minuteToTime(startMinute),
      endTime: minuteToTime(endMinute),
      note: normalizeOptionalString(raw.note)?.trim() || undefined,
      createdAt: normalizeOptionalString(raw.createdAt) ?? now,
      updatedAt: normalizeOptionalString(raw.updatedAt) ?? now,
    };
  } catch {
    return null;
  }
}

function energyBlockTouchesRange(
  block: EnergyBlock,
  startMinute: number,
  endMinute: number,
): boolean {
  const blockMinutes = new Set(
    expandMinuteRange(
      parseTimeToMinute(block.startTime),
      parseTimeToMinute(block.endTime),
    ),
  );

  for (let minute = startMinute; minute < endMinute; minute += 1) {
    if (blockMinutes.has(minute)) {
      return true;
    }
  }

  return false;
}

function getEnergyTimestamp(block: EnergyBlock): string {
  return block.updatedAt || block.createdAt;
}

function createEnergyBlockId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `energy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
