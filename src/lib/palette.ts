import type { CanvasColor } from "@/types/canvas";

export const CANVAS_PALETTE = [
  { hex: "#FFFFFF", name: "White Canvas", role: "white" },
  { hex: "#FFD7BF", name: "Soft Peach", role: "project" },
  { hex: "#FFD91A", name: "Notebook Yellow", role: "project" },
  { hex: "#FF6A2A", name: "Marker Orange", role: "project" },
  { hex: "#D62828", name: "Crayon Red", role: "project" },
  { hex: "#2F5FBF", name: "Paint Blue", role: "project" },
  { hex: "#6FB6FF", name: "Sky Blue", role: "project" },
  { hex: "#8BCF3F", name: "Leaf Green", role: "project" },
  { hex: "#1E8A4A", name: "Deep Green", role: "project" },
  { hex: "#D89432", name: "Ochre", role: "project" },
  { hex: "#8B4A3A", name: "Clay", role: "project" },
  { hex: "#1A1A1A", name: "Black Canvas", role: "black" },
] as const satisfies CanvasColor[];

export const WHITE_CANVAS = CANVAS_PALETTE[0];
export const BLACK_CANVAS = CANVAS_PALETTE[11];
export const PROJECT_COLORS = CANVAS_PALETTE.filter(
  (color) => color.role === "project",
);
