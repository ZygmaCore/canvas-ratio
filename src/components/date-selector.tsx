"use client";

import { getDayStatus, type DayStatus } from "@/lib/day";
import { getTodayDateKey } from "@/lib/time";

type DateSelectorProps = {
  value: string;
  onChange: (dateKey: string) => void;
};

const statusLabels: Record<DayStatus, string> = {
  today: "Today: Editable",
  past: "Past: Read-only",
  future: "Future: Not available",
};

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const status = getDayStatus(value);
  const handleDateValue = (dateKey: string) => {
    if (dateKey) {
      onChange(dateKey);
    }
  };

  return (
    <div className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <label
        htmlFor="canvas-date"
        className="block text-sm font-black uppercase text-[#2F5FBF]"
      >
        View date
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="canvas-date"
          type="date"
          value={value}
          onChange={(event) => handleDateValue(event.currentTarget.value)}
          onInput={(event) => handleDateValue(event.currentTarget.value)}
          className="min-h-11 flex-1 border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        />
        <button
          type="button"
          onClick={() => onChange(getTodayDateKey())}
          className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        >
          Today
        </button>
      </div>
      <p className="mt-3 text-sm font-bold text-[#3d3d3d]">
        {statusLabels[status]}
      </p>
    </div>
  );
}
