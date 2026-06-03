"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cellIndexToMinuteRange, getCellState, minuteToCellIndex } from "@/lib/cells";
import {
  formatSeconds,
  getCurrentActiveTask,
  getCurrentCellLabel,
  getMinutesSinceMidnight,
  getPomodoroSessionsForDay,
  getPomodoroState,
  getUpcomingTaskQueue,
} from "@/lib/pomodoro";
import { getTaskProjectColor, getTaskProjectName } from "@/lib/projects";
import { formatCellLabel } from "@/lib/cells";
import type { DayRecord, PomodoroState } from "@/types/canvas";

type PomodoroPanelProps = {
  day: DayRecord | null;
  readOnly?: boolean;
  compact?: boolean;
};

export function PomodoroPanel({
  day,
  readOnly = false,
  compact = false,
}: PomodoroPanelProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousPhaseRef = useRef<PomodoroState["phase"] | null>(null);
  const initializedRef = useRef(false);
  const pomodoroState = now ? getPomodoroState(now) : null;
  const sessions = useMemo(() => getPomodoroSessionsForDay(), []);
  const activeTask = day && now ? getCurrentActiveTask(day, now) : null;
  const upcomingQueue = day && now ? getUpcomingTaskQueue(day, now, 5) : [];
  const currentCellIndex = now
    ? minuteToCellIndex(getMinutesSinceMidnight(now))
    : 0;
  const currentCell = day && now ? getCellState(day.slots, currentCellIndex) : null;

  useEffect(() => {
    setNow(new Date());

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!pomodoroState) {
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      previousPhaseRef.current = pomodoroState.phase;
      return;
    }

    if (previousPhaseRef.current !== pomodoroState.phase) {
      previousPhaseRef.current = pomodoroState.phase;

      if (soundEnabled) {
        playBeep();
      }
    }
  }, [pomodoroState?.phase, soundEnabled]);

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>
            Automatic Pomodoro
          </h2>
          <p className="mt-1 text-sm font-bold">
            Clock-based 25/5 sessions from 00:00. No start or stop.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled(true)}
          disabled={soundEnabled}
          className="min-h-10 border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:bg-[#FFD7BF]"
        >
          {soundEnabled ? "Sound Enabled" : "Enable Sound"}
        </button>
      </div>

      <div className={compact ? "mt-5 grid gap-4" : "mt-5 grid gap-4 md:grid-cols-3"}>
        <div className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4">
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Current phase
          </p>
          <p className="mt-2 text-3xl font-black capitalize">
            {pomodoroState?.phase ?? "Syncing"}
          </p>
          <p className="mt-1 text-2xl font-black text-[#D62828]">
            {pomodoroState ? formatSeconds(pomodoroState.remainingSeconds) : "--:--"}
          </p>
          <p className="mt-2 text-sm font-bold">
            Session {pomodoroState ? pomodoroState.cycleIndex + 1 : "-"} / 48
          </p>
        </div>

        <div
          className={`border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4 ${
            compact ? "" : "md:col-span-2"
          }`}
        >
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Current Active Task
          </p>
          <ActiveTaskText
            day={day}
            activeTask={activeTask}
            currentCell={currentCell}
            phase={pomodoroState?.phase ?? null}
            currentCellLabel={now ? getCurrentCellLabel(now) : "syncing clock"}
          />
          {readOnly ? (
            <p className="mt-2 text-xs font-bold text-[#4a4a4a]">
              Read-only date. Pomodoro follows the real clock only.
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={
          compact
            ? "mt-5 grid gap-4"
            : "mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"
        }
      >
        <div className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4">
          <h3 className="text-lg font-black">Upcoming Queue Preview</h3>
          {upcomingQueue.length === 0 ? (
            <p className="mt-3 text-sm font-bold">No upcoming painted tasks.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {upcomingQueue.map((item) => (
                <div
                  key={`${item.taskId}-${item.startMinute}`}
                  className="flex items-center justify-between gap-3 border-2 border-[#1A1A1A] bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {item.taskName}
                    </p>
                    <p className="truncate text-xs font-bold text-[#2F5FBF]">
                      {item.projectName} /{" "}
                      {formatCellLabel(item.startMinute, item.endMinute)}
                    </p>
                  </div>
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border-2 border-[#1A1A1A]"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4">
          <h3 className="text-lg font-black">Urutan Sesi Hari Ini</h3>
          <div
            className={`mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 ${
              compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-4 sm:grid-cols-6 md:grid-cols-8"
            }`}
          >
            {sessions.map((session) => {
              const active = session.index === pomodoroState?.cycleIndex;
              const { startMinute, endMinute } = cellIndexToMinuteRange(
                session.index,
              );

              return (
                <div
                  key={session.index}
                  className={`border-2 border-[#1A1A1A] p-2 text-center ${
                    active ? "bg-[#FFD91A]" : "bg-white"
                  }`}
                >
                  <p className="text-xs font-black">{session.index + 1}</p>
                  <p className="mt-1 text-[10px] font-bold">
                    {formatCellLabel(startMinute, endMinute)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ActiveTaskText({
  day,
  activeTask,
  currentCell,
  phase,
  currentCellLabel,
}: {
  day: DayRecord | null;
  activeTask: ReturnType<typeof getCurrentActiveTask>;
  currentCell: ReturnType<typeof getCellState> | null;
  phase: PomodoroState["phase"] | null;
  currentCellLabel: string;
}) {
  if (!phase) {
    return <p className="mt-2 text-xl font-black">Syncing real clock.</p>;
  }

  if (phase === "break") {
    return (
      <p className="mt-2 text-xl font-black">
        Break time / {currentCellLabel}
      </p>
    );
  }

  if (!day || !currentCell) {
    return <p className="mt-2 text-xl font-black">No day record loaded.</p>;
  }

  if (currentCell.state === "black") {
    return (
      <p className="mt-2 text-xl font-black">
        Current active task: Black canvas / unavailable. / {currentCellLabel}
      </p>
    );
  }

  if (currentCell.state === "colored" && !activeTask) {
    return (
      <p className="mt-2 text-xl font-black">
        Current active task: Painted project time. / {currentCellLabel}
      </p>
    );
  }

  if (!activeTask) {
    return (
      <p className="mt-2 text-xl font-black">
        Current active task: Free canvas. / {currentCellLabel}
      </p>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <span
        className="h-7 w-7 rounded-full border-2 border-[#1A1A1A]"
        style={{ backgroundColor: getTaskProjectColor(day, activeTask) }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="break-words text-xl font-black">{activeTask.taskName}</p>
        <p className="break-words text-sm font-bold text-[#2F5FBF]">
          {getTaskProjectName(day, activeTask)} / {currentCellLabel}
        </p>
      </div>
    </div>
  );
}

function playBeep() {
  try {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = 660;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
  } catch {
    // Browser audio permissions can block this; the visual timer still works.
  }
}
