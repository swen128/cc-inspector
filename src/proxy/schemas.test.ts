import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { ClaudeRequestSchema } from "./schemas";

const FIXTURES_DIR = join(import.meta.dir, "__fixtures__");

async function loadJson(path: string): Promise<unknown> {
  const text = await Bun.file(path).text();
  return JSON.parse(text);
}

describe("ClaudeRequestSchema against sanitized fixtures", () => {
  test("parses all fixture files", async () => {
    const files = await readdir(FIXTURES_DIR);
    const requestFiles = files.filter((f) => f.endsWith(".json"));
    expect(requestFiles.length).toBeGreaterThan(0);

    const failures: Array<{ file: string; errors: unknown }> = [];

    for (const file of requestFiles) {
      const json = await loadJson(join(FIXTURES_DIR, file));
      const result = ClaudeRequestSchema.safeParse(json);
      if (!result.success) {
        failures.push({ file, errors: result.error.issues });
      }
    }

    if (failures.length > 0) {
      const summary = failures
        .map((f) => `${f.file}: ${JSON.stringify(f.errors, null, 2)}`)
        .join("\n\n");
      throw new Error(
        `Schema validation failed for ${String(failures.length)} file(s):\n${summary}`,
      );
    }
  });

  test("covers tool_use and tool_result content blocks", async () => {
    const files = await readdir(FIXTURES_DIR);
    const requestFiles = files.filter((f) => f.endsWith(".json"));

    const allContentTypes = new Set<string>();

    for (const file of requestFiles) {
      const json = await loadJson(join(FIXTURES_DIR, file));
      const result = ClaudeRequestSchema.safeParse(json);
      if (!result.success) continue;

      for (const msg of result.data.messages) {
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            allContentTypes.add(block.type);
          }
        }
      }
    }

    expect(allContentTypes.has("text")).toBe(true);
    expect(allContentTypes.has("tool_use")).toBe(true);
    expect(allContentTypes.has("tool_result")).toBe(true);
  });

  test("covers system blocks", async () => {
    const files = await readdir(FIXTURES_DIR);
    const requestFiles = files.filter((f) => f.endsWith(".json"));

    let hasSystem = false;

    for (const file of requestFiles) {
      const json = await loadJson(join(FIXTURES_DIR, file));
      const result = ClaudeRequestSchema.safeParse(json);
      if (!result.success) continue;
      if (result.data.system !== undefined && result.data.system.length > 0) {
        hasSystem = true;
        break;
      }
    }

    expect(hasSystem).toBe(true);
  });

  test("covers tool definitions", async () => {
    const files = await readdir(FIXTURES_DIR);
    const requestFiles = files.filter((f) => f.endsWith(".json"));

    let hasTools = false;

    for (const file of requestFiles) {
      const json = await loadJson(join(FIXTURES_DIR, file));
      const result = ClaudeRequestSchema.safeParse(json);
      if (!result.success) continue;
      if (result.data.tools !== undefined && result.data.tools.length > 0) {
        hasTools = true;
        break;
      }
    }

    expect(hasTools).toBe(true);
  });
});
