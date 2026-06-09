import { ProjectFilesPageClient } from "@/components/project-files-page-client";
import { getTodayDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function ProjectFilesPage() {
  return <ProjectFilesPageClient defaultTodayDate={getTodayDateKey()} />;
}
