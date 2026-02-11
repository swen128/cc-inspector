import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { ClaudeRequestSchema, ClaudeResponseSchema, SseEventSchema } from "./schemas";
import type { z } from "zod";

const FIXTURES_DIR = join(import.meta.dir, "__fixtures__");

function parseJson(text: string): unknown {
  return JSON.parse(text);
}

async function loadFixtures(prefix: string): Promise<Array<{ file: string; json: unknown }>> {
  const files = await readdir(FIXTURES_DIR);
  return Promise.all(
    files
      .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
      .map(async (file) => ({
        file,
        json: parseJson(await Bun.file(join(FIXTURES_DIR, file)).text()),
      })),
  );
}

function assertAllParse<T extends z.ZodType>(
  fixtures: Array<{ file: string; json: unknown }>,
  schema: T,
): Array<z.infer<T>> {
  const parsed: Array<z.infer<T>> = [];
  const failures: string[] = [];

  fixtures.forEach(({ file, json }) => {
    const result = schema.safeParse(json);
    if (result.success) {
      parsed.push(result.data);
    } else {
      failures.push(`${file}: ${JSON.stringify(result.error.issues, null, 2)}`);
    }
  });

  if (failures.length > 0) {
    throw new Error(
      `Schema validation failed for ${String(failures.length)} file(s):\n${failures.join("\n\n")}`,
    );
  }

  return parsed;
}

describe("ClaudeRequestSchema against sanitized fixtures", () => {
  test("parses all request fixtures", async () => {
    const fixtures = await loadFixtures("req-");
    expect(fixtures.length).toBeGreaterThan(0);
    assertAllParse(fixtures, ClaudeRequestSchema);
  });

  test("covers tool_use and tool_result content blocks", async () => {
    const fixtures = await loadFixtures("req-");
    const parsed = assertAllParse(fixtures, ClaudeRequestSchema);

    const allContentTypes = new Set(
      parsed.flatMap((req) =>
        req.messages.flatMap((msg) =>
          Array.isArray(msg.content) ? msg.content.map((block) => block.type) : [],
        ),
      ),
    );

    expect(allContentTypes.has("text")).toBe(true);
    expect(allContentTypes.has("tool_use")).toBe(true);
    expect(allContentTypes.has("tool_result")).toBe(true);
  });

  test("covers system blocks", async () => {
    const fixtures = await loadFixtures("req-");
    const parsed = assertAllParse(fixtures, ClaudeRequestSchema);

    expect(parsed.some((req) => req.system !== undefined && req.system.length > 0)).toBe(true);
  });

  test("covers tool definitions", async () => {
    const fixtures = await loadFixtures("req-");
    const parsed = assertAllParse(fixtures, ClaudeRequestSchema);

    expect(parsed.some((req) => req.tools !== undefined && req.tools.length > 0)).toBe(true);
  });
});

describe("ClaudeResponseSchema against sanitized fixtures", () => {
  test("parses all response fixtures", async () => {
    const fixtures = await loadFixtures("resp-");
    expect(fixtures.length).toBeGreaterThan(0);
    assertAllParse(fixtures, ClaudeResponseSchema);
  });

  test("covers usage fields (inputTokens / outputTokens)", async () => {
    const fixtures = await loadFixtures("resp-");
    const parsed = assertAllParse(fixtures, ClaudeResponseSchema);

    expect(parsed.some((resp) => resp.usage.input_tokens > 0)).toBe(true);
  });
});

describe("SseEventSchema against sanitized fixtures", () => {
  test("parses all SSE event fixtures", async () => {
    const fixtures = await loadFixtures("sse-");
    expect(fixtures.length).toBeGreaterThan(0);
    assertAllParse(fixtures, SseEventSchema);
  });

  test("covers key SSE event types", async () => {
    const fixtures = await loadFixtures("sse-");
    const parsed = assertAllParse(fixtures, SseEventSchema);

    const eventTypes = new Set(parsed.map((event) => event.type));

    expect(eventTypes.has("message_start")).toBe(true);
    expect(eventTypes.has("content_block_start")).toBe(true);
    expect(eventTypes.has("content_block_delta")).toBe(true);
    expect(eventTypes.has("content_block_stop")).toBe(true);
    expect(eventTypes.has("message_delta")).toBe(true);
    expect(eventTypes.has("message_stop")).toBe(true);
    expect(eventTypes.has("ping")).toBe(true);
  });
});
