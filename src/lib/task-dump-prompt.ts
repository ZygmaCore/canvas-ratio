import { cellIndexToMinuteRange, CELLS_PER_DAY, getCellState } from "@/lib/cells";
import { normalizeGlobalProjectId, type CanvasSettings } from "@/lib/settings";
import { getTaskDumpItems, getTaskDumpSummary } from "@/lib/task-dump";
import { MINUTES_PER_DAY, minuteToTime } from "@/lib/time";
import type { DayRecord, TaskRecord } from "@/types/canvas";

export type TaskDumpPlanningProjectId =
  | "academic"
  | "professional"
  | "personal";

export type TaskDumpPlanningBlock = {
  index: number;
  startTime: string;
  endTime: string;
  state: "free" | "unavailable" | "colored";
  projectId?: TaskDumpPlanningProjectId;
  projectName?: string;
  taskName?: string;
  note?: string;
};

export type TaskDumpPlanningData = {
  date: string;
  totalBlocks: 48;
  freeBlockCount: number;
  unavailableBlockCount: number;
  coloredBlockCount: number;
  freeBlockIndexes: number[];
  canvasBlocks: TaskDumpPlanningBlock[];
  taskDump: Array<{
    id: string;
    taskName: string;
    note?: string;
    blockCount: number;
  }>;
  taskDumpSummary: {
    dumpedTaskCount: number;
    dumpedBlockCount: number;
    freeBlockCount: number;
    remainingFreeBlocksAfterDump: number;
    isValid: boolean;
  };
};

export function buildTaskDumpPlanningData(
  day: DayRecord,
  settings: CanvasSettings,
): TaskDumpPlanningData {
  const projectById = new Map(
    settings.projects
      .map((project) => {
        const id = normalizeGlobalProjectId(project.id, project.name);

        return id ? [id, project.name] : null;
      })
      .filter((entry): entry is [TaskDumpPlanningProjectId, string] => !!entry),
  );
  const taskById = new Map(day.tasks.map((task) => [task.id, task]));
  const canvasBlocks = Array.from({ length: CELLS_PER_DAY }, (_, index) =>
    buildTaskDumpPlanningBlock(day, index, taskById, projectById),
  );
  const freeBlockIndexes = canvasBlocks
    .filter((block) => block.state === "free")
    .map((block) => block.index);
  const taskDump = getTaskDumpItems(day).map((item) => ({
    id: item.id,
    taskName: item.taskName,
    note: item.note,
    blockCount: item.blockCount,
  }));
  const summary = getTaskDumpSummary(day);

  return {
    date: day.date,
    totalBlocks: 48,
    freeBlockCount: freeBlockIndexes.length,
    unavailableBlockCount: canvasBlocks.filter(
      (block) => block.state === "unavailable",
    ).length,
    coloredBlockCount: canvasBlocks.filter((block) => block.state === "colored")
      .length,
    freeBlockIndexes,
    canvasBlocks,
    taskDump,
    taskDumpSummary: {
      dumpedTaskCount: taskDump.length,
      dumpedBlockCount: summary.dumpedBlocks,
      freeBlockCount: summary.freeBlocks,
      remainingFreeBlocksAfterDump: summary.availableDumpBlocks,
      isValid: summary.isValid,
    },
  };
}

export function buildTaskDumpPlanningPrompt(
  data: TaskDumpPlanningData,
): string {
  return `You are helping me arrange my remaining day using Canvas Ratio.

Canvas Ratio meaning:

* A day has 48 blocks.
* Each block is 30 minutes.
* Free blocks are white cells that can still be planned.
* Unavailable blocks are black cells and cannot be used.
* Colored blocks are already assigned and must not be changed.

Your task:

1. Use only the tasks from taskDump.
2. Place those tasks only into freeBlockIndexes.
3. Do not use unavailable blocks.
4. Do not modify colored blocks.
5. Do not invent new tasks.
6. Do not assign tasks outside the provided block counts.
7. Respect each task's blockCount exactly.
8. Use the notes as context.
9. If the task dump cannot fit, explain why.
10. Return both a readable schedule and a JSON assignment.
11. For every assigned block, classify it into projectId.
12. projectId must be one of: academic, professional, personal.
13. Use taskName and note to decide the project.
14. Do not ask the user for project.
15. Do not invent new project categories.
16. School/study tasks should be academic.
17. Work/coding/career tasks should be professional.
18. Piano/health/rest/life tasks should be personal.
19. The JSON assignment must be valid JSON.
20. Do not wrap the JSON assignment in extra commentary inside the JSON block.

Project classification:

* academic: school, study, coursework, math, science, exam preparation, reading for learning
* professional: work, coding, career, portfolio, project building, business, internship, job preparation
* personal: piano, health, rest, chores, relationships, hobbies, recovery, personal life

The user intentionally did not provide project labels. You must infer them from taskName and note.
If unsure, choose the most likely project based on taskName and note. Do not invent a new project category.

Output format:

* Short Planning Summary
* Scheduled Blocks
* Notes / Reasoning
* JSON Assignment

JSON Assignment format:
{
"assignments": [
{
"blockIndex": 0,
"startTime": "00:00",
"endTime": "00:30",
"taskName": "Example",
"note": "Optional note",
"projectId": "academic"
}
]
}

Important:

* Base your answer only on the JSON.
* Do not invent project categories.
* projectId is required for every assignment.
* projectId must be academic, professional, or personal.
* Do not alter existing colored or unavailable blocks.
* Only fill white/free blocks.
* Each taskName must match a taskName from taskDump.
* The total number of assigned blocks for each task must equal its blockCount.

Here is the JSON data:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``;
}

function buildTaskDumpPlanningBlock(
  day: DayRecord,
  index: number,
  taskById: Map<string, TaskRecord>,
  projectById: Map<TaskDumpPlanningProjectId, string>,
): TaskDumpPlanningBlock {
  const { startMinute, endMinute } = cellIndexToMinuteRange(index);
  const cellSlots = day.slots.filter(
    (slot) => slot.minute >= startMinute && slot.minute < endMinute,
  );
  const startTime = formatPlanningTime(startMinute);
  const endTime = formatPlanningTime(endMinute);

  if (cellSlots.some((slot) => slot.state === "black")) {
    return {
      index,
      startTime,
      endTime,
      state: "unavailable",
    };
  }

  const cell = getCellState(day.slots, index);

  if (cell.state !== "colored") {
    return {
      index,
      startTime,
      endTime,
      state: "free",
    };
  }

  const coloredSlot = cellSlots.find((slot) => slot.state === "colored");
  const task = coloredSlot?.taskId ? taskById.get(coloredSlot.taskId) : null;
  const projectId = normalizeGlobalProjectId(task?.projectId, task?.projectName);

  return {
    index,
    startTime,
    endTime,
    state: "colored",
    projectId: projectId ?? undefined,
    projectName:
      (projectId ? projectById.get(projectId) : undefined) ??
      task?.projectName,
    taskName: task?.taskName,
    note: task?.description,
  };
}

function formatPlanningTime(minute: number): string {
  if (minute >= MINUTES_PER_DAY) {
    return "24:00";
  }

  return minuteToTime(minute);
}
