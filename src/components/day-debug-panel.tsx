import { expandMinuteRange } from "@/lib/blocks";
import {
  getBlackCellIndices,
  getColoredCellIndices,
  getPaintableCellIndices,
  getWhiteCellIndices,
} from "@/lib/cells";
import type { DayStatus } from "@/lib/day";
import { getProjectUsageFromSlots, validateProjectRatios } from "@/lib/projects";
import { getDayStorageKey } from "@/lib/storage";
import { getTaskEffectivePaintedMinutes } from "@/lib/tasks";
import type {
  CanvasSlotState,
  DayRecord,
  ProjectRecord,
  TimeBlock,
} from "@/types/canvas";

type DayDebugPanelProps = {
  dateKey: string;
  day: DayRecord | null;
  projects: ProjectRecord[];
  status: DayStatus;
  editable: boolean;
  loading: boolean;
};

export function DayDebugPanel({
  dateKey,
  day,
  projects,
  status,
  editable,
  loading,
}: DayDebugPanelProps) {
  const slots = day?.slots ?? [];
  const ratioValidation = validateProjectRatios(projects);
  const projectUsage = day ? getProjectUsageFromSlots(day, projects) : [];
  const whiteSlotCount = countSlotsByState(day, "white");
  const blackSlotCount = countSlotsByState(day, "black");
  const coloredSlotCount = countSlotsByState(day, "colored");
  const blackBlockCount =
    (day?.sleepBlocks.length ?? 0) + (day?.randomEventBlocks.length ?? 0);
  const blackBlockDuration =
    getBlocksDuration(day?.sleepBlocks ?? []) +
    getBlocksDuration(day?.randomEventBlocks ?? []);
  const assignedTaskMinutes = (day?.tasks ?? []).reduce(
    (totalMinutes, task) => totalMinutes + (task.assignedMinutes?.length ?? 0),
    0,
  );
  const effectiveTaskMinutes = (day?.tasks ?? []).reduce(
    (totalMinutes, task) =>
      totalMinutes + (day ? getTaskEffectivePaintedMinutes(day.slots, task.id) : 0),
    0,
  );
  const coveredTaskMinutes = Math.max(
    0,
    assignedTaskMinutes - effectiveTaskMinutes,
  );
  const quotaCellTotal = projectUsage.reduce(
    (totalCells, usage) => totalCells + usage.quotaCells,
    0,
  );
  const items = [
    ["Date", dateKey],
    ["Status", status],
    ["Editable", String(editable)],
    ["Loading", String(loading)],
    ["Slots", String(day?.slots.length ?? 0)],
    ["White slots", String(whiteSlotCount)],
    ["Black slots", String(blackSlotCount)],
    ["Colored slots", String(coloredSlotCount)],
    ["White cells", String(getWhiteCellIndices(slots).length)],
    ["Black cells", String(getBlackCellIndices(slots).length)],
    ["Colored cells", String(getColoredCellIndices(slots).length)],
    ["Paintable cells", String(getPaintableCellIndices(slots).length)],
    ["Projects", String(projects.length)],
    ["Ratio total", `${ratioValidation.total}/100`],
    ["Ratio ready", String(ratioValidation.valid)],
    ["Quota cells", String(quotaCellTotal)],
    ["Tasks", String(day?.tasks.length ?? 0)],
    ["Black blocks", String(blackBlockCount)],
    ["Black block minutes", String(blackBlockDuration)],
    ["Covered task minutes", String(coveredTaskMinutes)],
    ["Pomodoro", "Automatic 25/5 clock"],
    ["Journal", day?.journal?.source ?? "none"],
    ["Pixel story", day?.generatedImage?.source ?? "none"],
    ["Storage key", getDayStorageKey(dateKey)],
  ];

  return (
    <section>
      <details className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
        <summary className="cursor-pointer text-lg font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]">
          Developer Details
        </summary>
        <p className="mt-3 text-sm font-bold text-[#4a4a4a]">
          Compact diagnostics for storage, quotas, and renderer state.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3"
            >
              <dt className="text-xs font-black uppercase text-[#2F5FBF]">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}

function countSlotsByState(
  day: DayRecord | null,
  state: CanvasSlotState,
): number {
  return day?.slots.filter((slot) => slot.state === state).length ?? 0;
}

function getBlocksDuration(blocks: TimeBlock[]): number {
  return blocks.reduce(
    (totalMinutes, block) =>
      totalMinutes + expandMinuteRange(block.startMinute, block.endMinute).length,
    0,
  );
}
