"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Code2,
  Database,
  GitBranch,
  Layers,
  Network,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Timer,
  Wrench,
  Workflow,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

type Decision = {
  title: string;
  decision: string;
  why: string;
  tradeoff: string;
  evidence: string;
  icon: ReactNode;
};

type ModelRoute = {
  route: string;
  model: string;
  criteria: string;
  why: string;
  tradeoff: string;
};

type TechChoice = {
  technology: string;
  role: string;
  why: string;
  alternative: string;
  whyNot: string;
};

type Pitfall = {
  title: string;
  symptom: string;
  cause: string;
  fix: string;
  evidence: string;
};

type MaintenanceNote = {
  area: string;
  warning: string;
  context: string;
};

// ── Architecture Decisions ──

const architectureDecisions: Decision[] = [
  {
    title: "State is split by lifecycle",
    decision:
      "Convex owns durable state (projects, files, messages, binary storage, AI quotas). Zustand owns ephemeral state (tabs, active file, layout). CodeMirror owns transient keystroke-level state.",
    why: "Durable project data, local IDE UX, and transient editor transactions have vastly different lifecycles. Keystrokes cannot wait on backend round trips. Files cannot live only in memory.",
    tradeoff:
      "No dirty-buffer conflict model. Autosave is a 300ms debounce to Convex. Two users editing the same file would overwrite each other.",
    evidence:
      "convex/schema.ts, src/features/editor/store/use-editor-store.ts, src/features/editor/components/editor-view.tsx",
    icon: <Database className="size-4" />,
  },
  {
    title: "Inngest owns all durable workflows",
    decision:
      "AI coding loops, GitHub imports, and GitHub exports are event-driven Inngest functions that mutate Convex through internal APIs using a shared secret key.",
    why: "These operations take seconds to minutes, must survive browser tab closures and serverless timeouts, and need cancellation and failure recovery hooks.",
    tradeoff:
      "Requires placeholder message rows, status fields, cancellation events, a 1-second DB sync wait, and a shared CURATE_CONVEX_INTERNAL_KEY. Leaking the key bypasses all Clerk auth.",
    evidence:
      "src/features/conversations/inngest/process-message.ts, src/features/projects/inngest/import-github-repo.ts, export-to-github.ts",
    icon: <Workflow className="size-4" />,
  },
  {
    title: "WebContainers are a strictly managed singleton",
    decision:
      "One WebContainer per browser tab, enforced by module-level variables: webcontainerInstance, bootPromise, and cleanupPromise. Teardown waits for pending boot.",
    why: "SharedArrayBuffer constraints and browser memory limits make multiple containers unstable. An orphaned instance from premature teardown causes unrecoverable boot failures.",
    tradeoff:
      "The preview is a local sandbox, not a general VM. SSR frameworks, native modules, non-JS runtimes, and interactive terminal prompts are all unsupported.",
    evidence: "src/features/preview/hooks/use-webcontainer.ts, next.config.ts",
    icon: <Wrench className="size-4" />,
  },
  {
    title: "Suggestions are editor extensions, not chat",
    decision:
      "Ghost text lives inside CodeMirror as a ViewPlugin, fires only on docChanged (actual typing), aborts stale requests, and accepts with Tab.",
    why: "Autocomplete should feel like editor infrastructure, not a conversational request loop. Triggering on cursor movement would burn API quota on every arrow key press.",
    tradeoff:
      "Suggestions are intentionally narrow (single insertion point) and cannot do multi-file reasoning. The 500ms debounce trades immediate response for quota efficiency.",
    evidence:
      "src/features/editor/extensions/suggestion/index.ts, src/features/editor/extensions/suggestion/fetcher.ts",
    icon: <Code2 className="size-4" />,
  },
  {
    title: "Agent tools return recoverable errors",
    decision:
      "Tool handlers validate inputs with Zod, catch ArgumentValidationError, and return instructional error strings ('Call listFiles to get valid IDs') instead of throwing.",
    why: "Claude often guesses file paths instead of using Convex IDs. Returning a tool error string lets the agent self-correct in the next iteration rather than crashing the Inngest function.",
    tradeoff:
      "Errors become conversational artifacts in the context window, consuming tokens. Critical failures still need external monitoring. No structured error classes for post-mortem analysis.",
    evidence: "src/inngest/tools/read-file.ts, update-file.ts, delete-files.ts",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    title: "GitHub sync is file-system aware",
    decision:
      "Import sorts folders by depth (parents before children), creates Convex nodes, and stores binaries via upload URLs. Export rebuilds full paths from the parentId chain, creates Git blobs, a single tree, and one commit.",
    why: "GitHub uses flat path-based trees. Curate uses recursive parentId nodes. Binary files need Convex storage, not text content. The translation must be explicit.",
    tradeoff:
      "This is import/export, not sync. No incremental updates, no branch selection (defaults to main/master), and individual file failures are logged but not surfaced to the user.",
    evidence:
      "src/features/projects/inngest/import-github-repo.ts, export-to-github.ts",
    icon: <GitBranch className="size-4" />,
  },
];

