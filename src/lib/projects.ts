import {
  CELLS_PER_DAY,
  getCellIndicesForMinutes,
  getCellState,
} from "@/lib/cells";
import { PROJECT_COLORS } from "@/lib/palette";
import {
  getActiveProjects,
  getGlobalProjects,
  normalizeLegacyProjectName,
  normalizeGlobalProjectId,
} from "@/lib/settings";
import type { DayRecord, ProjectRecord, TaskRecord } from "@/types/canvas";

export type ProjectRecordInput = {
  name: string;
  color: string;
  ratio: number;
  description?: string;
};

export type ProjectRatioValidation = {
  valid: boolean;
  total: number;
  message?: string;
};

export type ProjectQuota = {
  projectId: string;
  projectName: string;
  color: string;
  ratio: number;
  rawCells: number;
  quotaCells: number;
  recommendedCells: number;
  paintedCells: number;
  rawRemainingCells: number;
  remainingCells: number;
  overQuotaCells: number;
  differenceCells: number;
  overRecommendationCells: number;
  underRecommendationCells: number;
  whiteCells: number;
  blackCells: number;
  coloredCells: number;
  paintableCells: number;
};

export type ProjectUsage = ProjectQuota & {
  overQuota: boolean;
  percentOfQuotaUsed: number;
};

