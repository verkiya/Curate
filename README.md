<p align="center">
  <h1 align="center">Curate</h1>
  <p align="center">An AI-native browser IDE for building software without leaving the web.</p>
</p>

<p align="center">
  <a href="https://curate-ecru-eight.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-▶-4f46e5?style=flat-square" alt="Live Demo"></a>
  <a href="https://curate-ecru-eight.vercel.app/learnings"><img src="https://img.shields.io/badge/Engineering_Learnings-📘-059669?style=flat-square" alt="Learnings"></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Convex-Realtime_DB-ee5533?style=flat-square" alt="Convex">
  <img src="https://img.shields.io/badge/Inngest-Durable_Workflows-6366f1?style=flat-square" alt="Inngest">
  <img src="https://img.shields.io/badge/WebContainers-Browser_Runtime-1e293b?style=flat-square" alt="WebContainers">
</p>

---

## What is Curate?

Curate is a full-featured browser IDE that combines a real code editor, AI coding assistant, live preview environment, and GitHub integration into one cohesive tool. Users can create projects, import from GitHub, edit with AI-powered assistance, preview results instantly, and export back to GitHub — all without installing anything locally.

**The key technical challenge:** Coordinate durable cloud state (Convex), ephemeral browser state (Zustand), transient editor state (CodeMirror), background AI workflows (Inngest + AgentKit), and a browser-local Node.js runtime (WebContainers) into a seamless, responsive experience.

---

## Core Capabilities

| Capability          | What it does                                                                          | How it works                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Code Editor**     | Full CodeMirror 6 workspace with tabs, minimap, syntax highlighting for 15+ languages | Custom extensions for ghost text, selection editing, indentation markers                    |
| **AI Ghost Text**   | Real-time inline autocomplete as you type                                             | Gemini Flash pool (Convex-reserved) → Claude Haiku fallback, 500ms debounce, abort-on-stale |
| **AI Quick Edit**   | Select code → describe a change → get instant edit                                    | Haiku for <1500 chars, Sonnet for larger selections, with URL context scraping              |
| **AI Coding Agent** | Full file-aware agent that creates, reads, updates, deletes files                     | AgentKit network with 8 tools, Sonnet, maxIter 5, cancellable via events                    |
| **Live Preview**    | Browser-local dev server with integrated terminal                                     | WebContainer singleton with managed lifecycle, auto-install, hot-reload                     |
| **GitHub Import**   | Clone any public/private repo into Curate                                             | Inngest workflow: fetch tree → sort folders by depth → create nodes → handle binaries       |
| **GitHub Export**   | Push project back to GitHub as a new repository                                       | Inngest workflow: rebuild paths → create blobs → single commit → update ref                 |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Browser (Client)                              │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  CodeMirror   │  │   Zustand    │  │ WebContainer │  │   xterm.js │  │
│  │  (transient)  │  │ (ephemeral)  │  │ (singleton)  │  │ (terminal) │  │
│  │              │  │              │  │              │  │            │  │
│  │ • keystrokes │  │ • open tabs  │  │ • npm install│  │ • output   │  │
│  │ • selections │  │ • active file│  │ • npm run dev│  │ • append   │  │
│  │ • ghost text │  │ • layout     │  │ • file sync  │  │   only     │  │
│  │ • extensions │  │ • preview    │  │ • server-    │  │            │  │
│  │              │  │              │  │   ready URL  │  │            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────────┘  │
│         │                 │                 │                           │
│         └─────── 300ms debounce autosave ───┘                          │
│                           │                                             │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │ Real-time sync
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Convex (Durable State)                          │
│                                                                         │
│  projects ──── files ──── conversations ──── messages ──── aiUsage     │
│  (owner,       (tree       (per project)     (user/         (Gemini     │
│   settings,     structure,                    assistant,     RPM         │
│   import/       content,                      status)        counters)   │
│   export        binary                                                  │
│   status)       storage)                                                │
│                                                                         │
│  Auth: Clerk identity → verifyAuth() for user routes                   │
│        CURATE_CONVEX_INTERNAL_KEY for background worker routes          │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ Events + Mutations
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Inngest (Durable Workflows)                         │
│                                                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  process-message │  │ import-github-   │  │  export-to-github   │   │
│  │                  │  │ repo             │  │                     │   │
│  │ • AgentKit loop  │  │ • Fetch tree     │  │ • Get files + URLs  │   │
│  │ • 8 file tools   │  │ • Sort by depth  │  │ • Build full paths  │   │
│  │ • maxIter: 5     │  │ • Create folders │  │ • Create blobs      │   │
│  │ • cancelOn event │  │ • Create files   │  │ • Single commit     │   │
│  │ • title gen      │  │ • Handle binary  │  │ • cancelOn event    │   │
│  │ • onFailure hook │  │ • onFailure hook │  │ • onFailure hook    │   │
│  └─────────────────┘  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ API calls
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI Model Layer                                   │
│                                                                         │
│  Gemini Flash Pool ──► Suggestion primary (Convex quota-managed)       │
│  Claude Haiku 4.5  ──► Suggestion fallback, small edits, titles        │
│  Claude Sonnet 4.6 ──► Large edits, coding agent                       │
│  Claude Opus 4.8   ──► Reserved (configured, not actively routed)      │
└─────────────────────────────────────────────────────────────────────────┘
```

### State Lifecycle Separation

This is the most important architectural decision in Curate. Different types of state have different lifecycles, persistence requirements, and latency profiles:

| Layer                      | Owner        | Lifecycle    | Persistence                  | Latency          |
| -------------------------- | ------------ | ------------ | ---------------------------- | ---------------- |
| **Keystroke transactions** | CodeMirror   | Microseconds | None                         | Must be zero-lag |
| **Editor chrome**          | Zustand      | Session      | In-memory only               | Instant          |
| **Project data**           | Convex       | Permanent    | Cloud database               | ~50ms mutation   |
| **Background work**        | Inngest      | Minutes      | Durable, survives tab close  | Async            |
| **Browser runtime**        | WebContainer | Session      | None (re-mounts from Convex) | Boot ~3-5s       |

**Why this matters:** A naive approach would put everything in the database. But autocomplete at 50ms round-trip latency is unusable. Conversely, storing files only in-memory loses data on tab close. Each layer handles exactly the state it's suited for.

---

## AI System Design

### Model Routing Strategy

Curate uses model specialization — not a single "default model" — to optimize cost, latency, and capability per task:

```
User types code ──► docChanged event
                    │
                    ▼
              ┌──────────┐     ┌──────────────────────────┐
              │ Debounce  │────►│ Convex: reserveModel()   │
              │  500ms    │     │ Weighted random from pool │
              └──────────┘     │ 95% safety margin         │
                               └────────┬─────────────────┘
                                        │
                          ┌─────────────┼──────────────┐
                          ▼             ▼              ▼
                    Gemini 3.5    Gemini 2.5      Gemini 2.0
                    Flash         Flash-Lite      Flash
                    (weight:10)   (weight:5)      (weight:1)
                          │             │              │
                          └─────────────┼──────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │ If ALL exhausted:   │
                              │ Fallback to Claude  │
                              │ Haiku 4.5           │
                              └────────────────────┘
