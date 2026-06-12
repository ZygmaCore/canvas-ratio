"use client";

import type { TaskDumpItem } from "@/types/canvas";

type TaskDumpItemCardProps = {
  item: TaskDumpItem;
  editable: boolean;
  onEdit: (item: TaskDumpItem) => void;
  onDelete: (itemId: string) => void;
};

export function TaskDumpItemCard({
  item,
  editable,
  onEdit,
  onDelete,
}: TaskDumpItemCardProps) {
  return (
    <article className="animate-soft-fade border-2 border-[#1A1A1A] bg-[#FBFBF7] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="break-words text-base font-black">{item.taskName}</h4>
          {item.note ? (
            <p className="mt-1 break-words text-sm font-bold text-[#4a4a4a]">
              {item.note}
            </p>
          ) : null}
          <p className="mt-2 text-sm font-black text-[#2F5FBF]">
            {item.blockCount} block{item.blockCount === 1 ? "" : "s"}
          </p>
        </div>

        {editable ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="min-h-10 border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm font-black shadow-[2px_2px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              aria-label={`Delete task dump item ${item.taskName}`}
              className="min-h-10 border-2 border-[#1A1A1A] bg-[#D62828] px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