// ── AI Model Decisions ──

const modelDecisions: Decision[] = [
  {
    title: "Suggestions use a distributed Gemini pool",
    decision:
      "Ghost text reserves a Gemini Flash model through a Convex mutation before each request. Five models with different RPM limits and weights form a pool. Selection is weighted random.",
    why: "Autocomplete is extremely high-frequency and latency-sensitive. The configured Gemini pool spreads requests across models with separate RPM limits. Random selection avoids the write contention a round-robin counter would cause.",
    tradeoff:
      "The 95% safety margin is conservative. The prompt must stay narrow and schema-bound (Zod). Parsing failures silently return empty strings, protecting typing flow but hiding failures.",
    evidence:
      "src/app/api/suggestion/route.ts, convex/GeminiAi.ts, src/lib/ai-models.ts",
    icon: <Zap className="size-4" />,
  },
  {
    title: "Quick edit routes by selection size",
    decision:
      "Selections ≥1500 characters use Claude Sonnet. Smaller selections use Claude Haiku.",
    why: "Small edits benefit from low latency and cost. Large edits need stronger context preservation and code reasoning to avoid mangling surrounding code.",
    tradeoff:
      "The 1500-char threshold is a pragmatic heuristic. It ignores language, semantic complexity, and task difficulty. Needs telemetry before it can become more sophisticated.",
    evidence: "src/app/api/quick-edit/route.ts",
    icon: <Network className="size-4" />,
  },
  {
    title: "The coding agent defaults to Sonnet",
    decision:
      "AgentKit uses Claude Sonnet 4.6 with temperature 0.2, 8000 max output tokens, and maxIter 5. Opus exists in constants but has no active route.",
    why: "Sonnet is the balanced coding model: good tool use, good code generation, without the cost and latency of Opus. Five iterations is sufficient for most multi-step file modifications.",
    tradeoff:
      "Opus is reserved capacity for future deep reasoning escalation, not current behavior. Activating it needs a deliberate route, trigger, and budget guardrails.",
    evidence:
      "src/features/conversations/inngest/process-message.ts, src/lib/ai-models.ts",
    icon: <BrainCircuit className="size-4" />,
  },
  {
    title: "Claude routes are not provider-abstract",
    decision:
      "The agent prompt, XML structure, tool-call handling, and router logic are all tuned for Claude behavior — specifically that Anthropic responses can contain text and tool calls in the same step.",
    why: "The router checks hasTextResponse && !hasToolCalls to decide when to stop. This is Claude-specific behavior. OpenAI models handle tool calls differently.",
    tradeoff:
      "Adding OpenAI as a runtime AI provider should be treated as a new route with its own prompts, stopping rules, and quality checks — not a drop-in model swap.",
    evidence:
      "src/features/conversations/inngest/process-message.ts, constants.ts",
    icon: <Shield className="size-4" />,
  },
];

// ── AI Model Inventory ──

