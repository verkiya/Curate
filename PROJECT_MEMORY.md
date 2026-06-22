# Curate Project Memory

This file is the durable engineering memory for Curate. It should explain the system well enough for a future maintainer to recover the architecture without relying on external context.

## Architecture

Curate is a browser-native IDE split across four lifecycles:

| Boundary            | Owner        | Durable?         | Implementation                                            |
| ------------------- | ------------ | ---------------- | --------------------------------------------------------- |
| Editor transactions | CodeMirror   | No               | `src/features/editor/components/code-editor.tsx`          |
| Editor chrome       | Zustand      | No               | `src/features/editor/store/use-editor-store.ts`           |
| Project data        | Convex       | Yes              | `convex/schema.ts`, `convex/files.ts`, `convex/system.ts` |
| Long-running work   | Inngest      | Durable workflow | `src/features/*/inngest/*.ts`                             |
| Runtime preview     | WebContainer | Session only     | `src/features/preview/hooks/use-webcontainer.ts`          |

The important design rule: do not collapse these boundaries casually. Keystroke-level state belongs in the browser. Files, conversations, statuses, binary storage IDs, and AI usage counters belong in Convex. Long-running AI and GitHub work belongs in Inngest.

## Model Strategy

Curate uses task-specific routing instead of one default model.

| Route               | Model(s)                                                                                                     | Where                                                   | Why                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Suggestion primary  | `gemini-3.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite` | `src/app/api/suggestion/route.ts`, `convex/GeminiAi.ts` | High-frequency autocomplete needs request capacity and a narrow prompt.                 |
| Suggestion fallback | `claude-haiku-4-5-20251001`                                                                                  | `src/app/api/suggestion/route.ts`                       | Independent provider fallback when Gemini reservations or provider calls fail on quota. |
| Small quick edit    | `claude-haiku-4-5-20251001`                                                                                  | `src/app/api/quick-edit/route.ts`                       | Small selected-code edits do not need the main coding model.                            |
| Large quick edit    | `claude-sonnet-4-6`                                                                                          | `src/app/api/quick-edit/route.ts`                       | Larger selections need stronger code reasoning and context preservation.                |
| Coding agent        | `claude-sonnet-4-6`                                                                                          | `src/features/conversations/inngest/process-message.ts` | Best current balance for file-tool workflows.                                           |
| Title generation    | `claude-haiku-4-5-20251001`                                                                                  | `src/features/conversations/inngest/process-message.ts` | Short deterministic summarization with low output cap.                                  |
| Reserved            | `claude-opus-4-8`                                                                                            | `src/lib/ai-models.ts`                                  | Defined for future deep-reasoning escalation; no active runtime route uses it.          |

OpenAI SDKs and model metadata exist in the repo, but audited runtime routes use Anthropic and Google. OpenAI should not be activated as a drop-in replacement for the agent. The current AgentKit router and XML system prompt are tuned around Claude behavior, including responses that may contain both assistant text and tool calls in the same step.

## Reliability

- Inngest `cancelOn` is used for chat messages and GitHub export cancellation.
- `process-message` caps the AgentKit network at `maxIter: 5`.
- Agent tools validate parameters with Zod before mutating Convex.
- Read/update/rename/delete tools catch Convex `ArgumentValidationError` and tell the model to call `listFiles` for real IDs.
- `deleteFiles` pre-validates every requested ID before deleting anything.
- Suggestion requests use a Convex reservation mutation with a 95% safety margin before calling Gemini.
- Suggestion parsing failures return an empty suggestion so the typing surface does not crash.
- Quick edit URL scraping is bounded by max URL count, timeout, and character limits.
- WebContainer boot and teardown are serialized through `bootPromise` and `cleanupPromise`.
- Terminal rendering writes only the new output slice to xterm instead of rewriting the full buffer.

## Failure Modes

| Failure                                  | Likely cause                                                                      | First place to inspect                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Suggestions stop                         | Gemini pool exhausted and Haiku fallback failed or returned 429                   | `convex/GeminiAi.ts`, `src/app/api/suggestion/route.ts`    |
| Agent crashes on file IDs                | Model passed a path/name instead of a Convex document ID                          | `src/inngest/tools/*`                                      |
| Agent loops or spends too much           | Router did not stop or `maxIter` was changed                                      | `process-message.ts`                                       |
| Preview fails with single-instance error | WebContainer boot/teardown race                                                   | `use-webcontainer.ts`                                      |
| Imported repo misses files               | Per-file GitHub import failure was logged and skipped                             | `import-github-repo.ts`                                    |
| Export remains stuck                     | Inngest export workflow failed before status update or cancel event did not match | `export-to-github.ts`, `api/github/export/cancel/route.ts` |
| Binary file opens as text                | File storage/content boundary was violated                                        | `convex/schema.ts`, `editor-view.tsx`                      |

