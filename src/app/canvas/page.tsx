import { CanvasPageClient } from "@/components/canvas-page-client";
import { getTodayDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function CanvasPage() {
  return <CanvasPageClient initialDateKey={getTodayDateKey()} />;
}
