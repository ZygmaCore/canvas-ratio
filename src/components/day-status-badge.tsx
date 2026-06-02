import type { DayStatus } from "@/lib/day";

type DayStatusBadgeProps = {
  status: DayStatus;
  editable: boolean;
};

const statusContent: Record<
  DayStatus,
  { label: string; description: string; className: string }
> = {
  today: {
    label: "Today",
    description: "Editable",
    className: "bg-[#8BCF3F]",
  },
  past: {
    label: "Past",
    description: "Read-only",
    className: "bg-[#6FB6FF]",
  },
  future: {
    label: "Future",
    description: "Not available",
    className: "bg-[#FFD7BF]",
  },
};

export function DayStatusBadge({ status, editable }: DayStatusBadgeProps) {
  const content = statusContent[status];
  const description = status === "today" && !editable ? "Locked" : content.description;

  return (
    <div
      className={`w-fit border-2 border-[#1A1A1A] px-4 py-2 shadow-[3px_3px_0_#1A1A1A] ${content.className}`}
    >
      <p className="text-xs font-black uppercase">{content.label}</p>
      <p className="text-base font-black">{description}</p>
    </div>
  );
}
