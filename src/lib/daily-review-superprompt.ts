import { cellIndexToMinuteRange, getCellState } from "@/lib/cells";
import { getEnergyForCell } from "@/lib/energy";
import { calculateMomentum, type MomentumSummary } from "@/lib/momentum";
import { getProjectUsageFromSlots } from "@/lib/projects";
import { calculateRealityGap, type RealityGapSummary } from "@/lib/reality-gap";
import { normalizeGlobalProjectId, type CanvasSettings } from "@/lib/settings";
import { loadAllDayRecords } from "@/lib/storage";
import { getThemeSummaryForDay } from "@/lib/theme-days";
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
  energyLevel?: "high" | "medium" | "low" | "unspecified";
  energyNote?: string;
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
  theme?: ReturnType<typeof getThemeSummaryForDay>;
  recommendationSummary: Array<{
    projectId: DailyReviewProjectId;
    projectName: string;
    recommendedCells: number;
    coloredCells: number;
    differenceCells: number;
    status: "over recommendation" | "under recommendation" | "on recommendation";
  }>;
  energySummary: {
    high: number;
    medium: number;
    low: number;
    unspecified: number;
  };
  realityGap?: RealityGapSummary | null;
  momentum?: MomentumSummary | null;
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
  const recommendationSummary = getProjectUsageFromSlots(day, settings.projects)
    .map((usage) => {
      const projectId = normalizeGlobalProjectId(
        usage.projectId,
        usage.projectName,
      );

      if (!projectId) {
        return null;
      }

      return {
        projectId,
        projectName: usage.projectName,
        recommendedCells: usage.recommendedCells,
        coloredCells: usage.paintedCells,
        differenceCells: usage.differenceCells,
        status:
          usage.differenceCells > 0
            ? "over recommendation"
            : usage.differenceCells < 0
              ? "under recommendation"
              : "on recommendation",
      };
    })
    .filter(
      (summaryItem): summaryItem is DailyReviewData["recommendationSummary"][number] =>
        !!summaryItem,
    );
  const realityGap = calculateRealityGap(day, settings.projects);
  const savedDays = loadAllDayRecords();
  const momentum = savedDays.length > 0
    ? calculateMomentum(savedDays, { projects: settings.projects })
    : null;
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
    theme: getThemeSummaryForDay(day),
    recommendationSummary,
    energySummary: {
      high: blocks.filter((block) => block.energyLevel === "high").length,
      medium: blocks.filter((block) => block.energyLevel === "medium").length,
      low: blocks.filter((block) => block.energyLevel === "low").length,
      unspecified: blocks.filter(
        (block) => !block.energyLevel || block.energyLevel === "unspecified",
      ).length,
    },
    realityGap,
    momentum,
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
- Ratios are recommendations, not limits.
- The user may intentionally paint over or under the recommendation.
- Energy, momentum, and reality gap are context signals, not moral judgments.
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
9. Analyze whether difficult work was placed during high-energy periods.
10. Compare planned vs actual objectively if reality gap data exists.
11. Explain what shifted without shame.
12. Do not shame low-energy periods.
13. Do not invent tasks or events.
14. Base your review only on the JSON.

Output format:
- Daily Summary
- Ratio Reflection
- Theme Context
- Energy Context
- Reality Gap
- Momentum Context
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
  const energy = getEnergyForCell(day, index);

  if (cellSlots.some((slot) => slot.state === "black")) {
    return {
      index,
      startTime,
      endTime,
      state: "unavailable",
      isBlack: true,
      color: "#1A1A1A",
      energyLevel: energy.level,
      energyNote: energy.note,
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
      energyLevel: energy.level,
      energyNote: energy.note,
    };
  }

  return {
    index,
    startTime,
    endTime,
    state: "free",
    isFree: true,
    color: "#FFFFFF",
    energyLevel: energy.level,
    energyNote: energy.note,
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
