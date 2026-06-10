"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  Code2,
  Database,
  GitBranch,
  Network,
  ShieldCheck,
  Wrench,
  Workflow,
  Zap,
} from "lucide-react";

type Decision = {
  title: string;
  decision: string;
  why: string;
  tradeoff: string;
  evidence: string;
  icon: ReactNode;
};

type ModelInventoryItem = {
  route: string;
  model: string;
  role: string;
  tradeoff: string;
};

type PolarisDelta = {
  label: string;
  current: string;
  reference: string;
  lesson: string;
};

const modelDecisions: Decision[] = [
  {
    title: "Suggestions optimize for quota first",
    decision:
      "Ghost text reserves a Gemini Flash-family model through Convex, then falls back to Claude Haiku on quota exhaustion or provider rate limits.",
    why: "Autocomplete is high frequency and extremely latency-sensitive. The implementation optimizes for raw request capacity and graceful degradation before deep reasoning.",
    tradeoff:
      "The prompt stays narrow and schema-bound. Parser failures return an empty string, protecting typing flow but hiding some failure detail.",
    evidence:
      "src/app/api/suggestion/route.ts, convex/GeminiAi.ts, src/lib/ai-models.ts",
    icon: <Zap className="size-4" />,
  },
  {
    title: "Quick edit routes by selection size",
    decision:
      "Selections over 1500 characters use Claude Sonnet. Smaller selections use Claude Haiku.",
    why: "Small edits benefit more from low latency and cost. Large edits need stronger context preservation and code reasoning.",
    tradeoff:
      "The threshold ignores language and semantic complexity. It needs telemetry before it becomes more than a pragmatic heuristic.",
    evidence: "src/app/api/quick-edit/route.ts",
    icon: <Network className="size-4" />,
  },
  {
    title: "The agent defaults to Sonnet",
    decision:
      "The AgentKit coding loop uses Claude Sonnet with file tools, temperature 0.2, max 8000 output tokens, and maxIter 5.",
    why: "Sonnet is the balanced coding model: good tool use and code generation without the cost and latency profile of Opus.",
    tradeoff:
      "Opus exists in the model constants as an escalation tier, but no active route uses it today. Treat it as reserved capacity for future deep reasoning, not current behavior.",
    evidence:
      "src/features/conversations/inngest/process-message.ts, src/lib/ai-models.ts",
    icon: <BrainCircuit className="size-4" />,
  },
  {
    title: "Claude routes are not drop-in abstractions",
    decision:
      "Tool-driven coding uses Anthropic through AgentKit. OpenAI appears in dependencies and model-access tooling, but not in active production AI routes.",
    why: "The current agent prompt, XML structure, and router are tuned around Claude behavior, including Anthropic responses that can contain text and tool calls in the same step.",
    tradeoff:
      "This reduces provider abstraction. Adding OpenAI later should be treated as a new route with its own prompts, tool-call stopping rules, and quality checks, not a drop-in model swap.",
    evidence:
      "src/features/conversations/inngest/constants.ts, process-message.ts, package.json, models.json",
    icon: <ShieldCheck className="size-4" />,
  },
];

const activeModelInventory: ModelInventoryItem[] = [
  {
    route: "Suggestion primary pool",
    model:
      "gemini-3.5-flash, gemini-2.5-flash-lite, gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-lite",
    role: "Weighted pool reserved through Convex before each ghost-text request.",
    tradeoff:
      "Capacity and latency over strongest reasoning; the prompt must stay narrow and schema-bound.",
  },
  {
    route: "Suggestion fallback / small edits / titles",
    model: "claude-haiku-4-5-20251001",
    role: "Fallback autocomplete, small quick edits, and deterministic title generation.",
    tradeoff:
      "Cheap and fast, but not for broad file rewrites or multi-step agent work.",
  },
  {
    route: "Large quick edits / coding agent",
    model: "claude-sonnet-4-6",
    role: "Large selected-code edits and the primary AgentKit coding loop.",
    tradeoff:
      "Higher cost and latency than Haiku, but better tool-use and code-context quality.",
  },
  {
    route: "Reserved deep reasoning",
    model: "claude-opus-4-8",
    role: "Configured in CLAUDE_MODELS but unused by active runtime routes.",
    tradeoff:
      "Activating it needs a deliberate route, trigger, and budget guardrails.",
  },
];

