import { cellIndexToMinuteRange, getCellState } from "@/lib/cells";
import { normalizeGlobalProjectId, type CanvasSettings } from "@/lib/settings";
import { minuteToTime } from "@/lib/time";
import type { DayRecord, TaskRecord, TimeBlock } from "@/types/canvas";

export type DailyReviewProjectId = "academic" | "professional" | "personal";

export type DailyReviewBlock = {
  index: number;
  startTime: string;
  endTime: string;
  state: "free" | "unavailable" | "colored";
  projectId?: DailyReviewProjectId;
  projectName?: string;
  taskName?: string;
  note?: string;
  isBlack?: boolean;
  isFree?: boolean;
  color?: string;
};

export type DailyReviewData = {
  date: string;
  timezone?: string;
  projects: Array<{
    id: DailyReviewProjectId;
    name: string;
    ratio: number;
    color: string;
  }>;
  summary: {
    totalBlocks: 48;
    freeBlocks: number;
    unavailableBlocks: number;
    coloredBlocks: number;
    academicBlocks: number;
    professionalBlocks: number;
    personalBlocks: number;
  };
  blocks: DailyReviewBlock[];
  tasks: Array<{
    taskId: string;
    taskName: string;
    projectId: string;
    projectName: string;
    blockIndexes: number[];
    totalBlocks: number;
    totalMinutes: number;
    note?: string;
  }>;
  blackBlocks: Array<{
    id: string;
    type: "sleep" | "random-event";
    title: string;
    startTime: string;
    endTime: string;
    note?: string;
  }>;
};

export function buildDailyReviewData(
  day: DayRecord,
  settings: CanvasSettings,
): DailyReviewData {
  const projects = settings.projects
    .map((project) => {
      const id = normalizeGlobalProjectId(project.id, project.name);

      if (!id) {
        return null;
      }

      return {
        id,
        name: project.name,
        ratio: project.ratio,
        color: project.color,
      };
    })
    .filter((project): project is DailyReviewData["projects"][number] => !!project);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const taskById = new Map(day.tasks.map((task) => [task.id, task]));
  const blocks = Array.from({ length: 48 }, (_, index) =>
    buildDailyReviewBlock(day, index, taskById, projectById),
  );
  const summary = {
    totalBlocks: 48 as const,
    freeBlocks: blocks.filter((block) => block.state === "free").length,
    unavailableBlocks: blocks.filter((block) => block.state === "unavailable")
      .length,
    coloredBlocks: blocks.filter((block) => block.state === "colored").length,
    academicBlocks: blocks.filter((block) => block.projectId === "academic")
      .length,
    professionalBlocks: blocks.filter(
      (block) => block.projectId === "professional",
    ).length,
    personalBlocks: blocks.filter((block) => block.projectId === "personal")
      .length,
  };

  return {
    date: day.date,
    timezone: getClientTimeZone(),
    projects,
    summary,
    blocks,
    tasks: buildDailyReviewTasks(day, blocks),
    blackBlocks: [...day.sleepBlocks, ...day.randomEventBlocks].map(
      buildDailyReviewBlackBlock,
    ),
  };
}

export function buildDailyReviewPrompt(data: DailyReviewData): string {
  return `You are helping me review my day using Canvas Ratio.

Canvas Ratio meaning:
- White/free blocks are unused flexible time.
- Black/unavailable blocks are sleep, random events, or time that could not be used.
- Colored blocks are intentional work assigned to School, Work, or Personal.
- Project ratios are recommended balance targets, not strict limits.
- The user may intentionally paint over or under the recommendation.
- Each block is 30 minutes.
- There are 48 blocks in a day.

Your task:
1. Analyze the day objectively.
2. Summarize how the day was spent.
3. Compare actual colored blocks against recommended project balance.
4. Identify what went well.
5. Identify what got interrupted.
6. Identify unused/free time patterns.
7. Give a short improvement suggestion for tomorrow.
8. Reflect over/under recommendation objectively.
9. Do not shame me.
10. Do not invent tasks or events.
11. Base your review only on the JSON.

Output format:
- Daily Summary
- Ratio Reflection
- Interruptions / Black Canvas
- Free Time Pattern
- What Went Well
- What To Improve Tomorrow
- One-line Conclusion

Here is the JSON data:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``;
}

function buildDailyReviewBlock(
  day: DayRecord,
  index: number,
  taskById: Map<string, TaskRecord>,
  projectById: Map<DailyReviewProjectId, DailyReviewData["projects"][number]>,
): DailyReviewBlock {
  const { startMinute, endMinute } = cellIndexToMinuteRange(index);
  const cellSlots = day.slots.filter(
    (slot) => slot.minute >= startMinute && slot.minute < endMinute,
  );
  const startTime = formatReviewTime(startMinute);
  const endTime = formatReviewTime(endMinute);

  if (cellSlots.some((slot) => slot.state === "black")) {
    return {
      index,
      startTime,
      endTime,
      state: "unavailable",
      isBlack: true,
      color: "#1A1A1A",
    };
  }

  const cell = getCellState(day.slots, index);
  const coloredSlot = cellSlots.find((slot) => slot.state === "colored");
  const task = coloredSlot?.taskId ? taskById.get(coloredSlot.taskId) : null;
  const projectId = normalizeGlobalProjectId(task?.projectId, task?.projectName);
  const project = projectId ? projectById.get(projectId) : undefined;

  if (cell.state === "colored" && task && projectId && project) {
    return {
      index,
      startTime,
      endTime,
      state: "colored",
      projectId,
      projectName: project.name,
      taskName: task.taskName,
      note: task.description,
      color: project.color,
    };
  }

  return {
    index,
    startTime,
    endTime,
    state: "free",
    isFree: true,
    color: "#FFFFFF",
  };
}

function buildDailyReviewTasks(
  day: DayRecord,
  blocks: DailyReviewBlock[],
): DailyReviewData["tasks"] {
  return day.tasks
    .map((task) => {
      const projectId =
        normalizeGlobalProjectId(task.projectId, task.projectName) ??
        task.projectId;
      const blockIndexes = getTaskBlockIndexes(day, task, blocks);

      return {
        taskId: task.id,
        taskName: task.taskName,
        projectId,
        projectName: task.projectName ?? projectId,
        blockIndexes,
        totalBlocks: blockIndexes.length,
        totalMinutes: blockIndexes.length * 30,
        note: task.description,
      };
    })
    .filter((task) => task.totalBlocks > 0);
}

function getTaskBlockIndexes(
  day: DayRecord,
  task: TaskRecord,
  blocks: DailyReviewBlock[],
): number[] {
  return blocks
    .filter((block) => {
      if (block.state !== "colored") {
        return false;
      }

      const { startMinute, endMinute } = cellIndexToMinuteRange(block.index);

      return day.slots.some(
        (slot) =>
          slot.minute >= startMinute &&
          slot.minute < endMinute &&
          slot.state === "colored" &&
          slot.taskId === task.id,
      );
    })
    .map((block) => block.index);
}

function buildDailyReviewBlackBlock(
  block: TimeBlock,
): DailyReviewData["blackBlocks"][number] {
  return {
    id: block.id,
    type: block.type,
    title: block.title,
    startTime: formatReviewTime(block.startMinute),
    endTime: formatReviewTime(block.endMinute),
    note: block.description,
  };
}

function formatReviewTime(minute: number): string {
  if (minute >= 1440) {
    return "24:00";
  }

  return minuteToTime(minute);
}

function getClientTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}
