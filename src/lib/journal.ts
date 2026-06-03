import {
  getBlackCellIndices,
  getColoredCellIndices,
  getWhiteCellIndices,
} from "@/lib/cells";
import { getProjectUsageFromSlots } from "@/lib/projects";
import { getTaskEffectivePaintedMinutes } from "@/lib/tasks";
import type {
  DayRecord,
  JournalInputSnapshot,
  JournalRecord,
} from "@/types/canvas";

export function buildJournalInputSnapshot(day: DayRecord): JournalInputSnapshot {
  const slots = day.slots;
  const blackCells = getBlackCellIndices(slots).length;
  const whiteCells = getWhiteCellIndices(slots).length;
  const coloredCells = getColoredCellIndices(slots).length;
  const projectUsage = getProjectUsageFromSlots(day);

  return {
    date: day.date,
    totalCells: 48,
    blackCells,
    whiteCells,
    coloredCells,
    projects: projectUsage.map((usage) => ({
      projectId: usage.projectId,
      name: usage.projectName,
      color: usage.color,
      ratio: usage.ratio,
      quotaCells: usage.quotaCells,
      paintedCells: usage.paintedCells,
      remainingCells: usage.remainingCells,
    })),
    tasks: day.tasks.map((task) => ({
      taskId: task.id,
      projectId: task.projectId,
      projectName: task.projectName,
      taskName: task.taskName,
      color: task.color,
      assignedCells: Math.ceil((task.assignedMinutes?.length || 0) / 30),
      effectivePaintedCells: Math.ceil(getTaskEffectivePaintedMinutes(slots, task.id) / 30),
      description: task.description,
    })),
    sleepBlocks: day.sleepBlocks.map((block) => ({
      title: block.title,
      startMinute: block.startMinute,
      endMinute: block.endMinute,
      description: block.description,
    })),
    randomEventBlocks: day.randomEventBlocks.map((block) => ({
      title: block.title,
      startMinute: block.startMinute,
      endMinute: block.endMinute,
      description: block.description,
    })),
  };
}

export function buildJournalPrompt(snapshot: JournalInputSnapshot): string {
  const projectList = snapshot.projects
    .map(
      (p) =>
        `- ${p.name}: Target ${p.ratio}%, Painted ${p.paintedCells}/${p.quotaCells} cells`,
    )
    .join("\n");

  const taskList = snapshot.tasks
    .filter((t) => t.assignedCells > 0)
    .map(
      (t) =>
        `- ${t.taskName} (${t.projectName || "No Project"}): ${t.effectivePaintedCells}/${t.assignedCells} cells finished`,
    )
    .join("\n");

  const blackBlocks = [...snapshot.sleepBlocks, ...snapshot.randomEventBlocks]
    .map((b) => `- ${b.title} (${b.description || "No description"})`)
    .join("\n");

  return `
Tulis jurnal harian berdasarkan data canvas berikut untuk tanggal ${snapshot.date}.

Ringkasan Canvas:
- Total: 48 cell (24 jam)
- Terisi Proyek/Tugas: ${snapshot.coloredCells} cell
- Terhalang (Black): ${snapshot.blackCells} cell
- Kosong (Free): ${snapshot.whiteCells} cell

Proyek:
${projectList || "Tidak ada proyek."}

Tugas:
${taskList || "Tidak ada tugas."}

Blok Waktu Terhalang (Tidur/Event):
${blackBlocks || "Tidak ada blok waktu terhalang."}

Aturan Penulisan:
- Bahasa: Indonesia.
- Gaya: Reflektif, sederhana, hangat.
- Hindari gaya korporat atau tabel markdown.
- Jangan mengada-ada kejadian yang tidak ada di data.
- Berikan saran hanya jika benar-benar berdasarkan data (misal: terlalu banyak free time atau target rasio tidak tercapai).
- Jangan menghakimi (no shame).
- Sebutkan fokus dominan hari ini.
- Sebutkan gangguan/tidur jika ada.
- Sebutkan waktu luang jika relevan.
- AI hanya penulis jurnal. Jangan mengubah rasio, project, task, warna, slot canvas, atau prioritas user.
  `.trim();
}

export function generateMockJournal(snapshot: JournalInputSnapshot): string {
  const dominantProject = [...snapshot.projects].sort(
    (a, b) => b.paintedCells - a.paintedCells,
  )[0];
  
  let journal = `Jurnal untuk ${snapshot.date}.\n\n`;
  
  if (snapshot.coloredCells === 0 && snapshot.blackCells === 0) {
    journal += "Hari ini canvas tampak sangat bersih, hampir tidak ada yang dicat. Waktu yang tersedia masih sangat lapang.";
  } else {
    if (dominantProject && dominantProject.paintedCells > 0) {
      journal += `Hari ini fokus utamanya adalah pada ${dominantProject.name}. `;
    }
    
    if (snapshot.blackCells > 0) {
      journal += `Ada sekitar ${Math.round((snapshot.blackCells * 30) / 60)} jam yang digunakan untuk istirahat atau hal lain yang tidak bisa diganggu. `;
    }
    
    if (snapshot.whiteCells > 5) {
      journal += `Masih ada cukup banyak waktu luang (${Math.round((snapshot.whiteCells * 30) / 60)} jam) untuk bernapas hari ini. `;
    }
    
    if (snapshot.tasks.length > 0) {
      const finishedTasks = snapshot.tasks.filter(t => t.effectivePaintedCells > 0).length;
      journal += `Ada ${finishedTasks} tugas yang berhasil dikerjakan sebagian atau seluruhnya.`;
    }
  }

  return journal;
}

export function createJournalRecord(params: {
  date: string;
  content: string;
  source: "ai" | "mock";
  model?: string;
  warning?: string;
  inputSnapshot?: JournalInputSnapshot;
}): JournalRecord {
  return {
    id: `journal-${params.date}-${Date.now()}`,
    date: params.date,
    content: params.content,
    source: params.source,
    model: params.model,
    warning: params.warning,
    createdAt: new Date().toISOString(),
    inputSnapshot: params.inputSnapshot,
  };
}
