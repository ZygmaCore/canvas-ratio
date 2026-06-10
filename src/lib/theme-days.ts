import {
  getDefaultSettings,
  type GlobalProjectId,
} from "@/lib/settings";
import type { DayRecord, ProjectRecord } from "@/types/canvas";

export const THEME_DAYS_STORAGE_KEY = "canvas-ratio:theme-days:v1";

export type ThemeDayRatios = Record<GlobalProjectId, number>;

export type ThemeDay = {
  id: string;
  name: string;
  description?: string;
  ratios: ThemeDayRatios;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
};

export type ThemeDayInput = {
  name: string;
  description?: string;
  ratios: ThemeDayRatios;
  color?: string;
  icon?: string;
};

const nowForDefaults = "2026-01-01T00:00:00.000Z";

export const DEFAULT_THEME_DAYS: ThemeDay[] = [
  {
    id: "balanced-day",
    name: "Balanced Day",
    description: "A familiar 50/30/20 recommendation.",
    ratios: { academic: 50, professional: 30, personal: 20 },
    color: "#FFD91A",
    icon: "BAL",
    createdAt: nowForDefaults,
    updatedAt: nowForDefaults,
    isDefault: true,
  },
  {
    id: "deep-study-day",
    name: "Deep Study Day",
    description: "More room for School and deep learning.",
    ratios: { academic: 70, professional: 10, personal: 20 },
    color: "#FFD91A",
    icon: "STU",
    createdAt: nowForDefaults,
    updatedAt: nowForDefaults,
    isDefault: true,
  },
  {
    id: "coding-day",
    name: "Coding Day",
    description: "More room for Work and building.",
    ratios: { academic: 20, professional: 60, personal: 20 },
    color: "#2F5FBF",
    icon: "COD",
    createdAt: nowForDefaults,
    updatedAt: nowForDefaults,
    isDefault: true,
  },
  {
    id: "recovery-day",
    name: "Recovery Day",
    description: "More room for Personal recovery.",
    ratios: { academic: 20, professional: 10, personal: 70 },
    color: "#8BCF3F",
    icon: "REC",
    createdAt: nowForDefaults,
    updatedAt: nowForDefaults,
    isDefault: true,
  },
  {
    id: "piano-day",
    name: "Piano Day",
    description: "A personal-practice day.",
    ratios: { academic: 20, professional: 10, personal: 70 },
    color: "#8BCF3F",
    icon: "PNO",
    createdAt: nowForDefaults,
    updatedAt: nowForDefaults,
    isDefault: true,
  },
  {
    id: "admin-day",
    name: "Admin Day",
    description: "A practical admin-heavy recommendation.",
    ratios: { academic: 25, professional: 50, personal: 25 },
    color: "#6FB6FF",
    icon: "ADM",
    createdAt: nowForDefaults,
    updatedAt: nowForDefaults,
    isDefault: true,
  },
];

