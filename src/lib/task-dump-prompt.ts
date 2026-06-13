import { cellIndexToMinuteRange, CELLS_PER_DAY, getCellState } from "@/lib/cells";
import {
  getActiveProjects,
  normalizeGlobalProjectId,
  type CanvasSettings,
} from "@/lib/settings";
import { getTaskDumpItems, getTaskDumpSummary } from "@/lib/task-dump";
import { MINUTES_PER_DAY, minuteToTime } from "@/lib/time";
import type { DayRecord, TaskRecord } from "@/types/canvas";

export type TaskDumpPlanningBlock = {
  index: number;
  startTime: string;
  endTime: string;
  state: "free" | "black" | "colored";
  projectId?: string;
  projectName?: string;
  taskName?: string;
  note?: string;
};

export type TaskDumpPlanningData = {
  date: string;
  totalBlocks: 48;
  freeBlockCount: number;
  blackBlockCount: number;
  coloredBlockCount: number;
  freeBlockIndexes: number[];
  canvasBlocks: TaskDumpPlanningBlock[];
  projects: Array<{
    id: string;
    name: string;
    ratio: number;
    color: string;
  }>;
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
  const projects = getActiveProjects(settings.projects).map((project) => ({
    id: project.id,
    name: project.name,
    ratio: project.ratio,
    color: project.color,
  }));
  const projectById = new Map(
    settings.projects.map((project) => [project.id, project.name]),
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
    blackBlockCount: canvasBlocks.filter((block) => block.state === "black")
      .length,
    coloredBlockCount: canvasBlocks.filter((block) => block.state === "colored")
      .length,
    freeBlockIndexes,
    canvasBlocks,
    projects,
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
* Black blocks are black cells and cannot be used.
* Colored blocks are already assigned and must not be changed.

Your task:

1. Use only the tasks from taskDump.
2. Place those tasks only into freeBlockIndexes.
3. Do not use black blocks.
4. Do not modify colored blocks.
5. Do not invent new tasks.
6. Do not assign tasks outside the provided block counts.
7. Respect each task's blockCount exactly.
8. Each task's blockCount is the total number of 30-minute blocks required.
9. Tasks with blockCount greater than 1 may be split across non-consecutive blocks. blockCount is a quota, not a contiguity requirement.
10. Do not assume blocks for the same task must be adjacent.
11. Place each task wherever it fits best.
12. Only make blocks consecutive if the note clearly says the task needs continuous focus.
13. The total number of assigned blocks for each task must exactly equal blockCount.
14. Use the notes as context.
15. If the task dump cannot fit, explain why.
16. Return both a readable schedule and a JSON assignment.
17. For every assigned block, classify it into projectId.
18. projectId must be one of the ids from the projects array.
19. Use taskName and note to choose the best project.
20. Do not ask the user for project.
21. Do not invent new project IDs.
22. If unsure, choose the closest matching project from the projects array.
23. The JSON assignment must be valid JSON.
24. Do not wrap the JSON assignment in extra commentary inside the JSON block.

Project classification:

* The projects array contains the only available project IDs.
* Choose projectId from the provided projects list.
* Use each project name, taskName, note, and current canvas state as context.

The user intentionally did not provide project labels in taskDump. You must infer them from taskName and note.
If unsure, choose the closest matching project from the projects array.

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
"taskName": "Task name",
"note": "Optional note",
"projectId": "existing-project-id"
}
]
}

JSON assignment expectations:

* Keep JSON assignment as one item per block.
* The same taskName may appear multiple times.
* Repeated taskName is valid and counts toward that task's blockCount.
* The same blockIndex must not repeat.
* Assigned blocks for the same task do not need to be consecutive.

Important:

* Base your answer only on the JSON.
* Do not invent project IDs.
* projectId is required for every assignment.
* projectId must exist in the projects array.
* Do not alter existing colored or black blocks.
* Only fill white/free blocks.
* Each taskName must match a taskName from taskDump.
* The total number of assigned blocks for each task must equal its blockCount.
* The total number of assigned blocks must equal taskDumpSummary.dumpedBlockCount.

Here is the JSON data:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``;
}

function buildTaskDumpPlanningBlock(
  day: DayRecord,
  index: number,
  taskById: Map<string, TaskRecord>,
  projectById: Map<string, string>,
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
      state: "black",
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
