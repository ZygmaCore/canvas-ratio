"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CopyTaskDumpPromptButton } from "@/components/copy-task-dump-prompt-button";
import { InlineMessage } from "@/components/inline-message";
import { PasteTaskDumpAssignment } from "@/components/paste-task-dump-assignment";
import { TaskDumpItemCard } from "@/components/task-dump-item-card";
import type { DayStatus } from "@/lib/day";
import { getActiveProjects, type CanvasSettings } from "@/lib/settings";
import {
  addTaskDumpItem,
  clearTaskDump,
  deleteTaskDumpItem,
  getTaskDumpItems,
  getTaskDumpSummary,
  updateTaskDumpItem,
} from "@/lib/task-dump";
import type { DayRecord, TaskDumpItem } from "@/types/canvas";

type TaskDumpPanelProps = {
  day: DayRecord | null;
  settings: CanvasSettings;
  editable: boolean;
  status: DayStatus;
  onSaveDay: (day: DayRecord) => void;
};

export function TaskDumpPanel({
  day,
  settings,
  editable,
  status,
  onSaveDay,
}: TaskDumpPanelProps) {
  const items = useMemo(() => getTaskDumpItems(day), [day]);
  const summary = useMemo(() => getTaskDumpSummary(day), [day]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState("");
  const [note, setNote] = useState("");
  const [blockCount, setBlockCount] = useState("1");
  const [error, setError] = useState("");
  const activeProjectCount = getActiveProjects(settings.projects).length;
  const editingItem =
    editingItemId ? items.find((item) => item.id === editingItemId) : null;
  const remainingCapacity = Math.max(0, summary.availableDumpBlocks);
  const formDisabled =
    !day ||
    !editable ||
    (!editingItem && (summary.freeBlocks === 0 || summary.availableDumpBlocks <= 0));
  const blockInputMax = editingItem
    ? Math.max(
        1,
        editingItem.blockCount + Math.max(0, summary.availableDumpBlocks),
      )
    : Math.max(1, remainingCapacity);
  const copyDisabled =
    !day ||
    status === "future" ||
    activeProjectCount === 0 ||
    items.length === 0 ||
    summary.freeBlocks === 0 ||
    !summary.isValid;
  const applyDisabled =
    !day ||
    !editable ||
    status === "future" ||
    activeProjectCount === 0 ||
    items.length === 0 ||
    summary.freeBlocks === 0 ||
    !summary.isValid;

  function resetForm() {
    setEditingItemId(null);
    setTaskName("");
    setNote("");
    setBlockCount("1");
    setError("");
  }

  function handleEdit(item: TaskDumpItem) {
    setEditingItemId(item.id);
    setTaskName(item.taskName);
    setNote(item.note ?? "");
    setBlockCount(String(item.blockCount));
    setError("");
  }

  function handleDelete(itemId: string) {
    if (!day || !editable) {
      return;
    }

    onSaveDay(deleteTaskDumpItem(day, itemId));

    if (editingItemId === itemId) {
      resetForm();
    }
  }

  function handleClearDump() {
    if (!day || !editable || items.length === 0) {
      return;
    }

    if (!window.confirm("Clear all Task Dump items?")) {
      return;
    }

    onSaveDay(clearTaskDump(day));
    resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!day || !editable) {
      return;
    }

    try {
      const input = {
        taskName,
        note,
        blockCount: Number(blockCount),
      };

      onSaveDay(
        editingItemId
          ? updateTaskDumpItem(day, editingItemId, input)
          : addTaskDumpItem(day, input),
      );
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save this task dump item.",
      );
    }
  }

  return (
    <section className="animate-panel-enter rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Task Dump
          </p>
          <h2 className="mt-1 text-xl font-black">Plan Remaining Free Blocks</h2>
          <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
            List remaining tasks, copy a prompt, then paste the JSON result.
          </p>
        </div>
        <button
          type="button"
          disabled={!editable || items.length === 0}
          onClick={handleClearDump}
          className="min-h-10 shrink-0 border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black shadow-[2px_2px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a] disabled:shadow-none"
        >
          Clear Dump
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-sm font-black sm:grid-cols-3">
        <TaskDumpMetric label="Free blocks" value={summary.freeBlocks} />
        <TaskDumpMetric
          label="Dumped blocks"
          value={`${summary.dumpedBlocks} / ${summary.freeBlocks}`}
        />
        <TaskDumpMetric label="Remaining" value={remainingCapacity} />
      </div>

      {summary.overageBlocks > 0 ? (
        <InlineMessage type="warning" className="mt-4">
          Task Dump exceeds current free canvas by {summary.overageBlocks}{" "}
          block{summary.overageBlocks === 1 ? "" : "s"}.
        </InlineMessage>
      ) : null}

      {summary.freeBlocks === 0 ? (
        <InlineMessage type="warning" className="mt-4">
          No free blocks left.
        </InlineMessage>
      ) : null}

      {!editable && status === "past" ? (
        <InlineMessage type="info" className="mt-4">
          Past dates are read-only. You can still copy a valid dump.
        </InlineMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
          <label className="block">
            <span className="text-xs font-black uppercase text-[#2F5FBF]">
              Task
            </span>
            <input
              type="text"
              value={taskName}
            disabled={formDisabled}
            onChange={(event) => setTaskName(event.currentTarget.value)}
            className="mt-1 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-[#FFD7BF]"
            placeholder="Name the task"
          />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase text-[#2F5FBF]">
              Blocks
            </span>
            <input
              type="number"
              min={1}
              max={blockInputMax}
              value={blockCount}
              disabled={formDisabled}
              onChange={(event) => setBlockCount(event.currentTarget.value)}
              className="mt-1 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-[#FFD7BF]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase text-[#2F5FBF]">
            Note
          </span>
          <textarea
            value={note}
            disabled={formDisabled}
            onChange={(event) => setNote(event.currentTarget.value)}
            rows={2}
            className="mt-1 w-full resize-none border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-[#FFD7BF]"
            placeholder="Optional context"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={formDisabled}
            className="min-h-11 border-2 border-[#1A1A1A] bg-[#8BCF3F] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a] disabled:shadow-none"
          >
            {editingItem ? "Save Task" : "Add Task"}
          </button>
          {editingItem ? (
            <button
              type="button"
              onClick={resetForm}
              className="min-h-11 border-2 border-[#1A1A1A] bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {error ? (
          <InlineMessage type="error">
            {error}
          </InlineMessage>
        ) : null}
      </form>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <TaskDumpItemCard
            key={item.id}
            item={item}
            editable={editable}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <InlineMessage type="info" className="mt-4">
          Add at least one dumped task to copy a planning prompt.
        </InlineMessage>
      ) : null}

      <div className="mt-4">
        {activeProjectCount === 0 ? (
          <InlineMessage type="warning" className="mb-3">
            Create at least one project before planning remaining blocks.
          </InlineMessage>
        ) : null}
        <CopyTaskDumpPromptButton
          day={day}
          settings={settings}
          disabled={copyDisabled}
        />
      </div>

      <div className="mt-4">
        {activeProjectCount === 0 ? (
          <InlineMessage type="warning" className="mb-3">
            Create a project before applying an AI plan.
          </InlineMessage>
        ) : null}
        <PasteTaskDumpAssignment
          day={day}
          settings={settings}
          disabled={applyDisabled}
          onSaveDay={onSaveDay}
        />
      </div>
    </section>
  );
}

function TaskDumpMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="min-w-0 border-2 border-[#1A1A1A] bg-[#FBFBF7] px-3 py-2">
      <p className="text-[10px] font-black uppercase leading-tight text-[#2F5FBF]">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-black">{value}</p>
    </div>
  );
}
