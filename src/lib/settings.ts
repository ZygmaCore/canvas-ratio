import type { ProjectRecord } from "@/types/canvas";

export const SETTINGS_STORAGE_KEY = "canvas-ratio:settings";

export type GlobalProjectId = "academic" | "professional" | "personal";

export type CanvasSettings = {
  projects: ProjectRecord[];
};

type RatioInput = Partial<Record<GlobalProjectId, number>>;

const DEFAULT_PROJECTS: Array<ProjectRecord & { id: GlobalProjectId }> = [
  {
    id: "academic",
    name: "School",
    color: "#FFD91A",
    ratio: 50,
  },
  {
    id: "professional",
    name: "Work",
    color: "#2F5FBF",
    ratio: 30,
  },
  {
    id: "personal",
    name: "Personal",
    color: "#8BCF3F",
    ratio: 20,
  },
];

export function getDefaultSettings(): CanvasSettings {
  return {
    projects: DEFAULT_PROJECTS.map((project) => ({ ...project })),
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
  const normalizedSettings = normalizeSettings(settings);
  const storage = getStorage();

  if (storage) {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
  }

  return normalizedSettings;
}

export function normalizeSettings(raw: unknown): CanvasSettings {
  const rawProjects = getRawProjects(raw);

  return {
    projects: DEFAULT_PROJECTS.map((defaultProject) => {
      const storedProject = rawProjects.find((project) => {
        if (!isPlainObject(project)) {
          return false;
        }

        return (
          normalizeGlobalProjectId(
            normalizeOptionalString(project.id),
            normalizeOptionalString(project.name),
          ) === defaultProject.id
        );
      });

      return {
        ...defaultProject,
        ratio: isPlainObject(storedProject)
          ? normalizeProjectRatio(storedProject.ratio, defaultProject.ratio)
          : defaultProject.ratio,
      };
    }),
  };
}

export function getGlobalProjects(): ProjectRecord[] {
  return loadSettings().projects;
}

export function updateProjectRatios(ratios: RatioInput): CanvasSettings {
  const currentSettings = loadSettings();

  return saveSettings({
    projects: currentSettings.projects.map((project) => {
      const projectId = normalizeGlobalProjectId(project.id);
      const nextRatio = projectId ? ratios[projectId] : undefined;

      return {
        ...project,
        ratio:
          typeof nextRatio === "number"
            ? normalizeProjectRatio(nextRatio, project.ratio)
            : project.ratio,
      };
    }),
  });
}

export function isGlobalProjectId(value: string): value is GlobalProjectId {
  return DEFAULT_PROJECTS.some((project) => project.id === value);
}

export function normalizeGlobalProjectId(
  projectId?: string,
  projectName?: string,
): GlobalProjectId | null {
  for (const candidate of [projectId, projectName]) {
    if (!candidate) {
      continue;
    }

    const normalizedCandidate = slugify(candidate);

    if (isGlobalProjectId(normalizedCandidate)) {
      return normalizedCandidate;
    }

    if (
      normalizedCandidate.includes("academic") ||
      normalizedCandidate.includes("school") ||
      normalizedCandidate.includes("study")
    ) {
      return "academic";
    }

    if (
      normalizedCandidate.includes("professional") ||
      normalizedCandidate.includes("work") ||
      normalizedCandidate.includes("career") ||
      normalizedCandidate.includes("business")
    ) {
      return "professional";
    }

    if (
      normalizedCandidate.includes("personal") ||
      normalizedCandidate.includes("life") ||
      normalizedCandidate.includes("home")
    ) {
      return "personal";
    }
  }

  return null;
}

function getRawProjects(raw: unknown): unknown[] {
  if (!isPlainObject(raw) || !Array.isArray(raw.projects)) {
    return [];
  }

  return raw.projects;
}

function normalizeProjectRatio(ratio: unknown, fallbackRatio: number): number {
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) {
    return fallbackRatio;
  }

  return Math.min(100, Math.max(0, Math.round(ratio)));
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

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "untitled"
  );
}
