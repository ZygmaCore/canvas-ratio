import { cellIndexToMinuteRange, validateCellIndex } from "@/lib/cells";
import { rebuildDaySlots } from "@/lib/rebuild";
import type { TaskDumpPlanningData } from "@/lib/task-dump-prompt";
import { minuteToTime } from "@/lib/time";
import type { DayRecord, TaskRecord } from "@/types/canvas";

export type TaskDumpAssignment = {
  assignments: Array<{
    blockIndex: number;
    startTime?: string;
    endTime?: string;
    taskName: string;
    note?: string;
    projectId?: string;
    projectName?: string;
  }>;
};

export function parseTaskDumpAssignment(input: string): TaskDumpAssignment {
  const candidates = [
    input.trim(),
    ...extractFencedJsonBlocks(input),
    ...extractJsonObjectCandidates(input),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);

      if (isTaskDumpAssignmentLike(parsed)) {
        return normalizeAssignment(parsed);
      }
    } catch {
      // Try the next candidate; AI answers often include prose around JSON.
    }
  }

  throw new Error("Could not find a valid JSON assignment.");
}

export function validateTaskDumpAssignment(
  assignment: TaskDumpAssignment,
  currentPlanningData: TaskDumpPlanningData,
): void {
  if (!Array.isArray(assignment.assignments)) {
    throw new Error("Assignments must be an array.");
  }

  const freeBlockIndexes = new Set(currentPlanningData.freeBlockIndexes);
  const projectIds = new Set(currentPlanningData.projects.map((project) => project.id));
  const taskBlockCounts = new Map<string, number>();

  for (const item of currentPlanningData.taskDump) {
    taskBlockCounts.set(
      item.taskName,
      (taskBlockCounts.get(item.taskName) ?? 0) + item.blockCount,
    );
  }
  const assignedCounts = new Map<string, number>();
  const usedBlockIndexes = new Set<number>();

  for (const item of assignment.assignments) {
    if (!Number.isInteger(item.blockIndex)) {
      throw new Error("Each assignment needs a blockIndex from 0 to 47.");
    }

    validateCellIndex(item.blockIndex);

    if (usedBlockIndexes.has(item.blockIndex)) {
      throw new Error(`Block ${item.blockIndex} is assigned more than once.`);
    }

    usedBlockIndexes.add(item.blockIndex);

    if (!freeBlockIndexes.has(item.blockIndex)) {
      throw new Error(`Block ${item.blockIndex} is not free.`);
    }

    if (!taskBlockCounts.has(item.taskName)) {
      throw new Error(`Unknown task: ${item.taskName}.`);
    }

    item.projectId = requireValidProjectId(item, projectIds);
    validateAssignmentTimes(item, currentPlanningData);
    assignedCounts.set(
      item.taskName,
      (assignedCounts.get(item.taskName) ?? 0) + 1,
    );
  }

  if (
    assignment.assignments.length !==
    currentPlanningData.taskDumpSummary.dumpedBlockCount
  ) {
    throw new Error(
      `Expected ${currentPlanningData.taskDumpSummary.dumpedBlockCount} assigned blocks, got ${assignment.assignments.length}.`,
    );
  }

  for (const [taskName, blockCount] of taskBlockCounts) {
    const assignedCount = assignedCounts.get(taskName) ?? 0;

    if (assignedCount !== blockCount) {
      throw new Error(
        `Task '${taskName}' needs ${blockCount} block${blockCount === 1 ? "" : "s"} but got ${assignedCount}.`,
      );
    }
  }
}

export function applyTaskDumpAssignmentToDay(
  day: DayRecord,
  assignment: TaskDumpAssignment,
  currentPlanningData: TaskDumpPlanningData,
): DayRecord {
  const now = new Date().toISOString();
  const dumpItemByName = new Map(
    (day.taskDump ?? []).map((item) => [item.taskName, item]),
  );
  const projectById = new Map(
    currentPlanningData.projects.map((project) => [project.id, project]),
  );
  const assignmentGroups = new Map<string, TaskDumpAssignment["assignments"]>();

  for (const item of assignment.assignments) {
    const projectId = item.projectId ?? "";
    const groupKey = `${item.taskName}\u0000${projectId}`;
    const group = assignmentGroups.get(groupKey) ?? [];

    group.push({ ...item, projectId });
    assignmentGroups.set(groupKey, group);
  }

  const scheduledTasks: TaskRecord[] = Array.from(assignmentGroups).map(
    ([groupKey, assignments]) => {
      const [taskName, projectId] = groupKey.split("\u0000") as [
        string,
        string,
      ];
      const project = projectById.get(projectId);
      const assignedMinutes = assignments
        .sort((first, second) => first.blockIndex - second.blockIndex)
        .flatMap((item) => {
          const { startMinute, endMinute } = cellIndexToMinuteRange(
            item.blockIndex,
          );

          return Array.from(
            { length: endMinute - startMinute },
            (_, index) => startMinute + index,
          );
        });
      const dumpItem = dumpItemByName.get(taskName);
      const assignmentNote =
        assignments.map((item) => item.note?.trim()).find(Boolean) ??
        undefined;

      return {
        id: createTaskDumpScheduledTaskId(taskName, projectId),
        projectId,
        projectName: project?.name,
        taskName,
        source: "task-dump",
        color: project?.color,
        inputMode: "manual-cell",
        targetCanvas: "full",
        assignedMinutes,
        durationMinutes: assignedMinutes.length,
        description: dumpItem?.note ?? assignmentNote,
        createdAt: now,
      };
    },
  );

  return rebuildDaySlots({
    ...day,
    tasks: [...day.tasks, ...scheduledTasks],
    taskDump: [],
    updatedAt: now,
  });
}

