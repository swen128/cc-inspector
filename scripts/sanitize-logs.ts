import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";

const LOGS_DIR = "logs";
const OUT_DIR = "src/proxy/__fixtures__";

const KEEP_VALUES = new Set([
  "text",
  "thinking",
  "image",
  "tool_use",
  "tool_result",
  "base64",
  "user",
  "assistant",
  "message",
  "message_start",
  "content_block_start",
  "content_block_delta",
  "content_block_stop",
  "message_delta",
  "message_stop",
  "ping",
  "text_delta",
  "input_json_delta",
  "thinking_delta",
  "signature_delta",
]);

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return KEEP_VALUES.has(value) ? value : "<string>";
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitize(v);
    }
    return out;
  }
  return value;
}

function writeFixture(
  prefix: string,
  data: unknown,
  seen: Set<string>,
  stats: { written: number; skipped: number },
): Promise<void> | undefined {
  const content = JSON.stringify(sanitize(data), null, 2) + "\n";
  const hash = Bun.hash(content).toString(36);

  if (seen.has(hash)) {
    stats.skipped++;
    return;
  }
  seen.add(hash);
  stats.written++;
  return Bun.write(join(OUT_DIR, `${prefix}-${hash}.json`), content).then(() => undefined);
}

await mkdir(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const allFiles =
  args.length > 0
    ? args
    : await readdir(LOGS_DIR).then((fs) =>
        fs.filter((f) => f.endsWith(".json") || f.endsWith(".stream.txt")),
      );

const reqSeen = new Set<string>();
const respSeen = new Set<string>();
const sseSeen = new Set<string>();
const reqStats = { written: 0, skipped: 0 };
const respStats = { written: 0, skipped: 0 };
const sseStats = { written: 0, skipped: 0 };

for (const file of allFiles) {
  const path = join(LOGS_DIR, file);
  const text = await Bun.file(path).text();

  if (file.endsWith(".stream.txt")) {
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json: unknown = JSON.parse(line.slice(6));
        await writeFixture("sse", json, sseSeen, sseStats);
      } catch {}
    }
    continue;
  }

  const log = JSON.parse(text) as {
    request?: { body?: unknown };
    response?: { body?: Record<string, unknown> };
  };

  if (log.request?.body != null) {
    await writeFixture("req", log.request.body, reqSeen, reqStats);
  }

  if (
    log.response?.body !== undefined &&
    log.response.body !== null &&
    typeof log.response.body === "object" &&
    log.response.body["type"] === "message"
  ) {
    await writeFixture("resp", log.response.body, respSeen, respStats);
  }
}

console.log(
  `Requests:  ${String(reqStats.written)} written, ${String(reqStats.skipped)} duplicates`,
);
console.log(
  `Responses: ${String(respStats.written)} written, ${String(respStats.skipped)} duplicates`,
);
console.log(
  `SSE:       ${String(sseStats.written)} written, ${String(sseStats.skipped)} duplicates`,
);
