import { expandMinuteRange } from "@/lib/blocks";
import {
  CELLS_PER_DAY,
  MINUTES_PER_CELL,
  getBlackCellIndices,
  getColoredCellIndices,
  getWhiteCellIndices,
} from "@/lib/cells";
import {
  getAssignedCellCount,
  getEffectivePaintedCellCount,
  getProjectRatioTotal,
  getProjectUsageFromSlots,
  getTaskProjectColor,
  getTaskProjectName,
  validateProjectRatios,
} from "@/lib/projects";
import { formatMinuteRange } from "@/lib/time";
import type {
  DayRecord,
  JournalBlockSnapshot,
  JournalInputSnapshot,
  JournalRecord,
  JournalSource,
  TimeBlock,
} from "@/types/canvas";

export function buildJournalInputSnapshot(
  day: DayRecord,
): JournalInputSnapshot {
  const projects = getProjectUsageFromSlots(day).map((usage) => ({
    projectId: usage.projectId,
    name: usage.projectName,
    color: usage.color,
    ratio: usage.ratio,
    quotaCells: usage.quotaCells,
    paintedCells: usage.paintedCells,
    remainingCells: usage.remainingCells,
  }));
  const ratioValidation = validateProjectRatios(day.projects);

  return {
    date: day.date,
    totalCells: CELLS_PER_DAY,
    blackCells: getBlackCellIndices(day.slots).length,
    whiteCells: getWhiteCellIndices(day.slots).length,
    coloredCells: getColoredCellIndices(day.slots).length,
    ratioTotal: getProjectRatioTotal(day.projects),
    ratioReady: ratioValidation.valid,
    projects,
    tasks: day.tasks.map((task) => ({
      taskId: task.id,
      projectId: task.projectId,
      projectName: getTaskProjectName(day, task),
      taskName: task.taskName,
      color: getTaskProjectColor(day, task),
      assignedCells: getAssignedCellCount(task),
      effectivePaintedCells: getEffectivePaintedCellCount(day, task),
      description: task.description,
    })),
    sleepBlocks: day.sleepBlocks.map(createBlockSnapshot),
    randomEventBlocks: day.randomEventBlocks.map(createBlockSnapshot),
  };
}

export function buildJournalPrompt(snapshot: JournalInputSnapshot): string {
  return [
    "Tulis jurnal harian dalam Bahasa Indonesia berdasarkan snapshot Canvas Ratio berikut.",
    "Gaya: hangat, sederhana, dan jernih. Gunakan 2 sampai 5 paragraf pendek.",
    "Jangan membuat-buat tugas, kejadian, atau emosi yang tidak ada di data.",
    "Boleh memberi refleksi ringan hanya jika langsung berdasarkan data.",
    "Sebutkan area fokus, waktu hitam, waktu putih/free, dan progres tugas bila datanya ada.",
    "AI is a journal writer only. Do not modify the user's plan, ratios, tasks, or canvas.",
    "Kembalikan teks jurnal saja, tanpa tabel markdown dan tanpa JSON.",
    "",
    "Snapshot ringkas tanpa raw slots:",
    JSON.stringify(snapshot, null, 2),
  ].join("\n");
}

export function generateMockJournal(snapshot: JournalInputSnapshot): string {
  const dominantProject = getDominantPaintedProject(snapshot);
  const paintedTasks = snapshot.tasks.filter(
    (task) => task.effectivePaintedCells > 0,
  );
  const blackSummary = [
    snapshot.blackCells > 0
      ? `${formatCells(snapshot.blackCells)} menjadi kanvas hitam`
      : "tidak ada kanvas hitam",
    snapshot.sleepBlocks.length > 0
      ? `${snapshot.sleepBlocks.length} catatan tidur`
      : null,
    snapshot.randomEventBlocks.length > 0
      ? `${snapshot.randomEventBlocks.length} random event`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  const opening =
    snapshot.coloredCells > 0 && dominantProject
      ? `Pada ${snapshot.date}, bagian paling terlihat dari kanvas adalah ${dominantProject.name} dengan ${formatCells(dominantProject.paintedCells)} yang sudah diwarnai.`
      : `Pada ${snapshot.date}, kanvas masih terasa lapang karena belum banyak waktu yang diwarnai.`;

  const canvasLine = `Catatan waktunya sederhana: ${blackSummary}, ${formatCells(snapshot.whiteCells)} masih putih/free, dan ${formatCells(snapshot.coloredCells)} sudah menjadi warna proyek.`;

  const taskLine =
    paintedTasks.length > 0
      ? `Progres tugas yang tampak: ${paintedTasks
          .slice(0, 4)
          .map(
            (task) =>
              `${task.taskName} (${formatCells(task.effectivePaintedCells)})`,
          )
          .join(", ")}.`
      : "Belum ada tugas berwarna yang terlihat di kanvas, jadi jurnal ini mencatat ruang yang masih terbuka.";

  const closing =
    snapshot.ratioReady
      ? "Rasio proyek sudah lengkap, sehingga cerita hari ini mengikuti batas yang sudah dipilih."
      : `Rasio proyek belum lengkap (${snapshot.ratioTotal}/100), jadi tulisan ini hanya membaca jejak kanvas yang ada.`;

  return [opening, canvasLine, taskLine, closing].join("\n\n");
}

export function createJournalRecord(input: {
  date: string;
  content: string;
  summary?: string;
  model?: string;
  source: JournalSource;
  inputSnapshot: JournalInputSnapshot;
}): JournalRecord {
  return {
    id: createJournalId(),
    date: input.date,
    content: input.content.trim(),
    summary: input.summary?.trim() || undefined,
    model: input.model?.trim() || undefined,
    source: input.source,
    inputSnapshot: input.inputSnapshot,
    createdAt: new Date().toISOString(),
  };
}

export function createJournalSummary(content: string): string {
  return (
    content
      .split(/\n+/)
      .map((line) => line.trim())
      .find(Boolean)
      ?.slice(0, 180) ?? "Journal generated from Canvas Ratio snapshot."
  );
}

function createBlockSnapshot(block: TimeBlock): JournalBlockSnapshot {
  return {
    title: block.title,
    startMinute: block.startMinute,
    endMinute: block.endMinute,
    durationMinutes: expandMinuteRange(block.startMinute, block.endMinute)
      .length,
    description:
      block.description ||
      `${formatMinuteRange(block.startMinute, block.endMinute)} unavailable`,
  };
}

function getDominantPaintedProject(snapshot: JournalInputSnapshot) {
  return [...snapshot.projects]
    .filter((project) => project.paintedCells > 0)
    .sort((firstProject, secondProject) => {
      if (secondProject.paintedCells !== firstProject.paintedCells) {
        return secondProject.paintedCells - firstProject.paintedCells;
      }

      return firstProject.name.localeCompare(secondProject.name);
    })[0];
}

function formatCells(cells: number): string {
  const minutes = cells * MINUTES_PER_CELL;
  const hours = minutes / 60;
  const hourLabel = Number.isInteger(hours)
    ? `${hours} jam`
    : `${Math.round(hours * 10) / 10} jam`;

  return `${cells} sel (${hourLabel})`;
}

function createJournalId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `journal-${Date.now()}`;
}
