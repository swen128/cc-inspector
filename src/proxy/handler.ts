import { createLog, type CapturedLog } from "./store";
import { ClaudeResponseSchema, SseEventSchema } from "./schemas";

const UPSTREAM = "https://api.anthropic.com";

const STRIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
]);

type StreamTextBlock = { type: "text"; text: string };
type StreamThinkingBlock = { type: "thinking"; thinking: string; signature: string };
type StreamToolUseBlock = { type: "tool_use"; id: string; name: string; inputJson: string };
type StreamBlock = StreamTextBlock | StreamThinkingBlock | StreamToolUseBlock;

function parseInputJson(json: string): Record<string, unknown> {
  if (json === "") return {};
  try {
    const parsed: unknown = JSON.parse(json);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ...parsed };
    }
    return {};
  } catch {
    return {};
  }
}

function finalizeBlock(block: StreamBlock): Record<string, unknown> {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };
    case "thinking": {
      const out: Record<string, unknown> = { type: "thinking", thinking: block.thinking };
      if (block.signature !== "") out.signature = block.signature;
      return out;
    }
    case "tool_use":
      return {
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: parseInputJson(block.inputJson),
      };
  }
}

function extractStreamContent(raw: string, log: CapturedLog): string {
  const blocks = new Map<number, StreamBlock>();
  let id = "";
  let model = "";
  let stopReason: string | null = null;
  let stopSequence: string | null = null;
  let inputTokens = 0;
  let outputTokens = 0;

  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const json: unknown = JSON.parse(line.slice(6));
      const parsed = SseEventSchema.safeParse(json);
      if (!parsed.success) continue;
      const data = parsed.data;

      switch (data.type) {
        case "message_start":
          id = data.message.id;
          model = data.message.model;
          inputTokens = data.message.usage.input_tokens;
          log.inputTokens = inputTokens;
          if (log.model === null) log.model = model;
          break;
        case "content_block_start": {
          const cb = data.content_block;
          if (cb.type === "text") {
            blocks.set(data.index, { type: "text", text: cb.text });
          } else if (cb.type === "thinking") {
            blocks.set(data.index, {
              type: "thinking",
              thinking: cb.thinking,
              signature: cb.signature ?? "",
            });
          } else {
            blocks.set(data.index, {
              type: "tool_use",
              id: cb.id,
              name: cb.name,
              inputJson: "",
            });
          }
          break;
        }
        case "content_block_delta": {
          const block = blocks.get(data.index);
          if (block === undefined) break;
          const delta = data.delta;
          if (delta.type === "text_delta" && block.type === "text") {
            block.text += delta.text;
          } else if (delta.type === "thinking_delta" && block.type === "thinking") {
            block.thinking += delta.thinking;
          } else if (delta.type === "signature_delta" && block.type === "thinking") {
            block.signature += delta.signature;
          } else if (delta.type === "input_json_delta" && block.type === "tool_use") {
            block.inputJson += delta.partial_json;
          }
          break;
        }
        case "message_delta":
          stopReason = data.delta.stop_reason;
          stopSequence = data.delta.stop_sequence;
          outputTokens = data.usage.output_tokens;
          log.outputTokens = outputTokens;
          break;
        case "content_block_stop":
        case "message_stop":
        case "ping":
          break;
      }
    } catch {
      // non-JSON SSE line, skip
    }
  }

  const orderedContent = [...blocks.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, block]) => finalizeBlock(block));

  return JSON.stringify({
    id,
    type: "message",
    model,
    role: "assistant",
    content: orderedContent,
    stop_reason: stopReason,
    stop_sequence: stopSequence,
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  });
}

export async function handleProxy(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/proxy/, "") + url.search;
  const upstreamUrl = UPSTREAM + apiPath;
  const startTime = Date.now();

  const upstreamHeaders = new Headers();
  req.headers.forEach((v, k) => {
    if (!STRIP_REQUEST_HEADERS.has(k)) {
      upstreamHeaders.set(k, v);
    }
  });
  upstreamHeaders.set("host", "api.anthropic.com");
  upstreamHeaders.delete("accept-encoding");

  let requestBody: string | null = null;
  if (req.body && req.method !== "GET" && req.method !== "HEAD") {
    requestBody = await req.text();
  }

  const messagesPath = apiPath.split("?")[0];
  const isMessages = req.method === "POST" && messagesPath === "/v1/messages";

  const log = isMessages ? createLog(req.method, apiPath, requestBody) : null;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: upstreamHeaders,
      body: requestBody,
    });
  } catch (err) {
    if (log) {
      log.elapsedMs = Date.now() - startTime;
      log.responseStatus = 502;
      log.responseText = String(err);
    }
    return new Response(`Proxy error: ${err}`, { status: 502 });
  }

  const responseHeaders = new Headers(upstreamRes.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  const isStream = upstreamRes.headers.get("content-type")?.includes("text/event-stream") ?? false;

  if (!isStream) {
    const responseBody = await upstreamRes.text();
    if (log) {
      log.elapsedMs = Date.now() - startTime;
      log.responseStatus = upstreamRes.status;
      try {
        const json: unknown = JSON.parse(responseBody);
        log.responseText = JSON.stringify(json);
        const parsed = ClaudeResponseSchema.safeParse(json);
        if (parsed.success) {
          log.inputTokens = parsed.data.usage.input_tokens;
          log.outputTokens = parsed.data.usage.output_tokens;
        }
      } catch {
        log.responseText = responseBody;
      }
    }
    return new Response(responseBody, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  }

  if (log) {
    log.streaming = true;
    log.responseStatus = upstreamRes.status;
  }

  const chunks: string[] = [];
  const decoder = new TextDecoder();

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      chunks.push(decoder.decode(chunk, { stream: true }));
    },
    flush() {
      if (log) {
        const full = chunks.join("");
        log.elapsedMs = Date.now() - startTime;
        log.responseText = extractStreamContent(full, log);
      }
    },
  });

  if (upstreamRes.body === null) {
    return new Response("No response body", { status: 502 });
  }

  const loggedStream = upstreamRes.body.pipeThrough(transform);

  return new Response(loggedStream, {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
}