```

| Route                   | Model             | Selection Criteria              | Why This Model                                                                   |
| ----------------------- | ----------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| **Ghost text**          | Gemini Flash pool | Always first choice             | Highest RPM capacity. Autocomplete needs volume, not deep reasoning.             |
| **Ghost text fallback** | Claude Haiku 4.5  | When Gemini 95% quota exhausted | Ensures suggestions never silently stop. Different provider = independent quota. |
| **Small quick edit**    | Claude Haiku 4.5  | Selection < 1500 chars          | Fast, cheap. Small edits don't need heavy reasoning.                             |
| **Large quick edit**    | Claude Sonnet 4.6 | Selection ≥ 1500 chars          | Larger context needs better code understanding and preservation.                 |
| **Coding agent**        | Claude Sonnet 4.6 | Always                          | Best balance of tool use, code quality, and cost.                                |
| **Title generation**    | Claude Haiku 4.5  | Always                          | Tiny deterministic task. 50 max tokens, temperature 0.                           |
| **Deep reasoning**      | Claude Opus 4.8   | Reserved, not active            | Configured in `CLAUDE_MODELS` for future escalation. No active route uses it.    |

### Gemini Quota Management

Autocomplete is the highest-frequency AI operation. Curate manages Gemini quotas through a distributed Convex mutation:

```
src/lib/ai-models.ts          → Model pool definition (names, RPM, weights)
convex/GeminiAi.ts             → Distributed reservation (Convex mutation)
src/app/api/suggestion/route.ts → Triple-layer error handling
```

**How it works:**

1. Each suggestion request calls `reserveSuggestionModel` (a Convex mutation)
2. The mutation checks all models against a 95% safety margin of their RPM limit
3. Available models enter a weighted random pool (higher weight = more likely selected)
4. Random selection avoids write contention vs. a round-robin counter
5. On quota exhaustion, the API route falls back to Claude Haiku
6. Parsing errors (invalid JSON) return empty string — never crash the typing flow

> **Design decision:** Random selection over round-robin. A Convex round-robin counter would require a DB write on every keystroke across all users, causing massive write contention. Random selection is statistically identical over time with zero contention.

### Agent System

The coding agent uses Inngest AgentKit with a single-agent network:

```
User message
    │
    ▼
