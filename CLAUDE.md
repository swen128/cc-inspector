# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

cc-proxy is a transparent HTTP proxy for the Anthropic Claude API that captures and displays requests/responses in a web UI. It intercepts Claude Code's API traffic so users can inspect system prompts, tool definitions, messages, and token usage in real time.

Usage: run the proxy, then launch Claude Code with `ANTHROPIC_BASE_URL=http://localhost:3000/proxy claude` to route traffic through it.

## Commands

- `bun --hot src/index.ts` — dev server with HMR (or `bun run dev`)
- `bun run build` — production build to `dist/`
- `bun run start` — production server
- `bun test` — run tests
- `bun test path/to/file.test.ts` — run a single test file

## Tooling

- **Runtime/package manager**: Bun (pinned to 1.3.8 via mise.toml). Use `bun` for everything — no Node.js, npm, vite, express.
- **UI components**: shadcn/ui (new-york style) via `bunx shadcn@latest add <component>`. Config in `components.json`.
- **Styling**: Tailwind CSS v4 via `bun-plugin-tailwind`. Global styles in `styles/globals.css`.
- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **Validation**: Zod v4.

## Architecture

The app is a single `Bun.serve()` server (`src/index.ts`) that handles both the proxy backend and the React frontend via HTML imports.

### Proxy layer (`src/proxy/`)

- **`handler.ts`** — `handleProxy()` intercepts requests on `/proxy/*`, strips hop-by-hop headers, forwards to `https://api.anthropic.com`, and captures both streaming (SSE) and non-streaming responses. For streams, it uses `TransformStream` to tap chunks without buffering.
- **`store.ts`** — In-memory log store. `createLog()` parses request bodies against `ClaudeRequestSchema` to extract model, session ID (`metadata.user_id`), and structured message data. Provides filtered queries by session and model.
- **`schemas.ts`** — Zod schemas for the Claude Messages API request format (system blocks, messages with content blocks, tool definitions). Exported types `ClaudeRequest`, `ContentBlockType`, `MessageType` are shared between server and frontend.

### Frontend (`src/`)

- **`index.ts`** — Bun.serve routes: `/proxy/*` to handler, `/api/logs|sessions|models` to store queries, `/*` to the HTML entrypoint.
- **`ProxyViewer.tsx`** — Main UI component. Polls `/api/logs` every 2s. Renders each captured API call as an expandable card showing system prompts, tools, messages (with content block renderers for text/thinking/tool_use/tool_result), and response. Supports raw JSON toggle, session/model filtering.
- **`frontend.tsx`** — React entrypoint with HMR support.

### Key design decisions

- Schemas in `src/proxy/schemas.ts` are imported by both server and frontend code — keep them isomorphic.
- Logs are stored in memory only (no persistence across restarts). The `logs/` directory contains sample captured JSON files for reference/testing.
- The proxy strips `accept-encoding` to avoid dealing with compressed upstream responses.
