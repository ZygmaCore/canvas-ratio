import { createEmptyDayRecord } from "@/lib/day";
import { CANVAS_PALETTE, PROJECT_COLORS, WHITE_CANVAS, BLACK_CANVAS } from "@/lib/palette";
import { createMigratedProjectId, validateProjectColor } from "@/lib/projects";
import { rebuildDaySlots } from "@/lib/rebuild";
import { createEmptySlots, MINUTES_PER_DAY } from "@/lib/time";
import type {
  CanvasSlot,
  CanvasSlotState,
  DayRecord,
  GeneratedImageRecord,
  JournalRecord,
  ProjectRecord,
  TargetCanvas,
  TaskInputMode,
  TaskRecord,
  TimeBlock,
} from "@/types/canvas";

export const DAY_STORAGE_PREFIX = "canvas-ratio:v1:";
export const SETTINGS_STORAGE_KEY = "canvas-ratio:settings";

type NormalizedTask = TaskRecord & {
  projectName?: string;
  color?: string;
};

export type DayRecordImportResult =
  | { ok: true; day: DayRecord }
  | { ok: false; message: string };

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const taskInputModes = new Set<TaskInputMode>([
  "manual-cell",
  "ratio",
  "time-range",
  "duration",
]);
const targetCanvases = new Set<TargetCanvas>(["am", "pm", "full"]);
const slotStates = new Set<CanvasSlotState>(["white", "black", "colored"]);

export function getDayStorageKey(dateKey: string): string {
  return `${DAY_STORAGE_PREFIX}${dateKey}`;
}

export function loadDayRecord(dateKey: string): DayRecord | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawRecord = storage.getItem(getDayStorageKey(dateKey));

  if (!rawRecord) {
    return null;
  }

  try {
    const parsedRecord = JSON.parse(rawRecord);
    return normalizeDayRecordForStorage(parsedRecord, dateKey);
  } catch {
    return null;
  }
}

export function saveDayRecord(day: DayRecord): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(getDayStorageKey(day.date), JSON.stringify(day));
}

export function deleteDayRecord(dateKey: string): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(getDayStorageKey(dateKey));
}

export function ensureDayRecord(dateKey: string): DayRecord {
  const storedRecord = loadDayRecord(dateKey);

  if (storedRecord) {
    saveDayRecord(storedRecord);
    return storedRecord;
  }

  const emptyRecord = createEmptyDayRecord(dateKey);
  saveDayRecord(emptyRecord);

  return emptyRecord;
}

export function getCanvasRatioStorageKeys(): string[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  return Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => !!key && key.startsWith(DAY_STORAGE_PREFIX))
    .sort();
}

export function getDateFromDayStorageKey(storageKey: string): string | null {
  if (!storageKey.startsWith(DAY_STORAGE_PREFIX)) {
    return null;
  }

  const dateKey = storageKey.slice(DAY_STORAGE_PREFIX.length);

  return dateKeyPattern.test(dateKey) ? dateKey : null;
}

export function loadAllDayRecords(): DayRecord[] {
  return getCanvasRatioStorageKeys()
    .map((storageKey) => getDateFromDayStorageKey(storageKey))
    .filter((dateKey): dateKey is string => !!dateKey)
    .map((dateKey) => loadDayRecord(dateKey))
    .filter((day): day is DayRecord => !!day)
    .sort((firstDay, secondDay) => firstDay.date.localeCompare(secondDay.date));
}

export function parseDayRecordForImport(
  record: unknown,
  expectedDateKey?: string,
): DayRecordImportResult {
  const day = normalizeDayRecordForStorage(record, expectedDateKey);

  if (!day) {
    return {
      ok: false,
      message: "This file does not contain a valid Canvas Ratio day record.",
    };
  }

  return {
    ok: true,
    day,
  };
}

