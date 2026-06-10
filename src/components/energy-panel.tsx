"use client";

import { useState, type FormEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import { TimeRangeInput } from "@/components/time-range-input";
import {
  ENERGY_LEVEL_LABELS,
  addEnergyBlock,
  createEnergyBlock,
  deleteEnergyBlock,
} from "@/lib/energy";
import type { DayRecord, EnergyLevel } from "@/types/canvas";

type EnergyPanelProps = {
  day: DayRecord | null;
  editable: boolean;
  onSaveDay: (day: DayRecord) => void;
};

const energyOptions: Array<{ value: EnergyLevel; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function EnergyPanel({ day, editable, onSaveDay }: EnergyPanelProps) {
  const [level, setLevel] = useState<EnergyLevel>("high");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("11:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const blocks = day?.energyBlocks ?? [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!day || !editable) {
      return;
    }

    try {
      onSaveDay(
        addEnergyBlock(
          day,
          createEnergyBlock({
            level,
            startTime,
            endTime,
            note,
          }),
        ),
      );
      setNote("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Please enter a valid energy range.",
      );
    }
  }

  function handleDelete(blockId: string) {
    if (!day || !editable) {
      return;
    }

    onSaveDay(deleteEnergyBlock(day, blockId));
  }

  return (
    <details>
      <summary className="min-h-12 cursor-pointer border-2 border-[#1A1A1A] bg-white px-4 py-3 text-base font-black shadow-[4px_4px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]">
        Energy Layer
      </summary>
      <section className="mt-4 rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-[#2F5FBF]">
              Optional context
            </p>
            <h2 className="mt-1 text-2xl font-black">Energy Layer</h2>
            <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
              Energy helps you understand when work feels easier.
            </p>
          </div>
          <span className="w-fit border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
            Does not block paint
          </span>
        </div>

        {editable ? (
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Energy level
              </span>
              <select
                value={level}
                onChange={(event) => setLevel(event.currentTarget.value as EnergyLevel)}
                className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              >
                {energyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <TimeRangeInput
              startValue={startTime}
              endValue={endTime}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
              testIdPrefix="energy"
            />

            <label className="block">
              <span className="text-sm font-black uppercase text-[#2F5FBF]">
                Note
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
                rows={2}
                className="mt-2 w-full resize-none border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                placeholder="Optional"
              />
            </label>

            {error ? (
              <InlineMessage type="error">{error}</InlineMessage>
            ) : null}

            <button
              type="submit"
              className="min-h-11 w-fit border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Add Energy Range
            </button>
          </form>
        ) : (
          <InlineMessage type="info" className="mt-4">
            This date is read-only. Energy editing is disabled.
          </InlineMessage>
        )}

        <div className="mt-4 grid gap-3">
          {blocks.length === 0 ? (
            <InlineMessage type="info">
              No energy ranges yet.
            </InlineMessage>
          ) : null}

          {blocks.map((block) => (
            <article
              key={block.id}
              className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black">
                    {ENERGY_LEVEL_LABELS[block.level]} / {block.startTime}-
                    {block.endTime}
                  </p>
                  {block.note ? (
                    <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
                      {block.note}
                    </p>
                  ) : null}
                </div>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(block.id)}
                    className="min-h-10 shrink-0 border-2 border-[#1A1A1A] bg-[#D62828] px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </details>
  );
}
