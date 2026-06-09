"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import { ProjectFileDetail } from "@/components/project-file-detail";
import { ProjectFileForm } from "@/components/project-file-form";
import { ProjectFileList } from "@/components/project-file-list";
import {
  deleteProjectFile,
  loadProjectFiles,
  parseProjectFileImport,
  upsertProjectFile,
  type ProjectFile,
} from "@/lib/project-files";

type ProjectFilesPageClientProps = {
  defaultTodayDate: string;
};

export function ProjectFilesPageClient({
  defaultTodayDate,
}: ProjectFilesPageClientProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [message, setMessage] = useState("");
  const selectedFile = useMemo(
    () => files.find((file) => file.id === selectedFileId) ?? files[0] ?? null,
    [files, selectedFileId],
  );

  useEffect(() => {
    const loadedFiles = loadProjectFiles();
    setFiles(loadedFiles);
    setSelectedFileId(loadedFiles[0]?.id ?? "");
  }, []);

  function handleCreateProjectFile(projectFile: ProjectFile) {
    setFiles((currentFiles) => upsertProjectFile(currentFiles, projectFile));
    setSelectedFileId(projectFile.id);
    setMessage("Project file created.");
  }

  function handleUpdateProjectFile(projectFile: ProjectFile) {
    setFiles((currentFiles) => upsertProjectFile(currentFiles, projectFile));
    setSelectedFileId(projectFile.id);
  }

  function handleDeleteProjectFile(projectFileId: string) {
    if (!window.confirm("Delete this project file from localStorage?")) {
      return;
    }

    const nextFiles = deleteProjectFile(files, projectFileId);
    setFiles(nextFiles);
    setSelectedFileId(nextFiles[0]?.id ?? "");
    setMessage("Project file deleted.");
  }

  async function handleImportProjectFile(file: File) {
    const contents = await file.text();
    const projectFile = parseProjectFileImport(contents);

    if (!projectFile) {
      throw new Error("Could not find a valid Project File in that upload.");
    }

    setFiles((currentFiles) => upsertProjectFile(currentFiles, projectFile));
    setSelectedFileId(projectFile.id);
    setMessage("Project file imported.");
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden pb-8">
      <header className="sticky top-0 z-30 border-b-2 border-[#1A1A1A] bg-[#FBFBF7]/95 shadow-[0_4px_0_rgba(26,26,26,0.18)] backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#2F5FBF]">
              Canvas Ratio
            </p>
            <h1 className="mt-1 text-3xl font-black leading-tight">
              Project Files
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/canvas"
              className="min-h-11 border-2 border-[#1A1A1A] bg-[#FFD91A] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#1A1A1A] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Back to Canvas
            </Link>
            <Link
              href="/"
              className="min-h-11 border-2 border-[#1A1A1A] bg-white px-4 py-2 text-sm font-black text-[#2F5FBF] shadow-[3px_3px_0_#FFD91A] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start lg:px-8 xl:grid-cols-[430px_minmax(0,1fr)]">
        <aside className="grid min-w-0 gap-4 lg:sticky lg:top-[6rem] lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
          <ProjectFileList
            files={files}
            selectedFileId={selectedFile?.id ?? ""}
            onSelectProjectFile={setSelectedFileId}
            onImportProjectFile={handleImportProjectFile}
          />

          <ProjectFileForm
            defaultTodayDate={defaultTodayDate}
            onCreateProjectFile={handleCreateProjectFile}
          />
        </aside>

        <section className="min-w-0">
          {message ? (
            <InlineMessage type="info" className="mb-4">
              {message}
            </InlineMessage>
          ) : null}
          <ProjectFileDetail
            projectFile={selectedFile}
            onUpdateProjectFile={handleUpdateProjectFile}
            onDeleteProjectFile={handleDeleteProjectFile}
          />
        </section>
      </div>
    </main>
  );
}
