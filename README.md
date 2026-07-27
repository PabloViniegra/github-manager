# GitHub Manager

An autonomous [eve](https://eve.dev) agent that operates your GitHub account through the GitHub REST API. It runs as a durable TypeScript app, exposes the standard eve HTTP API, and is model-agnostic through the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).

## Tech Stack

<p>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 24"/></a>
  <a href="https://eve.dev"><img src="https://img.shields.io/badge/eve-0.27-000000?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==&logoColor=white" alt="eve framework"/></a>
  <a href="https://vercel.com/docs/ai-gateway"><img src="https://img.shields.io/badge/AI_Gateway-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel AI Gateway"/></a>
  <a href="https://www.anthropic.com/"><img src="https://img.shields.io/badge/Claude-3_Haiku-D97757?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic Claude 3 Haiku"/></a>
  <a href="https://zod.dev/"><img src="https://img.shields.io/badge/Zod-4-3068B7?style=for-the-badge&logo=zod&logoColor=white" alt="Zod"/></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/GitHub_API-v3-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub REST API"/></a>
</p>

<p>
  <img src="https://img.shields.io/badge/license-MIT-21B573?style=flat-square" alt="License: MIT"/>
  <img src="https://img.shields.io/badge/node-%3E=24-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node >= 24"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs welcome"/>
</p>

## Overview

GitHub Manager is a single-purpose agent built on [eve](https://eve.dev), Vercel's filesystem-first framework for durable agents. The app is a thin TypeScript layer on top of a shared GitHub REST client (`agent/lib/github.ts`) and 18 typed tools (`agent/tools/github_*.ts`) that cover the surface area a maintainer needs day to day: account, repositories, issues, pull requests, search, and notifications.

The default model is `anthropic/claude-3-haiku` and is reached through the Vercel AI Gateway, so swapping providers or models is a one-line change in `agent/agent.ts`.

## Features

| Area | Tools |
| --- | --- |
| Account & repos | `github_get_my_profile`, `github_list_my_repos`, `github_get_repo`, `github_create_repo`, `github_delete_repo` |
| Issues | `github_list_issues`, `github_get_issue`, `github_create_issue`, `github_update_issue`, `github_add_issue_comment` |
| Pull requests | `github_list_pull_requests`, `github_get_pull_request`, `github_create_pull_request`, `github_merge_pull_request` |
| Search | `github_search_repositories`, `github_search_code`, `github_search_issues` |
| Inbox | `github_list_notifications` |

Every tool is a typed `defineTool` from `eve/tools` with a Zod `inputSchema`. Read tools are unrestricted; write tools (create, update, merge, comment, delete) gate on `always()` from `eve/tools/approval`, which pauses the durable session for human approval before any side effect runs.

## Architecture

```
agent/
├── agent.ts                # defineAgent({ model: "anthropic/claude-3-haiku" })
├── instructions.md         # System prompt: identity, principles, style
├── channels/eve.ts         # Default HTTP channel
├── lib/github.ts           # Shared fetch client (Bearer auth, paginator, typed errors)
└── tools/github_*.ts       # 18 typed tools, one per file (filename == tool name)
```

The default eve harness provides file, shell, web, and delegation tools out of the box; this app keeps that surface and adds the GitHub-specific tools on top. Tools run in the app runtime with full access to `process.env`, not inside the sandbox.

## Getting started

### Prerequisites

- Node.js 24 or newer
- A Vercel AI Gateway credential (`AI_GATEWAY_API_KEY`) — or run `vercel link` and use `VERCEL_OIDC_TOKEN`
- A GitHub personal access token (`GITHUB_TOKEN`) with the scopes listed in `.env.example`

### Install

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in AI_GATEWAY_API_KEY and GITHUB_TOKEN
```

### Run locally

```bash
npm run dev              # interactive terminal UI
npx eve dev --no-ui      # background server, ready for HTTP calls
```

### Verify with the HTTP API

```bash
# create a session
curl -X POST http://127.0.0.1:2000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"List my most recently updated repositories."}'

# stream events (NDJSON)
curl http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

## Security model

- The GitHub token is read from `process.env.GITHUB_TOKEN` at request time and is never logged, echoed, or written to disk by the app. See `.env.example` for the required scopes per tool group.
- All write operations require explicit human approval through eve's durable pause-and-resume protocol. The agent is asked to call a tool; a person decides whether it runs.
- `agent/lib/github.ts` surfaces GitHub's HTTP status and response body on failure so the model can react, but it does not catch and swallow errors. Rate-limit (403) and 5xx responses are surfaced to the caller.
- The dev channel uses `placeholderAuth`. Do not deploy without replacing it with a real auth provider — see `agent/channels/eve.ts` and the eve [auth guide](https://eve.dev/docs).

## Switching models

The model is a single field in `agent/agent.ts`. To use a different gateway-routed model:

```ts
import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-3-haiku", // or any gateway id
});
```

For direct provider access, install the provider's AI SDK package and pass a `LanguageModel` instead of a string id.

## Development

```bash
npm run typecheck          # tsc, no emit
npm test                   # vitest run, exercises the GitHub client and key tool projections
npm run test:watch         # vitest in watch mode
npm run test:integration   # eve eval with mock model, no API cost
npm run build              # eve build, compiles agent into .eve/
npm run start              # serve the built output
npx eve info               # list the discovered surface and diagnostics

npm run test:integration -- --strict     # soft threshold misses also fail
npm run test:integration -- --list       # discover evals without running them
npm run test:integration -- greeting-no-tools  # one specific eval
```

Tests cover two layers:

- **Unit (vitest, `agent/__tests__/`)** — the shared GitHub client (auth header construction, error handling, pagination, 204 handling) and the non-trivial tool projections (issues PR filter, notifications subject extraction). No network.
- **Integration (`evals/`)** — three `eve eval` cases that drive the agent end-to-end through a scripted `mockModel` (activated by `EVE_EVAL=1`):
  - `greeting-no-tools` — a greeting does not trigger any tool call.
  - `write-tool-parks-for-approval` — a create-issue request calls the write tool, which then parks for human approval. Runs without `GITHUB_TOKEN` because the tool never executes.
  - `list-repos-uses-read-tool` — a list-repos request calls `github_list_my_repos`. Skipped when `GITHUB_TOKEN` is not set; with a valid token it exercises the full read path including pagination.

The unit test files live under `agent/__tests__/` (not `agent/tools/`) because the tool-slot discovery rejects any filename containing a dot, which `*.test.ts` has.

## License

[MIT](./LICENSE)
