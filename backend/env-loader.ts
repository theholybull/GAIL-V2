import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const CANDIDATE_ENV_FILES = [
  ".env.local",
  ".env",
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env.local"),
  resolve(process.cwd(), "..", ".env"),
];

export function loadEnvironmentFiles(): void {
  for (const candidate of CANDIDATE_ENV_FILES) {
    loadEnvironmentFile(candidate);
  }
}

function loadEnvironmentFile(filePath: string): void {
  const resolvedPath = resolve(filePath);
  if (!existsSync(resolvedPath)) {
    return;
  }

  const source = readFileSync(resolvedPath, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const parsed = parseEnvironmentLine(line);
    if (!parsed) {
      continue;
    }

    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

function parseEnvironmentLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined;
  }

  const normalized = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
  const separatorIndex = normalized.indexOf("=");
  if (separatorIndex <= 0) {
    return undefined;
  }

  const key = normalized.slice(0, separatorIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return undefined;
  }

  const rawValue = normalized.slice(separatorIndex + 1).trim();
  return {
    key,
    value: unquote(rawValue),
  };
}

function unquote(value: string): string {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1);
  }

  const commentIndex = value.indexOf(" #");
  return commentIndex >= 0 ? value.slice(0, commentIndex).trim() : value;
}