"use client";

import { useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import { TimeRangeInput } from "@/components/time-range-input";
import { parseTimeToMinute } from "@/lib/time";

type RandomEventFormProps = {
  disabled?: boolean;
  onAddRandomEvent: (input: {
    title: string;
    startMinute: number;
    endMinute: number;
    description?: string;
  }) => void;
};

export function RandomEventForm({
  disabled = false,
  onAddRandomEvent,
}: RandomEventFormProps) {
  const [title, setTitle] = useState("");
  const [startValue, setStartValue] = useState("09:00");
  const [endValue, setEndValue] = useState("10:00");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        setError("Random event title is required.");
        return;
      }

      const startMinute = parseTimeToMinute(startValue);
      const endMinute = parseTimeToMinute(endValue);

      if (startMinute === endMinute) {
        setError("Start and end time must be different.");
        return;
      }

      onAddRandomEvent({
        title: trimmedTitle,
        startMinute,
        endMinute,
        description: description.trim() || undefined,
      });
      setTitle("");
      setDescription("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Please enter a valid random event.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="random-event-form"
      className="rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]"
    >
      <h2 className="text-2xl font-black">Random Event</h2>
      <p className="mt-2 text-sm font-bold">
        Use this for sudden events, travel, hospital, errands, social events, or
        anything that breaks the canvas.
      </p>

      <label className="mt-4 block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          Title
        </span>
        <input
          type="text"
          value={title}
          disabled={disabled}
          data-testid="random-event-title"
          onChange={(event) => setTitle(event.currentTarget.value)}
          className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
          placeholder="Errand, travel, appointment"
        />
      </label>

      <div className="mt-4">
        <TimeRangeInput
          startValue={startValue}
          endValue={endValue}
          onStartChange={setStartValue}
          onEndChange={setEndValue}
          disabled={disabled}
          testIdPrefix="random-event"
        />
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          Note
        </span>
        <textarea
          value={description}
          disabled={disabled}
          data-testid="random-event-description"
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
        data-testid="add-random-event"
        className="mt-4 min-h-11 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 text-sm font-black text-[#FFFFFF] shadow-[3px_3px_0_#FFD91A] disabled:cursor-not-allowed disabled:bg-[#8B4A3A]"
      >
        Add Random Event
      </button>
    </form>
  );
}
