import type { Story } from "@ladle/react";
import { useState } from "react";
import type { CapturedLog } from "../proxy/schemas";
import { ProxyViewer } from "./ProxyViewer";

const sampleLogs: CapturedLog[] = [
  {
    id: 1,
    timestamp: "2025-02-11T10:30:00.000Z",
    method: "POST",
    path: "/v1/messages?beta=true",
    model: "claude-haiku-4-5",
    sessionId: "user_abc123_account_def456_session_ghi789",
    rawRequestBody: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1,
      stream: false,
      messages: [{ role: "user", content: "quota" }],
    }),
    responseStatus: 200,
    responseText: JSON.stringify({
      id: "msg_quota_check",
      type: "message",
      model: "claude-haiku-4-5",
      role: "assistant",
      content: [{ type: "text", text: "ok" }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 8, output_tokens: 1 },
    }),
    inputTokens: 8,
    outputTokens: 1,
    elapsedMs: 700,
    streaming: false,
  },
  {
    id: 2,
    timestamp: "2025-02-11T10:31:00.000Z",
    method: "POST",
    path: "/v1/messages?beta=true",
    model: "claude-opus-4-6",
    sessionId: "user_abc123_account_def456_session_ghi789",
    rawRequestBody: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 16384,
      stream: true,
      thinking: { type: "enabled" as const, budget_tokens: 10000 },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text" as const,
              text: "<system-reminder>\nThe following skills are available:\n- keybindings-help: Display keyboard shortcuts and navigation tips\n- ultrawork: Maximum precision mode. Enforces 100% certainty, mandatory planning, parallel agent delegation, and verification with evidence.\n</system-reminder>",
            },
            {
              type: "text" as const,
              text: '<system-reminder>\nAs you answer the user\'s questions, you can use the following context:\n# claudeMd\n\n## Notes management\nWhen the user refers to "note" or "nb", use the `nb` CLI. Notes are stored in `~/.nb/<notebook-name>/` as markdown files with git tracking.\n\n### Reading\n```bash\nnb list                              # List all notes\nnb list --tags <tag>                 # Filter by tag\nnb show <id> --no-color              # Display content\nnb search "query"                    # Search content\n```\n\n### Creating\n```bash\nnb add -t "Title" -c "Body content"  # Create note with title\nnb todo add "Title"                  # Create todo\n```\n</system-reminder>',
            },
            {
              type: "text" as const,
              text: "Help me understand the cc-proxy project structure and then implement a feature to export captured logs as JSON.",
              cache_control: { type: "ephemeral", ttl: "1h" },
            },
          ],
        },
      ],
      system: [
        {
          type: "text" as const,
          text: "x-anthropic-billing-header: cc_version=2.1.39.c39; cc_entrypoint=cli; cch=6a540;",
        },
        {
          type: "text" as const,
          text: "You are Claude Code, Anthropic's official CLI for Claude.",
        },
        {
          type: "text" as const,
          text: "# System Prompt for Claude Code\n\n## Core Responsibilities\nYou are Claude Code, a specialized AI assistant designed to help developers write, understand, and debug code. Your primary role is to assist with:\n\n- **Code Analysis**: Examine code structure, identify patterns, and suggest improvements\n- **Implementation**: Write production-ready code following best practices\n- **Debugging**: Help locate and fix bugs in existing code\n- **Architecture**: Design scalable, maintainable system architectures\n- **Testing**: Create comprehensive test suites and validate implementations\n\n## Tools Available\nYou have access to specialized tools for file operations, command execution, and code analysis:\n\n### File Operations\n- **Read**: Access file contents with line numbers and optional offset/limit\n- **Edit**: Perform precise string replacements in files\n- **Glob**: Fast pattern matching for finding files across projects\n\n### Command Execution\n- **Bash**: Execute shell commands with timeout support and persistent working directory\n- **Grep**: Powerful regex-based search across codebases\n\n### Code Understanding\n- **Task**: Delegate complex multi-step work to specialized agents\n\n## Important Notes\n\n### Code Quality Standards\n- Follow strict TypeScript rules: no `any`, no type assertions (except `as const`)\n- Use discriminated unions instead of type predicates\n- Ensure all functions have explicit return types\n- Validate data with Zod schemas before type assertions\n\n### Best Practices\n- Always read files before editing to understand context\n- Run `bun check` to verify changes (format + typecheck + lint + knip)\n- Create atomic commits with clear messages\n- Test implementations thoroughly before considering them complete\n\n### Project-Specific Guidelines\n- Use Bun as the runtime and package manager\n- Follow Biome formatting rules\n- Leverage ESLint's strict TypeScript configuration\n- Keep schemas isomorphic between server and front...",
        },
      ],
      tools: [
        {
          name: "Bash",
          description:
            "Executes a given bash command in a persistent shell session with optional timeout. All commands run in the working directory by default. Supports git, npm, docker, and other CLI tools. Captures stdout/stderr output.",
          input_schema: {
            type: "object",
            properties: {
              command: { type: "string", description: "The command to execute" },
              timeout: {
                type: "number",
                description: "Optional timeout in milliseconds (max 600000)",
              },
              description: {
                type: "string",
                description: "Clear, concise description of what this command does in 5-10 words",
              },
            },
            required: ["command"],
          },
        },
        {
          name: "Read",
          description:
            "Reads a file from the local filesystem. Supports any file type and returns content with line numbers. Can specify offset and limit for large files. Returns error if file does not exist.",
          input_schema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "The absolute path to the file to read" },
              offset: {
                type: "number",
                description: "The line number to start reading from (0-based)",
              },
              limit: {
                type: "number",
                description: "The number of lines to read (defaults to 2000)",
              },
            },
            required: ["file_path"],
          },
        },
        {
          name: "Edit",
          description:
            "Performs exact string replacements in files. Must read file first before editing. Supports replaceAll for renaming variables across files. Fails if oldString not found or found multiple times without sufficient context.",
          input_schema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "The absolute path to the file to modify" },
              old_string: { type: "string", description: "The text to replace" },
              new_string: {
                type: "string",
                description: "The replacement text (must be different from oldString)",
              },
            },
            required: ["file_path", "old_string", "new_string"],
          },
        },
        {
          name: "Glob",
          description:
            "Fast file pattern matching tool with safety limits. Supports glob patterns like **/*.js or src/**/*.ts. Returns matching file paths sorted by modification time. Works with any codebase size.",
          input_schema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "The glob pattern to match files against" },
              path: { type: "string", description: "The directory to search in (optional)" },
            },
            required: ["pattern"],
          },
        },
        {
          name: "Grep",
          description:
            "A powerful search tool built on ripgrep for finding content across files. Supports full regex syntax with optional file filtering. Returns file paths with matches sorted by modification time. Respects .gitignore.",
          input_schema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "The regex pattern to search for" },
              path: { type: "string", description: "File or directory to search in" },
              glob: { type: "string", description: "Glob pattern to filter files (e.g., *.ts)" },
            },
            required: ["pattern"],
          },
        },
        {
          name: "Task",
          description:
            "Launch a new agent to handle complex, multi-step tasks autonomously. Use for work that requires specialized expertise or parallel execution. The agent will handle implementation details and report results.",
          input_schema: {
            type: "object",
            properties: {
              description: { type: "string", description: "A short description of the task" },
              prompt: { type: "string", description: "The task for the agent to execute" },
              subagent_type: {
                type: "string",
                description: "The type of specialized agent (e.g., build, oracle, librarian)",
              },
            },
            required: ["description", "prompt", "subagent_type"],
          },
        },
      ],
    }),
    responseStatus: 200,
    responseText:
      "I'll help you understand the cc-proxy project structure and implement a JSON export feature. Let me start by exploring the codebase.",
    inputTokens: 45000,
    outputTokens: 2500,
    elapsedMs: 15000,
    streaming: true,
  },
  {
    id: 3,
    timestamp: "2025-02-11T10:32:30.000Z",
    method: "POST",
    path: "/v1/messages?beta=true",
    model: "claude-opus-4-6",
    sessionId: "user_abc123_account_def456_session_ghi789",
    rawRequestBody: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 16384,
      stream: true,
      thinking: { type: "enabled" as const, budget_tokens: 10000 },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text" as const,
              text: "<system-reminder>\nThe following skills are available:\n- keybindings-help: Display keyboard shortcuts and navigation tips\n- ultrawork: Maximum precision mode. Enforces 100% certainty, mandatory planning, parallel agent delegation, and verification with evidence.\n</system-reminder>",
            },
            {
              type: "text" as const,
              text: '<system-reminder>\nAs you answer the user\'s questions, you can use the following context:\n# claudeMd\n\n## Notes management\nWhen the user refers to "note" or "nb", use the `nb` CLI. Notes are stored in `~/.nb/<notebook-name>/` as markdown files with git tracking.\n\n### Reading\n```bash\nnb list                              # List all notes\nnb list --tags <tag>                 # Filter by tag\nnb show <id> --no-color              # Display content\nnb search "query"                    # Search content\n```\n\n### Creating\n```bash\nnb add -t "Title" -c "Body content"  # Create note with title\nnb todo add "Title"                  # Create todo\n```\n</system-reminder>',
            },
            {
              type: "text" as const,
              text: "Help me understand the cc-proxy project structure and then implement a feature to export captured logs as JSON.",
              cache_control: { type: "ephemeral", ttl: "1h" },
            },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "thinking" as const,
              thinking:
                "The user wants me to understand the cc-proxy project structure and implement a JSON export feature for captured logs. I should:\n1. Read the main index.ts file to understand the server structure\n2. Look at the store.ts to see how logs are stored\n3. Check the current API endpoints\n4. Design and implement a new /api/export endpoint\n5. Test the implementation\n\nLet me start by reading the key files.",
            },
            {
              type: "tool_use" as const,
              id: "toolu_01ABC123DEF456",
              name: "Read",
              input: { file_path: "/Users/yuto_ogino/programs-personal/cc-proxy/src/index.ts" },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: "toolu_01ABC123DEF456",
              content:
                '     1→import Bun from "bun";\n     2→import { createServer } from "./proxy/handler";\n     3→import { createStore } from "./proxy/store";\n     4→import { renderToString } from "react-dom/server";\n     5→import { Frontend } from "./frontend";\n     6→\n     7→const store = createStore();\n     8→const handler = createServer(store);\n     9→\n     9→const server = Bun.serve({\n    10→  port: 25947,\n    11→  fetch: handler,\n    12→});\n    13→\n    14→console.log(`Server running at http://localhost:${server.port}`);\n',
            },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "Good! I can see the server structure. Now let me check the store to understand how logs are managed and what API endpoints currently exist.",
            },
          ],
        },
      ],
      system: [
        {
          type: "text" as const,
          text: "x-anthropic-billing-header: cc_version=2.1.39.c39; cc_entrypoint=cli; cch=6a540;",
        },
        {
          type: "text" as const,
          text: "You are Claude Code, Anthropic's official CLI for Claude.",
        },
        {
          type: "text" as const,
          text: "# System Prompt for Claude Code\n\n## Core Responsibilities\nYou are Claude Code, a specialized AI assistant designed to help developers write, understand, and debug code. Your primary role is to assist with:\n\n- **Code Analysis**: Examine code structure, identify patterns, and suggest improvements\n- **Implementation**: Write production-ready code following best practices\n- **Debugging**: Help locate and fix bugs in existing code\n- **Architecture**: Design scalable, maintainable system architectures\n- **Testing**: Create comprehensive test suites and validate implementations\n\n## Tools Available\nYou have access to specialized tools for file operations, command execution, and code analysis:\n\n### File Operations\n- **Read**: Access file contents with line numbers and optional offset/limit\n- **Edit**: Perform precise string replacements in files\n- **Glob**: Fast pattern matching for finding files across projects\n\n### Command Execution\n- **Bash**: Execute shell commands with timeout support and persistent working directory\n- **Grep**: Powerful regex-based search across codebases\n\n### Code Understanding\n- **Task**: Delegate complex multi-step work to specialized agents\n\n## Important Notes\n\n### Code Quality Standards\n- Follow strict TypeScript rules: no `any`, no type assertions (except `as const`)\n- Use discriminated unions instead of type predicates\n- Ensure all functions have explicit return types\n- Validate data with Zod schemas before type assertions\n\n### Best Practices\n- Always read files before editing to understand context\n- Run `bun check` to verify changes (format + typecheck + lint + knip)\n- Create atomic commits with clear messages\n- Test implementations thoroughly before considering them complete\n\n### Project-Specific Guidelines\n- Use Bun as the runtime and package manager\n- Follow Biome formatting rules\n- Leverage ESLint's strict TypeScript configuration\n- Keep schemas isomorphic between server and front...",
        },
      ],
      tools: [
        {
          name: "Bash",
          description:
            "Executes a given bash command in a persistent shell session with optional timeout. All commands run in the working directory by default. Supports git, npm, docker, and other CLI tools. Captures stdout/stderr output.",
          input_schema: {
            type: "object",
            properties: {
              command: { type: "string", description: "The command to execute" },
              timeout: {
                type: "number",
                description: "Optional timeout in milliseconds (max 600000)",
              },
              description: {
                type: "string",
                description: "Clear, concise description of what this command does in 5-10 words",
              },
            },
            required: ["command"],
          },
        },
        {
          name: "Read",
          description:
            "Reads a file from the local filesystem. Supports any file type and returns content with line numbers. Can specify offset and limit for large files. Returns error if file does not exist.",
          input_schema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "The absolute path to the file to read" },
              offset: {
                type: "number",
                description: "The line number to start reading from (0-based)",
              },
              limit: {
                type: "number",
                description: "The number of lines to read (defaults to 2000)",
              },
            },
            required: ["file_path"],
          },
        },
        {
          name: "Edit",
          description:
            "Performs exact string replacements in files. Must read file first before editing. Supports replaceAll for renaming variables across files. Fails if oldString not found or found multiple times without sufficient context.",
          input_schema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "The absolute path to the file to modify" },
              old_string: { type: "string", description: "The text to replace" },
              new_string: {
                type: "string",
                description: "The replacement text (must be different from oldString)",
              },
            },
            required: ["file_path", "old_string", "new_string"],
          },
        },
        {
          name: "Glob",
          description:
            "Fast file pattern matching tool with safety limits. Supports glob patterns like **/*.js or src/**/*.ts. Returns matching file paths sorted by modification time. Works with any codebase size.",
          input_schema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "The glob pattern to match files against" },
              path: { type: "string", description: "The directory to search in (optional)" },
            },
            required: ["pattern"],
          },
        },
        {
          name: "Grep",
          description:
            "A powerful search tool built on ripgrep for finding content across files. Supports full regex syntax with optional file filtering. Returns file paths with matches sorted by modification time. Respects .gitignore.",
          input_schema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "The regex pattern to search for" },
              path: { type: "string", description: "File or directory to search in" },
              glob: { type: "string", description: "Glob pattern to filter files (e.g., *.ts)" },
            },
            required: ["pattern"],
          },
        },
        {
          name: "Task",
          description:
            "Launch a new agent to handle complex, multi-step tasks autonomously. Use for work that requires specialized expertise or parallel execution. The agent will handle implementation details and report results.",
          input_schema: {
            type: "object",
            properties: {
              description: { type: "string", description: "A short description of the task" },
              prompt: { type: "string", description: "The task for the agent to execute" },
              subagent_type: {
                type: "string",
                description: "The type of specialized agent (e.g., build, oracle, librarian)",
              },
            },
            required: ["description", "prompt", "subagent_type"],
          },
        },
      ],
    }),
    responseStatus: 200,
    responseText:
      "I've examined the project structure. The server uses Bun.serve with a handler from the proxy module. Let me check the store implementation to see the current API endpoints.",
    inputTokens: 50000,
    outputTokens: 3500,
    elapsedMs: 20000,
    streaming: true,
  },
  {
    id: 4,
    timestamp: "2025-02-11T10:33:00.000Z",
    method: "POST",
    path: "/v1/messages?beta=true",
    model: "claude-sonnet-4-5-20250929",
    sessionId: "user_xyz789_account_uvw012_session_rst345",
    rawRequestBody: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8096,
      stream: true,
      messages: [
        {
          role: "user",
          content: "Find all TypeScript files with unused imports and fix them.",
        },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use" as const,
              id: "toolu_02XYZ789ABC",
              name: "Bash",
              input: {
                command: "bun knip --reporter json",
                description: "Run knip to find unused imports",
              },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: "toolu_02XYZ789ABC",
              content:
                '{"files":{"src/components/ProxyViewer.tsx":{"unused":["useState"]}},"summary":{"total":1}}',
            },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use" as const,
              id: "toolu_03DEF456GHI",
              name: "Edit",
              input: {
                file_path:
                  "/Users/yuto_ogino/programs-personal/cc-proxy/src/components/ProxyViewer.tsx",
                old_string: "import { useState } from 'react';",
                new_string: "import React from 'react';",
              },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: "toolu_03DEF456GHI",
              content: "Edit successful. File updated.",
            },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "Found and fixed 1 unused import in `src/components/ProxyViewer.tsx`. Removed the unused `useState` import. The file now only imports what it needs.",
            },
          ],
        },
      ],
      system: [
        {
          type: "text" as const,
          text: "x-anthropic-billing-header: cc_version=2.1.39.c39; cc_entrypoint=cli; cch=6a540;",
        },
        {
          type: "text" as const,
          text: "You are Claude Code, Anthropic's official CLI for Claude.",
        },
      ],
      tools: [
        {
          name: "Bash",
          description:
            "Executes a given bash command in a persistent shell session with optional timeout. All commands run in the working directory by default. Supports git, npm, docker, and other CLI tools. Captures stdout/stderr output.",
          input_schema: {
            type: "object",
            properties: {
              command: { type: "string", description: "The command to execute" },
              timeout: {
                type: "number",
                description: "Optional timeout in milliseconds (max 600000)",
              },
              description: {
                type: "string",
                description: "Clear, concise description of what this command does in 5-10 words",
              },
            },
            required: ["command"],
          },
        },
        {
          name: "Read",
          description:
            "Reads a file from the local filesystem. Supports any file type and returns content with line numbers. Can specify offset and limit for large files. Returns error if file does not exist.",
          input_schema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "The absolute path to the file to read" },
              offset: {
                type: "number",
                description: "The line number to start reading from (0-based)",
              },
              limit: {
                type: "number",
                description: "The number of lines to read (defaults to 2000)",
              },
            },
            required: ["file_path"],
          },
        },
        {
          name: "Glob",
          description:
            "Fast file pattern matching tool with safety limits. Supports glob patterns like **/*.js or src/**/*.ts. Returns matching file paths sorted by modification time. Works with any codebase size.",
          input_schema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "The glob pattern to match files against" },
              path: { type: "string", description: "The directory to search in (optional)" },
            },
            required: ["pattern"],
          },
        },
      ],
    }),
    responseStatus: 200,
    responseText:
      "Found and fixed 1 unused import in `src/components/ProxyViewer.tsx`. Removed the unused `useState` import.",
    inputTokens: 12000,
    outputTokens: 800,
    elapsedMs: 8000,
    streaming: true,
  },
  {
    id: 5,
    timestamp: "2025-02-11T10:34:00.000Z",
    method: "POST",
    path: "/v1/messages?beta=true",
    model: "claude-opus-4-6",
    sessionId: "user_abc123_account_def456_session_ghi789",
    rawRequestBody: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 16384,
      stream: true,
      messages: [{ role: "user", content: "Implement a new feature for the proxy." }],
      system: [
        {
          type: "text" as const,
          text: "You are Claude Code, Anthropic's official CLI for Claude.",
        },
      ],
    }),
    responseStatus: 429,
    responseText: null,
    inputTokens: null,
    outputTokens: null,
    elapsedMs: 300,
    streaming: true,
  },
  {
    id: 6,
    timestamp: "2025-02-11T10:35:00.000Z",
    method: "POST",
    path: "/v1/messages?beta=true",
    model: "claude-sonnet-4-5-20250929",
    sessionId: "user_mno456_account_pqr789_session_stu012",
    rawRequestBody: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8096,
      stream: true,
      messages: [
        {
          role: "user",
          content: "What are the key differences between REST and GraphQL APIs?",
        },
        {
          role: "assistant",
          content: [
            {
              type: "text" as const,
              text: "# REST vs GraphQL\n\n## REST (Representational State Transfer)\n\n**Strengths:**\n- Simple and well-established standard\n- Easy to cache with HTTP semantics\n- Great for simple CRUD operations\n\n**Weaknesses:**\n- Over-fetching: clients receive more data than needed\n- Under-fetching: multiple requests needed for related data\n- Versioning challenges (v1, v2, v3 endpoints)\n\n## GraphQL\n\n**Strengths:**\n- Precise data fetching: request exactly what you need\n- Single endpoint for all queries\n- Strong typing with schema\n- Excellent for complex, interconnected data\n\n**Weaknesses:**\n- Steeper learning curve\n- Caching is more complex\n- Query complexity can impact performance\n\n## Example\n\n```typescript\n// REST: Multiple requests\nGET /api/users/123\nGET /api/users/123/posts\nGET /api/users/123/comments\n\n// GraphQL: Single request\nquery {\n  user(id: 123) {\n    name\n    posts { title }\n    comments { text }\n  }\n}\n```\n\n**Recommendation**: Use **REST** for simple APIs, **GraphQL** for complex data relationships.",
            },
          ],
        },
      ],
      system: [
        {
          type: "text" as const,
          text: "x-anthropic-billing-header: cc_version=2.1.39.c39; cc_entrypoint=cli; cch=6a540;",
        },
        {
          type: "text" as const,
          text: "You are Claude Code, Anthropic's official CLI for Claude.",
        },
      ],
    }),
    responseStatus: 200,
    responseText:
      "REST uses multiple endpoints with fixed data structures, while GraphQL uses a single endpoint with flexible queries. REST is simpler but can lead to over/under-fetching, while GraphQL provides precise data fetching but requires more complex caching strategies.",
    inputTokens: 500,
    outputTokens: 350,
    elapsedMs: 3000,
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