export function createProjectRecord(input: ProjectRecordInput): ProjectRecord {
  const name = validateProjectName(input.name);
  const color = validateProjectColor(input.color);
  const ratio = validateProjectRatio(input.ratio);

  return {
    id: createProjectId(name, color),
    name,
    color,
    ratio,
    description: input.description?.trim() || undefined,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function validateProjectColor(color: string): string {
  const projectColor = PROJECT_COLORS.find(
    (paletteColor) =>
      paletteColor.hex.toLowerCase() === color.toLowerCase(),
  );

  if (!projectColor) {
    throw new Error("Choose a project color from the palette.");
  }

  return projectColor.hex;
}

export function validateProjectRatios(
  projects: ProjectRecord[],
): ProjectRatioValidation {
  const total = getProjectRatioTotal(projects);
  const invalidProject = projects.find(
    (project) =>
      !Number.isInteger(project.ratio) ||
      project.ratio < 0 ||
      project.ratio > 100,
  );

  if (projects.length === 0) {
    return {
      valid: false,
      total,
      message: "Project settings could not be loaded.",
    };
  }

  if (invalidProject) {
    return {
      valid: false,
      total,
      message: "Project ratios must be whole numbers from 0 to 100.",
    };
  }

  if (total !== 100) {
    return {
      valid: true,
      total,
      message: "Project ratios should total 100 for balanced recommendations.",
    };
  }

  return {
    valid: true,
    total,
  };
}

export function calculateProjectCellQuotas(
  projects: ProjectRecord[],
  paintableCellCount: number,
  paintedUsage = new Map<string, number>(),
  whiteCellCount = paintableCellCount,
  cellCounts?: {
    whiteCells: number;
    blackCells: number;
    coloredCells: number;
    paintableCells: number;
  },
): ProjectQuota[] {
  const counts = cellCounts ?? {
    whiteCells: whiteCellCount,
    blackCells: Math.max(0, CELLS_PER_DAY - paintableCellCount),
    coloredCells: Math.max(0, paintableCellCount - whiteCellCount),
    paintableCells: paintableCellCount,
  };
  const totalRatio = getProjectRatioTotal(projects);
  const ratioDenominator = totalRatio > 0 ? totalRatio : projects.length;
  const quotaInputs = projects.map((project, index) => {
    const effectiveRatio =
      totalRatio > 0 ? project.ratio : projects.length > 0 ? 1 : 0;
    const rawCells =
      ratioDenominator > 0
        ? (paintableCellCount * effectiveRatio) / ratioDenominator
        : 0;
    const floorCells = Math.floor(rawCells);

    return {
      project,
      index,
      rawCells,
      quotaCells: floorCells,
      remainder: rawCells - floorCells,
    };
  });

  if (paintableCellCount > 0) {
    const floorTotal = quotaInputs.reduce(
      (totalCells, quotaInput) => totalCells + quotaInput.quotaCells,
      0,
    );
    const remainingCells = paintableCellCount - floorTotal;
    const sortedByRemainder = [...quotaInputs].sort((first, second) => {
      if (second.remainder !== first.remainder) {
        return second.remainder - first.remainder;
      }

      return first.index - second.index;
    });

    for (const quotaInput of sortedByRemainder.slice(0, remainingCells)) {
      quotaInput.quotaCells += 1;
    }
  }

  return quotaInputs.map(({ project, rawCells, quotaCells }) => {
    const paintedCells = paintedUsage.get(project.id) ?? 0;
    const rawRemainingCells = quotaCells - paintedCells;
    const differenceCells = paintedCells - quotaCells;

    return {
      projectId: project.id,
      projectName: project.name,
      color: project.color,
      ratio: project.ratio,
      rawCells,
      quotaCells,
      recommendedCells: quotaCells,
      paintedCells,
      rawRemainingCells,
      remainingCells: Math.min(
        Math.max(0, rawRemainingCells),
        counts.whiteCells,
      ),
      overQuotaCells: Math.max(0, paintedCells - quotaCells),
      differenceCells,
      overRecommendationCells: Math.max(0, differenceCells),
      underRecommendationCells: Math.max(0, -differenceCells),
      whiteCells: counts.whiteCells,
      blackCells: counts.blackCells,
      coloredCells: counts.coloredCells,
      paintableCells: counts.paintableCells,
    };
  });
}

export function calculateProjectQuotaState(
  day: DayRecord,
  settings: { projects: ProjectRecord[] } | ProjectRecord[] =
    getGlobalProjects(),
): ProjectUsage[] {
  const projects = Array.isArray(settings) ? settings : settings.projects;
  const activeProjects = getActiveProjects(projects);
  const taskById = new Map(day.tasks.map((task) => [task.id, task]));
  const paintedCellsByProject = new Map<string, number>();
  const cellCounts = {
    whiteCells: 0,
    blackCells: 0,
    coloredCells: 0,
    paintableCells: 0,
  };

  for (let cellIndex = 0; cellIndex < CELLS_PER_DAY; cellIndex += 1) {
    const cell = getCellState(day.slots, cellIndex);

    if (cell.state === "black") {
      cellCounts.blackCells += 1;
      continue;
    }

    cellCounts.paintableCells += 1;

    if (cell.state === "white" && !cell.isMixed) {
      cellCounts.whiteCells += 1;
      continue;
    }

    cellCounts.coloredCells += 1;

    if (cell.state !== "colored") {
      continue;
    }

    const project = getProjectForColoredCell(day, cell, taskById, projects);

    if (!project) {
      continue;
    }

    paintedCellsByProject.set(
      project.id,
      (paintedCellsByProject.get(project.id) ?? 0) + 1,
    );
  }

  return calculateProjectCellQuotas(
    activeProjects,
    cellCounts.paintableCells,
    paintedCellsByProject,
    cellCounts.whiteCells,
    cellCounts,
  ).map((quota) => {
    return {
      ...quota,
      overQuota: quota.overQuotaCells > 0,
      percentOfQuotaUsed:
        quota.quotaCells === 0
          ? 0
          : Math.round((quota.paintedCells / quota.quotaCells) * 1000) / 10,
    };
  });
}

export function getProjectUsageFromSlots(
  day: DayRecord,
  projects: ProjectRecord[] = getGlobalProjects(),
): ProjectUsage[] {
  return calculateProjectQuotaState(day, projects);
}

export function getProjectById(
  day: DayRecord,
  projectId: string,
  projects: ProjectRecord[] = getGlobalProjects(),
): ProjectRecord | null {
  const activeProject =
    projects.find((project) => project.id === projectId) ??
    projects.find(
      (project) => project.name.toLowerCase() === projectId.toLowerCase(),
    ) ??
    projects.find((project) => project.id === normalizeLegacyProjectName(projectId));

  if (activeProject) {
    return activeProject;
  }

  const deprecatedProject =
    day.projects.find((project) => project.id === projectId) ?? null;
  const mappedDeprecatedProjectId = deprecatedProject
    ? normalizeGlobalProjectId(deprecatedProject.id, deprecatedProject.name)
    : null;

  return (
    projects.find((project) => project.id === mappedDeprecatedProjectId) ??
    deprecatedProject
  );
}

export function getTaskProject(
  day: DayRecord,
  task: TaskRecord,
  projects: ProjectRecord[] = getGlobalProjects(),
): ProjectRecord | null {
  const mappedProjectId = normalizeGlobalProjectId(
    task.projectId,
    task.projectName,
  );
  const project = mappedProjectId
    ? projects.find((candidate) => candidate.id === mappedProjectId)
    : null;

  return project ?? getProjectById(day, task.projectId, projects);
}

export function getTaskProjectName(
  day: DayRecord,
  task: TaskRecord,
  projects: ProjectRecord[] = getGlobalProjects(),
): string {
  return (
    getTaskProject(day, task, projects)?.name ??
    task.projectName ??
    "Untitled Project"
  );
}

export function getTaskProjectColor(
  day: DayRecord,
  task: TaskRecord,
  projects: ProjectRecord[] = getGlobalProjects(),
): string {
  return (
    getTaskProject(day, task, projects)?.color ??
    getFallbackTaskColor(task.color) ??
    PROJECT_COLORS[0].hex
  );
}

export function getProjectTaskCount(
  day: DayRecord,
  projectId: string,
): number {
  return day.tasks.filter((task) => {
    const taskProjectId =
      normalizeGlobalProjectId(task.projectId, task.projectName) ??
      task.projectId;

    return taskProjectId === projectId;
  }).length;
}

export function canDeleteProject(
  day: DayRecord,
  projectId: string,
): { ok: boolean; reason?: string } {
  const projectExists = day.projects.some((project) => project.id === projectId);

  if (!projectExists) {
    return {
      ok: false,
      reason: "Project was not found.",
    };
  }

  return {
    ok: true,
  };
}

export function removeProject(
  day: DayRecord,
  projectId: string,
): DayRecord {
  const deleteCheck = canDeleteProject(day, projectId);

  if (!deleteCheck.ok) {
    throw new Error(deleteCheck.reason ?? "Project cannot be deleted.");
  }

  return {
    ...day,
    projects: day.projects.filter((project) => project.id !== projectId),
    tasks: day.tasks.filter((task) => task.projectId !== projectId),
    updatedAt: new Date().toISOString(),
  };
}

export function getProjectRatioTotal(projects: ProjectRecord[]): number {
  return getActiveProjects(projects).reduce(
    (total, project) => total + project.ratio,
    0,
  );
}

export function createMigratedProjectId(name: string, color: string): string {
  return `project-${slugify(name)}-${color.replace("#", "").toLowerCase()}`;
}

export function getAssignedCellCount(task: TaskRecord): number {
  return getCellIndicesForMinutes(task.assignedMinutes ?? []).length;
}

export function getEffectivePaintedCellCount(
  day: DayRecord,
  task: TaskRecord,
): number {
  return Array.from({ length: CELLS_PER_DAY }, (_, cellIndex) =>
    getCellState(day.slots, cellIndex),
  ).filter(
    (cell) =>
      cell.state === "colored" &&
      cell.taskId === task.id &&
      !cell.isMixed,
  ).length;
}

function getProjectForColoredCell(
  day: DayRecord,
  cell: ReturnType<typeof getCellState>,
  taskById: Map<string, TaskRecord>,
  projects: ProjectRecord[],
): ProjectRecord | null {
  const task = cell.taskId ? taskById.get(cell.taskId) : null;
  const taskProject = task ? getTaskProject(day, task, projects) : null;

  if (taskProject) {
    return taskProject;
  }

  return (
    projects.find(
      (project) => project.color.toLowerCase() === cell.color.toLowerCase(),
    ) ?? null
  );
}

function validateProjectName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Project name is required.");
  }

  if (trimmedName.length > 80) {
    throw new Error("Project name must be 80 characters or fewer.");
  }

  return trimmedName;
}

function validateProjectRatio(ratio: number): number {
  if (!Number.isInteger(ratio) || ratio < 0 || ratio > 100) {
    throw new Error("Project ratio must be a whole number between 0 and 100.");
  }

  return ratio;
}

function getFallbackTaskColor(color?: string): string | null {
  if (!color) {
    return null;
  }

  return PROJECT_COLORS.find(
    (projectColor) => projectColor.hex.toLowerCase() === color.toLowerCase(),
  )?.hex ?? null;
}

function createProjectId(name: string, color: string): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${createMigratedProjectId(name, color)}-${Date.now()}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}
