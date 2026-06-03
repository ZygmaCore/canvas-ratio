"use client";

import { useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import { buildJournalInputSnapshot } from "@/lib/journal";
import type { DayRecord, JournalRecord } from "@/types/canvas";

type FinishColoringPanelProps = {
  day: DayRecord;
  editable: boolean;
  onJournalCreated: (journal: JournalRecord) => void;
};

export function FinishColoringPanel({
  day,
  editable,
  onJournalCreated,
}: FinishColoringPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFinishColoring() {
    setLoading(true);
    setError("");

    try {
      const snapshot = buildJournalInputSnapshot(day);
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ snapshot }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate journal: ${response.statusText}`);
      }

      const journalData = normalizeJournalResponse(await response.json());
      onJournalCreated({
        ...journalData,
        id: `journal-${day.date}-${Date.now()}`,
        date: day.date,
        inputSnapshot: snapshot,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const hasJournal = !!day.journal;

  return (
    <div className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <h3 className="text-xl font-black">Finish Coloring</h3>
      <p className="mt-2 text-sm font-bold text-[#4a4a4a]">
        Write a daily journal based on your canvas coloring.
      </p>

      {error && (
        <InlineMessage type="error" className="mt-3">
          {error}
        </InlineMessage>
      )}

      <button
        type="button"
        disabled={!editable || loading}
        onClick={handleFinishColoring}
        className="mt-4 flex min-h-12 w-full items-center justify-center border-2 border-[#1A1A1A] bg-[#8BCF3F] px-5 py-2 text-sm font-black shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:translate-y-0 disabled:bg-gray-200 disabled:opacity-50 disabled:shadow-none"
      >
        {loading
          ? "Writing Journal..."
          : hasJournal
          ? "Regenerate Journal"
          : "Finish Coloring"}
      </button>

      {day.journal && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center border-2 border-[#1A1A1A] px-2 py-0.5 text-[10px] font-black uppercase ${day.journal.source === 'ai' ? 'bg-[#6FB6FF]' : 'bg-[#FFD91A]'}`}>
            Source: {day.journal.source === 'ai' ? 'AI' : 'Mock Fallback'}
          </span>
          {day.journal.model && (
            <span className="inline-flex items-center border-2 border-[#1A1A1A] bg-white px-2 py-0.5 text-[10px] font-black uppercase">
              Model: {day.journal.model}
            </span>
          )}
        </div>
      )}
      
      {day.journal?.warning && (
        <InlineMessage type="warning" className="mt-3">
          Warning: {day.journal.warning}
        </InlineMessage>
      )}
    </div>
  );
}

function normalizeJournalResponse(response: unknown): Omit<JournalRecord, "id" | "date"> {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error("Journal response was not valid.");
  }

  const possibleJournal = response as Partial<JournalRecord>;

  if (typeof possibleJournal.content !== "string" || !possibleJournal.content.trim()) {
    throw new Error("Journal response did not include content.");
  }

  return {
    content: possibleJournal.content,
    source: possibleJournal.source === "ai" ? "ai" : "mock",
    model:
      typeof possibleJournal.model === "string"
        ? possibleJournal.model
        : undefined,
    warning:
      typeof possibleJournal.warning === "string"
        ? possibleJournal.warning
        : undefined,
    createdAt:
      typeof possibleJournal.createdAt === "string"
        ? possibleJournal.createdAt
        : new Date().toISOString(),
  };
}