const modelRoutes: ModelRoute[] = [
  {
    route: "Suggestion primary",
    model:
      "gemini-3.5-flash, gemini-2.5-flash-lite, gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-lite",
    criteria: "Convex reservation (weighted random)",
    why: "Configured for high request capacity across the suggestion pool",
    tradeoff: "Prompt must stay schema-bound. No deep reasoning.",
  },
  {
    route: "Suggestion fallback",
    model: "claude-haiku-4-5-20251001",
    criteria: "All Gemini quotas exhausted (95% safety margin)",
    why: "Different provider = independent quota before the UI reports exhaustion.",
    tradeoff: "More expensive per-request than Gemini. Should be rare.",
  },
  {
    route: "Small quick edit + Titles",
    model: "claude-haiku-4-5-20251001",
    criteria: "Selection < 1500 chars / Title generation",
    why: "Fast, cheap. Small edits and titles don't need heavy reasoning.",
    tradeoff: "Not suitable for large rewrites or multi-step reasoning.",
  },
  {
    route: "Large quick edit + Coding agent",
    model: "claude-sonnet-4-6",
    criteria: "Selection ≥ 1500 chars / Agent invocation",
    why: "Best balance of tool use, code quality, cost, and latency.",
    tradeoff: "Higher cost than Haiku. 8000 token output limit.",
  },
  {
    route: "Reserved",
    model: "claude-opus-4-8",
    criteria: "None (configured, not routed)",
    why: "Future deep reasoning escalation tier.",
    tradeoff:
      "Needs deliberate route, trigger, and budget guardrails before activation.",
  },
];

// ── Technology Choices ──

const techChoices: TechChoice[] = [
  {
    technology: "Convex",
    role: "Real-time database, file storage, auth, AI quota management",
    why: "Reactive queries auto-update the UI. Built-in binary storage. Mutations work as distributed locks (rate limiting). Typed schemas with validation.",
    alternative: "Supabase / PlanetScale + S3",
    whyNot:
      "Would require rebuilding the real-time query layer, binary storage boundary, and generated type workflow that Convex currently provides in one system.",
  },
  {
    technology: "Inngest",
    role: "Durable background workflows (AI agent, GitHub sync)",
    why: "Event-driven. Survives serverless timeouts. Built-in cancelOn, onFailure, step-based orchestration. Works with AgentKit for AI agent loops.",
    alternative: "Temporal / BullMQ / Trigger.dev",
    whyNot:
      "Would require rewriting the current event names, cancelOn behavior, onFailure hooks, and AgentKit workflow integration already built around Inngest.",
  },
  {
    technology: "WebContainers",
    role: "Browser-local Node.js runtime for live preview",
    why: "Zero-install, zero-infra. Users get a real dev server without any backend sandbox. Secure by default (WASM sandbox, no host access).",
    alternative: "CodeSandbox API / Stackblitz SDK / VM-based sandbox",
    whyNot:
      "Would move preview execution out of Curate's browser-local lifecycle and require a different file-sync, security, and provisioning model.",
  },
  {
    technology: "CodeMirror 6",
    role: "Code editor with custom extensions",
    why: "Extension architecture allows ghost text, quick edit popover, and custom themes as first-class features. No wrapper library needed.",
    alternative: "Monaco Editor",
    whyNot:
      "The current ghost text, quick edit, selection tooltip, minimap, and theme work are implemented as CodeMirror extensions; switching would be a rewrite.",
  },
  {
    technology: "Clerk",
    role: "Authentication (OAuth, session management)",
    why: "Handles OAuth providers, session tokens, and integrates directly with both Next.js middleware and Convex identity verification.",
    alternative: "NextAuth / Auth0",
    whyNot:
      "The current auth boundary depends on Clerk middleware, Clerk OAuth tokens, and Convex identity verification; replacing it would affect every protected route and GitHub workflow.",
  },
];

// ── Reliability Lessons ──

