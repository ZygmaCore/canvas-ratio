"use client";

type PixelImageFrameProps = {
  dataUrl?: string;
  imageUrl?: string;
};

export function PixelImageFrame({ dataUrl, imageUrl }: PixelImageFrameProps) {
  const src = dataUrl || imageUrl;

  if (!src) {
    return (
      <div className="flex h-[100px] w-[100px] items-center justify-center border-4 border-[#1A1A1A] bg-[#FBFBF7] p-2 text-center">
        <p className="text-xs font-bold text-[#4a4a4a]">
          No story image generated yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[100px] w-[100px] overflow-hidden border-4 border-[#1A1A1A] bg-white shadow-[6px_6px_0_#1A1A1A]">
      <img
        src={src}
        alt="Generated pixel story for this day"
        className="h-full w-full object-contain"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 pointer-events-none border-[12px] border-white/20" />
    </div>
  );
}
