import { expandMinuteRange } from "@/lib/blocks";
import { InlineMessage } from "@/components/inline-message";
import { BLACK_CANVAS } from "@/lib/palette";
import { formatMinuteRange } from "@/lib/time";
import type { TimeBlock } from "@/types/canvas";

type BlackBlockListProps = {
  sleepBlocks: TimeBlock[];
  randomEventBlocks: TimeBlock[];
  editable: boolean;
  onDeleteBlock: (blockId: string) => void;
};

export function BlackBlockList({
  sleepBlocks,
  randomEventBlocks,
  editable,
  onDeleteBlock,
}: BlackBlockListProps) {
  const hasBlocks = sleepBlocks.length > 0 || randomEventBlocks.length > 0;

  return (
    <section className="animate-panel-enter rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Black Blocks</h2>
          <p className="mt-1 text-sm font-bold">
            Sleep and random events become black time you cannot color.
          </p>
        </div>
        <span
          className="h-8 w-8 rounded-full border-2 border-[#1A1A1A]"
          style={{ backgroundColor: BLACK_CANVAS.hex }}
          aria-hidden="true"
        />
      </div>

      {!hasBlocks ? (
        <InlineMessage type="warning" className="mt-4">
          No black blocks yet.
        </InlineMessage>
      ) : null}

      <BlockSection
        title="Sleep Blocks"
        blocks={sleepBlocks}
        editable={editable}
        onDeleteBlock={onDeleteBlock}
      />
      <BlockSection
        title="Random Events"
        blocks={randomEventBlocks}
        editable={editable}
        onDeleteBlock={onDeleteBlock}
      />
    </section>
  );
}

function BlockSection({
  title,
  blocks,
  editable,
  onDeleteBlock,
}: {
  title: string;
  blocks: TimeBlock[];
  editable: boolean;
  onDeleteBlock: (blockId: string) => void;
}) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-3 grid gap-3">
        {blocks.map((block) => (
          <article
            key={block.id}
            className="animate-soft-fade border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border-2 border-[#1A1A1A]"
                    style={{ backgroundColor: block.color }}
                    aria-hidden="true"
                  />
                  <h4 className="break-words text-base font-black">
                    {block.title}
                  </h4>
                </div>
                <p className="mt-2 text-sm font-bold text-[#2F5FBF]">
                  {formatMinuteRange(block.startMinute, block.endMinute)} /{" "}
                  {formatDuration(getBlockDuration(block))}
                </p>
                {block.description ? (
                  <p className="mt-2 break-words text-sm font-bold">
                    {block.description}
                  </p>
                ) : null}
              </div>

              {editable ? (
                <button
                  type="button"
                  onClick={() => onDeleteBlock(block.id)}
                  aria-label={`Delete ${block.title}`}
                  className="min-h-10 shrink-0 border-2 border-[#1A1A1A] bg-[#D62828] px-3 py-2 text-sm font-black text-[#FFFFFF] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function getBlockDuration(block: TimeBlock): number {
  return expandMinuteRange(block.startMinute, block.endMinute).length;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
