"use client";

import { useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import { TimeRangeInput } from "@/components/time-range-input";
import { parseTimeToMinute } from "@/lib/time";

type SleepFormProps = {
  disabled?: boolean;
  onAddSleep: (input: {
    startMinute: number;
    endMinute: number;
    description?: string;
  }) => void;
};

export function SleepForm({ disabled = false, onAddSleep }: SleepFormProps) {
  const [startValue, setStartValue] = useState("22:00");
  const [endValue, setEndValue] = useState("05:00");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const startMinute = parseTimeToMinute(startValue);
      const endMinute = parseTimeToMinute(endValue);

      if (startMinute === endMinute) {
        setError("Start and end time must be different.");
        return;
      }

      onAddSleep({
        startMinute,
        endMinute,
        description: description.trim() || undefined,
      });
      setDescription("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Please enter a valid sleep range.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="sleep-form"
      className="rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]"
    >
      <h2 className="text-2xl font-black">Sleep</h2>
      <p className="mt-2 text-sm font-bold">
        Sleep becomes black canvas because it cannot be painted with tasks.
      </p>

      <div className="mt-4">
        <TimeRangeInput
          startValue={startValue}
          endValue={endValue}
          onStartChange={setStartValue}
          onEndChange={setEndValue}
          disabled={disabled}
          testIdPrefix="sleep"
        />
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          Note
        </span>
        <textarea
          value={description}
          disabled={disabled}
          data-testid="sleep-description"
          onChange={(event) => setDescription(event.currentTarget.value)}
          rows={3}
          className="mt-2 w-full resize-none border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
          placeholder="Optional"
        />
      </label>

      {error ? (
        <InlineMessage type="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        data-testid="add-sleep"
        className="mt-4 min-h-11 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 text-sm font-black text-[#FFFFFF] shadow-[3px_3px_0_#FFD91A] disabled:cursor-not-allowed disabled:bg-[#8B4A3A]"
      >
        Add Sleep
      </button>
    </form>
  );
}
