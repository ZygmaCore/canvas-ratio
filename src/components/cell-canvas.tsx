"use client";

import type { CSSProperties } from "react";
import { getCellsForCanvas, type CellCanvasMode, type CellView } from "@/lib/cells";
import { getTaskProjectName } from "@/lib/projects";
import type { DayRecord } from "@/types/canvas";

type CellCanvasProps = {
  mode: CellCanvasMode;
  day: DayRecord | null;
  selectedProjectId?: string;
  selectedCellIndices: number[];
  editable: boolean;
  compact?: boolean;
  onToggleCell: (cellIndex: number) => void;
  onUnpaintCell: (cellIndex: number) => void;
};

const modeTitles: Record<CellCanvasMode, string> = {
  am: "A.M. Canvas",
  pm: "P.M. Canvas",
};

export function CellCanvas({
  mode,
  day,
  selectedProjectId,
  selectedCellIndices,
  editable,
  compact = false,
  onToggleCell,
  onUnpaintCell,
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
            Click white cells to paint. Click colored cells to clear them.
            Black blocks cannot be painted.
          </p>
        </div>
        <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          {mode === "am" ? "00:00-12:00" : "12:00-24:00"}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(58px,1fr))] gap-2">
        {cells.map((cell) => {
          const selected = selectedCellIndices.includes(cell.cellIndex);
          const task = cell.taskId ? taskById.get(cell.taskId) : undefined;
          const blocked = cell.state === "black";
          const disabled = !editable;
          const isTaskDumpCell = task?.source === "task-dump";

          return (
            <CellButton
              key={cell.cellIndex}
              cell={cell}
              disabled={disabled}
              blocked={blocked}
              selected={selected}
              projectName={
                isTaskDumpCell
                  ? task.taskName
                  : task && day
                    ? getTaskProjectName(day, task)
                    : undefined
              }
              sourceLabel={
                isTaskDumpCell ? "Scheduled from Task Dump" : undefined
              }
              note={task?.description}
              compact={compact}
              onToggleCell={onToggleCell}
              onUnpaintCell={onUnpaintCell}
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
  sourceLabel,
  note,
  compact,
  onToggleCell,
  onUnpaintCell,
}: {
  cell: CellView;
  disabled: boolean;
  blocked: boolean;
  selected: boolean;
  projectName?: string;
  sourceLabel?: string;
  note?: string;
  compact: boolean;
  onToggleCell: (cellIndex: number) => void;
  onUnpaintCell: (cellIndex: number) => void;
}) {
  const isBlack = cell.state === "black";
  const stateClass = {
    white: "cell-button--free",
    colored: "cell-button--colored",
    black: "cell-button--black",
  }[cell.state];
  const label =
    cell.state === "colored"
      ? projectName ?? "Colored project time"
      : cell.state === "black"
        ? "Black"
        : cell.isMixed
          ? "Mixed"
          : "Free";
  const displayLabel =
    selected ? "Selected" : cell.state === "colored" ? "Colored" : label;
  const ariaLabel = getCellAriaLabel(cell, label, selected, sourceLabel);
  const timeLabels = getCellTimeLabels(cell.label);
  const textClass = getReadableTextClass(cell);
  const title =
    sourceLabel && note
      ? `${sourceLabel}: ${label}. ${note}`
      : sourceLabel
        ? `${sourceLabel}: ${label}`
        : cell.state === "colored"
          ? label
        : undefined;

  return (
    <button
      type="button"
      disabled={disabled && !selected}
      aria-pressed={selected}
      onClick={() => {
        if (cell.state === "colored") {
          onUnpaintCell(cell.cellIndex);
          return;
        }

        onToggleCell(cell.cellIndex);
      }}
      aria-label={ariaLabel}
      title={title}
      data-testid={`cell-${cell.cellIndex}`}
      className={`cell-button ${stateClass} flex aspect-square min-w-0 flex-col items-center justify-center rounded-md border-2 border-[#1A1A1A] p-1 text-center focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] ${
        selected
          ? "shadow-[4px_4px_0_#1A1A1A] ring-4 ring-[#FFD91A]"
          : cell.state === "colored"
            ? "shadow-[2px_2px_0_#1A1A1A]"
            : "shadow-none"
      } ${disabled || blocked ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1A1A1A]"}`}
      style={{
        "--cell-stagger": String(cell.cellIndex % 12),
        backgroundColor: cell.color,
        backgroundImage: isBlack
          ? "repeating-linear-gradient(135deg, #1A1A1A 0, #1A1A1A 6px, #3A3A3A 6px, #3A3A3A 12px)"
          : cell.isMixed
            ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 6px, transparent 6px, transparent 12px)"
            : undefined,
      } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className={`relative z-10 flex flex-col items-center justify-center text-center font-mono font-black leading-none tabular-nums ${compact ? "text-[10px] sm:text-[11px]" : "text-xs"} ${textClass}`}
      >
        <span>{timeLabels.start}</span>
        <span>{timeLabels.end}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative z-10 mt-1 flex max-w-full items-center justify-center gap-1 text-center font-black leading-none ${compact ? "text-[9px] sm:text-[10px]" : "text-[11px]"} ${textClass}`}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full border border-current bg-current"
        />
        <span>{sourceLabel ? "Dump" : displayLabel}</span>
      </span>
    </button>
  );
}

function getCellAriaLabel(
  cell: CellView,
  label: string,
  selected: boolean,
  sourceLabel?: string,
): string {
  const timeRange = cell.label.replace("-", "–");

  if (cell.state === "black") {
    return `${timeRange}, black block`;
  }

  if (cell.state === "colored") {
    return sourceLabel
      ? `${timeRange}, ${label}, ${sourceLabel.toLowerCase()}, colored`
      : `${timeRange}, ${label}, colored`;
  }

  if (cell.isMixed) {
    return `${timeRange}, mixed canvas`;
  }

  return `${timeRange}, free time${selected ? ", selected" : ""}`;
}

function getCellTimeLabels(label: string): { start: string; end: string } {
  const [start, end] = label.split(/[-–]/);

  return {
    start: start?.trim() || label,
    end: end?.trim() || "",
  };
}

function getReadableTextClass(cell: CellView): string {
  if (cell.state === "black" || shouldUseLightText(cell.color)) {
    return "text-white";
  }

  return "text-[#1A1A1A]";
}

function shouldUseLightText(color: string): boolean {
  const match = /^#?([0-9a-f]{6})$/i.exec(color.trim());

  if (!match) {
    return false;
  }

  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance < 0.48;
}