┌─ Inngest: process-message ─────────────────────────────┐
│                                                         │
│  1. Wait 1s for DB sync (eventual consistency gap)      │
│  2. Fetch conversation + last 5 messages for context    │
│  3. If default title → spawn Haiku title agent          │
│  4. Create Sonnet coding agent with 8 tools:            │
│     listFiles, readFiles, createFiles, updateFile,      │
│     createFolder, renameFile, deleteFiles, scrapeUrls   │
│  5. Run network (maxIter: 5)                            │
│  6. Router: stop only when text response + no tool calls│
│  7. Update assistant message with response              │
│                                                         │
│  Cancel: message/cancel event (if condition match)      │
│  Failure: onFailure → set error message in Convex       │
└─────────────────────────────────────────────────────────┘
```

**System prompt design:** Uses XML tags (`<identity>`, `<environment>`, `<tools>`, `<rules>`) because Claude models are explicitly fine-tuned to parse XML-structured prompts with higher fidelity than markdown. The environment section teaches the agent about WebContainer constraints to prevent generating unsupported frameworks.

**Agent tools** use Zod validation, catch `ArgumentValidationError`, and return recoverable error strings (e.g., "Call listFiles to get valid IDs"). This lets the agent self-correct instead of crashing the entire workflow.

---

## Key Engineering Decisions

### Why Convex?

| Requirement                     | How Convex Satisfies It                                       |
| ------------------------------- | ------------------------------------------------------------- |
| Real-time file sync to preview  | Reactive queries auto-update `useFiles()` hook                |
| Durable project/file storage    | Document DB with typed schemas                                |
| Binary file storage             | Built-in `_storage` with upload URLs                          |
| Cross-session AI quota tracking | Mutations as distributed rate limiter                         |
| Two auth contexts               | User-facing (Clerk identity) + internal (API key for workers) |

**Tradeoff accepted:** Convex requires a dual auth model. User-facing queries use `verifyAuth()` (Clerk). Background workers use `validateInternalKey()` with `CURATE_CONVEX_INTERNAL_KEY`. Leaking this key would bypass all user-level auth checks.

### Why Inngest?

| Requirement                | How Inngest Satisfies It                           |
| -------------------------- | -------------------------------------------------- |
| AI work survives tab close | Durable functions run server-side                  |
| Cancellation support       | `cancelOn` with event matching                     |
| Failure recovery           | `onFailure` hooks update Convex status             |
| Step-based orchestration   | Complex multi-step workflows with serialized state |
| Timeout protection         | `maxIter: 5` prevents runaway token usage          |

**Tradeoff accepted:** Inngest requires placeholder rows, status fields, and cancel events. The `processMessage` function creates an assistant message in "processing" status before the agent starts, then updates it on completion or failure.

### Why WebContainers?

| Requirement           | How WebContainers Satisfy It            |
| --------------------- | --------------------------------------- |
| Zero-install preview  | Runs Node.js in the browser via WASM    |
| Security isolation    | Sandboxed, no access to host filesystem |
| Instant feedback loop | Edit code → auto-sync → live preview    |

**Tradeoffs accepted:**

- **Singleton constraint:** Only one WebContainer can exist per browser tab (SharedArrayBuffer limitation). Curate enforces this with module-level `webcontainerInstance` + `bootPromise` + `cleanupPromise` variables.
- **Cross-origin headers required:** `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` are applied globally in `next.config.ts`. This enables SharedArrayBuffer but affects all routes.
- **No SSR frameworks:** WebContainers cannot run Next.js, Nuxt, Remix, or any SSR framework. The agent system prompt explicitly lists unsupported patterns.

### Why Clerk?

Authentication with minimal configuration. Clerk handles OAuth, session management, and provides identity tokens that Convex validates via `ctx.auth.getUserIdentity()`. The edge middleware (`proxy.ts`) protects all routes except `/`, `/learnings`, and `/api/inngest`.

---

## Data Model

```
projects                          files
├── name: string                  ├── projectId: Id<projects>
├── ownerId: string               ├── parentId?: Id<files>          ← recursive tree
├── updatedAt: number             ├── name: string
├── importStatus?: enum           ├── type: "file" | "folder"
├── exportStatus?: enum           ├── content?: string              ← text files
├── exportRepoUrl?: string        ├── storageId?: Id<_storage>      ← binary files
└── settings?: {                  └── updatedAt: number
      installCommand?: string
      devCommand?: string
    }

