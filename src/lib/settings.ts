import { PROJECT_COLORS } from "@/lib/palette";
import type { ProjectRecord } from "@/types/canvas";

export const SETTINGS_STORAGE_KEY = "canvas-ratio:settings";

export type CanvasSettings = {
  projects: ProjectRecord[];
  onboardingSeen?: boolean;
  updatedAt: string;
};

export type ProjectInput = {
  id?: string;
  name: string;
  ratio: number;
  color: string;
  archived?: boolean;
};

type RatioInput = Record<string, number>;

export function getDefaultSettings(): CanvasSettings {
  const now = new Date().toISOString();

  return {
    projects: [],
    updatedAt: now,
  };
}

export function loadSettings(): CanvasSettings {
  const storage = getStorage();

  if (!storage) {
    return getDefaultSettings();
  }

  const rawSettings = storage.getItem(SETTINGS_STORAGE_KEY);

  if (!rawSettings) {
    const defaultSettings = getDefaultSettings();
    saveSettings(defaultSettings);
    return defaultSettings;
  }

  try {
    const settings = normalizeSettings(JSON.parse(rawSettings));
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return settings;
  } catch {
    const defaultSettings = getDefaultSettings();
    saveSettings(defaultSettings);
    return defaultSettings;
  }
}

export function saveSettings(settings: CanvasSettings): CanvasSettings {
  const normalizedSettings = normalizeSettings(settings, {
    allowEmptyProjects: true,
  });
  const storage = getStorage();

  if (storage) {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
  }

  return normalizedSettings;
}

export function normalizeSettings(
  raw: unknown,
  options: { allowEmptyProjects?: boolean } = {},
): CanvasSettings {
  const now = new Date().toISOString();
  const hasProjectList = isPlainObject(raw) && Array.isArray(raw.projects);
  const rawProjects = getRawProjects(raw);
  const projects = rawProjects
    .filter(isPlainObject)
    .map((project, index) => normalizeSettingsProject(project, index, now))
    .filter((project): project is ProjectRecord => !!project);

  const normalizedProjects =
    projects.length > 0 || options.allowEmptyProjects || hasProjectList
      ? dedupeProjectIds(projects).sort(compareProjects)
      : getDefaultSettings().projects;

  return {
    projects: normalizedProjects.map((project, index) => ({
      ...project,
      order: Number.isFinite(project.order) ? project.order : index,
    })),
    onboardingSeen: isPlainObject(raw) ? raw.onboardingSeen === true : undefined,
    updatedAt: isPlainObject(raw)
      ? normalizeOptionalString(raw.updatedAt) ?? now
      : now,
  };
}

export function getGlobalProjects(): ProjectRecord[] {
  return loadSettings().projects;
}

export function getActiveProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return projects.filter((project) => !project.archived).sort(compareProjects);
}

export function updateProjectRatios(ratios: RatioInput): CanvasSettings {
  const currentSettings = loadSettings();
  const now = new Date().toISOString();

  return saveSettings({
    ...currentSettings,
    projects: currentSettings.projects.map((project) => {
      const nextRatio = ratios[project.id];

      return {
        ...project,
        ratio:
          typeof nextRatio === "number"
            ? normalizeProjectRatio(nextRatio, project.ratio)
            : project.ratio,
        updatedAt: now,
      };
    }),
    updatedAt: now,
  });
}

