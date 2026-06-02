import type { CanvasSummary, ColorUsage } from "@/lib/canvas-segments";

type CanvasLegendProps = {
  summary: CanvasSummary;
  title: string;
};

export function CanvasLegend({ summary, title }: CanvasLegendProps) {
  const visibleUsage = summary.colorUsage.filter((usage) => usage.minutes > 0);

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {visibleUsage.map((usage) => (
          <LegendRow key={`${usage.state}-${usage.color}`} usage={usage} />
        ))}
      </div>
    </section>
  );
}

function LegendRow({ usage }: { usage: ColorUsage }) {
  return (
    <div className="flex items-center justify-between gap-3 border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-7 w-7 shrink-0 rounded-full border-2 border-[#1A1A1A]"
          style={{ backgroundColor: usage.color }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-black">{getUsageLabel(usage)}</p>
          <p className="text-xs font-bold text-[#4a4a4a]">{usage.color}</p>
        </div>
      </div>
      <p className="shrink-0 text-right text-sm font-black">
        {usage.minutes} min
        <br />
        <span className="text-[#2F5FBF]">{formatPercent(usage.percent)}</span>
      </p>
    </div>
  );
}

function getUsageLabel(usage: ColorUsage): string {
  if (usage.state === "white") {
    return "White / Free time";
  }

  if (usage.state === "black") {
    return "Black / Unavailable";
  }

  return "Project Color";
}

function formatPercent(percent: number): string {
  return `${percent.toFixed(1).replace(".0", "")}%`;
}
