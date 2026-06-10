# Curate

Curate is an AI-native browser IDE for building small software projects without leaving the web. It combines a real editor, durable project state, background AI workers, WebContainer local previews, and GitHub import/export into a single cohesive experience.

[Live demo](https://curate-ecru-eight.vercel.app) · [Engineering learnings](https://curate-ecru-eight.vercel.app/learnings)

## What It Does

- **Create & Import:** Start fresh or clone existing repositories directly from GitHub.
- **Code:** Edit files in a full CodeMirror workspace featuring tabs, a minimap, selection actions, and autosave.
- **AI Assist:** Leverage real-time ghost text autocomplete, quick selection edits, and a file-aware coding agent.
- **Preview:** Run and interact with projects in a browser-local WebContainer preview with an integrated terminal and restart controls.
- **Export:** Push modified or generated projects seamlessly back to GitHub.

## Architecture

Curate separates concerns to balance durable data with highly responsive local state:

- **State Management:** Convex handles all durable state (projects, files, AI quotas). Zustand manages ephemeral IDE state (tabs, layout), while CodeMirror owns transient keystroke transactions.
- **Background Workflows:** Inngest and AgentKit power long-running, cancellable AI jobs and GitHub syncs that outlive the browser tab.
- **Local Runtime:** WebContainers and xterm.js provide a secure, singleton browser-local development environment.
- **AI Routing:** A dynamic, specialized mix of Anthropic Claude and Google Gemini models routed by cost, latency, and reasoning requirements.

## AI Routing

Curate uses model specialization instead of a single default to optimize the developer experience:

| Route | Model | Why |
| ----- | ----- | --- |
| Ghost text | Gemini Flash pool (Fallback: `claude-haiku-4-5-20251001`) | High-frequency autocomplete needs capacity and low latency. |
| Quick edit | Haiku for small selections, `claude-sonnet-4-6` for >1500 chars | Small edits should be cheap; larger edits need better code reasoning. |
| Coding agent | `claude-sonnet-4-6` | Best current balance for tool use, code quality, cost, and latency. |
| Titles | `claude-haiku-4-5-20251001` | Tiny deterministic summarization task. |
| Reserved | `claude-opus-4-8` | Configured for future deep-reasoning escalation, not actively routed. |

OpenAI SDKs exist in the repository for tool metadata, but all active production AI routes use Anthropic or Google.

## Engineering Highlights

- **Durable Quota Management:** Convex-backed Gemini reservations coordinate autocomplete requests across sessions, maintaining a 95% safety margin.
- **Bounded Agent Execution:** AI coding loops are strictly bounded (`maxIter: 5`) with cancellable events and gracefully recoverable tool errors.
- **Safe Container Lifecycles:** WebContainer usage features a singleton boot process and queued cleanup to prevent unsafe multi-instance states or memory leaks.
- **Smart GitHub Sync:** The import/export pipeline translates flat Git path trees into Curate's Convex node-based file system and handles binary storage transparently.

## Development

```bash
npm install
npm run dev
```

`npm run dev` formats the repository and concurrently starts Next.js, Convex, and Inngest.

Required environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
CURATE_CONVEX_INTERNAL_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
FIRECRAWL_API_KEY=
```

Optional:

```env
SENTRY_DSN=
OPENAI_API_KEY= # model access scripts only; not active runtime routing
```

## Roadmap

- Add granular telemetry for model latency, cost, and fallback frequency.
- Surface per-file GitHub import validation errors.
- Align preview settings schema with `devCommand`.
- Expand testing for routing, agent tools, and WebContainer path building.
