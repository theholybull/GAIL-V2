import type { OpenAiConfigService } from "./openai-config-service";

export interface VisionAnalysisInput {
  imageBase64: string;
  mimeType?: string;
  prompt?: string;
}

export interface VisionAnalysisOutput {
  description: string;
  provider: string;
}

export class VisionService {
  private readonly model = process.env.OPENAI_MODEL ?? "gpt-5";
  private readonly baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  constructor(private readonly openAiConfigService?: OpenAiConfigService) {}

  private getApiKey(): string | undefined {
    return this.openAiConfigService?.getApiKey() ?? process.env.OPENAI_API_KEY;
  }

  async analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisOutput> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured — vision analysis requires OpenAI.");
    }

    const mime = input.mimeType || "image/jpeg";
    const userPrompt = input.prompt || "What do you see? Be brief and conversational — you're Gail looking through the camera.";

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: userPrompt },
              {
                type: "input_image",
                image_url: `data:${mime};base64,${input.imageBase64}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI vision request failed (${response.status}): ${body}`);
    }

    const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const text = payload.output_text
      ?? payload.output?.flatMap((o) => o.content ?? []).map((c) => c.text).filter(Boolean).join(" ")
      ?? "";

    if (!text.trim()) {
      throw new Error("OpenAI returned no description for the image.");
    }

    return {
      description: text.trim(),
      provider: "openai",
    };
  }
}
