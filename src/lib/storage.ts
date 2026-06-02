import { createEmptyDayRecord } from "@/lib/day";
import { PROJECT_COLORS } from "@/lib/palette";
import { createMigratedProjectId, validateProjectColor } from "@/lib/projects";
import { MINUTES_PER_DAY } from "@/lib/time";
import type {
  DayRecord,
  JournalRecord,
  ProjectRecord,
  TaskRecord,
} from "@/types/canvas";

const DAY_STORAGE_PREFIX = "canvas-ratio:v1:";

export const SETTINGS_STORAGE_KEY = "canvas-ratio:settings";

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

    if (!isStoredDayRecord(parsedRecord, dateKey)) {
      return null;
    }

    return normalizeStoredDayRecord(parsedRecord);
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

function isStoredDayRecord(
  record: unknown,
  dateKey: string,
): record is DayRecord {
  if (!record || typeof record !== "object") {
    return false;
  }

  const possibleRecord = record as Partial<DayRecord>;

  return (
    possibleRecord.date === dateKey &&
    Array.isArray(possibleRecord.slots) &&
    possibleRecord.slots.length === MINUTES_PER_DAY &&
    Array.isArray(possibleRecord.sleepBlocks) &&
    Array.isArray(possibleRecord.randomEventBlocks) &&
    Array.isArray(possibleRecord.tasks) &&
    typeof possibleRecord.createdAt === "string" &&
    typeof possibleRecord.updatedAt === "string"
  );
}

function normalizeStoredDayRecord(record: DayRecord): DayRecord {
  const migration = migrateProjectsAndTasks(record);

  return {
    ...record,
    projects: migration.projects,
    tasks: migration.tasks,
    journal: normalizeStoredJournal(record.journal),
    locked: record.locked ?? false,
  };
}

function normalizeStoredJournal(
  journal: JournalRecord | undefined,
): JournalRecord | undefined {
  if (!journal || typeof journal !== "object") {
    return undefined;
  }

  const possibleJournal = journal as Partial<JournalRecord>;

  if (
    typeof possibleJournal.id !== "string" ||
    typeof possibleJournal.date !== "string" ||
    typeof possibleJournal.content !== "string" ||
    typeof possibleJournal.createdAt !== "string"
  ) {
    return undefined;
  }

  return {
    ...possibleJournal,
    id: possibleJournal.id,
    date: possibleJournal.date,
    content: possibleJournal.content,
    source: possibleJournal.source === "ai" ? "ai" : "mock",
    model:
      possibleJournal.model ??
      (possibleJournal.source ? undefined : "legacy-journal"),
    createdAt: possibleJournal.createdAt,
  };
}

function migrateProjectsAndTasks(day: DayRecord): {
  projects: ProjectRecord[];
  tasks: TaskRecord[];
} {
  const rawProjectValue = (day as Partial<DayRecord>).projects;
  const hadProjects = Array.isArray(rawProjectValue);
  const rawProjects = hadProjects ? rawProjectValue : [];
  const migratedProjectMap = new Map<string, ProjectRecord>();
  const projects: ProjectRecord[] = rawProjects
    .filter((project) => isUsableProject(project))
    .map((project) => ({
      ...project,
      color: validateStoredProjectColor(project.color),
      ratio: normalizeProjectRatio(project.ratio),
      createdAt: project.createdAt || day.createdAt,
    }));

  for (const project of projects) {
    migratedProjectMap.set(project.id, project);
  }

  const tasks = (day.tasks ?? []).map((rawTask) => {
    const task = rawTask as TaskRecord & {
      projectId?: string;
      projectName?: string;
      color?: string;
    };

    if (task.projectId && migratedProjectMap.has(task.projectId)) {
      return {
        ...task,
        assignedMinutes: Array.isArray(task.assignedMinutes)
          ? task.assignedMinutes
          : [],
      } as TaskRecord;
    }

    const migratedProject = getOrCreateMigratedProject(task, day.createdAt);

    if (!migratedProjectMap.has(migratedProject.id)) {
      migratedProjectMap.set(migratedProject.id, migratedProject);
      projects.push(migratedProject);
    }

    return {
      ...task,
      projectId: migratedProject.id,
      projectName: task.projectName ?? migratedProject.name,
      color: task.color ?? migratedProject.color,
      assignedMinutes: Array.isArray(task.assignedMinutes)
        ? task.assignedMinutes
        : [],
    } as TaskRecord;
  });

  if (!hadProjects && projects.length > 0) {
    normalizeMigratedRatios(projects);
  }

  return {
    projects,
    tasks,
  };
}

function getOrCreateMigratedProject(
  task: TaskRecord & { projectName?: string; color?: string },
  createdAt: string,
): ProjectRecord {
  const name = task.projectName?.trim() || "Untitled Project";
  const color = validateStoredProjectColor(task.color);

  return {
    id: createMigratedProjectId(name, color),
    name,
    color,
    ratio: 1,
    createdAt,
  };
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

function isUsableProject(project: ProjectRecord): project is ProjectRecord {
  return (
    project &&
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.color === "string"
  );
}

function validateStoredProjectColor(color?: string): string {
  if (!color) {
    return PROJECT_COLORS[0].hex;
  }

  try {
    return validateProjectColor(color);
  } catch {
    return PROJECT_COLORS[0].hex;
  }
}

function normalizeProjectRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 100) {
    return 1;
  }

  return ratio;
}
