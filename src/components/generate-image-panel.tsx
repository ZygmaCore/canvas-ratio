"use client";

import { useState } from "react";
import { InlineMessage } from "@/components/inline-message";
import { buildImageInputSnapshot } from "@/lib/image-story";
import type { DayRecord, GeneratedImageRecord } from "@/types/canvas";

type GenerateImagePanelProps = {
  day: DayRecord;
  editable: boolean;
  onImageCreated: (image: GeneratedImageRecord) => void;
};

export function GenerateImagePanel({
  day,
  editable,
  onImageCreated,
}: GenerateImagePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerateImage() {
    if (!day.journal) {
      setError("Please generate a journal first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const snapshot = buildImageInputSnapshot(day);
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ snapshot }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }

      const imageData = normalizeImageResponse(await response.json());
      onImageCreated({
        ...imageData,
        id: `image-${day.date}-${Date.now()}`,
        date: day.date,
        inputSnapshot: snapshot,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const hasJournal = !!day.journal;
  const hasImage = !!day.generatedImage;

  return (
    <div className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <h3 className="text-xl font-black">Generate Pixel Story</h3>
      <p className="mt-2 text-sm font-bold text-[#4a4a4a]">
        Turn your journal and colors into a 100x100 pixel art story.
      </p>

      {!hasJournal && (
        <InlineMessage type="warning" className="mt-3">
          No pixel story yet. Generate image after journal.
        </InlineMessage>
      )}

      {hasJournal && !hasImage && (
        <InlineMessage type="info" className="mt-3">
          No pixel story yet. Generate image after journal.
        </InlineMessage>
      )}

      {error && (
        <InlineMessage type="error" className="mt-3">
          {error}
        </InlineMessage>
      )}

      <button
        type="button"
        disabled={!editable || loading || !hasJournal}
        onClick={handleGenerateImage}
        className="mt-4 flex min-h-12 w-full items-center justify-center border-2 border-[#1A1A1A] bg-[#FF6A2A] px-5 py-2 text-sm font-black text-white shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF] disabled:translate-y-0 disabled:bg-gray-200 disabled:opacity-50 disabled:shadow-none"
      >
        {loading
          ? "Generating Image..."
          : hasImage
          ? "Regenerate Pixel Story"
          : "Generate Pixel Story"}
      </button>

      {day.generatedImage ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]">
            Technical details
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center border-2 border-[#1A1A1A] px-2 py-0.5 text-[10px] font-black uppercase ${day.generatedImage.source === 'ai' ? 'bg-[#6FB6FF]' : 'bg-[#FFD91A]'}`}>
              Source: {day.generatedImage.source === 'ai' ? 'AI' : 'Mock Fallback'}
            </span>
            {day.generatedImage.model ? (
              <span className="inline-flex items-center border-2 border-[#1A1A1A] bg-white px-2 py-0.5 text-[10px] font-black uppercase">
                Model: {day.generatedImage.model}
              </span>
            ) : null}
          </div>
          {day.generatedImage.warning ? (
            <InlineMessage type="warning" className="mt-3">
              Warning: {day.generatedImage.warning}
            </InlineMessage>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}

function normalizeImageResponse(
  response: unknown,
): Omit<GeneratedImageRecord, "id" | "date" | "inputSnapshot"> {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error("Image response was not valid.");
  }

  const possibleImage = response as Partial<GeneratedImageRecord>;
  const dataUrl =
    typeof possibleImage.dataUrl === "string" ? possibleImage.dataUrl : undefined;
  const imageUrl =
    typeof possibleImage.imageUrl === "string" ? possibleImage.imageUrl : undefined;

  if (!dataUrl && !imageUrl) {
    throw new Error("Image response did not include an image.");
  }

  return {
    dataUrl,
    imageUrl,
    prompt:
      typeof possibleImage.prompt === "string" ? possibleImage.prompt : "",
    source: possibleImage.source === "ai" ? "ai" : "mock",
    model:
      typeof possibleImage.model === "string"
        ? possibleImage.model
        : undefined,
    warning:
      typeof possibleImage.warning === "string"
        ? possibleImage.warning
        : undefined,
    palette: Array.isArray(possibleImage.palette)
      ? possibleImage.palette.filter(
          (color): color is string => typeof color === "string",
        )
      : [],
    createdAt:
      typeof possibleImage.createdAt === "string"
        ? possibleImage.createdAt
        : new Date().toISOString(),
  };
}
