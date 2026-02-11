import { ClaudeRequestSchema, type CapturedLog, type ClaudeRequest } from "./schemas";

export type { CapturedLog };

let counter = 0;
const logs: CapturedLog[] = [];

export function createLog(method: string, path: string, requestBody: string | null): CapturedLog {
  let parsedRequest: ClaudeRequest | null = null;
  let model: string | null = null;
  let sessionId: string | null = null;

  if (requestBody) {
    try {
      const json = JSON.parse(requestBody);
      const result = ClaudeRequestSchema.safeParse(json);
      if (result.success) {
        parsedRequest = result.data;
        model = parsedRequest.model;
        sessionId = parsedRequest.metadata?.user_id ?? null;
      } else {
        model = json?.model ?? null;
        sessionId = json?.metadata?.user_id ?? null;
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
    parsedRequest,
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
    if (sessionId && l.sessionId !== sessionId) return false;
    if (model && l.model !== model) return false;
    return true;
  });
}

export function getSessions(): string[] {
  const set = new Set<string>();
  for (const l of logs) {
    if (l.sessionId) set.add(l.sessionId);
  }
  return [...set];
}

export function getModels(): string[] {
  const set = new Set<string>();
  for (const l of logs) {
    if (l.model) set.add(l.model);
  }
  return [...set];
}
