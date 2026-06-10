import {
  CELLS_PER_DAY,
  cellIndexToMinuteRange,
  formatCellLabel,
  getCellState,
  type CellView,
} from "@/lib/cells";
import { BLACK_CANVAS, WHITE_CANVAS } from "@/lib/palette";
import { getTaskProject, getTaskProjectName } from "@/lib/projects";
import { normalizeGlobalProjectId, type GlobalProjectId } from "@/lib/settings";
import type {
  CanvasCellSnapshot,
  DayRecord,
  ProjectRecord,
  SnapshotCellState,
} from "@/types/canvas";

export type RealityMode = "plan" | "actual" | "compare";

export type RealityGapStatus =
  | "matched"
  | "missed"
  | "unplanned"
  | "changed";

export type RealityGapCellComparison = {
  index: number;
  status: RealityGapStatus;
  planned: CanvasCellSnapshot;
  actual: CanvasCellSnapshot;
};

export type RealityGapSummary = {
  plannedColoredCells: number;
  actualColoredCells: number;
  difference: number;
  matchedCells: number;
  changedCells: number;
  missedPlannedCells: number;
  unplannedActualCells: number;
  changedProjectCells: number;
  perProject: Array<{
    projectId: GlobalProjectId;
    projectName: string;
    plannedCells: number;
    actualCells: number;
    difference: number;
  }>;
  cells: RealityGapCellComparison[];
};

const snapshotStates = new Set<SnapshotCellState>([
  "free",
  "unavailable",
  "colored",
]);

export function createCanvasSnapshot(
  day: DayRecord,
  projects: ProjectRecord[],
): CanvasCellSnapshot[] {
  const taskById = new Map(day.tasks.map((task) => [task.id, task]));

  return Array.from({ length: CELLS_PER_DAY }, (_, index) => {
    const cell = getCellState(day.slots, index);

    if (cell.state === "black") {
      return {
        index,
        state: "unavailable",
        color: BLACK_CANVAS.hex,
      };
    }

    if (cell.state === "colored") {
      const task = cell.taskId ? taskById.get(cell.taskId) : undefined;
      const project = task
        ? getTaskProject(day, task, projects)
        : projects.find(
            (candidate) =>
              candidate.color.toLowerCase() === cell.color.toLowerCase(),
          );
      const projectId = project
        ? normalizeGlobalProjectId(project.id, project.name)
        : null;

      if (projectId && project) {
        return {
          index,
          state: "colored",
          projectId,
          taskName: task ? getTaskProjectName(day, task, projects) : undefined,
          color: project.color,
        };
      }
    }

    return {
      index,
      state: "free",
      color: WHITE_CANVAS.hex,
    };
  });
}

export function savePlanSnapshot(
  day: DayRecord,
  projects: ProjectRecord[],
): DayRecord {
  const plannedCells = createCanvasSnapshot(day, projects);
  const now = new Date().toISOString();

  return {
    ...day,
    plannedCells,
    actualCells: day.actualCells ?? plannedCells.map((cell) => ({ ...cell })),
    planSnapshotAt: now,
    updatedAt: now,
  };
}

export function ensureActualCells(
  day: DayRecord,
  projects: ProjectRecord[],
): CanvasCellSnapshot[] {
  if (day.actualCells?.length === CELLS_PER_DAY) {
    return day.actualCells;
  }

  if (day.plannedCells?.length === CELLS_PER_DAY) {
    return day.plannedCells.map((cell) => ({ ...cell }));
  }

  return createCanvasSnapshot(day, projects);
}

export function updateActualCell(
  day: DayRecord,
  projects: ProjectRecord[],
  cellIndex: number,
  project?: ProjectRecord | null,
): DayRecord {
  const actualCells = ensureActualCells(day, projects);
  const currentCell = actualCells[cellIndex];

  if (!currentCell || currentCell.state === "unavailable") {
    return day;
  }

  const nextCells = actualCells.map((cell) => {
    if (cell.index !== cellIndex) {
      return { ...cell };
    }

    if (cell.state === "colored") {
      return {
        index: cellIndex,
        state: "free" as const,
        color: WHITE_CANVAS.hex,
      };
    }

    if (!project) {
      return { ...cell };
    }

    return {
      index: cellIndex,
      state: "colored" as const,
      projectId: normalizeGlobalProjectId(project.id, project.name) ?? "academic",
      taskName: "Actual",
      color: project.color,
    };
  });
  const now = new Date().toISOString();

  return {
    ...day,
    actualCells: nextCells,
    actualUpdatedAt: now,
    updatedAt: now,
  };
}

