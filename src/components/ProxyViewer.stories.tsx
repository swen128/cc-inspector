import type { Story } from "@ladle/react";
import { useState } from "react";
import type { CapturedLog } from "../proxy/schemas";
import { ProxyViewer } from "./ProxyViewer";

const sampleLogs: CapturedLog[] = [
  {
    id: 1,
    timestamp: "2025-01-15T10:30:00.000Z",
    method: "POST",
    path: "/v1/messages",
    model: "claude-sonnet-4-5-20250929",
    sessionId: "session-abc-123-def-456",
    parsedRequest: {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8096,
      stream: true,
      messages: [
        { role: "user", content: "What is the capital of France?" },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "The capital of France is **Paris**.",
            },
          ],
        },
      ],
      system: [
        {
          type: "text" as const,
          text: "You are a helpful assistant.",
        },
      ],
    },
    rawRequestBody:
      '{"model":"claude-sonnet-4-5-20250929","messages":[{"role":"user","content":"What is the capital of France?"}]}',
    responseStatus: 200,
    responseText: "The capital of France is **Paris**.",
    inputTokens: 42,
    outputTokens: 12,
    elapsedMs: 1230,
    streaming: true,
  },
  {
    id: 2,
    timestamp: "2025-01-15T10:31:00.000Z",
    method: "POST",
    path: "/v1/messages",
    model: "claude-sonnet-4-5-20250929",
    sessionId: "session-abc-123-def-456",
    parsedRequest: {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8096,
      stream: true,
      messages: [
        { role: "user", content: "List files in the src directory" },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use" as const,
              id: "toolu_01ABC",
              name: "Bash",
              input: { command: "ls -la src/", description: "List files in src" },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: "toolu_01ABC",
              content: "App.tsx\nindex.ts\nProxyViewer.tsx\nfrontend.tsx",
            },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "Here are the files in the `src/` directory:\n\n- `App.tsx`\n- `index.ts`\n- `ProxyViewer.tsx`\n- `frontend.tsx`",
            },
          ],
        },
      ],
      tools: [
        {
          name: "Bash",
          description: "Execute a bash command",
          input_schema: {
            type: "object",
            properties: {
              command: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        {
          name: "Read",
          description: "Read a file from the filesystem",
          input_schema: {
            type: "object",
            properties: {
              file_path: { type: "string" },
            },
          },
        },
      ],
    },
    rawRequestBody: "{}",
    responseStatus: 200,
    responseText: "Here are the files in the `src/` directory.",
    inputTokens: 3200,
    outputTokens: 180,
    elapsedMs: 4520,
    streaming: true,
  },
  {
    id: 3,
    timestamp: "2025-01-15T10:32:30.000Z",
    method: "POST",
    path: "/v1/messages",
    model: "claude-opus-4-6",
    sessionId: "session-xyz-789-uvw-012",
    parsedRequest: {
      model: "claude-opus-4-6",
      max_tokens: 16384,
      stream: true,
      thinking: { type: "enabled" as const, budget_tokens: 10000 },
      messages: [
        {
          role: "user",
          content:
            "Refactor the authentication module to use JWT tokens instead of session cookies.",
        },
        {
          role: "assistant",
          content: [
            {
              type: "thinking" as const,
              thinking:
                "The user wants to refactor authentication from session-based to JWT. I need to:\n1. Read the current auth module\n2. Understand the session cookie flow\n3. Replace with JWT sign/verify\n4. Update middleware\n\nLet me start by reading the existing code.",
            },
            {
              type: "tool_use" as const,
              id: "toolu_02DEF",
              name: "Read",
              input: { file_path: "src/auth/middleware.ts" },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: "toolu_02DEF",
              content:
                'import { Request, Response, NextFunction } from "express";\n\nexport function authMiddleware(req: Request, res: Response, next: NextFunction) {\n  const session = req.cookies["session_id"];\n  if (!session) return res.status(401).json({ error: "Unauthorized" });\n  next();\n}',
            },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "I've read the current middleware. Here's my plan to refactor to JWT:\n\n1. Install `jsonwebtoken` package\n2. Replace cookie check with Bearer token validation\n3. Add token signing on login\n\nLet me implement these changes.",
            },
          ],
        },
      ],
      system: [
        {
          type: "text" as const,
          text: "You are a senior software engineer. Think step by step before making changes.",
        },
      ],
    },
    rawRequestBody: "{}",
    responseStatus: 200,
    responseText:
      "I've read the current middleware. Here's my plan to refactor to JWT:\n\n1. Install `jsonwebtoken` package\n2. Replace cookie check with Bearer token validation\n3. Add token signing on login",
    inputTokens: 8500,
    outputTokens: 1200,
    elapsedMs: 12400,
    streaming: true,
  },
  {
    id: 4,
    timestamp: "2025-01-15T10:33:00.000Z",
    method: "POST",
    path: "/v1/messages",
    model: "claude-haiku-4-5-20251001",
    sessionId: "session-xyz-789-uvw-012",
    parsedRequest: {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      stream: true,
      messages: [
        {
          role: "user",
          content:
            "Summarize this error:\n\n```\nTypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.tsx:14:22)\n```",
        },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "The error is a `TypeError` in `UserList.tsx` at line 14. You're calling `.map()` on a value that is `undefined`. The `users` prop or state is likely not initialized — add a default empty array: `const users = props.users ?? [];`",
            },
          ],
        },
      ],
    },
    rawRequestBody: "{}",
    responseStatus: 200,
    responseText:
      "The error is a `TypeError` in `UserList.tsx` at line 14. You're calling `.map()` on a value that is `undefined`.",
    inputTokens: 150,
    outputTokens: 85,
    elapsedMs: 620,
    streaming: true,
  },
  {
    id: 5,
    timestamp: "2025-01-15T10:34:00.000Z",
    method: "POST",
    path: "/v1/messages",
    model: "claude-opus-4-6",
    sessionId: "session-abc-123-def-456",
    parsedRequest: {
      model: "claude-opus-4-6",
      max_tokens: 16384,
      stream: true,
      messages: [{ role: "user", content: "Write comprehensive tests for the proxy handler." }],
      system: [
        {
          type: "text" as const,
          text: "You are a helpful assistant.",
        },
      ],
    },
    rawRequestBody: "{}",
    responseStatus: 429,
    responseText: null,
    inputTokens: null,
    outputTokens: null,
    elapsedMs: 340,
    streaming: true,
  },
  {
    id: 6,
    timestamp: "2025-01-15T10:35:00.000Z",
    method: "POST",
    path: "/v1/messages",
    model: "claude-sonnet-4-5-20250929",
    sessionId: "session-new-345-ghi-678",
    parsedRequest: {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8096,
      stream: true,
      messages: [
        {
          role: "user",
          content: "Explain the difference between `useEffect` and `useLayoutEffect` in React.",
        },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "**`useEffect`** runs asynchronously after the browser paints. It's the default choice for most side effects (data fetching, subscriptions, logging).\n\n**`useLayoutEffect`** runs synchronously after DOM mutations but *before* the browser paints. Use it when you need to measure DOM elements or prevent visual flicker.\n\n```tsx\n// useEffect — runs after paint\nuseEffect(() => {\n  fetchData();\n}, []);\n\n// useLayoutEffect — runs before paint\nuseLayoutEffect(() => {\n  const rect = ref.current.getBoundingClientRect();\n  setPosition(rect);\n}, []);\n```\n\nRule of thumb: start with `useEffect`. Only switch to `useLayoutEffect` if you see flickering.",
            },
          ],
        },
      ],
    },
    rawRequestBody: "{}",
    responseStatus: 200,
    responseText:
      "**`useEffect`** runs asynchronously after the browser paints. **`useLayoutEffect`** runs synchronously before the browser paints.",
    inputTokens: 95,
    outputTokens: 220,
    elapsedMs: 2100,
    streaming: true,
  },
];

function StatefulProxyViewer({ logs }: { logs: CapturedLog[] }): React.JSX.Element {
  const [session, setSession] = useState("__all__");
  const [model, setModel] = useState("__all__");

  const sessions = [...new Set(logs.map((l) => l.sessionId).filter((s) => s !== null))];
  const models = [...new Set(logs.map((l) => l.model).filter((m) => m !== null))];

  return (
    <ProxyViewer
      logs={logs}
      sessions={sessions}
      models={models}
      selectedSession={session}
      selectedModel={model}
      onSessionChange={setSession}
      onModelChange={setModel}
    />
  );
}

export default {
  title: "ProxyViewer",
};

export const WithSampleData: Story = () => <StatefulProxyViewer logs={sampleLogs} />;

export const Empty: Story = () => <StatefulProxyViewer logs={[]} />;
