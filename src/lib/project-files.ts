export const PROJECT_FILES_STORAGE_KEY = "canvas-ratio:project-files:v1";

export type ProjectFileBlock = {
  index: number;
  completed: boolean;
  completedAt?: string;
  note?: string;
};

export type ProjectFile = {
  id: string;
  projectName: string;
  unitName: string;
  totalTarget: number;
  todayDate: string;
  targetDate: string;
  notes?: string;
  blocks: ProjectFileBlock[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectFileInput = {
  projectName: string;
  unitName: string;
  totalTarget: number;
  todayDate: string;
  targetDate: string;
  notes?: string;
};

export type ProjectFileProgress = {
  completed: number;
  remaining: number;
  percentComplete: number;
  daysLeftInclusive: number;
  targetDatePassed: boolean;
  requiredToday: number;
  completedToday: number;
  todayRecommendedBlockIndexes: number[];
};

export type ProjectFileReviewData = ProjectFileProgress & {
  id: string;
  projectName: string;
  unitName: string;
  totalTarget: number;
  todayDate: string;
  targetDate: string;
  notes?: string;
  blocks: Array<{
    index: number;
    completed: boolean;
    completedAt?: string;
  }>;
};

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function createProjectFile(input: ProjectFileInput): ProjectFile {
  const totalTarget = normalizeTotalTarget(input.totalTarget);
  const now = new Date().toISOString();

  return {
    id: createProjectFileId(),
    projectName: normalizeRequiredText(input.projectName, "Project name"),
    unitName: normalizeRequiredText(input.unitName, "Unit name"),
    totalTarget,
    todayDate: normalizeDateKey(input.todayDate, "Today date"),
    targetDate: normalizeDateKey(input.targetDate, "Target date"),
    notes: input.notes?.trim() || undefined,
    blocks: Array.from({ length: totalTarget }, (_, index) => ({
      index,
      completed: false,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function loadProjectFiles(): ProjectFile[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    return normalizeProjectFiles(
      JSON.parse(storage.getItem(PROJECT_FILES_STORAGE_KEY) ?? "[]"),
    );
  } catch {
    return [];
  }
}

export function saveProjectFiles(files: ProjectFile[]): ProjectFile[] {
  const normalizedFiles = normalizeProjectFiles(files);
  const storage = getStorage();

  if (storage) {
    storage.setItem(PROJECT_FILES_STORAGE_KEY, JSON.stringify(normalizedFiles));
  }

  return normalizedFiles;
}

export function upsertProjectFile(
  files: ProjectFile[],
  projectFile: ProjectFile,
): ProjectFile[] {
  const nextFile = normalizeProjectFile({
    ...projectFile,
    updatedAt: new Date().toISOString(),
  });

  if (!nextFile) {
    return files;
  }

  const exists = files.some((file) => file.id === nextFile.id);

  return saveProjectFiles(
    exists
      ? files.map((file) => (file.id === nextFile.id ? nextFile : file))
      : [nextFile, ...files],
  );
}

export function deleteProjectFile(
  files: ProjectFile[],
  projectFileId: string,
): ProjectFile[] {
  return saveProjectFiles(files.filter((file) => file.id !== projectFileId));
}

export function toggleProjectFileBlock(
  projectFile: ProjectFile,
  blockIndex: number,
): ProjectFile {
  const todayDate = projectFile.todayDate;

  return {
    ...projectFile,
    blocks: projectFile.blocks.map((block) => {
      if (block.index !== blockIndex) {
        return block;
      }

      const completed = !block.completed;

      return {
        ...block,
        completed,
        completedAt: completed ? todayDate : undefined,
      };
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function calculateProjectFileProgress(
  projectFile: ProjectFile,
): ProjectFileProgress {
  const completed = projectFile.blocks.filter((block) => block.completed).length;
  const remaining = Math.max(0, projectFile.totalTarget - completed);
  const daysDifference = differenceInCalendarDays(
    projectFile.targetDate,
    projectFile.todayDate,
  );
  const targetDatePassed = daysDifference < 0;
  const daysLeftInclusive = targetDatePassed ? 1 : Math.max(1, daysDifference + 1);
  const requiredToday = remaining === 0 ? 0 : Math.ceil(remaining / daysLeftInclusive);
  const completedToday = projectFile.blocks.filter(
    (block) => block.completed && block.completedAt === projectFile.todayDate,
  ).length;
  const todayRecommendedBlockIndexes = projectFile.blocks
    .filter((block) => !block.completed)
    .slice(0, requiredToday)
    .map((block) => block.index);

  return {
    completed,
    remaining,
    percentComplete:
      projectFile.totalTarget === 0
        ? 0
        : Math.round((completed / projectFile.totalTarget) * 1000) / 10,
    daysLeftInclusive,
    targetDatePassed,
    requiredToday,
    completedToday,
    todayRecommendedBlockIndexes,
  };
}

export function buildProjectFileReviewData(
  projectFile: ProjectFile,
): ProjectFileReviewData {
  return {
    id: projectFile.id,
    projectName: projectFile.projectName,
    unitName: projectFile.unitName,
    totalTarget: projectFile.totalTarget,
    todayDate: projectFile.todayDate,
    targetDate: projectFile.targetDate,
    notes: projectFile.notes,
    ...calculateProjectFileProgress(projectFile),
    blocks: projectFile.blocks.map((block) => ({
      index: block.index,
      completed: block.completed,
      completedAt: block.completedAt,
    })),
  };
}

export function buildProjectFileReviewPrompt(projectFile: ProjectFile): string {
  const data = buildProjectFileReviewData(projectFile);

  return `You are helping me review progress on a long-term project.

Project File meaning:
- Each block is one unit of progress.
- Completed blocks are finished units.
- Incomplete blocks are remaining units.
- The target date defines how many units should be completed per day.

Your task:
1. Summarize current progress.
2. Calculate whether the project is on track.
3. Explain how many units should be done today.
4. Identify if the target date is realistic.
5. Give a short, practical suggestion for the next session.
6. Do not shame me.
7. Do not invent progress.
8. Base the review only on the JSON.

Output format:
- Project Summary
- Progress Status
- Today’s Required Work
- Risk / Delay
- Next Action
- One-line Conclusion

Here is the JSON data:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``;
}

export function buildProjectFileHtml(projectFile: ProjectFile): string {
  const progress = calculateProjectFileProgress(projectFile);
  const json = JSON.stringify(projectFile, null, 2).replace(/</g, "\\u003c");
  const blocks = projectFile.blocks
    .map(
      (block) =>
        `<span class="block ${block.completed ? "completed" : ""} ${
          progress.todayRecommendedBlockIndexes.includes(block.index)
            ? "today"
            : ""
        }" title="${escapeHtml(projectFile.unitName)} ${block.index + 1}"></span>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(projectFile.projectName)} - Canvas Ratio Project File</title>
  <style>
    :root { --ink: #1a1a1a; --paper: #fbfbf7; --sun: #ffd91a; --sky: #6fb6ff; --leaf: #8bcf3f; }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--paper); }
    main { width: min(1100px, 100%); margin: 0 auto; padding: 24px; }
    h1 { margin: 0; font-size: clamp(32px, 6vw, 64px); line-height: 1; }
    .card { border: 2px solid var(--ink); background: white; padding: 18px; box-shadow: 5px 5px 0 var(--ink); }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 18px 0; }
    .metric { border: 2px solid var(--ink); background: var(--sun); padding: 12px; font-weight: 900; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(18px, 1fr)); gap: 6px; }
    .block { aspect-ratio: 1; border: 2px solid var(--ink); background: white; display: block; }
    .block.completed { background: var(--leaf); }
    .block.today:not(.completed) { background: var(--sun); box-shadow: inset 0 0 0 3px white; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <p><strong>Canvas Ratio Project File</strong></p>
      <h1>${escapeHtml(projectFile.projectName)}</h1>
      <p>${escapeHtml(projectFile.notes ?? "")}</p>
      <div class="summary">
        <div class="metric">${progress.completed}/${projectFile.totalTarget} ${escapeHtml(projectFile.unitName)}</div>
        <div class="metric">${progress.percentComplete}% complete</div>
        <div class="metric">${progress.daysLeftInclusive} days left</div>
        <div class="metric">${progress.requiredToday} ${escapeHtml(projectFile.unitName)} today</div>
      </div>
      <div class="grid">${blocks}</div>
      <p>Generated ${escapeHtml(new Date().toISOString())}</p>
    </section>
    <script type="application/json" id="canvas-ratio-project-file">
${json}
    </script>
  </main>
</body>
</html>`;
}

export function parseProjectFileImport(fileContents: string): ProjectFile | null {
  const scriptMatch = fileContents.match(
    /<script[^>]*id=["']canvas-ratio-project-file["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  const rawJson = scriptMatch?.[1]?.trim() ?? fileContents.trim();

  try {
    return normalizeProjectFile(JSON.parse(rawJson));
  } catch {
    return null;
  }
}

export function normalizeProjectFiles(raw: unknown): ProjectFile[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(normalizeProjectFile)
    .filter((file): file is ProjectFile => !!file)
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

function normalizeProjectFile(raw: unknown): ProjectFile | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  const projectName = normalizeOptionalString(raw.projectName)?.trim();
  const unitName = normalizeOptionalString(raw.unitName)?.trim();
  const todayDate = normalizeOptionalString(raw.todayDate);
  const targetDate = normalizeOptionalString(raw.targetDate);
  let totalTarget: number | null = null;

  if (typeof raw.totalTarget === "number") {
    try {
      totalTarget = normalizeTotalTarget(raw.totalTarget);
    } catch {
      return null;
    }
  }

  if (
    !projectName ||
    !unitName ||
    !totalTarget ||
    !todayDate ||
    !targetDate ||
    !dateKeyPattern.test(todayDate) ||
    !dateKeyPattern.test(targetDate)
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : [];
  const blocks = Array.from({ length: totalTarget }, (_, index) => {
    const rawBlock = rawBlocks.find(
      (block) => isPlainObject(block) && block.index === index,
    );

    return {
      index,
      completed: isPlainObject(rawBlock) ? rawBlock.completed === true : false,
      completedAt: isPlainObject(rawBlock)
        ? normalizeOptionalString(rawBlock.completedAt)
        : undefined,
      note: isPlainObject(rawBlock)
        ? normalizeOptionalString(rawBlock.note)
        : undefined,
    };
  });

  return {
    id: normalizeOptionalString(raw.id) ?? createProjectFileId(),
    projectName,
    unitName,
    totalTarget,
    todayDate,
    targetDate,
    notes: normalizeOptionalString(raw.notes)?.trim() || undefined,
    blocks,
    createdAt: normalizeOptionalString(raw.createdAt) ?? now,
    updatedAt: normalizeOptionalString(raw.updatedAt) ?? now,
  };
}

function differenceInCalendarDays(targetDate: string, todayDate: string): number {
  return Math.round((getUtcDayTime(targetDate) - getUtcDayTime(todayDate)) / 86400000);
}

function getUtcDayTime(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);

  return Date.UTC(year, month - 1, day);
}

function normalizeRequiredText(value: string, label: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${label} is required.`);
  }

  return trimmedValue;
}

function normalizeDateKey(value: string, label: string): string {
  if (!dateKeyPattern.test(value)) {
    throw new Error(`${label} must be a valid date.`);
  }

  return value;
}

function normalizeTotalTarget(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 2000) {
    throw new Error("Total target must be between 1 and 2000.");
  }

  return value;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createProjectFileId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `project-file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
