## Overview
This repository is a durable Eve agent for managing GitHub account and repository workflows through the GitHub REST API.
It exposes typed tools for repositories, issues, pull requests, labels, search, reactions, and notifications. `agent/instructions.md` defines runtime behavior; current source and `package.json` are authoritative when README or generated Eve data drift.

## Technology
- Node.js 24.x, npm, ESM, and strict TypeScript targeting ES2022.
- Eve 0.27.6, AI SDK 7, Zod 4, and native `fetch`.
- Vitest 2 for unit tests; Eve evals for agent and tool-routing behavior.

## Commands
- `npm install`: install dependencies.
- `npm run dev`: start Eve development mode with the UI.
- `npx eve dev --no-ui`: start development mode without the UI.
- `npm run typecheck`: run TypeScript checks.
- `npm test`: run unit tests once.
- `npm run test:watch`: run unit tests in watch mode.
- `npm run test:integration`: run all Eve evals.
- `npm run test:integration -- --strict`: run evals with strict gate handling.
- `npm run build`: create the production build.
- `npm run start`: run the production build.
- `npx eve info`: validate Eve discovery and inspect the resolved project.
- No lint or format command is currently configured; do not invent one.

## Architecture
- `agent/agent.ts` configures the model and the deterministic eval-only mock model.
- `agent/instructions.md` defines the agent's GitHub-specific operating rules.
- `agent/channels/eve.ts` exposes Eve's standard session API and auth wiring.
- `agent/lib/github.ts` centralizes GitHub REST authentication, headers, errors, request helpers, and pagination.
- `agent/tools/github_*.ts` contains one default-exported `defineTool` with a Zod `inputSchema` per GitHub capability.
- Eve derives tool names from file paths. Keep tests outside `agent/tools/`; dots in test filenames are not valid Eve tool names.
- Every operation that can mutate GitHub MUST declare an Eve approval policy such as `approval: always()`, including mutations hidden behind an option on a read-like tool.
- Tool results must be JSON-serializable, scoped to what the model needs, and free of credentials.
- Interrupted external steps can replay; protect mutations with approval and make them idempotent where practical.
- Unit tests live in `agent/__tests__/` and mock `globalThis.fetch` rather than calling GitHub.
- Integration evals live in `evals/` and verify conversation behavior, tool routing, and approval parking.

## Code Style
- Use two-space indentation, semicolons, double quotes, and trailing commas.
- Keep `.js` suffixes on relative ESM imports, including imports of TypeScript source files.
- Use `snake_case` for tool filenames and model-facing input fields.
- Use uppercase names for constants and `as const` for enum-like arrays.
- Put shared HTTP behavior in `agent/lib/github.ts`; keep each GitHub capability in its own tool module.
- Import Vitest APIs explicitly and use `describe`/`it` with focused fetch mocks.
- Do not add comments unless explicitly requested; prefer self-documenting code.
- Make surgical changes only; do not refactor unrelated code or formatting.

## Others
- Before changing Eve integration code, resolve the installed `eve` package and read the relevant local guide under `node_modules/eve/docs/`:
  - `reference/project-layout.md` for discovery and filesystem layout.
  - `agent-config.md` and `instructions.mdx` for agent configuration and instructions.
  - `tools/overview.mdx` and `tools/human-in-the-loop.md` for tools and approval.
  - `channels/eve.mdx` and `guides/auth-and-route-protection.md` for API channels and auth.
  - `evals/overview.mdx` and `reference/cli.md` for evals and diagnostics.
- If local package docs are unavailable, use `https://eve.dev/docs` as the fallback.
- Never print, log, return, or commit `GITHUB_TOKEN`, model credentials, or local `.env*` values.
- Treat `.eve/`, `.output/`, `dist/`, and `node_modules/` as generated or local state; do not edit or commit them.
- `placeholderAuth()` is development scaffolding and must be replaced before any production browser deployment.
- After code changes, run `npm run typecheck` and `npm test`.
- After tool, layout, channel, agent-config, or discovery changes, also run `npx eve info`, the relevant integration evals, and `npm run build`.
- For the current tool inventory, trust `agent/tools/` and fresh `npx eve info` output rather than ignored `.eve/` artifacts or stale README counts.
