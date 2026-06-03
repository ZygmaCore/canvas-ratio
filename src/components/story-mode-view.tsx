"use client";

import { InlineMessage } from "@/components/inline-message";
import { PixelImageFrame } from "@/components/pixel-image-frame";
import type { DayRecord } from "@/types/canvas";

type StoryModeViewProps = {
  day: DayRecord;
  onBackToCanvas: () => void;
};

export function StoryModeView({ day, onBackToCanvas }: StoryModeViewProps) {
  const image = day.generatedImage;
  const journal = day.journal;

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-xl font-black">No Pixel Story Yet</p>
        <p className="mt-2 text-sm font-bold text-[#4a4a4a]">
          Generate a journal then a pixel story to see it here.
        </p>
        <button
          type="button"
          onClick={onBackToCanvas}
          className="mt-8 border-2 border-[#1A1A1A] bg-white px-6 py-2 text-sm font-black shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        >
          Back to Canvas
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-3xl font-black">Today's Pixel Story</h2>
        <button
          type="button"
          onClick={onBackToCanvas}
          className="border-2 border-[#1A1A1A] bg-white px-4 py-2 text-xs font-black shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
        >
          Back to Canvas
        </button>
      </div>

      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <PixelImageFrame
            dataUrl={image.dataUrl}
            imageUrl={image.imageUrl}
          />
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center border-2 border-[#1A1A1A] px-2 py-0.5 text-[10px] font-black uppercase ${image.source === 'ai' ? 'bg-[#6FB6FF]' : 'bg-[#FFD91A]'}`}>
              Source: {image.source === 'ai' ? 'AI' : 'Mock Fallback'}
            </span>
            {image.model && (
              <span className="inline-flex items-center border-2 border-[#1A1A1A] bg-white px-2 py-0.5 text-[10px] font-black uppercase">
                Model: {image.model}
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-[#4a4a4a]">
            Created: {new Date(image.createdAt).toLocaleString()}
          </p>
          {image.warning ? (
            <InlineMessage type="warning">
              Warning: {image.warning}
            </InlineMessage>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border-2 border-[#1A1A1A] bg-[#FBFBF7] p-6">
            <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-[#2F5FBF]">
              Daily Journal
            </h3>
            <div className="prose prose-sm">
              {journal ? (
                journal.content.split("\n").map((line, i) => (
                  <p key={i} className="mb-3 text-sm font-medium leading-relaxed text-[#323232]">
                    {line}
                  </p>
                ))
              ) : (
                <p className="italic text-gray-500">No journal content found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
