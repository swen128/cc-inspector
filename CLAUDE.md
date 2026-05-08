## What This Project Is

cc-inspector is a transparent HTTP proxy for the Anthropic Claude API that captures and displays requests/responses in a web UI. It intercepts Claude Code's API traffic so users can inspect system prompts, tool definitions, messages, and token usage in real time.

Usage: run the proxy, then launch Claude Code with `ANTHROPIC_BASE_URL=http://localhost:25947/proxy claude` to route traffic through it.

## Verification

Whenever you've made any code change, verify it works end-to-end by running the dev server and Claude Code.
Present verifiable proofs like screenshots to the user.

## Publishing

Publishing is automated via GitHub Actions. Push a version tag to trigger it:

1. Bump the version in `package.json`
2. `git tag v<version>` (e.g. `git tag v0.1.3`)
3. `git push origin main --tags`

The workflow (`.github/workflows/publish.yml`) runs `bun check`, then `npm publish --access public --provenance`.

