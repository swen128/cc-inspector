# cc-inspector

A transparent proxy for the Anthropic Claude API that captures every request and response, letting you inspect system prompts, tool definitions, messages, and token usage in a web UI.

Built for understanding what Claude Code sends to the API under the hood.

## Quick Start

```bash
bunx cc-inspector
```

Then launch Claude Code through the proxy:

```bash
ANTHROPIC_BASE_URL=http://localhost:25947/proxy claude
```

Open http://localhost:25947 to see captured requests in real time.

## What You Can See

- **System prompts** — the full system message Claude Code sends, including CLAUDE.md contents and tool instructions
- **Tool definitions** — every tool available to the model, with names, descriptions, and input schemas
- **Messages** — the complete conversation history sent in each request, with renderers for text, thinking, tool_use, and tool_result blocks
- **Token usage** — input/output token counts per request
- **Streaming** — captures SSE streaming responses without buffering
- **Filtering** — filter by session ID or model

## Options

```
--port, -p <number>  Port to listen on (default: 25947, env: PORT)
```

You can also set the port via the `PORT` environment variable:

```bash
PORT=3000 bunx cc-inspector
```

Or pass it as a flag:

```bash
bunx cc-inspector --port 3000
```

## How It Works

The proxy sits between Claude Code and `api.anthropic.com`. Setting `ANTHROPIC_BASE_URL` tells Claude Code to send API requests to the proxy instead of directly to Anthropic. The proxy forwards everything to the real API and logs both the request and response.

```
Claude Code  →  cc-inspector (:25947/proxy/*)  →  api.anthropic.com
                      ↓
                Web UI (:25947)
```

Logs are stored in memory only and reset when the server restarts.