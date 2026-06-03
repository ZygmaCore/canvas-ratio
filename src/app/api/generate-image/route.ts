import { NextRequest, NextResponse } from "next/server";
import { generateGeminiImage, getGeminiApiKey } from "@/lib/google-ai";
import {
  buildImagePrompt,
  generateMockPixelStory,
} from "@/lib/image-story";
import { ImageInputSnapshot } from "@/types/canvas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { snapshot } = body as { snapshot: ImageInputSnapshot };

    if (!snapshot || !snapshot.date) {
      return NextResponse.json(
        { error: "Invalid snapshot data" },
        { status: 400 }
      );
    }

    if (!snapshot.journalContent) {
      return NextResponse.json(
        { error: "Journal content is required for image generation" },
        { status: 400 }
      );
    }

    const prompt = buildImagePrompt(snapshot);
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      const mockDataUrl = generateMockPixelStory(snapshot);
      return NextResponse.json({
        source: "mock",
        prompt,
        dataUrl: mockDataUrl,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      const { dataUrl, imageUrl, model } = await generateGeminiImage({ prompt });
      return NextResponse.json({
        source: "ai",
        model,
        prompt,
        dataUrl,
        imageUrl,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Image Error:", error);
      const mockDataUrl = generateMockPixelStory(snapshot);
      return NextResponse.json({
        source: "mock",
        prompt,
        dataUrl: mockDataUrl,
        warning: `Gemini failed: ${error.message}. Using mock fallback.`,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("API Generate Image Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