const reliabilityLessons = [
  {
    title: "Cancel and bound all model work",
    detail:
      "The agent loop is bounded at maxIter: 5. New chat messages and stop-button clicks send message/cancel events. The Inngest cancelOn condition matches messageId, so only the correct in-progress function is terminated.",
    evidence:
      "process-message.ts (cancelOn, maxIter), src/app/api/messages/cancel/route.ts",
    icon: <Timer className="size-4" />,
  },
  {
    title: "Pre-validate destructive operations",
    detail:
      "deleteFiles validates every file ID exists before deleting anything. This prevents mixed valid/invalid partial deletes that would leave the file tree in an inconsistent state.",
    evidence: "src/inngest/tools/delete-files.ts",
    icon: <Shield className="size-4" />,
  },
  {
    title: "Keep preview lifecycle idempotent",
    detail:
      "Boot waits for cleanup. Teardown waits for boot. Import pauses startup. File sync runs regardless of container status (not gated on 'running'). Terminal output appends only new bytes.",
    evidence: "use-webcontainer.ts, preview-terminal.tsx",
    icon: <RefreshCcw className="size-4" />,
  },
  {
    title: "Ghost text must not fire on cursor movement",
    detail:
      "The suggestion plugin triggers only on docChanged, never on selectionSet. Combined with the AbortController on each new request, stale suggestions from previous positions are automatically cancelled.",
    evidence: "src/features/editor/extensions/suggestion/index.ts",
    icon: <Code2 className="size-4" />,
  },
  {
    title: "Bound external documentation context",
    detail:
      "Quick edit accepts at most 3 URLs, races each scrape against a 5-second timeout (Firecrawl can hang), trims docs to 3000 chars, and slices large file context to 15000 chars (keeping top and bottom halves for imports/exports visibility).",
    evidence: "src/app/api/quick-edit/route.ts",
    icon: <BookOpen className="size-4" />,
  },
  {
    title: "Cross-origin isolation is the preview tax",
    detail:
      "COEP (credentialless) and COOP (same-origin) headers are applied globally so SharedArrayBuffer works for WebContainers. Scoping to /projects/* only would be safer but isn't implemented.",
    evidence: "next.config.ts",
    icon: <Layers className="size-4" />,
  },
  {
    title: "Wait for eventual consistency",
    detail:
      "The agent function sleeps 1 second after receiving the message event before querying conversation history. This handles the gap between Convex write and read replica sync.",
    evidence: "process-message.ts (step.sleep 'wait-for-db-sync')",
    icon: <Database className="size-4" />,
  },
];

// ── Common Pitfalls ──

const pitfalls: Pitfall[] = [
  {
    title: '"Only a single WebContainer instance" crash',
    symptom: "Preview fails to boot after navigation or hot reload.",
    cause:
      "Previous instance wasn't torn down before new boot. Can happen if teardown is called during pending boot without awaiting it.",
    fix: "The cleanupPromise pattern handles this. If the error still occurs, the restart button falls back to window.location.reload().",
    evidence: "use-webcontainer.ts (teardownWebContainer, restart callback)",
  },
  {
    title: "Agent passes file paths instead of Convex IDs",
    symptom: "Tool calls fail with ArgumentValidationError.",
    cause:
      "Claude guesses paths like 'src/App.jsx' instead of calling listFiles first to get the actual Convex document ID.",
    fix: "Tools return an instructional error string telling the agent to call listFiles. The system prompt rule explicitly says: 'NEVER use file paths as IDs.'",
    evidence: "process-message.ts (system prompt), read-file.ts",
  },
  {
    title: "Suggestion quota exhaustion cascade",
    symptom: "Ghost text stops appearing for all users.",
    cause:
      "All 5 Gemini models hit their 95% safety margin within the same 60-second window.",
    fix: "The API route catches the Convex error and falls back to Claude Haiku. If Haiku also 429s, returns empty string with 429 status.",
    evidence: "suggestion/route.ts (triple error handling)",
  },
  {
    title: "GitHub import silently skips files",
    symptom: "Imported project is missing some files.",
    cause:
      "Individual file fetches in the import loop catch and log errors but continue. No user-facing report of skipped files.",
    fix: "Known limitation. The error is logged server-side. Surfacing a per-file skip report to the user is a roadmap item.",
    evidence: "import-github-repo.ts (catch block in create-files step)",
  },
];

// ── Things Future Maintainers Should Not Accidentally Break ──

