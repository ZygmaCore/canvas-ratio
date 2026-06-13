"use client";

import type {
  ProjectFile,
  ProjectFileProgress,
} from "@/lib/project-files";
import { getReadableTextColor } from "@/lib/project-files";

type ProjectFileBlockGridProps = {
  projectFile: ProjectFile;
  progress: ProjectFileProgress;
  projectColor: string;
  onToggleBlock: (blockIndex: number) => void;
};

export function ProjectFileBlockGrid({
  projectFile,
  progress,
  projectColor,
  onToggleBlock,
}: ProjectFileBlockGridProps) {
  const recommendedToday = new Set(progress.todayRecommendedBlockIndexes);
  const completedTextColor = getReadableTextColor(projectColor);

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Progress Blocks
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {projectFile.totalTarget} {projectFile.unitName}
          </h2>
        </div>
        <span className="w-fit border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          Tap to complete
        </span>
      </div>

      <div
        className="mt-4 grid gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(2.25rem, 1fr))",
        }}
      >
        {projectFile.blocks.map((block) => {
          const recommended = recommendedToday.has(block.index);

          return (
            <button
              key={block.index}
              type="button"
              aria-pressed={block.completed}
              aria-label={`${projectFile.unitName} ${block.index + 1}, ${
                block.completed ? "completed" : "incomplete"
              }`}
              title={`${projectFile.unitName} ${block.index + 1}`}
              onClick={() => onToggleBlock(block.index)}
              className="aspect-square min-h-9 border-2 border-[#1A1A1A] text-[10px] font-black leading-none transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              style={{
                backgroundColor: block.completed
                  ? projectColor
                  : recommended
                    ? "#FFD91A"
                    : "#FFFFFF",
                color: block.completed ? completedTextColor : "#1A1A1A",
              }}
            >
              {block.index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <LegendChip color={projectColor} label="Completed" />
        <LegendChip color="#FFD91A" label="Recommended today" />
        <LegendChip color="#FFFFFF" label="Remaining" />
      </div>
    </section>
  );
}

function LegendChip({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#FBFBF7] px-2 py-1">
      <span
        className="h-3 w-3 border-2 border-[#1A1A1A]"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