export function normalizeDayRecordForStorage(
  record: unknown,
  expectedDateKey?: string,
): DayRecord | null {
  try {
    if (!isPlainObject(record)) {
      return null;
    }

    const recordDate = normalizeDateKey(record.date);
    const date = recordDate ?? expectedDateKey;

    if (!date || (expectedDateKey && date !== expectedDateKey)) {
      return null;
    }

    const now = new Date().toISOString();
    const createdAt = normalizeOptionalString(record.createdAt) ?? now;
    const updatedAt = normalizeOptionalString(record.updatedAt) ?? createdAt;
    const rawProjects = Array.isArray(record.projects) ? record.projects : [];
    const rawTasks = Array.isArray(record.tasks) ? record.tasks : [];
    const sleepBlocks = normalizeStoredBlocks(record.sleepBlocks, "sleep");
    const randomEventBlocks = normalizeStoredBlocks(
      record.randomEventBlocks,
      "random-event",
    );
    const migration = migrateProjectsAndTasks({
      createdAt,
      rawProjects,
      rawTasks,
    });
    const normalizedSlots = normalizeStoredSlots(
      record.slots,
      migration.tasks,
    );
    const baseDay: DayRecord = {
      date,
      slots: normalizedSlots ?? createEmptySlots(),
      projects: migration.projects,
      sleepBlocks,
      randomEventBlocks,
      tasks: migration.tasks,
      journal: normalizeStoredJournal(record.journal, date),
      generatedImage: normalizeStoredGeneratedImage(record.generatedImage, date),
      locked: record.locked === true,
      createdAt,
      updatedAt,
    };

    if (!normalizedSlots) {
      return rebuildDaySlots(baseDay);
    }

    return {
      ...baseDay,
      tasks: updateTaskEffectivePaintedMinutes(
        baseDay.tasks,
        normalizedSlots,
      ),
    };
  } catch {
    return null;
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeStoredJournal(
  journal: unknown,
  fallbackDate: string,
): JournalRecord | undefined {
  if (!isPlainObject(journal)) {
    return undefined;
  }

  const content = normalizeOptionalString(journal.content);
  const createdAt = normalizeOptionalString(journal.createdAt);

  if (!content || !createdAt) {
    return undefined;
  }

  return {
    id: normalizeOptionalString(journal.id) ?? `journal-${fallbackDate}`,
    date: normalizeDateKey(journal.date) ?? fallbackDate,
    content,
    summary: normalizeOptionalString(journal.summary),
    source: journal.source === "ai" ? "ai" : "mock",
    model: normalizeOptionalString(journal.model),
    warning: normalizeOptionalString(journal.warning),
    createdAt,
    inputSnapshot: isPlainObject(journal.inputSnapshot)
      ? (journal.inputSnapshot as unknown as JournalRecord["inputSnapshot"])
      : undefined,
  };
}

function normalizeStoredGeneratedImage(
  generatedImage: unknown,
  fallbackDate: string,
): GeneratedImageRecord | undefined {
  if (!isPlainObject(generatedImage)) {
    return undefined;
  }

  const dataUrl = normalizeOptionalString(generatedImage.dataUrl);
  const imageUrl = normalizeOptionalString(generatedImage.imageUrl);
  const prompt = normalizeOptionalString(generatedImage.prompt) ?? "";
  const createdAt = normalizeOptionalString(generatedImage.createdAt);

  if ((!dataUrl && !imageUrl && !prompt) || !createdAt) {
    return undefined;
  }

  return {
    id: normalizeOptionalString(generatedImage.id) ?? `image-${fallbackDate}`,
    date: normalizeDateKey(generatedImage.date) ?? fallbackDate,
    imageUrl,
    dataUrl,
    prompt,
    model: normalizeOptionalString(generatedImage.model),
    source: generatedImage.source === "ai" ? "ai" : "mock",
    warning: normalizeOptionalString(generatedImage.warning),
    palette: normalizeStoredPalette(generatedImage.palette),
    createdAt,
    inputSnapshot: isPlainObject(generatedImage.inputSnapshot)
      ? (generatedImage.inputSnapshot as unknown as GeneratedImageRecord["inputSnapshot"])
      : undefined,
  };
}

function migrateProjectsAndTasks({
  createdAt,
  rawProjects,
  rawTasks,
}: {
  createdAt: string;
  rawProjects: unknown[];
  rawTasks: unknown[];
}): {
  projects: ProjectRecord[];
  tasks: NormalizedTask[];
} {
  const hadProjects = rawProjects.length > 0;
  const projects = assignUniqueProjectColors(
    rawProjects
      .filter(isPlainObject)
      .map((project) => normalizeStoredProject(project, createdAt))
      .filter((project): project is ProjectRecord => !!project),
  );
  const migratedProjectMap = new Map<string, ProjectRecord>();

  for (const project of projects) {
    migratedProjectMap.set(project.id, project);
  }

  const tasks = rawTasks
    .filter(isPlainObject)
    .map((rawTask) =>
      normalizeStoredTask(rawTask, {
        createdAt,
        projects,
        migratedProjectMap,
      }),
    )
    .filter((task): task is NormalizedTask => !!task);

  if (!hadProjects && projects.length > 0) {
    normalizeMigratedRatios(projects);
  }

  return {
    projects,
    tasks,
  };
}

function normalizeStoredProject(
  project: Record<string, unknown>,
  fallbackCreatedAt: string,
): ProjectRecord | null {
  const name = (
    normalizeOptionalString(project.name) ??
    normalizeOptionalString(project.projectName) ??
    normalizeOptionalString(project.title)
  )?.trim();

  if (!name) {
    return null;
  }

  const color = validateStoredProjectColor(project.color);
  const id =
    normalizeOptionalString(project.id) ?? createMigratedProjectId(name, color);

  return {
    id,
    name,
    color,
    ratio: normalizeProjectRatio(project.ratio),
    description: normalizeOptionalString(project.description)?.trim() || undefined,
    createdAt: normalizeOptionalString(project.createdAt) ?? fallbackCreatedAt,
  };
}

function normalizeStoredTask(
  task: Record<string, unknown>,
  context: {
    createdAt: string;
    projects: ProjectRecord[];
    migratedProjectMap: Map<string, ProjectRecord>;
  },
): NormalizedTask | null {
  const taskName = (
    normalizeOptionalString(task.taskName) ??
    normalizeOptionalString(task.name) ??
    normalizeOptionalString(task.title)
  )?.trim();

  if (!taskName) {
    return null;
  }

  const projectId = normalizeOptionalString(task.projectId);
  const existingProject = projectId
    ? context.migratedProjectMap.get(projectId)
    : undefined;
  const project = existingProject ?? getOrCreateMigratedProject(task, context);
  const assignedMinutes = normalizeAssignedMinutes(
    task.assignedMinutes ?? task.minutes,
  );
  const inputMode = normalizeTaskInputMode(task.inputMode);
  const targetCanvas = normalizeTargetCanvas(task.targetCanvas);

  return {
    id: normalizeOptionalString(task.id) ?? createTaskId(),
    projectId: project.id,
    projectName:
      normalizeOptionalString(task.projectName)?.trim() || project.name,
    taskName,
    color: validateStoredProjectColor(task.color ?? project.color),
    inputMode,
    targetCanvas,
    assignedMinutes,
    effectivePaintedMinutes: normalizePositiveInteger(
      task.effectivePaintedMinutes,
    ),
    ratio: normalizeOptionalRatio(task.ratio),
    startMinute: normalizeOptionalMinute(task.startMinute),
    endMinute: normalizeOptionalMinute(task.endMinute),
    durationMinutes:
      inputMode === "duration"
        ? normalizeStoredDuration(task.durationMinutes, assignedMinutes)
        : normalizePositiveInteger(task.durationMinutes),
    description: normalizeOptionalString(task.description)?.trim() || undefined,
    createdAt: normalizeOptionalString(task.createdAt) ?? context.createdAt,
  };
}

function getOrCreateMigratedProject(
  task: Record<string, unknown>,
  context: {
    createdAt: string;
    projects: ProjectRecord[];
    migratedProjectMap: Map<string, ProjectRecord>;
  },
): ProjectRecord {
  const name =
    normalizeOptionalString(task.projectName)?.trim() || "Untitled Project";
  const color = validateStoredProjectColor(task.color);
  const id = createMigratedProjectId(name, color);
  const existingProject = context.migratedProjectMap.get(id);

  if (existingProject) {
    return existingProject;
  }

  const project: ProjectRecord = {
    id,
    name,
    color: getNextAvailableProjectColor(context.projects, color),
    ratio: 1,
    createdAt: context.createdAt,
  };

  context.migratedProjectMap.set(project.id, project);
  context.projects.push(project);

  return project;
}

function normalizeStoredBlocks(
  blocks: unknown,
  type: TimeBlock["type"],
): TimeBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter(isPlainObject)
    .map((block) => normalizeStoredBlock(block, type))
    .filter((block): block is TimeBlock => !!block);
}

function normalizeStoredBlock(
  block: Record<string, unknown>,
  type: TimeBlock["type"],
): TimeBlock | null {
  const startMinute = normalizeOptionalMinute(block.startMinute);
  const endMinute = normalizeOptionalMinute(block.endMinute);

  if (
    typeof startMinute !== "number" ||
    typeof endMinute !== "number" ||
    startMinute === endMinute
  ) {
    return null;
  }

  const title =
    normalizeOptionalString(block.title)?.trim() ||
    (type === "sleep" ? "Sleep" : "Random Event");

  return {
    id: normalizeOptionalString(block.id) ?? createBlockId(),
    type,
    title,
    startMinute,
    endMinute,
    color: BLACK_CANVAS.hex,
    description: normalizeOptionalString(block.description)?.trim() || undefined,
  };
}

function normalizeStoredSlots(
  slots: unknown,
  tasks: NormalizedTask[],
): CanvasSlot[] | null {
  if (!Array.isArray(slots) || slots.length !== MINUTES_PER_DAY) {
    return null;
  }

  const taskColorById = new Map(
    tasks.map((task) => [task.id, validateStoredProjectColor(task.color)]),
  );

  return slots.map((slot, minute) => {
    if (!isPlainObject(slot)) {
      return createWhiteSlot(minute);
    }

    const state = slotStates.has(slot.state as CanvasSlotState)
      ? (slot.state as CanvasSlotState)
      : "white";

    if (state === "black") {
      return {
        minute,
        state,
        color: BLACK_CANVAS.hex,
        blockId: normalizeOptionalString(slot.blockId),
      };
    }

    if (state === "colored") {
      const taskId = normalizeOptionalString(slot.taskId);
      const fallbackColor =
        (taskId ? taskColorById.get(taskId) : undefined) ?? PROJECT_COLORS[0].hex;

      return {
        minute,
        state,
        color: validateStoredProjectColor(slot.color, fallbackColor),
        taskId,
      };
    }

    return createWhiteSlot(minute);
  });
}

function updateTaskEffectivePaintedMinutes(
  tasks: NormalizedTask[],
  slots: CanvasSlot[],
): NormalizedTask[] {
  return tasks.map((task) => ({
    ...task,
    effectivePaintedMinutes: slots.filter(
      (slot) => slot.state === "colored" && slot.taskId === task.id,
    ).length,
  }));
}

function normalizeMigratedRatios(projects: ProjectRecord[]): void {
  if (projects.length === 0) {
    return;
  }

  const currentTotal = projects.reduce(
    (total, project) => total + project.ratio,
    0,
  );

  if (currentTotal === 100) {
    return;
  }

  const baseRatio = Math.floor(100 / projects.length);
  let remainingRatio = 100 - baseRatio * projects.length;

  for (const project of projects) {
    project.ratio = baseRatio + (remainingRatio > 0 ? 1 : 0);
    remainingRatio -= 1;
  }
}

function assignUniqueProjectColors(projects: ProjectRecord[]): ProjectRecord[] {
  const usedColors = new Set<string>();

  return projects.map((project) => {
    const color = getNextAvailableProjectColor(projects, project.color, usedColors);
    usedColors.add(color);

    return {
      ...project,
      color,
    };
  });
}

function getNextAvailableProjectColor(
  projects: ProjectRecord[],
  preferredColor: string,
  usedColors = new Set(projects.map((project) => project.color)),
): string {
  if (!usedColors.has(preferredColor)) {
    return preferredColor;
  }

  return (
    PROJECT_COLORS.find((color) => !usedColors.has(color.hex))?.hex ??
    preferredColor
  );
}

function validateStoredProjectColor(
  color?: unknown,
  fallbackColor: string = PROJECT_COLORS[0].hex,
): string {
  if (typeof color !== "string") {
    return fallbackColor;
  }

  try {
    return validateProjectColor(color);
  } catch {
    return fallbackColor;
  }
}

function normalizeStoredPalette(palette: unknown): string[] {
  if (!Array.isArray(palette)) {
    return CANVAS_PALETTE.map((color) => color.hex);
  }

  const allowedColors = new Set<string>(CANVAS_PALETTE.map((color) => color.hex));
  const normalizedPalette = palette
    .filter((color): color is string => typeof color === "string")
    .map((color) => color.toUpperCase())
    .filter((color) => allowedColors.has(color));

  return normalizedPalette.length > 0
    ? normalizedPalette
    : CANVAS_PALETTE.map((color) => color.hex);
}

function normalizeProjectRatio(ratio: unknown): number {
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) {
    return 1;
  }

  return Math.min(100, Math.max(1, Math.round(ratio)));
}