export function calculateRealityGap(
  day: DayRecord,
  projects: ProjectRecord[],
): RealityGapSummary | null {
  const plannedCells = normalizeCanvasSnapshots(day.plannedCells);
  const actualCells = normalizeCanvasSnapshots(day.actualCells);

  if (!plannedCells || !actualCells) {
    return null;
  }

  const cells = plannedCells.map((planned, index) => {
    const actual = actualCells[index] ?? createFreeSnapshot(index);

    return {
      index,
      status: getRealityGapStatus(planned, actual),
      planned,
      actual,
    };
  });
  const plannedColoredCells = plannedCells.filter(
    (cell) => cell.state === "colored",
  ).length;
  const actualColoredCells = actualCells.filter(
    (cell) => cell.state === "colored",
  ).length;

  return {
    plannedColoredCells,
    actualColoredCells,
    difference: actualColoredCells - plannedColoredCells,
    matchedCells: cells.filter((cell) => cell.status === "matched").length,
    changedCells: cells.filter((cell) => cell.status !== "matched").length,
    missedPlannedCells: cells.filter((cell) => cell.status === "missed").length,
    unplannedActualCells: cells.filter((cell) => cell.status === "unplanned")
      .length,
    changedProjectCells: cells.filter((cell) => cell.status === "changed")
      .length,
    perProject: projects.map((project) => {
      const projectId =
        normalizeGlobalProjectId(project.id, project.name) ?? "academic";
      const plannedProjectCells = plannedCells.filter(
        (cell) => cell.projectId === projectId,
      ).length;
      const actualProjectCells = actualCells.filter(
        (cell) => cell.projectId === projectId,
      ).length;

      return {
        projectId,
        projectName: project.name,
        plannedCells: plannedProjectCells,
        actualCells: actualProjectCells,
        difference: actualProjectCells - plannedProjectCells,
      };
    }),
    cells,
  };
}

export function normalizeCanvasSnapshots(
  raw: unknown,
): CanvasCellSnapshot[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  const normalizedCells = Array.from({ length: CELLS_PER_DAY }, (_, index) =>
    createFreeSnapshot(index),
  );

  for (const rawCell of raw) {
    const cell = normalizeCanvasSnapshot(rawCell);

    if (cell) {
      normalizedCells[cell.index] = cell;
    }
  }

  return normalizedCells;
}

export function getSnapshotProjectName(
  snapshot: CanvasCellSnapshot,
  projects: ProjectRecord[],
): string | undefined {
  if (!snapshot.projectId) {
    return undefined;
  }

  return projects.find((project) => project.id === snapshot.projectId)?.name;
}

export function snapshotCellsToCellViews(
  snapshots: CanvasCellSnapshot[],
): CellView[] {
  return snapshots.map((snapshot) => {
    const { startMinute, endMinute } = cellIndexToMinuteRange(snapshot.index);

    return {
      cellIndex: snapshot.index,
      startMinute,
      endMinute,
      label: formatCellLabel(startMinute, endMinute),
      state:
        snapshot.state === "unavailable"
          ? "black"
          : snapshot.state === "colored"
            ? "colored"
            : "white",
      color:
        snapshot.state === "unavailable"
          ? BLACK_CANVAS.hex
          : snapshot.color ?? WHITE_CANVAS.hex,
      isMixed: false,
    };
  });
}

export function getSnapshotLabelMap(
  snapshots: CanvasCellSnapshot[],
  projects: ProjectRecord[],
): Map<number, string> {
  return new Map(
    snapshots.map((snapshot) => [
      snapshot.index,
      snapshot.state === "colored"
        ? getSnapshotProjectName(snapshot, projects) ?? "Colored"
        : snapshot.state === "unavailable"
          ? "Unavailable"
          : "Free",
    ]),
  );
}

export function getCompareStatusMap(
  summary: RealityGapSummary | null,
): Map<number, RealityGapStatus> {
  return new Map(
    (summary?.cells ?? []).map((cell) => [cell.index, cell.status]),
  );
}

function normalizeCanvasSnapshot(raw: unknown): CanvasCellSnapshot | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  if (
    !Number.isInteger(raw.index) ||
    typeof raw.index !== "number" ||
    raw.index < 0 ||
    raw.index >= CELLS_PER_DAY ||
    !snapshotStates.has(raw.state as SnapshotCellState)
  ) {
    return null;
  }

  const projectId = normalizeGlobalProjectId(
    normalizeOptionalString(raw.projectId),
  );

  return {
    index: raw.index,
    state: raw.state as SnapshotCellState,
    projectId: raw.state === "colored" ? projectId ?? undefined : undefined,
    taskName:
      raw.state === "colored"
        ? normalizeOptionalString(raw.taskName)?.trim() || undefined
        : undefined,
    color: normalizeOptionalString(raw.color) ?? getSnapshotFallbackColor(raw.state),
  };
}

function getRealityGapStatus(
  planned: CanvasCellSnapshot,
  actual: CanvasCellSnapshot,
): RealityGapStatus {
  if (
    planned.state === actual.state &&
    (planned.state !== "colored" || planned.projectId === actual.projectId)
  ) {
    return "matched";
  }

  if (
    planned.state === "colored" &&
    actual.state === "colored" &&
    planned.projectId !== actual.projectId
  ) {
    return "changed";
  }

  if (planned.state === "free" && actual.state === "colored") {
    return "unplanned";
  }

  return "missed";
}

function createFreeSnapshot(index: number): CanvasCellSnapshot {
  return {
    index,
    state: "free",
    color: WHITE_CANVAS.hex,
  };
}

function getSnapshotFallbackColor(state: unknown): string {
  if (state === "unavailable") {
    return BLACK_CANVAS.hex;
  }

  return WHITE_CANVAS.hex;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
