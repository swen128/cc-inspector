import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";

const LOGS_DIR = "logs";
const OUT_DIR = "src/proxy/__fixtures__";

// Zod discriminator/enum literals — replacing these would break schema validation
const KEEP_VALUES = new Set([
  "text",
  "thinking",
  "image",
  "tool_use",
  "tool_result",
  "base64",
  "user",
  "assistant",
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

await mkdir(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const files = args.length > 0 ? args : (await readdir(LOGS_DIR)).filter((f) => f.endsWith(".json"));

const seen = new Set<string>();
let written = 0;
let skipped = 0;

for (const file of files) {
  const path = join(LOGS_DIR, file);
  const text = await Bun.file(path).text();
  const log = JSON.parse(text);
  const body = log.request?.body;
  if (!body) continue;

  const content = JSON.stringify(sanitize(body), null, 2) + "\n";
  const hash = Bun.hash(content).toString(36);

  if (seen.has(hash)) {
    skipped++;
    continue;
  }
  seen.add(hash);

  await Bun.write(join(OUT_DIR, `${hash}.json`), content);
  written++;
}

console.log(`Wrote ${String(written)} fixtures, skipped ${String(skipped)} duplicates`);
