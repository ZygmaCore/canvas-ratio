import {
  getProjectTaskCount,
  getProjectUsageFromSlots,
} from "@/lib/projects";
import { InlineMessage } from "@/components/inline-message";
import type { DayRecord } from "@/types/canvas";

type ProjectListProps = {
  day: DayRecord | null;
  editable: boolean;
  onDeleteProject: (projectId: string) => void;
};

export function ProjectList({
  day,
  editable,
  onDeleteProject,
}: ProjectListProps) {
  const projects = day?.projects ?? [];
  const usage = day ? getProjectUsageFromSlots(day) : [];

  return (
    <section className="rounded-lg border-2 border-[#1A1A1A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Project Quotas</h2>
          <p className="mt-1 text-sm font-bold">
            Ratios split only non-black paintable canvas cells.
          </p>
        </div>
        <span className="border-2 border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-black">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </span>
      </div>

      {projects.length === 0 ? (
        <InlineMessage type="warning" className="mt-4">
          Create projects first. Ratios must total 100 before painting.
        </InlineMessage>
      ) : null}

      <div className="mt-4 grid gap-3">
        {projects.map((project) => {
          const projectUsage = usage.find(
            (usageItem) => usageItem.projectId === project.id,
          );
          const taskCount = day ? getProjectTaskCount(day, project.id) : 0;

          return (
            <article
              key={project.id}
              className="border-2 border-[#1A1A1A] bg-[#FBFBF7] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border-2 border-[#1A1A1A]"
                      style={{ backgroundColor: project.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-black">
                        {project.name}
                      </h3>
                      <p className="text-sm font-bold text-[#2F5FBF]">
                        {project.ratio}% ratio / {taskCount} task
                        {taskCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm font-bold sm:grid-cols-3">
                    <p>
                      Quota:{" "}
                      <span className="font-black">
                        {projectUsage?.quotaCells ?? 0} cells
                      </span>
                    </p>
                    <p>
                      Painted:{" "}
                      <span className="font-black">
                        {projectUsage?.paintedCells ?? 0} cells
                      </span>
                    </p>
                    <p>
                      Remaining:{" "}
                      <span className="font-black">
                        {projectUsage?.remainingCells ?? 0} cells
                      </span>
                    </p>
                  </div>

                  {projectUsage?.overQuota ? (
                    <InlineMessage type="warning" className="mt-3">
                      This project is over quota.
                    </InlineMessage>
                  ) : null}

                  {project.description ? (
                    <p className="mt-3 break-words text-sm font-bold">
                      {project.description}
                    </p>
                  ) : null}
                </div>

                {editable ? (
                  <button
                    type="button"
                    onClick={() => onDeleteProject(project.id)}
                    aria-label={`Delete project ${project.name}`}
                    className="min-h-10 shrink-0 border-2 border-[#1A1A1A] bg-[#D62828] px-3 py-2 text-sm font-black text-[#FFFFFF]"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
