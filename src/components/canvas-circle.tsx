import { createCanvasSegments, type CanvasMode } from "@/lib/canvas-segments";
import { segmentToArcPath } from "@/lib/svg-arc";
import type { CanvasSlot } from "@/types/canvas";

type CanvasCircleProps = {
  title: string;
  subtitle?: string;
  mode: CanvasMode;
  slots: CanvasSlot[];
  readOnly?: boolean;
  showLabels?: boolean;
};

const timeRanges: Record<CanvasMode, string> = {
  am: "00:00-11:59",
  pm: "12:00-23:59",
};

const modeLabels: Record<CanvasMode, string> = {
  am: "A.M.",
  pm: "P.M.",
};

export function CanvasCircle({
  title,
  subtitle,
  mode,
  slots,
  readOnly = false,
  showLabels = true,
}: CanvasCircleProps) {
  const accentColor = mode === "pm" ? "#FF6A2A" : "#6FB6FF";
  const segments = createCanvasSegments(slots, mode);
  const isFullCircle =
    segments.length === 1 && segments[0].durationMinutes >= 720;

  return (
    <article className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm font-bold text-[#4a4a4a]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {readOnly ? (
            <span className="border-2 border-[#1A1A1A] bg-[#FFD7BF] px-2 py-1 text-xs font-black">
              Read-only
            </span>
          ) : null}
          <span
            className="h-4 w-12 border-2 border-[#1A1A1A]"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mx-auto aspect-square w-full max-w-sm">
        <svg
          viewBox="0 0 240 240"
          role="img"
          aria-label={`${title} rendered from ${segments.length} segment${segments.length === 1 ? "" : "s"}`}
          className="h-full w-full overflow-visible"
        >
          <circle
            cx="120"
            cy="120"
            r="112"
            fill="#FBFBF7"
            stroke="#1A1A1A"
            strokeWidth="3"
          />
          {isFullCircle ? (
            <circle
              cx="120"
              cy="120"
              r="105"
              fill={segments[0].color}
              stroke="#1A1A1A"
              strokeWidth="2"
            />
          ) : (
            segments.map((segment) => (
              <path
                key={segment.id}
                d={segmentToArcPath(segment)}
                fill={segment.color}
                stroke="#1A1A1A"
                strokeWidth="0.45"
              />
            ))
          )}
          <circle
            cx="120"
            cy="120"
            r="46"
            fill="#FFFFFF"
            stroke="#1A1A1A"
            strokeWidth="3"
          />
          {showLabels ? (
            <>
              <text
                x="120"
                y="113"
                textAnchor="middle"
                className="fill-[#1A1A1A] text-[22px] font-black"
              >
                {modeLabels[mode]}
              </text>
              <text
                x="120"
                y="136"
                textAnchor="middle"
                className="fill-[#3d3d3d] text-[12px] font-bold"
              >
                {timeRanges[mode]}
              </text>
            </>
          ) : null}
          <circle
            cx="120"
            cy="120"
            r="105"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="5"
          />
        </svg>
      </div>
    </article>
  );
}
