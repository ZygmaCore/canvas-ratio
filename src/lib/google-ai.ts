const DEFAULT_TEXT_MODEL = "gemini-3.1-flash-lite";
const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export function getGeminiTextModel(): string {
  return process.env.GEMINI_TEXT_MODEL || DEFAULT_TEXT_MODEL;
}

export function getGeminiImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
}

export async function generateGeminiText(params: {
  prompt: string;
}): Promise<{
  content: string;
  model: string;
}> {
  const apiKey = getGeminiApiKey();
  const model = getGeminiTextModel();

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: params.prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Text API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini Text API returned no content.");
  }

  return {
    content: text,
    model,
  };
}

export async function generateGeminiImage(params: {
  prompt: string;
}): Promise<{
  dataUrl?: string;
  imageUrl?: string;
  model: string;
}> {
  const apiKey = getGeminiApiKey();
  const model = getGeminiImageModel();

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: params.prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["Image"],
        responseFormat: {
          image: {
            aspectRatio: "1:1",
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Image API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const part = data?.candidates?.[0]?.content?.parts?.[0];
  
  const inlineData = part?.inlineData || part?.inline_data;
  const base64Data = inlineData?.data;
  const mimeType = inlineData?.mimeType || inlineData?.mime_type || "image/png";

  if (!base64Data) {
    throw new Error("Gemini Image API returned no image data.");
  }

  return {
    dataUrl: `data:${mimeType};base64,${base64Data}`,
    model,
  };
}
