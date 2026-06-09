"use client";

import type {
  ProjectFile,
  ProjectFileProgress,
} from "@/lib/project-files";

type ProjectFileBlockGridProps = {
  projectFile: ProjectFile;
  progress: ProjectFileProgress;
  onToggleBlock: (blockIndex: number) => void;
};

export function ProjectFileBlockGrid({
  projectFile,
  progress,
  onToggleBlock,
}: ProjectFileBlockGridProps) {
  const recommendedToday = new Set(progress.todayRecommendedBlockIndexes);

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
              className={`aspect-square min-h-9 border-2 border-[#1A1A1A] text-[10px] font-black leading-none transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] ${
                block.completed
                  ? "bg-[#8BCF3F]"
                  : recommended
                    ? "bg-[#FFD91A]"
                    : "bg-white"
              }`}
            >
              {block.index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <LegendChip colorClass="bg-[#8BCF3F]" label="Completed" />
        <LegendChip colorClass="bg-[#FFD91A]" label="Recommended today" />
        <LegendChip colorClass="bg-white" label="Remaining" />
      </div>
    </section>
  );
}

function LegendChip({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#FBFBF7] px-2 py-1">
      <span
        className={`h-3 w-3 border-2 border-[#1A1A1A] ${colorClass}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
