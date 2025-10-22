/**
 * Image generation helper using OpenAI Images API
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 */
import { getOpenAI } from "server/services/openai";
import { storagePut } from "server/storage";

export type GenerateImageOptions = {
  prompt: string;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const openai = getOpenAI();

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: options.prompt,
    size: "1024x1024",
    response_format: "b64_json",
  });

  const image = result.data?.[0];
  if (!image?.b64_json) {
    throw new Error("Image generation failed: no image returned");
  }

  const buffer = Buffer.from(image.b64_json, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    "image/png"
  );
  return { url };
}
