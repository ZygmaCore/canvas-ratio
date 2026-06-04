export type CanvasColor = {
  hex: string;
  name: string;
  role: "white" | "black" | "project";
};

export type CanvasSlotState = "white" | "black" | "colored";

export type CanvasSlot = {
  minute: number;
  state: CanvasSlotState;
  color: string;
  taskId?: string;
  blockId?: string;
};

export type TimeBlock = {
  id: string;
  type: "sleep" | "random-event";
  title: string;
  startMinute: number;
  endMinute: number;
  color: string;
  description?: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  color: string;
  ratio: number;
  description?: string;
  createdAt?: string;
};

export type TaskInputMode = "manual-cell" | "ratio" | "time-range" | "duration";

export type TargetCanvas = "am" | "pm" | "full";

export type TaskRecord = {
  id: string;
  projectId: string;
  projectName?: string;
  taskName: string;
  color?: string;
  inputMode: TaskInputMode;
  targetCanvas?: TargetCanvas;
  assignedMinutes: number[];
  effectivePaintedMinutes?: number;
  ratio?: number;
  startMinute?: number;
  endMinute?: number;
  durationMinutes?: number;
  description?: string;
  createdAt: string;
};

export type DayRecord = {
  date: string;
  slots: CanvasSlot[];
  projects: ProjectRecord[];
  sleepBlocks: TimeBlock[];
  randomEventBlocks: TimeBlock[];
  tasks: TaskRecord[];
  journal?: JournalRecord;
  generatedImage?: GeneratedImageRecord;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface JournalInputSnapshot {
  date: string;
  totalCells: number;
  blackCells: number;
  whiteCells: number;
  coloredCells: number;
  projects: Array<{
    projectId: string;
    name: string;
    color: string;
    ratio: number;
    quotaCells: number;
    paintedCells: number;
    remainingCells: number;
  }>;
  tasks: Array<{
    taskId: string;
    projectId?: string;
    projectName?: string;
    taskName: string;
    color?: string;
    assignedCells: number;
    effectivePaintedCells: number;
    description?: string;
  }>;
  sleepBlocks: Array<{
    title: string;
    startMinute: number;
    endMinute: number;
    description?: string;
  }>;
  randomEventBlocks: Array<{
    title: string;
    startMinute: number;
    endMinute: number;
    description?: string;
  }>;
}

export interface JournalRecord {
  id: string;
  date: string;
  content: string;
  summary?: string;
  model?: string;
  source: "ai" | "mock";
  warning?: string;
  createdAt: string;
  inputSnapshot?: JournalInputSnapshot;
}

export interface ImageInputSnapshot {
  date: string;
  journalContent: string;
  colorComposition: Array<{
    color: string;
    label: string;
    minutes: number;
    cells: number;
    percentOfDay: number;
    percentOfPainted?: number;
  }>;
  projects: Array<{
    projectId: string;
    name: string;
    color: string;
    ratio: number;
    paintedCells: number;
    quotaCells: number;
  }>;
  blackCells: number;
  whiteCells: number;
  coloredCells: number;
}

export interface GeneratedImageRecord {
  id: string;
  date: string;
  imageUrl?: string;
  dataUrl?: string;
  prompt: string;
  model?: string;
  source: "ai" | "mock";
  warning?: string;
  palette: string[];
  createdAt: string;
  inputSnapshot?: ImageInputSnapshot;
}

export type PomodoroState = {
  cycleIndex: number;
  minuteInCycle: number;
  phase: "focus" | "break";
  remainingSeconds: number;
};
