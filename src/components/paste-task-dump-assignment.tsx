"use client";

import { useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import {
  applyTaskDumpAssignmentToDay,
  parseTaskDumpAssignment,
  validateTaskDumpAssignment,
} from "@/lib/task-dump-assignment";
import { buildTaskDumpPlanningData } from "@/lib/task-dump-prompt";
import type { CanvasSettings } from "@/lib/settings";
import type { DayRecord } from "@/types/canvas";

type PasteTaskDumpAssignmentProps = {
  day: DayRecord | null;
  settings: CanvasSettings;
  disabled?: boolean;
  onSaveDay: (day: DayRecord) => void;
};

type ApplyStatus = {
  type: "success" | "error";
  message: string;
};

export function PasteTaskDumpAssignment({
  day,
  settings,
  disabled = false,
  onSaveDay,
}: PasteTaskDumpAssignmentProps) {
  const [assignmentText, setAssignmentText] = useState("");
  const [status, setStatus] = useState<ApplyStatus | null>(null);
  const applyDisabled = disabled || !day || !assignmentText.trim();

  function handleApplyAssignment() {
    if (!day || applyDisabled) {
      return;
    }

    try {
      const assignment = parseTaskDumpAssignment(assignmentText);
      const planningData = buildTaskDumpPlanningData(day, settings);

      validateTaskDumpAssignment(assignment, planningData);
      onSaveDay(applyTaskDumpAssignmentToDay(day, assignment));
      setAssignmentText("");
      setStatus({
        type: "success",
        message: "AI plan applied to canvas.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not apply this AI result.",
      });
    }
  }

  return (
    <section className="border-t-2 border-[#1A1A1A] pt-4">
      <h3 className="text-lg font-black">Paste AI Result</h3>
      <label className="mt-3 block">
        <span className="sr-only">Paste AI JSON result</span>
        <textarea
          value={assignmentText}
          disabled={disabled || !day}
          onChange={(event) => {
            setAssignmentText(event.currentTarget.value);
            setStatus(null);
          }}
          rows={5}
          className="w-full resize-none border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-[#FFD7BF]"
          placeholder="Paste the JSON Assignment from your AI here."
        />
      </label>
      <button
        type="button"
        disabled={applyDisabled}
        onClick={handleApplyAssignment}
        className="mt-3 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#6FB6FF] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a] disabled:shadow-none"
      >
        Apply to Canvas
      </button>
      {status ? (
        <InlineMessage type={status.type} className="mt-3">
          {status.message}
        </InlineMessage>
      ) : null}
    </section>
  );
}
