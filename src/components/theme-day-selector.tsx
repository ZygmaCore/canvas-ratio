"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { InlineMessage } from "@/components/inline-message";
import {
  createThemeDay,
  deleteThemeDay,
  loadThemeDays,
  resetThemeDays,
  upsertThemeDay,
  type ThemeDay,
} from "@/lib/theme-days";
import type { DayRecord, ProjectRecord } from "@/types/canvas";

type ThemeDaySelectorProps = {
  day: DayRecord | null;
  projects: ProjectRecord[];
  editable: boolean;
  onApplyTheme: (theme: ThemeDay) => void;
};

export function ThemeDaySelector({
  day,
  projects,
  editable,
  onApplyTheme,
}: ThemeDaySelectorProps) {
  const [themes, setThemes] = useState<ThemeDay[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [academicRatio, setAcademicRatio] = useState("50");
  const [professionalRatio, setProfessionalRatio] = useState("30");
  const [personalRatio, setPersonalRatio] = useState("20");
  const [error, setError] = useState("");
  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === day?.themeDayId) ?? null,
    [day?.themeDayId, themes],
  );
  const activeRatios =
    selectedTheme?.ratios ??
    day?.themeDayRatios ??
    null;

  useEffect(() => {
    setThemes(loadThemeDays());
  }, []);

  function handleThemeChange(themeId: string) {
    const theme = themes.find((candidate) => candidate.id === themeId);

    if (theme) {
      onApplyTheme(theme);
    }
  }

  function handleCreateTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const nextTheme = createThemeDay({
        name: customName,
        description: customDescription,
        ratios: {
          academic: Number(academicRatio),
          professional: Number(professionalRatio),
          personal: Number(personalRatio),
        },
      });
      const nextThemes = upsertThemeDay(themes, nextTheme);

      setThemes(nextThemes);
      onApplyTheme(nextTheme);
      setCustomName("");
      setCustomDescription("");
      setCustomOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Please enter a valid theme day.",
      );
    }
  }

  function handleDeleteTheme(themeId: string) {
    setThemes(deleteThemeDay(themes, themeId));
  }

  function handleResetThemes() {
    setThemes(resetThemeDays());
  }

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[#2F5FBF]">
            Today’s Theme
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {day?.themeDayName ?? "Default ratios"}
          </h2>
          <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
            Themes change recommendations, not your freedom to paint.
          </p>
        </div>

        <label className="min-w-0 lg:w-64">
          <span className="sr-only">Change theme day</span>
          <select
            value={selectedTheme?.id ?? ""}
            disabled={!editable || themes.length === 0}
            onChange={(event) => handleThemeChange(event.currentTarget.value)}
            className="min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:bg-[#FFD7BF]"
          >
            <option value="" disabled>
              Choose a theme
            </option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-2 text-sm font-bold sm:grid-cols-3">
        {projects.map((project) => (
          <p key={project.id}>
            {project.name}:{" "}
            <span className="font-black">
              {getActiveRatio(activeRatios, project.id, project.ratio)}%
            </span>
          </p>
        ))}
      </div>

      <details
        open={customOpen}
        onToggle={(event) => setCustomOpen(event.currentTarget.open)}
        className="mt-4"
      >
        <summary className="min-h-11 cursor-pointer border-2 border-[#1A1A1A] bg-[#FBFBF7] px-4 py-2 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]">
          Custom Themes
        </summary>
        <div className="mt-4 grid gap-4">
          {editable ? (
            <form
              onSubmit={handleCreateTheme}
              className="grid gap-3 border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4"
            >
              <label className="block">
                <span className="text-sm font-black uppercase text-[#2F5FBF]">
                  Theme name
                </span>
                <input
                  type="text"
                  value={customName}
                  onChange={(event) => setCustomName(event.currentTarget.value)}
                  className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                  placeholder="Research Day"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black uppercase text-[#2F5FBF]">
                  Description
                </span>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(event) =>
                    setCustomDescription(event.currentTarget.value)
                  }
                  className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                  placeholder="Optional"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <RatioInput
                  label={projects[0]?.name ?? "School"}
                  value={academicRatio}
                  onChange={setAcademicRatio}
                />
                <RatioInput
                  label={projects[1]?.name ?? "Work"}
                  value={professionalRatio}
                  onChange={setProfessionalRatio}
                />
                <RatioInput
                  label={projects[2]?.name ?? "Personal"}
                  value={personalRatio}
                  onChange={setPersonalRatio}
                />
              </div>

              {error ? <InlineMessage type="error">{error}</InlineMessage> : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="min-h-11 border-2 border-[#1A1A1A] bg-[#2F5FBF] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                >
                  Save Custom Theme
                </button>
                <button
                  type="button"
                  onClick={handleResetThemes}
                  className="min-h-11 border-2 border-[#1A1A1A] bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                >
                  Restore Defaults
                </button>
              </div>
            </form>
          ) : null}

          <div className="grid gap-2">
            {themes
              .filter((theme) => !theme.isDefault)
              .map((theme) => (
                <article
                  key={theme.id}
                  className="flex flex-col gap-2 border-2 border-[#1A1A1A] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black">{theme.name}</p>
                    <p className="text-xs font-bold text-[#4a4a4a]">
                      {theme.ratios.academic}/{theme.ratios.professional}/
                      {theme.ratios.personal}
                    </p>
                  </div>
                  {editable ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTheme(theme.id)}
                      className="min-h-10 border-2 border-[#1A1A1A] bg-[#D62828] px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
                    >
                      Delete
                    </button>
                  ) : null}
                </article>
              ))}
          </div>
        </div>
      </details>
    </section>
  );
}

function RatioInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black uppercase text-[#2F5FBF]">
        {label}
      </span>
      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
      />
    </label>
  );
}

function getActiveRatio(
  ratios: Record<string, number> | null,
  projectId: string,
  fallbackRatio: number,
): number {
  const ratio = ratios?.[projectId];

  return typeof ratio === "number" ? ratio : fallbackRatio;
}
