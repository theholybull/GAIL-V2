import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { OpenAiConfigStatus, UpdateOpenAiConfigInput } from "../../shared/contracts/index";

interface OpenAiConfigFile {
  apiKey?: string;
}

export class OpenAiConfigService {
  private readonly configPath: string;
  private readonly envApiKey = process.env.OPENAI_API_KEY;
  private readonly model = process.env.OPENAI_MODEL ?? "gpt-5";
  private readonly baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  constructor(
    configPath = process.env.GAIL_OPENAI_CONFIG_PATH ?? resolve(process.cwd(), "..", "data", "providers", "openai-config.json"),
  ) {
    this.configPath = configPath;
  }

  getApiKey(): string | undefined {
    return this.envApiKey ?? this.readStoredApiKey();
  }

  getStatus(): OpenAiConfigStatus {
    const stored = this.readStoredApiKey();
    const source = this.envApiKey ? "env" : stored ? "stored" : "none";
    return {
      configured: Boolean(this.envApiKey ?? stored),
      source,
      hasStoredKey: Boolean(stored),
      model: this.model,
      baseUrl: this.baseUrl,
    };
  }

  update(input: UpdateOpenAiConfigInput): OpenAiConfigStatus {
    if (input.clear) {
      this.clearStoredApiKey();
      return this.getStatus();
    }

    if (input.apiKey !== undefined) {
      this.writeStoredApiKey(input.apiKey.trim());
    }

    return this.getStatus();
  }

  private readStoredApiKey(): string | undefined {
    if (!existsSync(this.configPath)) {
      return undefined;
    }
    const raw = readFileSync(this.configPath, "utf8").trim();
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as Partial<OpenAiConfigFile>;
    return typeof parsed.apiKey === "string" && parsed.apiKey.trim().length > 0
      ? parsed.apiKey.trim()
      : undefined;
  }

  private writeStoredApiKey(apiKey: string): void {
    mkdirSync(dirname(this.configPath), { recursive: true });
    writeFileSync(this.configPath, JSON.stringify({ apiKey }, null, 2), { mode: 0o600 });
  }

  private clearStoredApiKey(): void {
    if (existsSync(this.configPath)) {
      unlinkSync(this.configPath);
    }
  }
}