export function createThemeDay(input: ThemeDayInput): ThemeDay {
  const now = new Date().toISOString();
  const ratios = normalizeThemeRatios(input.ratios);
  const name = input.name.trim();

  if (!name) {
    throw new Error("Theme name is required.");
  }

  return {
    id: createThemeDayId(name),
    name,
    description: input.description?.trim() || undefined,
    ratios,
    color: input.color || "#FFD91A",
    icon: input.icon?.trim().slice(0, 4).toUpperCase() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadThemeDays(): ThemeDay[] {
  const storage = getStorage();

  if (!storage) {
    return DEFAULT_THEME_DAYS.map((theme) => ({ ...theme }));
  }

  try {
    const customThemes = normalizeThemeDays(
      JSON.parse(storage.getItem(THEME_DAYS_STORAGE_KEY) ?? "[]"),
    ).filter((theme) => !theme.isDefault);

    return mergeThemeDays(customThemes);
  } catch {
    return mergeThemeDays([]);
  }
}

export function saveCustomThemeDays(themes: ThemeDay[]): ThemeDay[] {
  const customThemes = normalizeThemeDays(themes).filter(
    (theme) => !theme.isDefault,
  );
  const storage = getStorage();

  if (storage) {
    storage.setItem(THEME_DAYS_STORAGE_KEY, JSON.stringify(customThemes));
  }

  return mergeThemeDays(customThemes);
}

export function upsertThemeDay(themes: ThemeDay[], theme: ThemeDay): ThemeDay[] {
  const customThemes = themes.filter((candidate) => !candidate.isDefault);
  const exists = customThemes.some((candidate) => candidate.id === theme.id);
  const nextTheme = {
    ...theme,
    isDefault: false,
    updatedAt: new Date().toISOString(),
  };

  return saveCustomThemeDays(
    exists
      ? customThemes.map((candidate) =>
          candidate.id === nextTheme.id ? nextTheme : candidate,
        )
      : [nextTheme, ...customThemes],
  );
}

export function deleteThemeDay(themes: ThemeDay[], themeId: string): ThemeDay[] {
  return saveCustomThemeDays(
    themes.filter((theme) => theme.id !== themeId && !theme.isDefault),
  );
}

export function resetThemeDays(): ThemeDay[] {
  const storage = getStorage();

  storage?.removeItem(THEME_DAYS_STORAGE_KEY);
  return mergeThemeDays([]);
}

export function applyThemeToDay(day: DayRecord, theme: ThemeDay): DayRecord {
  return {
    ...day,
    themeDayId: theme.id,
    themeDayName: theme.name,
    themeDayRatios: { ...theme.ratios },
    updatedAt: new Date().toISOString(),
  };
}

export function getEffectiveProjectsForDay(
  projects: ProjectRecord[],
  day?: DayRecord | null,
): ProjectRecord[] {
  const ratios = normalizeOptionalThemeRatios(day?.themeDayRatios);

  if (!ratios) {
    return projects;
  }

  return projects.map((project) => {
    const projectId = project.id as GlobalProjectId;

    return {
      ...project,
      ratio: ratios[projectId] ?? project.ratio,
    };
  });
}

export function getThemeSummaryForDay(day?: DayRecord | null): {
  id?: string;
  name?: string;
  ratios?: ThemeDayRatios;
} | null {
  if (!day) {
    return null;
  }

  const ratios = normalizeOptionalThemeRatios(day?.themeDayRatios);

  if (!day?.themeDayName && !ratios) {
    return null;
  }

  return {
    id: day.themeDayId,
    name: day.themeDayName,
    ...(ratios ? { ratios } : {}),
  };
}

export function normalizeThemeDays(raw: unknown): ThemeDay[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(isPlainObject)
    .map(normalizeThemeDay)
    .filter((theme): theme is ThemeDay => !!theme);
}

export function normalizeOptionalThemeRatios(
  raw: unknown,
): ThemeDayRatios | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  try {
    return normalizeThemeRatios({
      academic: raw.academic,
      professional: raw.professional,
      personal: raw.personal,
    });
  } catch {
    return null;
  }
}

function normalizeThemeDay(raw: Record<string, unknown>): ThemeDay | null {
  const name = normalizeOptionalString(raw.name)?.trim();

  if (!name) {
    return null;
  }

  try {
    const now = new Date().toISOString();

    return {
      id: normalizeOptionalString(raw.id) ?? createThemeDayId(name),
      name,
      description: normalizeOptionalString(raw.description)?.trim() || undefined,
      ratios: normalizeThemeRatios(raw.ratios),
      color: normalizeOptionalString(raw.color),
      icon: normalizeOptionalString(raw.icon)?.trim().slice(0, 4).toUpperCase(),
      createdAt: normalizeOptionalString(raw.createdAt) ?? now,
      updatedAt: normalizeOptionalString(raw.updatedAt) ?? now,
      isDefault: raw.isDefault === true,
    };
  } catch {
    return null;
  }
}

function normalizeThemeRatios(raw: unknown): ThemeDayRatios {
  if (!isPlainObject(raw)) {
    throw new Error("Theme ratios are required.");
  }

  const ratios = {
    academic: normalizeRatioValue(raw.academic),
    professional: normalizeRatioValue(raw.professional),
    personal: normalizeRatioValue(raw.personal),
  };
  const total = ratios.academic + ratios.professional + ratios.personal;

  if (total !== 100) {
    throw new Error("Theme ratios must total 100.");
  }

  return ratios;
}

function normalizeRatioValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Theme ratios must be numbers.");
  }

  const ratio = Math.round(value);

  if (ratio < 0 || ratio > 100) {
    throw new Error("Theme ratios must be between 0 and 100.");
  }

  return ratio;
}

function mergeThemeDays(customThemes: ThemeDay[]): ThemeDay[] {
  return [
    ...DEFAULT_THEME_DAYS.map((theme) => ({ ...theme })),
    ...customThemes,
  ];
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

function createThemeDayId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "theme-day";

  if (globalThis.crypto?.randomUUID) {
    return `theme-${slug}-${globalThis.crypto.randomUUID()}`;
  }

  return `theme-${slug}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
