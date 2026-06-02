import type { CanvasSegment } from "@/lib/canvas-segments";

const DEFAULT_TOTAL_MINUTES = 720;
const START_ANGLE_OFFSET = -90;

type Point = {
  x: number;
  y: number;
};

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDegrees: number,
): Point {
  const angleRadians = (angleDegrees * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy + radius * Math.sin(angleRadians),
  };
}

export function describeArcSector(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startPoint = polarToCartesian(cx, cy, radius, startAngle);
  const endPoint = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${startPoint.x} ${startPoint.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`,
    "Z",
  ].join(" ");
}

export function segmentToArcPath(
  segment: CanvasSegment,
  totalMinutes = DEFAULT_TOTAL_MINUTES,
): string {
  const startAngle =
    START_ANGLE_OFFSET + (segment.startOffset / totalMinutes) * 360;
  const endAngle = START_ANGLE_OFFSET + (segment.endOffset / totalMinutes) * 360;

  return describeArcSector(120, 120, 105, startAngle, endAngle);
}
