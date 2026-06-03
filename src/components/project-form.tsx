"use client";

import { useState, type FormEvent } from "react";
import { ColorPalettePicker } from "@/components/color-palette-picker";
import { InlineMessage } from "@/components/inline-message";
import { PROJECT_COLORS } from "@/lib/palette";
import {
  createProjectRecord,
  getProjectRatioTotal,
} from "@/lib/projects";
import type { ProjectRecord } from "@/types/canvas";

type ProjectFormProps = {
  projects: ProjectRecord[];
  disabled?: boolean;
  onAddProject: (project: ProjectRecord) => void;
};

export function ProjectForm({
  projects,
  disabled = false,
  onAddProject,
}: ProjectFormProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLORS[0].hex);
  const [ratio, setRatio] = useState("50");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const totalRatio = getProjectRatioTotal(projects);
  const nextRatio = Number(ratio || "0");
  const nextTotalRatio = totalRatio + nextRatio;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const trimmedName = name.trim();

      if (
        projects.some(
          (project) => project.name.toLowerCase() === trimmedName.toLowerCase(),
        )
      ) {
        setError("Project name already exists for this day.");
        return;
      }

      if (projects.some((project) => project.color === color)) {
        setError("Project color already exists for this day.");
        return;
      }

      if (nextTotalRatio > 100) {
        setError("Adding this project would push total ratio over 100.");
        return;
      }

      const project = createProjectRecord({
        name: trimmedName,
        color,
        ratio: nextRatio,
        description: description.trim() || undefined,
      });

      onAddProject(project);
      setName("");
      setDescription("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Please enter a valid project.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="project-form"
      className="rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Projects & Ratios</h2>
          <p className="mt-1 text-sm font-bold">
            Projects define the colors and quotas of your day.
          </p>
        </div>
        <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          Total ratio: {totalRatio}/100
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px]">
        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Project name
          </span>
          <input
            type="text"
            value={name}
            disabled={disabled}
            data-testid="project-name"
            onChange={(event) => setName(event.currentTarget.value)}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
            placeholder="Academic, Work, Personal"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black uppercase text-[#2F5FBF]">
            Ratio %
          </span>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={ratio}
            disabled={disabled}
            data-testid="project-ratio"
            onChange={(event) => setRatio(event.currentTarget.value)}
            onInput={(event) => setRatio(event.currentTarget.value)}
            className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-black uppercase text-[#2F5FBF]">
          Project color
        </legend>
        <div className="mt-2">
          <ColorPalettePicker
            value={color}
            onChange={setColor}
            disabled={disabled}
          />
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          Description
        </span>
        <textarea
          value={description}
          disabled={disabled}
          data-testid="project-description"
          onChange={(event) => setDescription(event.currentTarget.value)}
          rows={3}
          className="mt-2 w-full resize-none border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
          placeholder="Optional"
        />
      </label>

      {totalRatio !== 100 ? (
        <InlineMessage type="warning" className="mt-3">
          Project ratios must total 100 before painting. Next total would be{" "}
          {Number.isFinite(nextTotalRatio) ? nextTotalRatio : totalRatio}/100.
        </InlineMessage>
      ) : null}

      {error ? (
        <InlineMessage type="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        data-testid="add-project"
        className="mt-4 min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-[#FFFFFF] shadow-[3px_3px_0_#FFD91A] disabled:cursor-not-allowed disabled:bg-[#8B4A3A]"
      >
        Add Project
      </button>
    </form>
  );
}