const nonStreamingLog: CapturedLog = {
  id: 7,
  timestamp: "2025-02-11T10:36:00.000Z",
  method: "POST",
  path: "/v1/messages?beta=true",
  model: "claude-sonnet-4-5-20250929",
  sessionId: "user_vwx345_account_yza678_session_bcd901",
  rawRequestBody: JSON.stringify({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    stream: false,
    messages: [
      { role: "user", content: "Read the package.json file and tell me the project name." },
    ],
    system: [
      {
        type: "text" as const,
        text: "You are Claude Code, Anthropic's official CLI for Claude.",
      },
    ],
    tools: [
      {
        name: "Read",
        description:
          "Reads a file from the local filesystem. Supports any file type and returns content with line numbers. Can specify offset and limit for large files. Returns error if file does not exist.",
        input_schema: {
          type: "object",
          properties: {
            file_path: { type: "string", description: "The absolute path to the file to read" },
            offset: {
              type: "number",
              description: "The line number to start reading from (0-based)",
            },
            limit: {
              type: "number",
              description: "The number of lines to read (defaults to 2000)",
            },
          },
          required: ["file_path"],
        },
      },
    ],
  }),
  responseStatus: 200,
  responseText: JSON.stringify({
    id: "msg_01ABC123XYZ789",
    type: "message",
    model: "claude-sonnet-4-5-20250929",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "The project name is **cc-proxy** - a transparent HTTP proxy for the Anthropic Claude API that captures and displays requests/responses in a web UI.",
      },
    ],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 145, output_tokens: 28 },
  }),
  inputTokens: 145,
  outputTokens: 28,
  elapsedMs: 1200,
  streaming: false,
};

const allLogs = [...sampleLogs, nonStreamingLog];

export const WithSampleData: Story = () => <StatefulProxyViewer logs={allLogs} />;

export const Empty: Story = () => <StatefulProxyViewer logs={[]} />;
