export type CanvasColor = {
  hex: string;
  name: string;
  role: "white" | "black" | "project";
};

export type CanvasSlotState = "white" | "black" | "colored";
export type EnergyLevel = "high" | "medium" | "low";
export type SnapshotCellState = "free" | "unavailable" | "colored";

export type GlobalProjectId = "academic" | "professional" | "personal";

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

export type EnergyBlock = {
  id: string;
  level: EnergyLevel;
  startTime: string;
  endTime: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
  energyBlocks?: EnergyBlock[];
  plannedCells?: CanvasCellSnapshot[];
  actualCells?: CanvasCellSnapshot[];
  planSnapshotAt?: string;
  actualUpdatedAt?: string;
  themeDayId?: string;
  themeDayName?: string;
  themeDayRatios?: Partial<Record<GlobalProjectId, number>>;
  dayReflection?: string;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CanvasCellSnapshot = {
  index: number;
  state: SnapshotCellState;
  projectId?: GlobalProjectId;
  taskName?: string;
  color?: string;
};

export type PomodoroState = {
  cycleIndex: number;
  minuteInCycle: number;
  phase: "focus" | "break";
  remainingSeconds: number;
};