export function createProjectSetting(
  input: ProjectInput,
  existingProjects: ProjectRecord[] = [],
): ProjectRecord {
  const now = new Date().toISOString();
  const id = input.id?.trim() || createProjectId(input.name);
  const usedOrders = existingProjects.map((project) => project.order ?? 0);
  const nextOrder = usedOrders.length > 0 ? Math.max(...usedOrders) + 1 : 0;

  return {
    id,
    name: normalizeProjectName(input.name),
    ratio: normalizeProjectRatio(input.ratio, 0),
    color: normalizeProjectColor(input.color),
    order: nextOrder,
    archived: input.archived === true,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeGlobalProjectId(
  projectId?: string,
  projectName?: string,
): string | null {
  if (projectId?.trim()) {
    return projectId.trim();
  }

  if (!projectName?.trim()) {
    return null;
  }

  return normalizeLegacyProjectName(projectName);
}

export function normalizeLegacyProjectName(projectName?: string): string | null {
  if (!projectName?.trim()) {
    return null;
  }

  const normalizedCandidate = slugify(projectName);

  if (
    normalizedCandidate === "academic" ||
    normalizedCandidate === "school" ||
    normalizedCandidate.includes("academic") ||
    normalizedCandidate.includes("school") ||
    normalizedCandidate.includes("study")
  ) {
    return "academic";
  }

  if (
    normalizedCandidate === "professional" ||
    normalizedCandidate === "work" ||
    normalizedCandidate.includes("professional") ||
    normalizedCandidate.includes("work") ||
    normalizedCandidate.includes("career") ||
    normalizedCandidate.includes("business")
  ) {
    return "professional";
  }

  if (
    normalizedCandidate === "personal" ||
    normalizedCandidate.includes("personal") ||
    normalizedCandidate.includes("life") ||
    normalizedCandidate.includes("home")
  ) {
    return "personal";
  }

  return null;
}

function normalizeSettingsProject(
  rawProject: Record<string, unknown>,
  index: number,
  fallbackTime: string,
): ProjectRecord | null {
  const name = normalizeOptionalString(rawProject.name)?.trim();

  if (!name) {
    return null;
  }

  const id =
    normalizeOptionalString(rawProject.id)?.trim() ||
    normalizeLegacyProjectName(name) ||
    createProjectId(name);

  return {
    id,
    name: normalizeProjectName(name),
    color: normalizeProjectColor(rawProject.color),
    ratio: normalizeProjectRatio(rawProject.ratio, 0),
    order: normalizeProjectOrder(rawProject.order, index),
    description:
      normalizeOptionalString(rawProject.description)?.trim() || undefined,
    archived: rawProject.archived === true,
    createdAt: normalizeOptionalString(rawProject.createdAt) ?? fallbackTime,
    updatedAt: normalizeOptionalString(rawProject.updatedAt) ?? fallbackTime,
  };
}

function getRawProjects(raw: unknown): unknown[] {
  if (!isPlainObject(raw) || !Array.isArray(raw.projects)) {
    return [];
  }

  return raw.projects;
}

function normalizeProjectName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "Untitled Project";
  }

  return trimmedName.slice(0, 80);
}

function normalizeProjectRatio(ratio: unknown, fallbackRatio: number): number {
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) {
    return fallbackRatio;
  }

  return Math.min(100, Math.max(0, Math.round(ratio)));
}

function normalizeProjectOrder(order: unknown, fallbackOrder: number): number {
  if (typeof order !== "number" || !Number.isFinite(order)) {
    return fallbackOrder;
  }

  return Math.round(order);
}

function normalizeProjectColor(color: unknown): string {
  if (typeof color !== "string") {
    return PROJECT_COLORS[0].hex;
  }

  return (
    PROJECT_COLORS.find(
      (projectColor) =>
        projectColor.hex.toLowerCase() === color.toLowerCase(),
    )?.hex ?? PROJECT_COLORS[0].hex
  );
}

function dedupeProjectIds(projects: ProjectRecord[]): ProjectRecord[] {
  const seenIds = new Set<string>();

  return projects.map((project) => {
    let id = project.id;

    while (seenIds.has(id)) {
      id = `${project.id}-${seenIds.size + 1}`;
    }

    seenIds.add(id);
    return {
      ...project,
      id,
    };
  });
}

function compareProjects(first: ProjectRecord, second: ProjectRecord): number {
  if ((first.archived === true) !== (second.archived === true)) {
    return first.archived ? 1 : -1;
  }

  if (first.order !== second.order) {
    return first.order - second.order;
  }

  return first.name.localeCompare(second.name);
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

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createProjectId(name: string): string {
  const slug = slugify(name);

  if (globalThis.crypto?.randomUUID) {
    return `project-${globalThis.crypto.randomUUID()}`;
  }

  return `project-${slug || "untitled"}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "untitled"
  );
}
