"use client";

import { getCellsForCanvas, type CellCanvasMode, type CellView } from "@/lib/cells";
import { getTaskProjectName } from "@/lib/projects";
import type { DayRecord } from "@/types/canvas";

type CellCanvasProps = {
  mode: CellCanvasMode;
  day: DayRecord | null;
  selectedProjectId?: string;
  selectedCellIndices: number[];
  editable: boolean;
  quotaReady: boolean;
  compact?: boolean;
  onToggleCell: (cellIndex: number) => void;
};

const modeTitles: Record<CellCanvasMode, string> = {
  am: "A.M. Cell Canvas",
  pm: "P.M. Cell Canvas",
};

export function CellCanvas({
  mode,
  day,
  selectedProjectId,
  selectedCellIndices,
  editable,
  quotaReady,
  compact = false,
  onToggleCell,
}: CellCanvasProps) {
  const cells = day ? getCellsForCanvas(day.slots, mode) : [];
  const taskById = new Map((day?.tasks ?? []).map((task) => [task.id, task]));

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A] sm:p-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>
            {modeTitles[mode]}
          </h2>
          <p className="text-sm font-bold text-[#4a4a4a]">
            24 half-hour cells for click painting.
          </p>
        </div>
        <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          {mode === "am" ? "00:00-12:00" : "12:00-24:00"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {cells.map((cell) => {
          const selected = selectedCellIndices.includes(cell.cellIndex);
          const task = cell.taskId ? taskById.get(cell.taskId) : undefined;
          const blocked =
            cell.state === "black" ||
            cell.state === "colored" ||
            cell.isMixed;
          const disabled =
            !editable ||
            !selectedProjectId ||
            (!quotaReady && !blocked);

          return (
            <CellButton
              key={cell.cellIndex}
              cell={cell}
              disabled={disabled}
              blocked={blocked}
              selected={selected}
              projectName={
                task && day ? getTaskProjectName(day, task) : undefined
              }
              compact={compact}
              onToggleCell={onToggleCell}
            />
          );
        })}
      </div>
    </section>
  );
}

function CellButton({
  cell,
  disabled,
  blocked,
  selected,
  projectName,
  compact,
  onToggleCell,
}: {
  cell: CellView;
  disabled: boolean;
  blocked: boolean;
  selected: boolean;
  projectName?: string;
  compact: boolean;
  onToggleCell: (cellIndex: number) => void;
}) {
  const isBlack = cell.state === "black";
  const label =
    cell.state === "colored"
      ? projectName ?? "Painted project time"
      : cell.state === "black"
        ? "Black canvas"
        : cell.isMixed
          ? "Mixed"
          : "Free";
  const ariaLabel = getCellAriaLabel(cell, label, selected);

  return (
    <button
      type="button"
      disabled={disabled && !selected}
      aria-pressed={selected}
      onClick={() => onToggleCell(cell.cellIndex)}
      aria-label={ariaLabel}
      data-testid={`cell-${cell.cellIndex}`}
      className={`${compact ? "min-h-[50px] p-1.5" : "min-h-[72px] p-2"} border-2 border-[#1A1A1A] text-left transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] ${
        selected
          ? "shadow-[4px_4px_0_#1A1A1A] ring-4 ring-[#FFD91A]"
          : cell.state === "colored"
            ? "shadow-[2px_2px_0_#1A1A1A]"
            : "shadow-none"
      } ${disabled || blocked ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1A1A1A]"}`}
      style={{
        backgroundColor: cell.color,
        backgroundImage: isBlack
          ? "repeating-linear-gradient(135deg, #1A1A1A 0, #1A1A1A 6px, #3A3A3A 6px, #3A3A3A 12px)"
          : cell.isMixed
            ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 6px, transparent 6px, transparent 12px)"
            : undefined,
      }}
    >
      <span
        className={`block font-black leading-tight ${compact ? "text-[11px]" : "text-xs"} ${
          cell.state === "black" ? "text-white" : "text-[#1A1A1A]"
        }`}
      >
        {cell.label}
      </span>
      <span
        className={`${compact ? "mt-0.5" : "mt-1"} block truncate font-bold leading-tight ${compact ? "text-[11px]" : "text-xs"} ${
          cell.state === "black" ? "text-white" : "text-[#1A1A1A]"
        }`}
      >
        {selected ? "Selected" : label}
      </span>
    </button>
  );
}

function getCellAriaLabel(
  cell: CellView,
  label: string,
  selected: boolean,
): string {
  const timeRange = cell.label.replace("-", "–");

  if (cell.state === "black") {
    return `${timeRange}, black canvas, unavailable`;
  }

  if (cell.state === "colored") {
    return `${timeRange}, ${label}, painted`;
  }

  if (cell.isMixed) {
    return `${timeRange}, mixed canvas`;
  }

  return `${timeRange}, free canvas${selected ? ", selected" : ""}`;
}