const maintenanceNotes: MaintenanceNote[] = [
  {
    area: "WebContainer singleton pattern and cleanupPromise",
    warning:
      "Do not make webcontainerInstance, bootPromise, or cleanupPromise local to the hook. They must be module-level to survive React re-renders and enforce the singleton.",
    context:
      "Making them useRef or useState variables would break the singleton guarantee across component remounts. cleanupPromise ensures teardowns wait for pending boots.",
  },
  {
    area: "COEP/COOP headers in next.config.ts",
    warning:
      "Removing these headers will silently break WebContainer boot. SharedArrayBuffer will throw without cross-origin isolation.",
    context:
      "The headers are global (/:path*). Scoping to /projects/* only would be better security but hasn't been tested with Clerk's iframe requirements.",
  },
  {
    area: "cancelOn event matching in process-message",
    warning:
      "The if condition 'event.data.messageId == async.data.messageId' is Inngest expression syntax, not JavaScript. Do not refactor it.",
    context:
      "This matches the incoming cancel event's messageId against the original trigger event's messageId to cancel only the correct function instance.",
  },
  {
    area: "The 1-second DB sync sleep",
    warning:
      "The step.sleep('wait-for-db-sync', '1s') in process-message is not arbitrary. Removing it causes the agent to sometimes miss the user's message in conversation history.",
    context:
      "Convex mutations propagate to read replicas with eventual consistency. The sleep bridges this gap.",
  },
  {
    area: "Random vs. round-robin in GeminiAi.ts",
    warning:
      "Do not replace Math.random() with a counter-based round-robin. A counter would require a dedicated Convex row updated on every keystroke across all users.",
    context:
      "The comment in the code explains why a shared round-robin counter would add write contention on every keystroke. Weighted random selection avoids that shared counter.",
  },
  {
    area: "System prompt XML structure",
    warning:
      "The <identity>, <environment>, <tools>, <rules>, <workflow> XML tags are not cosmetic. Claude models are fine-tuned to parse XML-structured system prompts with higher fidelity than markdown.",
    context:
      "Switching to markdown headers would likely degrade tool-use accuracy and rule adherence.",
  },
  {
    area: "File synchronization behavior",
    warning:
      "The useEffect for file sync deliberately omits 'status' from its dependency array. Do not add it back.",
    context:
      "Syncing only when status === 'running' would lose edits made during the install/boot phase. This was a deliberate improvement.",
  },
  {
    area: "Convex vs Zustand ownership boundaries",
    warning:
      "Do not move open tabs or cursor position state into Convex. Do not move durable file data into Zustand.",
    context:
      "Backend round trips are too slow for transient editor state. Zustand is wiped on refresh, which is fatal for project files.",
  },
  {
    area: "docChanged-only suggestion triggering",
    warning:
      "Do not trigger AI suggestions on 'selectionSet' (cursor movement). Only trigger on 'docChanged' (actual typing).",
    context:
      "Triggering on cursor movement would burn through API quotas instantly as users navigate files.",
  },
  {
    area: "ArgumentValidationError recovery patterns",
    warning:
      "AgentKit tools must catch ArgumentValidationError and return instructional strings (e.g., 'Use listFiles') instead of throwing.",
    context:
      "Models frequently hallucinate file paths instead of Convex IDs. Throwing crashes the Inngest function; returning strings lets the model self-correct.",
  },
  {
    area: "import/export ordering requirements",
    warning:
      "GitHub import must sort folders by depth (parents before children). GitHub export must recursively rebuild string paths from parentIds.",
    context:
      "Convex uses a recursive tree. GitHub uses flat paths. Failing to sort by depth causes parent constraint violations during import.",
  },
  {
    area: "Agent loop maxIter limits",
    warning:
      "Do not remove or arbitrarily increase the 'maxIter: 5' limit in the Inngest process-message workflow.",
    context:
      "Unbounded tool-calling loops can consume large token budgets quickly. The current implementation treats 5 iterations as the intended cap for this toolset.",
  },
  {
    area: "Gemini safety margin logic",
    warning:
      "Do not remove the 95% safety margin check (SAFETY_FACTOR = 0.95) when reserving Gemini models in Convex.",
    context:
      "Reserving exactly 100% of the quota causes API rate limits during concurrent typing due to the delay between reservation and execution.",
  },
];

// ── Future Improvements ──

