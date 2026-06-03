import {
  getBlackCellIndices,
  getColoredCellIndices,
  getWhiteCellIndices,
} from "@/lib/cells";
import { getProjectUsageFromSlots } from "@/lib/projects";
import { CANVAS_PALETTE } from "@/lib/palette";
import type {
  DayRecord,
  GeneratedImageRecord,
  ImageInputSnapshot,
} from "@/types/canvas";

export function buildImageInputSnapshot(day: DayRecord): ImageInputSnapshot {
  const slots = day.slots;
  const blackCells = getBlackCellIndices(slots).length;
  const whiteCells = getWhiteCellIndices(slots).length;
  const coloredCells = getColoredCellIndices(slots).length;
  const projectUsage = getProjectUsageFromSlots(day);

  // Calculate color composition
  const colorComposition = CANVAS_PALETTE.map((paletteColor) => {
    const slotCount = slots.filter((s) => s.color === paletteColor.hex).length;
    const cellCount = slotCount / 30;
    
    return {
      color: paletteColor.hex,
      label: paletteColor.name,
      minutes: slotCount,
      cells: cellCount,
      percentOfDay: (slotCount / 1440) * 100,
      percentOfPainted: coloredCells > 0 && paletteColor.role === "project" 
        ? (cellCount / coloredCells) * 100 
        : undefined,
    };
  }).filter(c => c.minutes > 0);

  return {
    date: day.date,
    journalContent: day.journal?.content || "",
    colorComposition,
    projects: projectUsage.map((usage) => ({
      projectId: usage.projectId,
      name: usage.projectName,
      color: usage.color,
      ratio: usage.ratio,
      paintedCells: usage.paintedCells,
      quotaCells: usage.quotaCells,
    })),
    blackCells,
    whiteCells,
    coloredCells,
  };
}

export function buildImagePrompt(snapshot: ImageInputSnapshot): string {
  const paletteHex = CANVAS_PALETTE.map((c) => c.hex).join(", ");
  const colorsUsed = snapshot.colorComposition
    .map((c) => `${c.label} (${c.color}): ${Math.round(c.percentOfDay)}% of the day`)
    .join("\n");

  return `
Create a 100x100 pixel art illustration representing a symbolic daily story based on this journal entry:

Journal Entry:
"${snapshot.journalContent}"

Visual Context (Colors and Composition):
${colorsUsed}

Requirements:
- Style: 100x100 pixel art, symbolic, daily story illustration.
- No text inside the image.
- No watermark or signature.
- No gradients or photorealism.
- Palette: Use ONLY these exact hex colors: ${paletteHex}.
- Do NOT use any colors outside this palette.
- Color dominance should roughly follow the visual context provided.
- The image should be a symbolic representation of the day's theme, not a screenshot of a user interface.
  `.trim();
}

export function generateMockPixelStory(snapshot: ImageInputSnapshot): string {
  // Generate a simple 100x100 SVG as a data URL
  const size = 100;
  const cellSize = 10;
  const rows = size / cellSize;
  const cols = size / cellSize;
  
  let rects = "";
  const palette =
    snapshot.colorComposition.length > 0
      ? snapshot.colorComposition.map(c => c.color)
      : CANVAS_PALETTE.map((color) => color.hex);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Semi-random but deterministic based on coordinates and palette
      const colorIndex = (r * cols + c) % palette.length;
      const color = palette[colorIndex];
      rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
    }
  }

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${rects}
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function createGeneratedImageRecord(params: {
  date: string;
  prompt: string;
  source: "ai" | "mock";
  dataUrl?: string;
  imageUrl?: string;
  model?: string;
  warning?: string;
  inputSnapshot?: ImageInputSnapshot;
}): GeneratedImageRecord {
  return {
    id: `image-${params.date}-${Date.now()}`,
    date: params.date,
    prompt: params.prompt,
    source: params.source,
    dataUrl: params.dataUrl,
    imageUrl: params.imageUrl,
    model: params.model,
    warning: params.warning,
    palette: CANVAS_PALETTE.map((c) => c.hex),
    createdAt: new Date().toISOString(),
    inputSnapshot: params.inputSnapshot,
  };
}
