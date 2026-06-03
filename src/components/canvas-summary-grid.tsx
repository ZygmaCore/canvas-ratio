import type { CanvasSummary } from "@/lib/canvas-segments";
import { SummaryCard } from "@/components/summary-card";

type CanvasSummaryGridProps = {
  amSummary: CanvasSummary;
  pmSummary: CanvasSummary;
  fullDaySummary: CanvasSummary;
  compact?: boolean;
};

export function CanvasSummaryGrid({
  amSummary,
  pmSummary,
  fullDaySummary,
  compact = false,
}: CanvasSummaryGridProps) {
  const summaryItems = [
    {
      label: "Free time",
      value: `${fullDaySummary.whiteMinutes} min`,
      description: `${formatPercent(fullDaySummary.whitePercent)} of full day`,
    },
    {
      label: "Unavailable time",
      value: `${fullDaySummary.blackMinutes} min`,
      description: `${formatPercent(fullDaySummary.blackPercent)} of full day`,
    },
    {
      label: "Colored time",
      value: `${fullDaySummary.coloredMinutes} min`,
      description: `${formatPercent(fullDaySummary.coloredPercent)} of full day`,
    },
    {
      label: "Total canvas minutes",
      value: `${fullDaySummary.totalMinutes} min`,
      description: `A.M. ${amSummary.totalMinutes} min / P.M. ${pmSummary.totalMinutes} min`,
    },
  ];

  return (
    <section
      className={
        compact
          ? "grid gap-3 sm:grid-cols-2"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      }
    >
      {summaryItems.map((item) => (
        <SummaryCard
          key={item.label}
          label={item.label}
          value={item.value}
          description={item.description}
        />
      ))}
    </section>
  );
}

function formatPercent(percent: number): string {
  return `${percent.toFixed(1).replace(".0", "")}%`;
}
