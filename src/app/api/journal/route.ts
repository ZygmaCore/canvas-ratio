import { NextResponse } from "next/server";
import {
  buildJournalPrompt,
  createJournalSummary,
  generateMockJournal,
} from "@/lib/journal";
import type { JournalInputSnapshot, JournalSource } from "@/types/canvas";

type JournalApiResponse = {
  source: JournalSource;
  model: string;
  content: string;
  summary?: string;
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const snapshot = getValidSnapshot(body);

  if (!snapshot) {
    return NextResponse.json(
      { error: "Expected body: { snapshot: JournalInputSnapshot }." },
      { status: 400 },
    );
  }

  const mockResponse = createMockResponse(snapshot);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(mockResponse);
  }

  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.1-flash-lite";

  try {
    const content = await requestGeminiJournal(apiKey, model, snapshot);

    return NextResponse.json({
      source: "ai",
      model,
      content,
      summary: createJournalSummary(content),
    } satisfies JournalApiResponse);
  } catch (error) {
    console.error(
      "Journal AI generation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(mockResponse);
  }
}

function createMockResponse(
  snapshot: JournalInputSnapshot,
): JournalApiResponse {
  const content = generateMockJournal(snapshot);

  return {
    source: "mock",
    model: "mock-journal",
    content,
    summary: createJournalSummary(content),
  };
}

async function requestGeminiJournal(
  apiKey: string,
  model: string,
  snapshot: JournalInputSnapshot,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildJournalPrompt(snapshot) }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 700,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}.`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const content = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!content) {
    throw new Error("Gemini returned an empty journal.");
  }

  return content;
}

function getValidSnapshot(body: unknown): JournalInputSnapshot | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const snapshot = (body as { snapshot?: unknown }).snapshot;

  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const possibleSnapshot = snapshot as Partial<JournalInputSnapshot>;

  if (
    typeof possibleSnapshot.date !== "string" ||
    !Number.isFinite(possibleSnapshot.totalCells) ||
    !Number.isFinite(possibleSnapshot.blackCells) ||
    !Number.isFinite(possibleSnapshot.whiteCells) ||
    !Number.isFinite(possibleSnapshot.coloredCells) ||
    !Number.isFinite(possibleSnapshot.ratioTotal) ||
    typeof possibleSnapshot.ratioReady !== "boolean" ||
    !Array.isArray(possibleSnapshot.projects) ||
    !Array.isArray(possibleSnapshot.tasks) ||
    !Array.isArray(possibleSnapshot.sleepBlocks) ||
    !Array.isArray(possibleSnapshot.randomEventBlocks)
  ) {
    return null;
  }

  return possibleSnapshot as JournalInputSnapshot;
}