const architectureDecisions: Decision[] = [
  {
    title: "State is split by lifecycle",
    decision:
      "Convex owns durable state (projects, files, messages, binary storage, AI quotas). Zustand owns ephemeral state (tabs, editor chrome). CodeMirror owns transient keystroke-level state.",
    why: "Durable project data, local IDE UX, and transient editor transactions have vastly different lifecycles and persistence requirements.",
    tradeoff:
      "The UI stays responsive without latency jitter, but there is no dirty-buffer conflict model yet. Autosave is a 300ms debounce into Convex.",
    evidence:
      "convex/schema.ts, src/features/editor/store/use-editor-store.ts, src/features/editor/components/editor-view.tsx",
    icon: <Database className="size-4" />,
  },
  {
    title: "Inngest owns durable workflows",
    decision:
      "AI coding loops, GitHub imports, and GitHub exports are event-driven background jobs managed by Inngest that mutate Convex through internal APIs.",
    why: "Operations like AI file edits, full repository traversal, binary uploads, and GitHub commits take time and must survive browser tab closures or serverless timeout windows.",
    tradeoff:
      "This requires placeholder rows, status fields, cancellation events, and a shared internal key. Leaking that key would bypass user-facing Clerk checks.",
    evidence:
      "src/app/api/messages/route.ts, src/features/*/inngest/*.ts, convex/auth.ts, convex/system.ts",
    icon: <Workflow className="size-4" />,
  },
  {
    title: "Agent tools return recoverable errors",
    decision:
      "Tool handlers validate inputs with Zod, catch Convex ArgumentValidationError, and tell the model to call listFiles for real IDs.",
    why: "Models often pass string paths where Convex IDs are required. Returning a tool error string lets the agent self-correct instead of crashing the worker entirely.",
    tradeoff:
      "Recoverability improves, but errors become conversational artifacts in the context window. Critical failures still need external monitoring.",
    evidence: "src/inngest/tools/read-file.ts, update-file.ts, delete-files.ts",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    title: "WebContainers are a strictly managed singleton",
    decision:
      "Curate enforces exactly one active WebContainer instance, managed via a single boot promise and a queued cleanup promise. The AI agent prompt constrains generated apps to WebContainer-safe patterns.",
    why: "SharedArrayBuffer constraints, browser memory limits, and StackBlitz runtime restrictions make running multiple live containers or unsupported environments highly unstable.",
    tradeoff:
      "The preview is an incredibly useful local sandbox but not a general VM. SSR frameworks, native modules, non-JS runtimes, and interactive terminal prompts are outside the supported path.",
    evidence:
      "src/features/preview/hooks/use-webcontainer.ts, next.config.ts, src/features/conversations/inngest/constants.ts",
    icon: <Wrench className="size-4" />,
  },
  {
    title: "Suggestions are editor extensions, not chat",
    decision:
      "Ghost text lives inside CodeMirror, fires only on document changes, aborts stale requests, and accepts with Tab.",
    why: "Autocomplete should feel like editor infrastructure, not a conversational request loop.",
    tradeoff:
      "This saves quota and typing flow, but suggestions are intentionally narrow and cannot do multi-file reasoning.",
    evidence:
      "src/features/editor/extensions/suggestion/index.ts, src/features/editor/extensions/suggestion/fetcher.ts",
    icon: <Code2 className="size-4" />,
  },
  {
    title: "GitHub import/export is file-system aware",
    decision:
      "Import sorts folders by depth and stores binaries in Convex storage. Export rebuilds full paths before creating Git blobs, one tree, and one commit.",
    why: "GitHub trees are path-based while Curate is node-based. Binary files need storage URLs instead of text content.",
    tradeoff:
      "This is good for first import/export. It is not a sync engine, and import can complete after logging per-file failures.",
    evidence:
      "src/features/projects/inngest/import-github-repo.ts, export-to-github.ts",
    icon: <GitBranch className="size-4" />,
  },
];

