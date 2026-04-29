import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ActionResult, CreateCommandMappingInput, ExecuteCommandInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import { HARDWIRED_COMMANDS, type HardwiredCommandDefinition } from "../../shared/command-definitions/hardwired-commands";
import type { RequestMeta } from "../api/request-meta";
import { HttpError } from "../api/http-error";
import { ActionBroker } from "../brokers/action-broker";

interface CommandMappingRecord {
  id: string;
  commandKey: string;
  phrase: string;
  normalizedPhrase: string;
  createdAt: string;
  updatedAt: string;
}

interface CommandMappingsFile {
  mappings: CommandMappingRecord[];
}

export class CommandService {
  private readonly mappingsPath: string;

  constructor(
    private readonly actionBroker: ActionBroker,
    mappingsPath = process.env.GAIL_COMMAND_MAPPINGS_PATH ?? resolve(process.cwd(), "..", "data", "commands", "mappings.json"),
  ) {
    this.mappingsPath = mappingsPath;
  }

  list(): HardwiredCommandDefinition[] {
    const mappings = this.readMappings();
    return HARDWIRED_COMMANDS.map((entry) => {
      const mappedPhrases = mappings
        .filter((mapping) => mapping.commandKey === entry.key)
        .map((mapping) => mapping.phrase);
      return {
        ...entry,
        phrases: dedupePhrases([...entry.phrases, ...mappedPhrases]),
      };
    });
  }

  listMappings(): CommandMappingRecord[] {
    return this.readMappings();
  }

  createMapping(input: CreateCommandMappingInput): { mapping: CommandMappingRecord; command: HardwiredCommandDefinition } {
    const commandKey = input.commandKey.trim();
    const phrase = input.phrase.trim();
    if (!commandKey) {
      throw new HttpError(400, "commandKey must not be empty.");
    }
    if (!phrase) {
      throw new HttpError(400, "phrase must not be empty.");
    }
    const command = HARDWIRED_COMMANDS.find((entry) => entry.key === commandKey);
    if (!command) {
      throw new HttpError(404, `Command key not found: ${commandKey}`);
    }

    const normalizedPhrase = normalizeCommandPhrase(phrase);
    const mappings = this.readMappings();
    const existing = mappings.find((mapping) => mapping.commandKey === commandKey && mapping.normalizedPhrase === normalizedPhrase);
    if (existing) {
      return {
        mapping: existing,
        command: {
          ...command,
          phrases: dedupePhrases([...command.phrases, existing.phrase]),
        },
      };
    }

    const now = new Date().toISOString();
    const mapping: CommandMappingRecord = {
      id: createScaffoldId("command_mapping"),
      commandKey,
      phrase,
      normalizedPhrase,
      createdAt: now,
      updatedAt: now,
    };
    const nextMappings = [mapping, ...mappings].slice(0, 400);
    this.writeMappings(nextMappings);
    return {
      mapping,
      command: {
        ...command,
        phrases: dedupePhrases([...command.phrases, mapping.phrase]),
      },
    };
  }

  execute(meta: RequestMeta, input: ExecuteCommandInput): ActionResult & { command: HardwiredCommandDefinition } {
    const command = this.match(input.phrase);
    if (!command) {
      throw new HttpError(404, `No hardwired command matched phrase: ${input.phrase}`);
    }

    return this.executeMatched(meta, command);
  }

  match(phrase: string, options: { allowPartial?: boolean } = {}): HardwiredCommandDefinition | undefined {
    const normalized = normalizeCommandPhrase(phrase);
    return this.list().find((entry) => entry.phrases.some((candidate) => {
      const normalizedCandidate = normalizeCommandPhrase(candidate);
      return options.allowPartial
        ? normalized === normalizedCandidate || normalized.includes(normalizedCandidate)
        : normalized === normalizedCandidate;
    }));
  }

  executeMatched(meta: RequestMeta, command: HardwiredCommandDefinition): ActionResult & { command: HardwiredCommandDefinition } {
    const requestId = createScaffoldId("command_request");
    const result = this.actionBroker.evaluate({
      id: requestId,
      type: "open_url",
      riskLevel: "low",
      mode: meta.mode,
      deviceId: meta.deviceId ?? `${meta.deviceType}-anonymous`,
      requiresConfirmation: false,
      payload: {
        commandKey: command.key,
        action: command.action,
      },
    });

    return {
      ...result,
      message: `Hardwired command matched: ${command.key}. ${result.message}`,
      command,
    };
  }

  private readMappings(): CommandMappingRecord[] {
    if (!existsSync(this.mappingsPath)) {
      this.writeMappings([]);
      return [];
    }
    const raw = readFileSync(this.mappingsPath, "utf8").trim();
    if (!raw) {
      this.writeMappings([]);
      return [];
    }
    const parsed = JSON.parse(raw) as Partial<CommandMappingsFile>;
    return Array.isArray(parsed.mappings) ? parsed.mappings : [];
  }

  private writeMappings(mappings: CommandMappingRecord[]): void {
    mkdirSync(dirname(this.mappingsPath), { recursive: true });
    writeFileSync(this.mappingsPath, JSON.stringify({ mappings }, null, 2));
  }
}

function normalizeCommandPhrase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function dedupePhrases(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    const normalized = normalizeCommandPhrase(trimmed);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(trimmed);
  }
  return result;
}
