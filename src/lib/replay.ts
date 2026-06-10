import { getCellState } from "@/lib/cells";
import { getProjectUsageFromSlots } from "@/lib/projects";
import { getDefaultSettings } from "@/lib/settings";
import type { DayRecord, ProjectRecord } from "@/types/canvas";

export type ReplayRange = 7 | 14 | 30;

export type ReplayDaySummary = {
  date: string;
  coloredCells: number;
  freeCells: number;
  unavailableCells: number;
  academicCells: number;
  professionalCells: number;
  personalCells: number;
  themeDayName?: string;
};

export type ReplaySummary = {
  rangeStart: string;
  rangeEnd: string;
  daysCount: number;
  totalColoredCells: number;
  totalUnavailableCells: number;
  averageColoredCellsPerDay: number;
  mostUsedProject?: string;
  mostCommonTheme?: string;
  highestUnavailableDay?: string;
  highestAcademicDay?: string;
  highestProfessionalDay?: string;
  highestPersonalDay?: string;
};

export function getReplayDays(
  days: DayRecord[],
  rangeDays: ReplayRange = 7,
): DayRecord[] {
  const endDate = getTodayDateKey();
  const startDate = addDays(endDate, -(rangeDays - 1));

  return days
    .filter((day) => day.date >= startDate && day.date <= endDate)
    .sort((first, second) => first.date.localeCompare(second.date));
}

export function summarizeReplayDay(
  day: DayRecord,
  projects: ProjectRecord[] = getDefaultSettings().projects,
): ReplayDaySummary {
  const usage = getProjectUsageFromSlots(day, projects);
  const cellCounts = {
    coloredCells: 0,
    freeCells: 0,
    unavailableCells: 0,
  };

  for (let cellIndex = 0; cellIndex < 48; cellIndex += 1) {
    const cell = getCellState(day.slots, cellIndex);

    if (cell.state === "black") {
      cellCounts.unavailableCells += 1;
    } else if (cell.state === "colored") {
      cellCounts.coloredCells += 1;
    } else {
      cellCounts.freeCells += 1;
    }
  }

  return {
    date: day.date,
    ...cellCounts,
    academicCells:
      usage.find((projectUsage) => projectUsage.projectId === "academic")
        ?.paintedCells ?? 0,
    professionalCells:
      usage.find((projectUsage) => projectUsage.projectId === "professional")
        ?.paintedCells ?? 0,
    personalCells:
      usage.find((projectUsage) => projectUsage.projectId === "personal")
        ?.paintedCells ?? 0,
    themeDayName: day.themeDayName,
  };
}

export function summarizeReplayRange(
  days: DayRecord[],
  rangeDays: ReplayRange,
  projects: ProjectRecord[] = getDefaultSettings().projects,
): {
  daySummaries: ReplayDaySummary[];
  summary: ReplaySummary;
} {
  const replayDays = getReplayDays(days, rangeDays);
  const daySummaries = replayDays.map((day) => summarizeReplayDay(day, projects));
  const rangeEnd = getTodayDateKey();
  const rangeStart = addDays(rangeEnd, -(rangeDays - 1));
  const projectTotals = [
    {
      name: projects.find((project) => project.id === "academic")?.name ?? "School",
      cells: sum(daySummaries.map((day) => day.academicCells)),
    },
    {
      name: projects.find((project) => project.id === "professional")?.name ?? "Work",
      cells: sum(daySummaries.map((day) => day.professionalCells)),
    },
    {
      name: projects.find((project) => project.id === "personal")?.name ?? "Personal",
      cells: sum(daySummaries.map((day) => day.personalCells)),
    },
  ];
  const mostUsedProject = [...projectTotals].sort(
    (first, second) => second.cells - first.cells,
  )[0];

  return {
    daySummaries,
    summary: {
      rangeStart,
      rangeEnd,
      daysCount: daySummaries.length,
      totalColoredCells: sum(daySummaries.map((day) => day.coloredCells)),
      totalUnavailableCells: sum(
        daySummaries.map((day) => day.unavailableCells),
      ),
      averageColoredCellsPerDay:
        daySummaries.length === 0
          ? 0
          : Math.round(
              (sum(daySummaries.map((day) => day.coloredCells)) /
                daySummaries.length) *
                10,
            ) / 10,
      mostUsedProject:
        mostUsedProject && mostUsedProject.cells > 0
          ? mostUsedProject.name
          : undefined,
      mostCommonTheme: getMostCommon(
        daySummaries
          .map((day) => day.themeDayName)
          .filter((theme): theme is string => !!theme),
      ),
      highestUnavailableDay: getHighestDay(daySummaries, "unavailableCells"),
      highestAcademicDay: getHighestDay(daySummaries, "academicCells"),
      highestProfessionalDay: getHighestDay(daySummaries, "professionalCells"),
      highestPersonalDay: getHighestDay(daySummaries, "personalCells"),
    },
  };
}

export function buildReplayReviewPrompt(input: {
  summary: ReplaySummary;
  daySummaries: ReplayDaySummary[];
}): string {
  return `You are helping me review a Canvas Ratio replay range.

Canvas Ratio meaning:
- A day has 48 blocks.
- Free blocks are flexible time.
- Unavailable blocks are time that could not be used.
- Colored blocks are intentional project time.
- Ratios are recommendations, not limits.
- Replay is local history, not a score.

Your task:
1. Summarize the range.
2. Identify repeated patterns.
3. Compare project distribution.
4. Identify days with many interruptions.
5. Suggest one practical improvement for next week.
6. Do not shame me.
7. Do not invent data.

Here is the JSON data:

\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\``;
}

function getTodayDateKey(): string {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function getMostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0];
}

function getHighestDay(
  days: ReplayDaySummary[],
  key:
    | "unavailableCells"
    | "academicCells"
    | "professionalCells"
    | "personalCells",
): string | undefined {
  const highest = [...days].sort((first, second) => second[key] - first[key])[0];

  return highest && highest[key] > 0 ? highest.date : undefined;
}
