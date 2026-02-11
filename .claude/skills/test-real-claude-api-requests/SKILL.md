---
name: test-real-claude-api-requests
description: Capture real Claude Code API traffic through the proxy and validate against Zod schemas
user-invocable: true
---

# Test Real Claude API Requests

Capture live Claude Code traffic through the cc-proxy, sanitize it, and run schema validation tests.

## Steps

1. Start the proxy server on port 25947:
   ```bash
   bun --hot src/index.ts &
   sleep 2
   ```

2. Run a Claude Code session routed through the proxy to generate multi-turn traffic (tool_use, tool_result, system blocks, streaming):
   ```bash
   ANTHROPIC_BASE_URL=http://localhost:25947/proxy claude --print --model claude-haiku-4-5-20251001 "Read the file package.json and tell me the project name."
   ```

3. Save captured logs from the in-memory store to `logs/` in the standard format:
   ```bash
   curl -s http://localhost:25947/api/logs
   ```
   Write each log entry to `logs/<id>.json` with the `{id, timestamp, request: {method, path, headers, body}, response: {...}}` shape.

4. Stop the proxy server.

5. Run the sanitize script to strip personal data from all logs and generate deduplicated test fixtures:
   ```bash
   rm -f src/proxy/__fixtures__/*.json
   bun scripts/sanitize-logs.ts
   ```
   This replaces all string values with `"<string>"` while preserving Zod schema discriminators (`text`, `tool_use`, `tool_result`, `thinking`, `image`, `user`, `assistant`). Fixtures are named by content hash (`Bun.hash` base-36) and duplicates are skipped.

6. Run the schema tests:
   ```bash
   bun test src/proxy/schemas.test.ts
   ```

7. Report results: how many fixtures parsed, any failures, which content block types were covered.