function normalizeOptionalRatio(ratio: unknown): number | undefined {
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) {
    return undefined;
  }

  return Math.min(100, Math.max(1, ratio));
}

function normalizeTaskInputMode(inputMode: unknown): TaskInputMode {
  return taskInputModes.has(inputMode as TaskInputMode)
    ? (inputMode as TaskInputMode)
    : "manual-cell";
}

function normalizeTargetCanvas(targetCanvas: unknown): TargetCanvas {
  return targetCanvases.has(targetCanvas as TargetCanvas)
    ? (targetCanvas as TargetCanvas)
    : "full";
}

function normalizeAssignedMinutes(assignedMinutes: unknown): number[] {
  if (!Array.isArray(assignedMinutes)) {
    return [];
  }

  return Array.from(
    new Set(assignedMinutes.filter(isMinuteOfDay)),
  ).sort((firstMinute, secondMinute) => firstMinute - secondMinute);
}

function normalizeOptionalMinute(minute: unknown): number | undefined {
  return isMinuteOfDay(minute) ? minute : undefined;
}

function normalizePositiveInteger(value: unknown): number | undefined {
  if (!Number.isInteger(value) || typeof value !== "number" || value <= 0) {
    return undefined;
  }

  return value;
}

function normalizeStoredDuration(
  durationMinutes: unknown,
  assignedMinutes: number[],
): number | undefined {
  const assignedCellDuration = assignedCellsFromMinutes(assignedMinutes) * 30;

  if (assignedCellDuration > 0) {
    return assignedCellDuration;
  }

  return normalizePositiveInteger(durationMinutes);
}

function normalizeDateKey(value: unknown): string | undefined {
  return typeof value === "string" && dateKeyPattern.test(value)
    ? value
    : undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isMinuteOfDay(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < MINUTES_PER_DAY
  );
}

function assignedCellsFromMinutes(minutes: number[]): number {
  return new Set(minutes.map((minute) => Math.floor(minute / 30))).size;
}

function createWhiteSlot(minute: number): CanvasSlot {
  return {
    minute,
    state: "white",
    color: WHITE_CANVAS.hex,
  };
}

function createTaskId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createBlockId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
