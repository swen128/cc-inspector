# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

cc-proxy is a transparent HTTP proxy for the Anthropic Claude API that captures and displays requests/responses in a web UI. It intercepts Claude Code's API traffic so users can inspect system prompts, tool definitions, messages, and token usage in real time.

Usage: run the proxy, then launch Claude Code with `ANTHROPIC_BASE_URL=http://localhost:25947/proxy claude` to route traffic through it.

## Commands

- `bun run dev` — dev server with HMR (`bun --hot src/index.ts`)
- `bun run build` — production build to `dist/`
- `bun run start` — production server
- `bun test` — run tests
- `bun test path/to/file.test.ts` — run a single test file
- `bun check` — **run this to verify changes** (runs format + typecheck + lint + knip sequentially)
- `bun ladle` — Ladle dev server for component stories

## Tooling

- **Runtime/package manager**: Bun (pinned to 1.3.8 via mise.toml). Use `bun` for everything — no Node.js, npm, vite, express.
- **Formatter**: Biome (`bun format` to format, `bun format:check` to check). Config in `biome.json`.
- **Linter**: ESLint with strict TypeScript rules. Config in `eslint.config.js`.
- **Dead code**: Knip (`bun knip`). Config in `knip.json`. Unused exports/dependencies must be removed, not ignored.
- **UI components**: shadcn/ui (new-york style) via `bunx shadcn@latest add <component>`. Config in `components.json`.
- **Styling**: Tailwind CSS v4 via `bun-plugin-tailwind`. Global styles in `styles/globals.css`.
- **Component stories**: Ladle (`src/**/*.stories.tsx`). Config in `.ladle/config.mjs`.
- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **Validation**: Zod v4.

## Strict ESLint Rules

The ESLint config enforces very strict TypeScript rules that significantly affect how code must be written:

- **No `any`**: `no-explicit-any` + all `no-unsafe-*` rules are errors. Use Zod `.parse()` to safely type `Response.json()` results instead of type assertions.
- **No type assertions**: `consistent-type-assertions` set to `assertionStyle: "never"` — no `as` casts allowed. Exception: `as const` is permitted.
- **No type predicates**: Banned via `no-restricted-syntax`. Design types so narrowing happens via discriminated unions.
- **No `in` operator**: Banned. Use sum types / discriminated unions instead.
- **No throw statements**: `functional/no-throw-statements` is error (relaxed in test files and `src/index.ts`).
- **Explicit return types**: Required on all functions (arrow expressions, typed function expressions, and higher-order functions are exempt).
- **Strict boolean expressions**: No implicit truthiness checks.
- **No eslint-disable comments**: `eslint-comments/no-use` blocks all directive comments.
- **No console**: `no-console` is error (relaxed in `src/index.ts`).
- **`noUncheckedIndexedAccess`**: Enabled in tsconfig — array/record indexing returns `T | undefined`.

## Architecture

The app is a single `Bun.serve()` server (`src/index.ts`) that handles both the proxy backend and the React frontend via HTML imports.

### Proxy layer (`src/proxy/`)

- **`handler.ts`** — `handleProxy()` intercepts requests on `/proxy/*`, strips hop-by-hop headers, forwards to `https://api.anthropic.com`, and captures both streaming (SSE) and non-streaming responses. For streams, it uses `TransformStream` to tap chunks without buffering.
- **`store.ts`** — In-memory log store. `createLog()` parses request bodies against `ClaudeRequestSchema` to extract model, session ID (`metadata.user_id`), and structured message data. Provides filtered queries by session and model.
- **`schemas.ts`** — Zod schemas for the Claude Messages API request format (system blocks, messages with content blocks, tool definitions). Exported types `ClaudeRequest`, `ContentBlockType`, `MessageType` are shared between server and frontend.

### Frontend (`src/`)

- **`index.ts`** — Bun.serve routes: `/proxy/*` to handler, `/api/logs|sessions|models` to store queries, `/*` to the HTML entrypoint.
- **`ProxyViewerContainer.tsx`** — Container component. Fetches data from `/api/logs` (polls every 2s), manages filter state, and passes everything as props to the presentational component.
- **`ProxyViewer.tsx`** — Presentational component. Renders captured API calls as expandable cards showing system prompts, tools, messages (with content block renderers for text/thinking/tool_use/tool_result), and response. Pure props-in, JSX-out — no data fetching.
- **`frontend.tsx`** — React entrypoint with HMR support.

### Key design decisions

- **Presentational/container split**: UI components are split into a container (data fetching, state) and a presentational component (pure rendering). Presentational components get Ladle stories.
- Schemas in `src/proxy/schemas.ts` are imported by both server and frontend code — keep them isomorphic.
- Logs are stored in memory only (no persistence across restarts). The `logs/` directory contains sample captured JSON files for reference/testing.
- The proxy strips `accept-encoding` to avoid dealing with compressed upstream responses.
