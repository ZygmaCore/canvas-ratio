import { expandMinuteRange } from "@/lib/blocks";
import {
  createCanvasSegments,
  summarizeCanvas,
  summarizeSlots,
} from "@/lib/canvas-segments";
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
import type { CanvasSlotState, DayRecord, TimeBlock } from "@/types/canvas";

type DayDebugPanelProps = {
  dateKey: string;
  day: DayRecord | null;
  status: DayStatus;
  editable: boolean;
  loading: boolean;
};

export function DayDebugPanel({
  dateKey,
  day,
  status,
  editable,
  loading,
}: DayDebugPanelProps) {
  const whiteSlotCount = countSlotsByState(day, "white");
  const blackSlotCount = countSlotsByState(day, "black");
  const coloredSlotCount = countSlotsByState(day, "colored");
  const slots = day?.slots ?? [];
  const amSegments = createCanvasSegments(slots, "am");
  const pmSegments = createCanvasSegments(slots, "pm");
  const amSummary = summarizeCanvas(slots, "am");
  const pmSummary = summarizeCanvas(slots, "pm");
  const fullDaySummary = summarizeSlots(slots);
  const ratioValidation = validateProjectRatios(day?.projects ?? []);
  const projectUsage = day ? getProjectUsageFromSlots(day) : [];
  const journal = day?.journal;
  const missingProjectTaskCount = (day?.tasks ?? []).filter(
    (task) =>
      !task.projectId ||
      !(day?.projects ?? []).some((project) => project.id === task.projectId),
  ).length;
  const migratedTaskCount = (day?.tasks ?? []).filter((task) =>
    task.projectId?.startsWith("project-"),
  ).length;
  const blackCellCount = getBlackCellIndices(slots).length;
  const whiteCellCount = getWhiteCellIndices(slots).length;
  const coloredCellCount = getColoredCellIndices(slots).length;
  const paintableCellCount = getPaintableCellIndices(slots).length;
  const sleepDuration = getBlocksDuration(day?.sleepBlocks ?? []);
  const randomEventDuration = getBlocksDuration(day?.randomEventBlocks ?? []);
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
  const wrappedBlocks = [
    ...(day?.sleepBlocks ?? []),
    ...(day?.randomEventBlocks ?? []),
  ].filter((block) => block.startMinute > block.endMinute);

  const items = [
    ["Selected date", dateKey],
    ["Day status", status],
    ["Editable", String(editable)],
    ["Total slots", String(day?.slots.length ?? 0)],
    ["White slots", String(whiteSlotCount)],
    ["Black slots", String(blackSlotCount)],
    ["Colored slots", String(coloredSlotCount)],
    ["Sleep blocks", String(day?.sleepBlocks.length ?? 0)],
    ["Random events", String(day?.randomEventBlocks.length ?? 0)],
    ["Sleep block duration", String(sleepDuration)],
    ["Random event duration", String(randomEventDuration)],
    ["Total black block duration", String(sleepDuration + randomEventDuration)],
    ["Wrapped blocks", String(wrappedBlocks.length)],
    ["Project count", String(day?.projects.length ?? 0)],
    ["Project ratio total", `${ratioValidation.total}/100`],
    ["Project ratio ready", String(ratioValidation.valid)],
    ["Paintable cells", String(paintableCellCount)],
    ["White cells", String(whiteCellCount)],
    ["Black cells", String(blackCellCount)],
    ["Colored cells", String(coloredCellCount)],
    ["Missing project tasks", String(missingProjectTaskCount)],
    ["Migrated task hints", String(migratedTaskCount)],
    [
      "Quota cells total",
      String(
        projectUsage.reduce(
          (totalCells, usage) => totalCells + usage.quotaCells,
          0,
        ),
      ),
    ],
    ["Task count", String(day?.tasks.length ?? 0)],
    ["Assigned task minutes", String(assignedTaskMinutes)],
    ["Effective painted task minutes", String(effectiveTaskMinutes)],
    ["Colored task minutes", String(fullDaySummary.coloredMinutes)],
    ["Covered by black minutes", String(coveredTaskMinutes)],
    ["Journal present", String(Boolean(journal))],
    ["Journal source", journal?.source ?? "none"],
    ["Journal model", journal?.model ?? "none"],
    ["Journal created at", journal?.createdAt ?? "none"],
    ["Journal snapshot present", String(Boolean(journal?.inputSnapshot))],
    ["Created at", day?.createdAt ?? "none"],
    ["Updated at", day?.updatedAt ?? "none"],
    ["A.M. segments", String(amSegments.length)],
    ["P.M. segments", String(pmSegments.length)],
    ["A.M. white minutes", String(amSummary.whiteMinutes)],
    ["A.M. black minutes", String(amSummary.blackMinutes)],
    ["A.M. colored minutes", String(amSummary.coloredMinutes)],
    ["P.M. white minutes", String(pmSummary.whiteMinutes)],
    ["P.M. black minutes", String(pmSummary.blackMinutes)],
    ["P.M. colored minutes", String(pmSummary.coloredMinutes)],
    ["Full-day white minutes", String(fullDaySummary.whiteMinutes)],
    ["Full-day black minutes", String(fullDaySummary.blackMinutes)],
    ["Full-day colored minutes", String(fullDaySummary.coloredMinutes)],
    ["localStorage key", getDayStorageKey(dateKey)],
  ];

  return (
    <section className="mt-6 rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-black">Day 7 journal/storage panel</h2>
        <p className="text-sm font-bold text-[#4a4a4a]">
          {loading
            ? "Loading day record..."
            : "Projects, cells, Pomodoro, journal, and renderer ready"}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
