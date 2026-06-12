"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import { getDayStatus } from "@/lib/day";
import {
  loadAllDayRecords,
  parseDayRecordForImport,
  saveDayRecord,
} from "@/lib/storage";
import type { DayRecord } from "@/types/canvas";

type BackupPanelProps = {
  currentDate?: string;
  day?: DayRecord | null;
  onImportDay?: (day: DayRecord) => void;
  editable: boolean;
};

type BackupPayload = {
  version: 1;
  exportedAt: string;
  days: DayRecord[];
};

type Message = {
  type: "info" | "success" | "warning" | "error";
  text: string;
};

export function BackupPanel({
  currentDate,
  day,
  onImportDay,
  editable,
}: BackupPanelProps) {
  const dayInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);

  function handleExportCurrentDay() {
    if (!day) {
      setMessage({
        type: "warning",
        text: "No day record is available to export.",
      });
      return;
    }

    downloadJson(day, `canvas-ratio-${day.date}.json`);
    setMessage({
      type: "success",
      text: `Exported ${day.date}.`,
    });
  }

  function handleExportAllDays() {
    const days = loadAllDayRecords();

    if (days.length === 0) {
      setMessage({
        type: "warning",
        text: "No saved Canvas Ratio day records were found.",
      });
      return;
    }

    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      days,
    };

    downloadJson(payload, `canvas-ratio-backup-${getLocalDateKey()}.json`);
    setMessage({
      type: "success",
      text: `Exported ${days.length} day record${days.length === 1 ? "" : "s"}.`,
    });
  }

  async function handleImportDayFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const result = parseDayRecordForImport(parsed);

      if (!result.ok) {
        setMessage({ type: "error", text: result.message });
        return;
      }

      if (!confirmDayImport(result.day)) {
        setMessage({ type: "info", text: "Import cancelled." });
        return;
      }

      saveDayRecord(result.day);
      onImportDay?.(result.day);
      setMessage({
        type: "success",
        text: `Imported ${result.day.date}.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Could not read this JSON file.",
      });
    }
  }

  async function handleImportBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const rawDays = getBackupDays(parsed);

      if (!rawDays) {
        setMessage({
          type: "error",
          text: "This file is not a Canvas Ratio backup.",
        });
        return;
      }

      const days = rawDays
        .map((rawDay) => parseDayRecordForImport(rawDay))
        .filter((result): result is { ok: true; day: DayRecord } => result.ok)
        .map((result) => result.day);

      if (days.length === 0) {
        setMessage({
          type: "error",
          text: "No valid day records were found in this backup.",
        });
        return;
      }

      const confirmed = window.confirm(
        `Import ${days.length} Canvas Ratio day record${days.length === 1 ? "" : "s"}? Existing records with the same dates will be overwritten.`,
      );

      if (!confirmed) {
        setMessage({ type: "info", text: "Import cancelled." });
        return;
      }

      for (const importedDay of days) {
        saveDayRecord(importedDay);
        onImportDay?.(importedDay);
      }

      setMessage({
        type: "success",
        text: `Imported ${days.length} day record${days.length === 1 ? "" : "s"}.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Could not read this backup JSON file.",
      });
    }
  }

  function confirmDayImport(importedDay: DayRecord): boolean {
    const status = getDayStatus(importedDay.date);

    if (status === "today" && importedDay.date === currentDate) {
      return window.confirm(
        `Import ${importedDay.date} and overwrite the current day record?`,
      );
    }

    if (status === "future") {
      return window.confirm(
        `This record is for the future date ${importedDay.date}. It will be stored, but future canvases are not editable. Import it anyway?`,
      );
    }

    return window.confirm(
      `Import ${importedDay.date}? Existing local data for that date will be overwritten.`,
    );
  }

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Backup & Settings</h2>
          <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
            Export or import your Canvas Ratio records.
          </p>
        </div>
        <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          Local backup
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={handleExportCurrentDay}
          disabled={!day}
          className="min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-[#4a4a4a] disabled:shadow-none"
        >
          Export Current Day
        </button>
        <button
          type="button"
          onClick={handleExportAllDays}
          className="min-h-11 border-2 border-[#1A1A1A] bg-[#8BCF3F] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        >
          Export All Days
        </button>
        <button
          type="button"
          onClick={() => dayInputRef.current?.click()}
          className="min-h-11 border-2 border-[#1A1A1A] bg-[#FF6A2A] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        >
          Import Day JSON
        </button>
        <button
          type="button"
          onClick={() => backupInputRef.current?.click()}
          className="min-h-11 border-2 border-[#1A1A1A] bg-[#D89432] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        >
          Import Full Backup
        </button>
      </div>

      <input
        ref={dayInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportDayFile}
      />
      <input
        ref={backupInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportBackupFile}
      />

      {message ? (
        <InlineMessage type={message.type} className="mt-4">
          {message.text}
        </InlineMessage>
      ) : null}

      {!editable ? (
        <InlineMessage type="info" className="mt-4">
          This date is read-only for editing, but exporting and confirmed imports
          are still available.
        </InlineMessage>
      ) : null}
    </section>
  );
}

function getBackupDays(payload: unknown): unknown[] | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const possiblePayload = payload as Partial<BackupPayload>;

  return Array.isArray(possiblePayload.days) ? possiblePayload.days : null;
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getLocalDateKey(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
