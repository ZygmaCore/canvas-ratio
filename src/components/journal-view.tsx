import type { JournalRecord } from "@/types/canvas";

type JournalViewProps = {
  journal?: JournalRecord;
};

export function JournalView({ journal }: JournalViewProps) {
  if (!journal) {
    return (
      <section className="rounded-lg border-2 border-dashed border-[#1A1A1A] bg-[#FBFBF7] p-5">
        <h2 className="text-2xl font-black">Journal</h2>
        <p className="mt-3 text-sm font-bold text-[#4a4a4a]">
          No journal yet. Finish coloring to write today’s story.
        </p>
      </section>
    );
  }

  const source = journal.source ?? "mock";
  const sourceLabel = source === "ai" ? "AI" : "Mock";

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-[#FBFBF7] p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Journal</h2>
          <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
            {journal.date} · Created {formatCreatedAt(journal.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-xs font-black uppercase">
            {sourceLabel}
          </span>
          {journal.model ? (
            <span className="border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-black">
              {journal.model}
            </span>
          ) : null}
        </div>
      </div>

      {journal.summary ? (
        <p className="mt-5 border-l-4 border-[#2F5FBF] bg-white px-4 py-3 text-sm font-black leading-6">
          {journal.summary}
        </p>
      ) : null}

      <div className="mt-5 whitespace-pre-line text-base font-medium leading-8 text-[#222222]">
        {journal.content}
      </div>
    </section>
  );
}

function formatCreatedAt(value: string): string {
  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return value;
  }

  return createdAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