const reliabilityLessons = [
  {
    lesson: "Cancel and bound model work.",
    note: "New chat messages and stop requests send message/cancel events. The AgentKit loop stops at maxIter 5 and only finishes when Claude has text with no pending tool call.",
    evidence:
      "src/app/api/messages/route.ts, src/app/api/messages/cancel/route.ts, src/features/conversations/inngest/process-message.ts",
  },
  {
    lesson: "Pre-validate destructive operations.",
    note: "deleteFiles validates every ID before deleting anything, avoiding mixed valid/invalid partial deletes.",
    evidence: "src/inngest/tools/delete-files.ts",
  },
  {
    lesson: "Keep preview lifecycle idempotent.",
    note: "Boot waits for cleanup, teardown waits for boot, import pauses startup, file sync runs before status === running, and terminal output writes only new bytes.",
    evidence:
      "src/features/preview/hooks/use-webcontainer.ts, src/features/preview/components/preview-terminal.tsx",
  },
  {
    lesson: "Suggestions should not fire on cursor movement.",
    note: "Curate triggers ghost text only on docChanged and aborts stale requests. Polaris also triggered selectionSet, which burned quota while users navigated.",
    evidence: "src/features/editor/extensions/suggestion/index.ts",
  },
  {
    lesson: "External documentation context must be bounded.",
    note: "Quick edit accepts at most 3 URLs, races each scrape against 5 seconds, trims docs to 3000 chars, and slices large file context.",
    evidence: "src/app/api/quick-edit/route.ts",
  },
  {
    lesson: "Cross-origin isolation is the preview tax.",
    note: "COEP/COOP headers are applied globally so SharedArrayBuffer works for WebContainers. The code notes project-only headers could be safer but are not implemented.",
    evidence: "next.config.ts",
  },
];

const polarisDeltas: PolarisDelta[] = [
  {
    label: "Inherited",
    current:
      "Convex file tree, CodeMirror extensions, AgentKit tools, WebContainer preview, and GitHub workflows remain the architectural spine.",
    reference:
      "Polaris provides the tutorial baseline for the same major subsystems.",
    lesson:
      "Curate should keep the feature boundaries, but not assume the tutorial defaults are production-ready.",
  },
  {
    label: "Improved",
    current:
      "Curate adds Convex-backed Gemini routing, Haiku fallback, Sonnet primary agent, maxIter 5, cleanupPromise, edit-only suggestion triggers, and WebContainer-specific prompt rules.",
    reference:
      "Polaris used single-model suggestions, Opus as the agent, maxIter 20, and simpler WebContainer lifecycle handling.",
    lesson:
      "The biggest production gains came from lowering default model cost and hardening lifecycle/rate-limit failure paths.",
  },
  {
    label: "Rejected",
    current:
      "Curate rejects always-Opus coding, cursor-movement autocomplete, status-gated preview sync, and generic generated app rules.",
    reference:
      "These patterns were acceptable tutorial shortcuts but created cost, quota, or runtime fragility.",
    lesson:
      "Tutorial simplicity should be revisited anywhere the system crosses browser runtime, provider quota, or destructive file mutation boundaries.",
  },
];

const clarificationsAndTradeoffs = [
  "OpenAI is not an active runtime model route. The repo has OpenAI SDKs, model metadata, and access-check scripts, but production AI calls found here use Anthropic or Google.",
  "Claude Opus is not currently used by the coding agent. It is defined as a reserved deep-reasoning tier in CLAUDE_MODELS.",
  "The previous documentation's Claude 3.5 labels were stale. Curate routes through Claude Haiku 4.5, Sonnet 4.6, and reserved Opus 4.8 constants.",
  "The old in-memory suggestion router is not the active path. The active rate limiter is Convex-backed in convex/GeminiAi.ts.",
];

const futureImprovements = [
  "Preview settings use devCommand in UI/hook code, while the Convex schema currently documents only installCommand inside project settings.",
  "GitHub import has no user-facing skipped-file report when individual files fail.",
  "Model-routing thresholds are hard-coded. There is no telemetry loop yet for latency, quality, or cost by route.",
  "Agent tools favor recoverable strings over structured error classes, which limits analysis after failures.",
];

