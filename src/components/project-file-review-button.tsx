"use client";

import { useState } from "react";
import {
  buildProjectFileReviewPrompt,
  type ProjectFile,
} from "@/lib/project-files";
import type { ProjectRecord } from "@/types/canvas";

type ProjectFileReviewButtonProps = {
  projectFile: ProjectFile;
  projects: ProjectRecord[];
  className?: string;
};

export function ProjectFileReviewButton({
  projectFile,
  projects,
  className = "",
}: ProjectFileReviewButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopyPrompt() {
    try {
      await copyText(buildProjectFileReviewPrompt(projectFile, projects));
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopyPrompt}
      className={className}
    >
      {status === "copied"
        ? "Copied Review Prompt"
        : status === "error"
          ? "Copy Failed"
          : "Copy Review Prompt"}
    </button>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
}
