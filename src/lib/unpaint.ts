import { cellIndexToMinuteRange } from "@/lib/cells";
import { rebuildDaySlots } from "@/lib/rebuild";
import type { DayRecord } from "@/types/canvas";

export function unpaintCell(day: DayRecord, cellIndex: number): DayRecord {
  const { startMinute, endMinute } = cellIndexToMinuteRange(cellIndex);
  const paintedSlot = day.slots.find(
    (slot) =>
      slot.minute >= startMinute &&
      slot.minute < endMinute &&
      slot.state === "colored" &&
      !!slot.taskId,
  );

  if (!paintedSlot?.taskId) {
    return day;
  }

  const nextTasks = day.tasks.flatMap((task) => {
    if (task.id !== paintedSlot.taskId) {
      return [task];
    }

    const assignedMinutes = (task.assignedMinutes ?? []).filter(
      (minute) => minute < startMinute || minute >= endMinute,
    );

    if (assignedMinutes.length === 0) {
      return [];
    }

    return [
      {
        ...task,
        assignedMinutes,
      },
    ];
  });

  return rebuildDaySlots({
    ...day,
    tasks: nextTasks,
    updatedAt: new Date().toISOString(),
  });
}
