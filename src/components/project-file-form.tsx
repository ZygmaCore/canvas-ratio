"use client";

import { useState, type FormEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import {
  createProjectFile,
  type ProjectFile,
  type ProjectFileInput,
} from "@/lib/project-files";
import { getTodayDateKey } from "@/lib/time";

type ProjectFileFormProps = {
  defaultTodayDate: string;
  onCreateProjectFile: (projectFile: ProjectFile) => void;
};

export function ProjectFileForm({
  defaultTodayDate,
  onCreateProjectFile,
}: ProjectFileFormProps) {
  const [projectName, setProjectName] = useState("");
  const [unitName, setUnitName] = useState("tasks");
  const [totalTarget, setTotalTarget] = useState("10");
  const [targetDate, setTargetDate] = useState(
    getDateAfterDays(defaultTodayDate, 14),
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const currentDate = getTodayDateKey();
      const input: ProjectFileInput = {
        projectName,
        unitName,
        totalTarget: Number(totalTarget),
        todayDate: currentDate,
        targetDate,
        notes,
      };

      onCreateProjectFile(createProjectFile(input));
      setProjectName("");
      setUnitName("tasks");
      setTotalTarget("10");
      setTargetDate(getDateAfterDays(currentDate, 14));
      setNotes("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Please enter a valid project file.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-panel-enter rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[5px_5px_0_#1A1A1A]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            New Project File
          </p>
          <h2 className="mt-1 text-2xl font-black">Create progress blocks</h2>
        </div>
        <span className="w-fit border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          Local file
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextInput
          label="Project name"
          value={projectName}
          onChange={setProjectName}
          placeholder="Project name"
        />
        <TextInput
          label="Unit name"
          value={unitName}
          onChange={setUnitName}
          placeholder="tasks"
        />
        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Total target
          </span>
          <input
            type="number"
            min="1"
            max="2000"
            value={totalTarget}
            onChange={(event) => setTotalTarget(event.currentTarget.value)}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Target date
          </span>
          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.currentTarget.value)}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          Notes
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          rows={3}
          className="mt-2 w-full resize-none border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          placeholder="Optional"
        />
      </label>

      {error ? (
        <InlineMessage type="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}

      <button
        type="submit"
        className="mt-4 min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
      >
        Create Project File
      </button>
    </form>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black uppercase text-[#2F5FBF]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        placeholder={placeholder}
      />
    </label>
  );
}

function getDateAfterDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days - 1);

  return date.toISOString().slice(0, 10);
}
