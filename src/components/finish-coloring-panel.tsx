"use client";

import { useMemo, useState } from "react";
import {
  buildJournalInputSnapshot,
  createJournalRecord,
} from "@/lib/journal";
import type {
  DayRecord,
  JournalRecord,
  JournalSource,
} from "@/types/canvas";

type FinishColoringPanelProps = {
  day: DayRecord;
  editable: boolean;
  onJournalCreated: (journal: JournalRecord) => void;
};

type JournalApiResponse = {
  source: JournalSource;
  model: string;
  content: string;
  summary?: string;
};

export function FinishColoringPanel({
  day,
  editable,
  onJournalCreated,
}: FinishColoringPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const snapshot = useMemo(() => buildJournalInputSnapshot(day), [day]);
  const hasJournal = Boolean(day.journal);
  const staleJournal = Boolean(
    day.journal?.inputSnapshot &&
      JSON.stringify(day.journal.inputSnapshot) !== JSON.stringify(snapshot),
  );
  const emptyCanvas = snapshot.blackCells === 0 && snapshot.coloredCells === 0;
  const ratioIncomplete = !snapshot.ratioReady;

  async function handleFinishColoring() {
    if (!editable || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ snapshot }),
      });

      if (!response.ok) {
        throw new Error("Journal request failed.");
      }

      const result = (await response.json()) as JournalApiResponse;
      assertJournalResponse(result);
      onJournalCreated(
        createJournalRecord({
          date: day.date,
          content: result.content,
          summary: result.summary,
          model: result.model,
          source: result.source,
          inputSnapshot: snapshot,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Journal could not be generated.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Finish Coloring</h2>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#4a4a4a]">
            Canvas Ratio writes a journal from projects, tasks, black canvas,
            and free space. It does not change ratios, tasks, or canvas slots.
          </p>
        </div>
        {hasJournal ? (
          <span className="inline-flex w-fit border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-xs font-black uppercase">
            Journal already created
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {emptyCanvas ? (
          <p className="border-2 border-[#1A1A1A] bg-[#FFD7BF] px-3 py-2 text-sm font-black">
            The canvas is still empty.
          </p>
        ) : null}
        {ratioIncomplete ? (
          <p className="border-2 border-[#1A1A1A] bg-[#FFD7BF] px-3 py-2 text-sm font-black">
            Ratios are not complete, so journal may be less meaningful.
          </p>
        ) : null}
        {staleJournal ? (
          <p className="border-2 border-[#1A1A1A] bg-[#6FB6FF] px-3 py-2 text-sm font-black">
            Journal may not match the latest canvas. Regenerate when finished.
          </p>
        ) : null}
      </div>

      {editable ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleFinishColoring}
            disabled={loading}
            className="min-h-12 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-[#9b9b9b]"
          >
            {loading
              ? "Writing today’s journal..."
              : hasJournal
                ? "Regenerate Journal"
                : "Finish Coloring"}
          </button>
          {error ? (
            <p
              data-testid="finish-error"
              className="text-sm font-black text-[#D62828]"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function assertJournalResponse(
  response: JournalApiResponse,
): asserts response is JournalApiResponse {
  if (
    (response.source !== "ai" && response.source !== "mock") ||
    typeof response.model !== "string" ||
    typeof response.content !== "string" ||
    !response.content.trim()
  ) {
    throw new Error("Journal response was invalid.");
  }
}
