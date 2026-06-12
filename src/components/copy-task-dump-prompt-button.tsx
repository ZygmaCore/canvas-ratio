"use client";

import { useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import {
  buildTaskDumpPlanningData,
  buildTaskDumpPlanningPrompt,
} from "@/lib/task-dump-prompt";
import type { CanvasSettings } from "@/lib/settings";
import type { DayRecord } from "@/types/canvas";

type CopyTaskDumpPromptButtonProps = {
  day: DayRecord | null;
  settings: CanvasSettings;
  disabled?: boolean;
};

type CopyStatus = {
  type: "success" | "error";
  message: string;
};

export function CopyTaskDumpPromptButton({
  day,
  settings,
  disabled = false,
}: CopyTaskDumpPromptButtonProps) {
  const [status, setStatus] = useState<CopyStatus | null>(null);

  async function handleCopyPrompt() {
    if (!day || disabled) {
      return;
    }

    try {
      const planningData = buildTaskDumpPlanningData(day, settings);
      const prompt = buildTaskDumpPlanningPrompt(planningData);

      await copyPlainText(prompt);
      setStatus({
        type: "success",
        message: "Task planning prompt copied.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Could not copy the task planning prompt.",
      });
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={!day || disabled}
        onClick={handleCopyPrompt}
        className="min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a] disabled:shadow-none"
      >
        Copy Planning Prompt
      </button>
      {status ? (
        <InlineMessage type={status.type} className="mt-3">
          {status.message}
        </InlineMessage>
      ) : null}
    </div>
  );
}

async function copyPlainText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some browser contexts expose Clipboard API but still deny writes.
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
