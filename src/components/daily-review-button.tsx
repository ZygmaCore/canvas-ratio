"use client";

import { useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import {
  buildDailyReviewData,
  buildDailyReviewPrompt,
} from "@/lib/daily-review-superprompt";
import type { CanvasSettings } from "@/lib/settings";
import type { DayRecord } from "@/types/canvas";

type DailyReviewButtonProps = {
  day: DayRecord | null;
  settings: CanvasSettings;
  disabled?: boolean;
};

type CopyStatus = {
  type: "success" | "error";
  message: string;
};

export function DailyReviewButton({
  day,
  settings,
  disabled = false,
}: DailyReviewButtonProps) {
  const [status, setStatus] = useState<CopyStatus | null>(null);

  async function handleCopyDailyReview() {
    if (!day || disabled) {
      return;
    }

    try {
      const reviewData = buildDailyReviewData(day, settings);
      const prompt = buildDailyReviewPrompt(reviewData);

      await copyPlainText(prompt);
      setStatus({
        type: "success",
        message: "Daily review prompt copied.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Could not copy the daily review prompt.",
      });
    }
  }

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-black">Daily Review</h3>
          <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
            Copy a local 48-block JSON prompt and paste it into any AI.
          </p>
        </div>
        <button
          type="button"
          disabled={!day || disabled}
          onClick={handleCopyDailyReview}
          className="min-h-11 shrink-0 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a] disabled:shadow-none"
        >
          Copy Daily Review Prompt
        </button>
      </div>
      {status ? (
        <InlineMessage type={status.type} className="mt-3">
          {status.message}
        </InlineMessage>
      ) : null}
    </section>
  );
}

async function copyPlainText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that expose Clipboard API but deny write access.
    }
  }

  const textarea = document.createElement("textarea");
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection()?.rangeCount
    ? document.getSelection()?.getRangeAt(0)
    : null;

  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  textarea.remove();
  activeElement?.focus();

  if (selection) {
    const currentSelection = document.getSelection();
    currentSelection?.removeAllRanges();
    currentSelection?.addRange(selection);
  }

  if (!copied) {
    throw new Error("Copy command failed.");
  }
}