export default function LearningsPage() {
  return (
    <main className="min-h-screen bg-background pb-28 text-foreground md:pb-32">
      <div className="border-b border-border/60 bg-card/20">
        <div className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Curate Engineering Reference
          </p>

          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Lessons from building a browser-native AI IDE
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                This page is for future maintainers. It records decisions that
                are visible in the codebase, the reason each decision exists,
                and the tradeoff contributors should preserve or revisit.
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

      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <Section
          kicker="01"
          title="Architecture"
          intro="The system separates concerns by lifecycle: durable state, long-running work, browser runtime, and editor chrome each have a specific owner."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {architectureDecisions.map((item) => (
              <DecisionCard key={item.title} item={item} />
            ))}
          </div>
        </Section>

        <Section
          kicker="02"
          title="AI Decisions"
          intro="Curate uses model specialization. Model choice is treated as routing infrastructure, not branding, to optimize cost, latency, and capability."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {modelDecisions.map((item) => (
              <DecisionCard key={item.title} item={item} />
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-border/60 bg-card/50 p-5">
            <h3 className="text-sm font-semibold">Active Model Inventory</h3>
            <div className="mt-4 grid gap-3">
              {activeModelInventory.map((item) => (
                <InventoryRow key={item.route} item={item} />
              ))}
            </div>
          </div>
        </Section>

        <Section
          kicker="03"
          title="Reliability Lessons"
          intro="Most Curate failures come from async work, model tool use, or browser runtime lifecycle. These patterns keep failures recoverable."
        >
          <div className="grid gap-3">
            {reliabilityLessons.map((item) => (
              <LessonRow key={item.lesson} {...item} />
            ))}
          </div>
        </Section>

        <Section
          kicker="04"
          title="Polaris Learnings"
          intro="Polaris remains useful as the tutorial reference. Curate's important changes are the places where production constraints overruled tutorial simplicity."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {polarisDeltas.map((item) => (
              <DeltaCard key={item.label} item={item} />
            ))}
          </div>
        </Section>

        <Section
          kicker="05"
          title="Clarifications & Tradeoffs"
          intro="Important distinctions about what Curate actually implements versus common assumptions or legacy documentation."
        >
          <ul className="grid gap-3">
            {clarificationsAndTradeoffs.map((claim) => (
              <li
                key={claim}
                className="rounded-lg border border-border/60 bg-card/50 p-4 text-sm leading-6 text-muted-foreground"
              >
                {claim}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          kicker="06"
          title="Future Improvements"
          intro="These are cleanup targets and planned enhancements that future contributors should know about."
        >
          <ul className="grid gap-3">
            {futureImprovements.map((gap) => (
              <li
                key={gap}
                className="flex gap-3 rounded-lg border border-border/60 bg-card/50 p-4 text-sm leading-6 text-muted-foreground"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

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
        <Pair label="Tradeoff" value={item.tradeoff} />
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

function InventoryRow({ item }: { item: ModelInventoryItem }) {
  return (
    <article className="rounded-md border border-border/50 bg-background/50 p-3">
      <div className="grid gap-2 md:grid-cols-[0.28fr_0.72fr]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
          {item.route}
        </h4>
        <div className="space-y-2">
          <p className="font-mono text-xs leading-5 text-muted-foreground">
            {item.model}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{item.role}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Tradeoff: {item.tradeoff}
          </p>
        </div>
      </div>
    </article>
  );
}

function DeltaCard({ item }: { item: PolarisDelta }) {
  return (
    <article className="rounded-lg border border-border/60 bg-card/50 p-4">
      <h3 className="text-sm font-semibold text-primary">{item.label}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">Curate:</span>{" "}
        {item.current}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">Polaris:</span>{" "}
        {item.reference}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">Lesson:</span>{" "}
        {item.lesson}
      </p>
    </article>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  );
}

function LessonRow({
  lesson,
  note,
  evidence,
}: {
  lesson: string;
  note: string;
  evidence: string;
}) {
  return (
    <article className="rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-start gap-3">
        <Wrench className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">{lesson}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
          <p className="mt-2 rounded-md bg-background/70 px-2 py-1 font-mono text-xs leading-5 text-muted-foreground">
            {evidence}
          </p>
        </div>
      </div>
    </article>
  );
}
