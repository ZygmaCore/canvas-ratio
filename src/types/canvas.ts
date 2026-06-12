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
  order: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
};

export type TaskInputMode = "manual-cell" | "ratio" | "time-range" | "duration";

export type TargetCanvas = "am" | "pm" | "full";

export type TaskSource = "project-paint" | "task-dump";

export type TaskRecord = {
  id: string;
  projectId: string;
  projectName?: string;
  taskName: string;
  source?: TaskSource;
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

export type TaskDumpItem = {
  id: string;
  taskName: string;
  note?: string;
  blockCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DayRecord = {
  date: string;
  slots: CanvasSlot[];
  projects: ProjectRecord[];
  sleepBlocks: TimeBlock[];
  randomEventBlocks: TimeBlock[];
  tasks: TaskRecord[];
  taskDump?: TaskDumpItem[];
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PomodoroState = {
  cycleIndex: number;
  minuteInCycle: number;
  phase: "focus" | "break";
  remainingSeconds: number;
};
