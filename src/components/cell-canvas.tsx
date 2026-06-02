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
  onToggleCell,
}: CellCanvasProps) {
  const cells = day ? getCellsForCanvas(day.slots, mode) : [];
  const taskById = new Map((day?.tasks ?? []).map((task) => [task.id, task]));

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">{modeTitles[mode]}</h2>
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
            !quotaReady;

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
  onToggleCell,
}: {
  cell: CellView;
  disabled: boolean;
  blocked: boolean;
  selected: boolean;
  projectName?: string;
  onToggleCell: (cellIndex: number) => void;
}) {
  const isBlack = cell.state === "black";
  const label =
    cell.state === "colored"
      ? projectName ?? "Painted"
      : cell.state === "black"
        ? "Black canvas"
        : cell.isMixed
          ? "Mixed"
          : "Free";

  return (
    <button
      type="button"
      disabled={disabled && !selected}
      onClick={() => onToggleCell(cell.cellIndex)}
      aria-label={`${cell.label} ${label}`}
      data-testid={`cell-${cell.cellIndex}`}
      className={`min-h-[72px] border-2 border-[#1A1A1A] p-2 text-left transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] ${
        selected
          ? "shadow-[4px_4px_0_#1A1A1A] ring-4 ring-[#FFD91A]"
          : "shadow-none"
      } ${disabled || blocked ? "cursor-not-allowed opacity-80" : "hover:-translate-y-0.5"}`}
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
        className={`block text-xs font-black ${
          cell.state === "black" ? "text-white" : "text-[#1A1A1A]"
        }`}
      >
        {cell.label}
      </span>
      <span
        className={`mt-1 block truncate text-xs font-bold ${
          cell.state === "black" ? "text-white" : "text-[#1A1A1A]"
        }`}
      >
        {selected ? "Selected" : label}
      </span>
    </button>
  );
}
