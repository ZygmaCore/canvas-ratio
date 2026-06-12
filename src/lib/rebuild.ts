import { applyBlackBlockToSlots } from "@/lib/blocks";
import { getTaskProjectColor } from "@/lib/projects";
import { applyTaskToSlots } from "@/lib/tasks";
import { createEmptySlots } from "@/lib/time";
import type { DayRecord, TaskRecord } from "@/types/canvas";

export function rebuildDaySlots(day: DayRecord): DayRecord {
  const taskSlots = day.tasks.reduce(
    (currentSlots, task) => {
      const normalizedTask = normalizeTask(task);

      return applyTaskToSlots(
        currentSlots,
        normalizedTask,
        getTaskProjectColor(day, normalizedTask),
      );
    },
    createEmptySlots(),
  );
  const rebuiltSlots = [...day.sleepBlocks, ...day.randomEventBlocks].reduce(
    (currentSlots, block) => applyBlackBlockToSlots(currentSlots, block),
    taskSlots,
  );
  const tasks = day.tasks.map((task) => {
    const normalizedTask = normalizeTask(task);

    return {
      ...normalizedTask,
      effectivePaintedMinutes: rebuiltSlots.filter(
        (slot) => slot.state === "colored" && slot.taskId === task.id,
      ).length,
    };
  });

  return {
    ...day,
    tasks,
    slots: rebuiltSlots,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeTask(task: TaskRecord): TaskRecord {
  return {
    ...task,
    source: task.source ?? "project-paint",
    projectId: task.projectId ?? "",
    targetCanvas: task.targetCanvas ?? "full",
    assignedMinutes: task.assignedMinutes ?? [],
  };
}
