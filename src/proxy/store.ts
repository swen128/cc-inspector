import { z } from "zod";
import type { CapturedLog } from "./schemas";

export type { CapturedLog };

const LooseRequestSchema = z.object({
  model: z.string().optional(),
  metadata: z.object({ user_id: z.string().optional() }).passthrough().optional(),
});

let counter = 0;
const logs: CapturedLog[] = [];

export function createLog(method: string, path: string, requestBody: string | null): CapturedLog {
  let model: string | null = null;
  let sessionId: string | null = null;

  if (requestBody !== null) {
    try {
      const json: unknown = JSON.parse(requestBody);
      const loose = LooseRequestSchema.safeParse(json);
      if (loose.success) {
        model = loose.data.model ?? null;
        sessionId = loose.data.metadata?.user_id ?? null;
      }
    } catch {
      // request body not valid JSON, skip parsing
    }
  }

  const log: CapturedLog = {
    id: ++counter,
    timestamp: new Date().toISOString(),
    method,
    path,
    model,
    sessionId,
    rawRequestBody: requestBody,
    responseStatus: null,
    responseText: null,
    inputTokens: null,
    outputTokens: null,
    elapsedMs: null,
    streaming: false,
  };

  logs.push(log);
  return log;
}

export function getFilteredLogs(sessionId?: string, model?: string): CapturedLog[] {
  return logs.filter((l) => {
    if (sessionId !== undefined && l.sessionId !== sessionId) return false;
    if (model !== undefined && l.model !== model) return false;
    return true;
  });
}

export function getSessions(): string[] {
  const set = new Set<string>();
  for (const l of logs) {
    if (l.sessionId !== null) set.add(l.sessionId);
  }
  return [...set];
}

export function getModels(): string[] {
  const set = new Set<string>();
  for (const l of logs) {
    if (l.model !== null) set.add(l.model);
  }
  return [...set];
}
