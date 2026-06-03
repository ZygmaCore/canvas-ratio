"use client";

import { InlineMessage } from "@/components/inline-message";
import type { JournalRecord } from "@/types/canvas";

type JournalViewProps = {
  journal?: JournalRecord;
};

export function JournalView({ journal }: JournalViewProps) {
  if (!journal) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#1A1A1A] p-6 text-center">
        <p className="text-sm font-bold text-[#4a4a4a]">
          No journal yet. Finish coloring to write today's story.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0_#1A1A1A]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black">Daily Journal</h3>
        <span className="text-xs font-bold text-[#4a4a4a]">
          {new Date(journal.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      
      <div className="prose prose-sm max-w-none">
        {journal.content.split("\n").map((line, i) => (
          <p key={i} className="mb-3 text-sm font-medium leading-relaxed text-[#323232]">
            {line}
          </p>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t-2 border-[#1A1A1A] pt-4">
        <span className={`inline-flex items-center border-2 border-[#1A1A1A] px-2 py-0.5 text-[10px] font-black uppercase ${journal.source === 'ai' ? 'bg-[#6FB6FF]' : 'bg-[#FFD91A]'}`}>
          Source: {journal.source === 'ai' ? 'AI' : 'Mock Fallback'}
        </span>
        {journal.model && (
          <span className="inline-flex items-center border-2 border-[#1A1A1A] bg-white px-2 py-0.5 text-[10px] font-black uppercase">
            Model: {journal.model}
          </span>
        )}
      </div>

      {journal.warning ? (
        <InlineMessage type="warning" className="mt-4">
          Warning: {journal.warning}
        </InlineMessage>
      ) : null}
    </div>
  );
}