conversations                    messages
├── projectId: Id<projects>       ├── conversationId: Id<conversations>
├── title: string                 ├── projectId: Id<projects>
└── updatedAt: number             ├── role: "user" | "assistant"
                                  ├── content: string
aiUsage                           └── status?: "processing" | "completed" | "cancelled"
├── modelName: string
├── requests: number
└── resetAt: number
```

**File system design:** Files use a recursive `parentId` structure rather than path strings. This enables O(1) rename/move operations without rewriting paths, but requires parent-chain traversal to reconstruct full paths (used in GitHub export and WebContainer mounting).

---

## WebContainer Lifecycle

The WebContainer lifecycle is one of the most carefully managed parts of Curate:

```
Mount                          Unmount / Navigate Away
  │                                    │
  ▼                                    ▼
Wait for cleanupPromise        If instance exists:
  │                              teardown() immediately
  ▼                            If bootPromise pending:
Boot WebContainer                wait for boot → then teardown()
  │                              (stored in cleanupPromise)
  ▼
Mount file tree from Convex
  │
  ▼
Spawn install command
  │ (stream output → terminal)
  ▼
Spawn dev command
  │ (stream output → terminal)
  ▼
Listen for server-ready → set previewUrl
```

**Critical detail:** If a user navigates away while the WebContainer is still booting, Curate waits for boot to complete before tearing down. Without this, orphaned instances cause "Only a single WebContainer instance" errors on subsequent boots.

**File sync:** Unlike some implementations that gate file sync on `status === "running"`, Curate syncs files regardless of container status. This prevents losing edits made during the initial install/boot phase.

---

## Tech Stack

| Category        | Technology                | Version     |
| --------------- | ------------------------- | ----------- |
| Framework       | Next.js (Turbopack)       | 16.2        |
| Language        | TypeScript                | 5.x         |
| Database        | Convex                    | 1.41        |
| Auth            | Clerk                     | 6.36        |
| Background Jobs | Inngest + AgentKit        | 3.54 / 0.13 |
| AI (Anthropic)  | `@ai-sdk/anthropic`       | 3.x         |
| AI (Google)     | `@ai-sdk/google`          | 3.x         |
| Editor          | CodeMirror 6              | 6.x         |
| Preview         | WebContainer API          | 1.6         |
| Terminal        | xterm.js                  | 6.x         |
| UI              | Radix UI + Tailwind CSS 4 | —           |
| Animations      | Framer Motion             | 12.x        |
| Web Scraping    | Firecrawl                 | 4.x         |
| Monitoring      | Sentry                    | 10.x        |
| Deployment      | Vercel                    | —           |

---

## Project Structure

```
curate/
├── convex/                    # Convex backend
│   ├── schema.ts              # Database schema (projects, files, messages, aiUsage)
│   ├── files.ts               # User-facing file CRUD (Clerk auth)
│   ├── projects.ts            # User-facing project CRUD
│   ├── conversations.ts       # User-facing conversation CRUD
│   ├── system.ts              # Internal APIs for background workers (key auth)
│   ├── GeminiAi.ts            # Distributed Gemini quota reservation
│   └── auth.ts                # Clerk identity verification helper
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── suggestion/    # Ghost text endpoint (Gemini → Haiku fallback)
│   │   │   ├── quick-edit/    # Selection edit endpoint (Haiku / Sonnet routing)
│   │   │   ├── messages/      # Agent message dispatch + cancellation
│   │   │   ├── github/        # GitHub OAuth + import/export triggers
│   │   │   └── inngest/       # Inngest webhook endpoint
│   │   ├── dashboard/         # Authenticated IDE workspace
│   │   └── (public)/
│   │       └── learnings/     # Engineering learnings page
│   │
│   ├── features/
│   │   ├── editor/
│   │   │   ├── extensions/    # CodeMirror: suggestion, quick-edit, theme, minimap
│   │   │   ├── store/         # Zustand tab state management
│   │   │   ├── hooks/         # Editor-specific hooks
│   │   │   └── components/    # Editor UI (tabs, breadcrumbs, toolbar)
│   │   ├── preview/
│   │   │   ├── hooks/         # use-webcontainer.ts (singleton lifecycle)
│   │   │   ├── components/    # Preview panel, terminal, settings
│   │   │   └── utils/         # File tree builder for WebContainer mounting
│   │   ├── conversations/
│   │   │   ├── inngest/       # process-message.ts + system prompt constants
│   │   │   └── components/    # Chat UI
│   │   └── projects/
│   │       ├── inngest/       # import-github-repo.ts, export-to-github.ts
│   │       └── components/    # Project list, creation, settings
│   │
│   ├── inngest/
│   │   ├── tools/             # 8 AgentKit tools (read, write, create, delete, etc.)
│   │   ├── client.ts          # Inngest client initialization
│   │   └── functions.ts       # Demo/utility functions
│   │
│   ├── lib/
│   │   ├── ai-models.ts       # CLAUDE_MODELS + GEMINI_MODELS definitions
│   │   └── ai/                # Deprecated in-memory router (kept for reference)
│   │
│   └── proxy.ts               # Clerk edge middleware (Next.js 16 naming)
│
├── next.config.ts             # COEP/COOP headers + Sentry + Turbopack
└── package.json               # All dependencies
```

---

## Development

### Prerequisites

- Node.js 20+
- npm
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) application
- Anthropic API key
- Google AI API key

### Setup

```bash
git clone https://github.com/hiverkiya/Curate.git
cd Curate
npm install
```

### Environment Variables

Create `.env.local`:

| Variable                            | Required | Purpose                                |
| ----------------------------------- | -------- | -------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅       | Clerk frontend auth                    |
| `CLERK_SECRET_KEY`                  | ✅       | Clerk server auth                      |
| `NEXT_PUBLIC_CONVEX_URL`            | ✅       | Convex deployment URL                  |
| `CONVEX_DEPLOYMENT`                 | ✅       | Convex deployment identifier           |
| `CURATE_CONVEX_INTERNAL_KEY`        | ✅       | Shared secret for Inngest → Convex     |
| `ANTHROPIC_API_KEY`                 | ✅       | Claude models (agent, edits, titles)   |
| `GOOGLE_GENERATIVE_AI_API_KEY`      | ✅       | Gemini models (suggestions)            |
| `FIRECRAWL_API_KEY`                 | ✅       | URL scraping for quick edit context    |
| `SENTRY_DSN`                        | —        | Error monitoring                       |
| `OPENAI_API_KEY`                    | —        | Model access scripts only, not runtime |

### Run

```bash
npm run dev
```

This formats the codebase, then concurrently starts:

- **Next.js** dev server (port 3000)
- **Convex** dev server (watches schema + functions)
- **Inngest** dev server (port 8288, webhooks to localhost:3000)

---

## Security Model

| Boundary                            | Mechanism                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| **User → API routes**               | Clerk `auth()` in every route handler                                                |
| **User → Convex queries/mutations** | `verifyAuth()` checks `ctx.auth.getUserIdentity()`                                   |
| **Inngest → Convex**                | `validateInternalKey()` checks `CURATE_CONVEX_INTERNAL_KEY`                          |
| **Edge middleware**                 | `proxy.ts` protects all routes except `/`, `/learnings`, `/test`, and `/api/inngest` |
| **WebContainer**                    | Sandboxed WASM runtime, no host filesystem access                                    |
| **COEP/COOP**                       | Required for SharedArrayBuffer, applied globally via `next.config.ts`                |

> ⚠️ **Important:** `CURATE_CONVEX_INTERNAL_KEY` bypasses all Clerk auth checks. It provides service-to-service authentication for Inngest workers. Treat it as a highly sensitive secret.

---

## Roadmap

- [ ] Add granular telemetry for model latency, cost, and fallback frequency
- [ ] Surface per-file GitHub import validation errors to users
- [ ] Expand automated testing for routing, agent tools, and WebContainer paths
- [ ] Replace hard-coded model routing thresholds with telemetry-driven tuning
- [ ] Add structured error classes to agent tools for better post-failure analysis