## Debugging

Start here:

1. For project/file data: inspect Convex tables and `convex/system.ts`.
2. For chat/agent issues: inspect `src/app/api/messages/route.ts`, then `process-message.ts`, then the relevant tool in `src/inngest/tools`.
3. For suggestions: inspect `src/features/editor/extensions/suggestion`, `src/app/api/suggestion/route.ts`, and `convex/GeminiAi.ts`.
4. For quick edit: inspect `src/features/editor/extensions/quick-edit` and `src/app/api/quick-edit/route.ts`.
5. For preview: inspect `use-webcontainer.ts`, `file-tree.ts`, `next.config.ts`, and terminal output.
6. For GitHub import/export: inspect API trigger routes, then the Inngest workflow.
7. For auth: inspect `src/proxy.ts`, `convex/auth.ts`, and `convex/system.ts`.

## Important Invariants

- WebContainer singleton variables must remain module-level.
- COEP/COOP headers are required for SharedArrayBuffer and WebContainer boot.
- Inngest cancellation expressions are Inngest expression syntax, not JavaScript.
- The agent must use Convex file IDs, not paths, for read/update/rename/delete tools.
- The system prompt must teach WebContainer constraints; otherwise the agent will generate unsupported projects.
- File sync should not be gated on `status === "running"` because edits can happen during install/boot.
- Suggestion generation should fire on `docChanged`, not cursor movement.
- Binary files should use Convex storage, not `content`.
- GitHub import must create folders before child files.
- GitHub export must rebuild paths from the `parentId` chain.
- `CURATE_CONVEX_INTERNAL_KEY` bypasses Clerk checks and must be treated as a high-risk secret.

## Engineering Lessons

- Browser IDEs are lifecycle problems before they are UI problems.
- AI model routing is infrastructure. Different tasks need different latency, cost, and reasoning profiles.
- Model tool failures should be recoverable where possible. Returning corrective tool messages is often better than throwing.
- Durable workflows need visible UI state. Placeholder messages and project import/export statuses keep async work understandable.
- WebContainer support depends as much on generated project shape as runtime code. The agent prompt is part of runtime reliability.
- A flat `files` table with `parentId` scales better than storing one giant nested project document, but every path boundary must rebuild paths deliberately.
- GitHub is path-based; Curate is node-based. Import/export must translate between those worlds.
- Public documentation should not claim telemetry-backed latency, quality, or cost wins until telemetry exists.

## Maintenance Notes

- Keep `README.md` public-facing and concise enough to scan.
- Keep `src/app/(public)/learnings/page.tsx` as the engineering handbook and warning system.
- Keep this file as the canonical low-noise memory document.
- When changing model routes, update all three documents together.
- When changing file schema, check GitHub import/export, WebContainer mounting, breadcrumbs, file explorer, and agent tools.
- When changing system prompt rules, test new project creation in preview.
- When changing auth boundaries, check both Clerk-authenticated user functions and internal-key worker functions.

## Technical Debt

- No telemetry loop for model latency, quality, fallback frequency, token usage, or cost by route.
- No user-facing report for skipped GitHub import files.
- Agent tool errors are plain strings, not structured error objects.
- No collaborative editing or conflict resolution model.
- GitHub import/export is not incremental sync.
- No branch selection during import; current workflow tries `main`, then `master`.
- OpenAI metadata scripts exist, but runtime provider abstraction is not implemented.
- Test coverage should be added for model routing, agent tools, WebContainer path building, and GitHub workflows.

## Repository Conventions

- Use Convex queries/mutations for durable application data.
- Use internal Convex functions with `CURATE_CONVEX_INTERNAL_KEY` only from trusted server/workflow code.
- Use Inngest for work that can exceed a normal HTTP request or must survive tab closure.
- Keep CodeMirror behavior inside extensions instead of component-level DOM manipulation.
- Use Zustand for editor chrome that should reset with the session.
- Prefer updating files over delete-and-recreate in agent tools.
- Prefer batch file creation when the agent creates multiple sibling files.
- Keep comments focused on intent, tradeoffs, and failure handling.