const futureImprovements = [
  {
    area: "Telemetry-driven model routing",
    detail:
      "Model thresholds (1500 chars, maxIter 5, 95% safety margin) are all hard-coded. No runtime telemetry for latency, quality, or cost by route. Adding observability would enable data-driven tuning.",
  },
  {
    area: "User-facing import error report",
    detail:
      "GitHub import logs file-level failures but doesn't surface them to the user. A post-import summary showing skipped files and reasons would improve trust.",
  },
  {
    area: "Structured agent tool errors",
    detail:
      "Agent tools return plain strings for errors. Structured error classes with codes would enable better post-failure analysis and automated retry strategies.",
  },
  {
    area: "Scoped COEP/COOP headers",
    detail:
      "Cross-origin isolation headers are applied globally. Scoping to /projects/* would reduce security surface for public pages.",
  },
  {
    area: "Collaborative editing",
    detail:
      "Currently no conflict resolution for concurrent edits. Convex's real-time primitives could support a CRDT or OT layer, but the 300ms debounce autosave would need to be rearchitected.",
  },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function LearningsPage() {
  return (
    <main className="relative cursor-logo min-h-screen overflow-hidden bg-background pb-28 text-foreground md:pb-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_38%)]" />
      {/* ── Hero ── */}
      <div className="border-b border-border/60 bg-card/20">
        <div className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground shadow-[0_4px_14px_0_rgba(5,150,105,0.1)] backdrop-blur-sm">
            Curate · Engineering Reference
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                Lessons from building a browser-native AI&nbsp;IDE
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                This page is the project&apos;s engineering memory. It records
                why things are built the way they are, which tradeoffs were
                accepted, what pitfalls exist, and what a future maintainer
                should know before changing anything.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Fact label="Primary agent" value="Claude Sonnet 4.6" />
              <Fact label="Fast paths" value="Gemini pool + Haiku" />
              <Fact label="Durable work" value="Inngest + Convex" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        {/* 01 — Architecture */}
        <Section
          kicker="01"
          title="Architecture Decisions"
          intro="The system separates concerns by lifecycle: durable state, long-running work, browser runtime, and editor chrome each have a specific owner. Every decision here has a concrete tradeoff."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {architectureDecisions.map((item) => (
              <DecisionCard key={item.title} item={item} />
            ))}
          </div>
        </Section>

        {/* 02 — AI Decisions */}
        <Section
          kicker="02"
          title="AI Model Decisions"
          intro="Model choice is treated as routing infrastructure. Each route optimizes for a different balance of cost, latency, and capability."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {modelDecisions.map((item) => (
              <DecisionCard key={item.title} item={item} />
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border/60 bg-card/50 p-5">
            <h3 className="text-sm font-semibold">Active Model Inventory</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete routing table. OpenAI SDKs exist in the repo for tool
              metadata, but all runtime AI routes use Anthropic or Google.
            </p>
            <div className="mt-4 grid gap-3">
              {modelRoutes.map((item) => (
                <ModelRow key={item.route} item={item} />
              ))}
            </div>
          </div>
        </Section>

        {/* 03 — Technology Choices */}
        <Section
          kicker="03"
          title="Technology Choices"
          intro="Why each major technology was selected, what alternatives were considered, and why they were rejected."
        >
          <div className="grid gap-4">
            {techChoices.map((item) => (
              <TechChoiceCard key={item.technology} item={item} />
            ))}
          </div>
        </Section>

        {/* 04 — Reliability */}
        <Section
          kicker="04"
          title="Reliability Patterns"
          intro="Most Curate failures come from async work, model tool use, or browser runtime lifecycle. These patterns keep failures recoverable."
        >
          <div className="grid gap-3">
            {reliabilityLessons.map((item) => (
              <ReliabilityRow key={item.title} item={item} />
            ))}
          </div>
        </Section>

        {/* 05 — Pitfalls */}
        <Section
          kicker="05"
          title="Common Pitfalls"
          intro="Known failure modes that have been encountered and solved (or mitigated). Check here before debugging an unfamiliar issue."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {pitfalls.map((item) => (
              <PitfallCard key={item.title} item={item} />
            ))}
          </div>
        </Section>

        {/* 06 — Do Not Change */}
        <Section
          kicker="06"
          title="Things Future Maintainers Should Not Accidentally Break"
          intro="Code that looks simple but has non-obvious reasons for existing. Do not change without understanding the context."
        >
          <div className="grid gap-3">
            {maintenanceNotes.map((item) => (
              <MaintenanceRow key={item.area} item={item} />
            ))}
          </div>
        </Section>

        {/* 07 — Future */}
        <Section
          kicker="07"
          title="Future Improvements"
          intro="Cleanup targets and planned enhancements. These represent known limitations, not bugs."
        >
          <div className="grid gap-3">
            {futureImprovements.map((item) => (
              <FutureRow key={item.area} item={item} />
            ))}
          </div>
        </Section>
      </div>

      {/* ── Footer ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/85 px-4 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-7xl justify-center">
          <Link
            href="/"
            aria-label="Go back to home"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/50 bg-card/60 px-8 text-sm font-medium shadow-xl shadow-primary/10 backdrop-blur-md transition-colors hover:bg-accent"
          >
            <ArrowLeft className="size-4" />
            <span>Go back to home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function Section({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border/60 py-10 first:border-t-0 first:pt-0">
      <div className="mb-6 grid gap-3 md:grid-cols-[0.2fr_0.8fr]">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          {kicker}
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {intro}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DecisionCard({ item }: { item: Decision }) {
  return (
    <article className="rounded-lg border border-border/60 bg-card/50 p-5">
      <div className="mb-3 flex items-center gap-2 text-primary">
        {item.icon}
        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
      </div>

      <dl className="space-y-3 text-sm leading-6">
        <Pair label="Decision" value={item.decision} />
        <Pair label="Why" value={item.why} />
        <Pair label="Tradeoff" value={item.tradeoff} variant="warning" />
        <div>
          <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Evidence
          </dt>
          <dd className="rounded-md bg-background/70 px-2 py-1 font-mono text-xs leading-5 text-muted-foreground">
            {item.evidence}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function ModelRow({ item }: { item: ModelRoute }) {
  return (
    <article className="rounded-md border border-border/50 bg-background/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
          {item.route}
        </h4>
        <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
          {item.model.includes(",")
            ? `${item.model.split(",").length} models`
            : item.model}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="text-sm leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">When:</span>{" "}
          {item.criteria}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">Why:</span> {item.why}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">Tradeoff:</span>{" "}
          {item.tradeoff}
        </p>
      </div>
      {item.model.includes(",") && (
        <p className="mt-2 font-mono text-xs leading-5 text-muted-foreground/60">
          {item.model}
        </p>
      )}
    </article>
  );
}

function TechChoiceCard({ item }: { item: TechChoice }) {
  return (
    <article className="rounded-lg border border-border/60 bg-card/50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{item.technology}</h3>
        <span className="text-xs text-muted-foreground">{item.role}</span>
      </div>
      <div className="grid gap-3 text-sm leading-6 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Why chosen
          </p>
          <p className="text-muted-foreground">{item.why}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Alternative: {item.alternative}
          </p>
          <p className="text-muted-foreground">{item.whyNot}</p>
        </div>
      </div>
    </article>
  );
}

function ReliabilityRow({
  item,
}: {
  item: (typeof reliabilityLessons)[number];
}) {
  return (
    <article className="rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-primary">{item.icon}</div>
        <div>
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {item.detail}
          </p>
          <p className="mt-2 rounded-md bg-background/70 px-2 py-1 font-mono text-xs leading-5 text-muted-foreground">
            {item.evidence}
          </p>
        </div>
      </div>
    </article>
  );
}

function PitfallCard({ item }: { item: Pitfall }) {
  return (
    <article className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="size-4 text-yellow-500" />
        <h3 className="text-sm font-semibold">{item.title}</h3>
      </div>
      <dl className="space-y-2 text-sm leading-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
            Symptom
          </dt>
          <dd className="text-muted-foreground">{item.symptom}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cause
          </dt>
          <dd className="text-muted-foreground">{item.cause}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fix
          </dt>
          <dd className="text-muted-foreground">{item.fix}</dd>
        </div>
        <div>
          <dd className="rounded-md bg-background/70 px-2 py-1 font-mono text-xs leading-5 text-muted-foreground">
            {item.evidence}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function MaintenanceRow({ item }: { item: MaintenanceNote }) {
  return (
    <article className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-red-500" />
        <div>
          <h3 className="text-sm font-semibold">{item.area}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-red-600 dark:text-red-400">
            {item.warning}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {item.context}
          </p>
        </div>
      </div>
    </article>
  );
}

function FutureRow({ item }: { item: (typeof futureImprovements)[number] }) {
  return (
    <article className="flex gap-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <h3 className="text-sm font-semibold">{item.area}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {item.detail}
        </p>
      </div>
    </article>
  );
}

function Pair({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "warning";
}) {
  return (
    <div>
      <dt
        className={`mb-1 text-xs font-semibold uppercase tracking-wider ${
          variant === "warning"
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  );
}
