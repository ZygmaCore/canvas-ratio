import { getProjectUsageFromSlots } from "@/lib/projects";
import { getDefaultSettings, type GlobalProjectId } from "@/lib/settings";
import type { DayRecord, ProjectRecord } from "@/types/canvas";

export type MomentumTrend =
  | "rising"
  | "stable"
  | "falling"
  | "insufficient-data";

export type MomentumSummary = {
  rangeDays: number;
  projects: Array<{
    projectId: GlobalProjectId;
    projectName: string;
    dailyCells: Array<{
      date: string;
      coloredCells: number;
    }>;
    averageCells: number;
    trend: MomentumTrend;
    momentumScore: number;
    message: string;
  }>;
};

export function calculateMomentum(
  days: DayRecord[],
  options: {
    rangeDays?: number;
    projects?: ProjectRecord[];
  } = {},
): MomentumSummary {
  const rangeDays = options.rangeDays ?? 7;
  const projects = options.projects ?? getDefaultSettings().projects;
  const recentDays = [...days]
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(-rangeDays);

  return {
    rangeDays,
    projects: projects.map((project) => {
      const dailyCells = recentDays.map((day) => {
        const usage = getProjectUsageFromSlots(day, projects).find(
          (projectUsage) => projectUsage.projectId === project.id,
        );

        return {
          date: day.date,
          coloredCells: usage?.paintedCells ?? 0,
        };
      });
      const trendDetails = calculateTrend(dailyCells.map((day) => day.coloredCells));

      return {
        projectId: project.id as GlobalProjectId,
        projectName: project.name,
        dailyCells,
        averageCells: average(dailyCells.map((day) => day.coloredCells)),
        trend: trendDetails.trend,
        momentumScore: trendDetails.momentumScore,
        message: getMomentumMessage(project.name, trendDetails.trend),
      };
    }),
  };
}

function calculateTrend(values: number[]): {
  trend: MomentumTrend;
  momentumScore: number;
} {
  if (values.length < 3 || values.every((value) => value === 0)) {
    return {
      trend: "insufficient-data",
      momentumScore: 0,
    };
  }

  const midpoint = Math.ceil(values.length / 2);
  const firstAverage = average(values.slice(0, midpoint));
  const secondAverage = average(values.slice(midpoint));
  const delta = secondAverage - firstAverage;
  const momentumScore = clamp(Math.round(delta * 10), -100, 100);

  if (delta >= 1) {
    return {
      trend: "rising",
      momentumScore,
    };
  }

  if (delta <= -1) {
    return {
      trend: "falling",
      momentumScore,
    };
  }

  return {
    trend: "stable",
    momentumScore,
  };
}

function getMomentumMessage(projectName: string, trend: MomentumTrend): string {
  if (trend === "rising") {
    return `${projectName} is showing more colored time recently.`;
  }

  if (trend === "falling") {
    return `${projectName} has less colored time recently. Missing a day is context, not judgment.`;
  }

  if (trend === "stable") {
    return `${projectName} is holding a steady recent rhythm.`;
  }

  return `${projectName} needs more saved days before a direction is useful.`;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    (values.reduce((total, value) => total + value, 0) / values.length) * 10,
  ) / 10;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