function normalizeAssignment(raw: unknown): TaskDumpAssignment {
  if (!isPlainObject(raw) || !Array.isArray(raw.assignments)) {
    throw new Error("Assignments must be an array.");
  }

  return {
    assignments: raw.assignments.map((item) => {
      if (!isPlainObject(item)) {
        throw new Error("Each assignment must be an object.");
      }

      return {
        blockIndex:
          typeof item.blockIndex === "number" ? item.blockIndex : Number.NaN,
        startTime: normalizeOptionalString(item.startTime),
        endTime: normalizeOptionalString(item.endTime),
        taskName: normalizeRequiredString(item.taskName, "taskName"),
        note: normalizeOptionalString(item.note),
        projectId: normalizeOptionalString(item.projectId),
        projectName: normalizeOptionalString(item.projectName),
      };
    }),
  };
}

function requireValidProjectId(
  item: TaskDumpAssignment["assignments"][number],
  projectIds: Set<string>,
): string {
  if (typeof item.projectId === "string" && item.projectId.trim()) {
    const projectId = item.projectId.trim();

    if (projectIds.has(projectId)) {
      return projectId;
    }

    throw new Error(`Invalid projectId: ${item.projectId}.`);
  }

  throw new Error(`Missing projectId for block ${item.blockIndex}.`);
}

function validateAssignmentTimes(
  item: TaskDumpAssignment["assignments"][number],
  currentPlanningData: TaskDumpPlanningData,
): void {
  const block = currentPlanningData.canvasBlocks.find(
    (candidate) => candidate.index === item.blockIndex,
  );

  if (!block) {
    throw new Error(`Block ${item.blockIndex} is not available.`);
  }

  if (
    item.startTime &&
    normalizeTimeLabel(item.startTime) !== normalizeTimeLabel(block.startTime)
  ) {
    throw new Error(`Block ${item.blockIndex} startTime does not match.`);
  }

  if (
    item.endTime &&
    normalizeTimeLabel(item.endTime) !== normalizeTimeLabel(block.endTime)
  ) {
    throw new Error(`Block ${item.blockIndex} endTime does not match.`);
  }
}

function isTaskDumpAssignmentLike(value: unknown): value is {
  assignments: unknown[];
} {
  return isPlainObject(value) && Array.isArray(value.assignments);
}

function extractFencedJsonBlocks(input: string): string[] {
  return Array.from(input.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)).map(
    (match) => match[1].trim(),
  );
}

function extractJsonObjectCandidates(input: string): string[] {
  const candidates: string[] = [];

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== "{") {
      continue;
    }

    const endIndex = findMatchingBrace(input, index);

    if (endIndex > index) {
      candidates.push(input.slice(index, endIndex + 1));
    }
  }

  return candidates;
}

function findMatchingBrace(input: string, startIndex: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function normalizeTimeLabel(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue === "24:00") {
    return trimmedValue;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmedValue);

  if (!match) {
    return trimmedValue;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours === 24 && minutes === 0) {
    return "24:00";
  }

  if (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours < 24 &&
    minutes >= 0 &&
    minutes < 60
  ) {
    return minuteToTime(hours * 60 + minutes);
  }

  return trimmedValue;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function normalizeRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createTaskDumpScheduledTaskId(
  taskName: string,
  projectId: string,
): string {
  const slug = slugify(taskName).slice(0, 32);

  if (globalThis.crypto?.randomUUID) {
    return `task-dump-${globalThis.crypto.randomUUID()}`;
  }

  return `task-dump-${projectId}-${slug || "task"}-${Date.now()}-${Math.random()
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
