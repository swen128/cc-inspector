import { createLog, type CapturedLog } from "./store";

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

function extractStreamContent(raw: string, log: CapturedLog) {
  const textParts: string[] = [];

  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const data = JSON.parse(line.slice(6));
      if (data.type === "message_start" && data.message) {
        log.inputTokens = data.message.usage?.input_tokens ?? null;
        if (!log.model) log.model = data.message.model ?? null;
      }
      if (data.type === "content_block_delta" && data.delta?.text) {
        textParts.push(data.delta.text);
      }
      if (data.type === "message_delta" && data.usage) {
        log.outputTokens = data.usage.output_tokens ?? null;
      }
    } catch {}
  }

  return textParts.join("");
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

  const isStream =
    upstreamRes.headers.get("content-type")?.includes("text/event-stream") ?? false;

  if (!isStream) {
    const responseBody = await upstreamRes.text();
    if (log) {
      log.elapsedMs = Date.now() - startTime;
      log.responseStatus = upstreamRes.status;
      try {
        const parsed = JSON.parse(responseBody);
        log.responseText = JSON.stringify(parsed);
        log.inputTokens = parsed.usage?.input_tokens ?? null;
        log.outputTokens = parsed.usage?.output_tokens ?? null;
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

  const loggedStream = upstreamRes.body!.pipeThrough(transform);

  return new Response(loggedStream, {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
}
