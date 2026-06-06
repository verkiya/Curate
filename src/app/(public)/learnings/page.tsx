/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  BrainCircuit,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Home,
  Layers3,
  MonitorSmartphone,
  Shield,
  TerminalSquare,
  Workflow,
  Zap,
} from "lucide-react";

const stackGroups = [
  {
    title: "Frontend Platform",
    icon: MonitorSmartphone,
    description:
      "Next.js App Router architecture, React 19 rendering, TypeScript safety, Tailwind UI composition, and animation orchestration.",
    items: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
    ],
  },
  {
    title: "Browser IDE Runtime",
    icon: TerminalSquare,
    description:
      "Browser-native editing, terminal execution, pane orchestration, workspace state, and in-browser compute.",
    items: ["CodeMirror 6", "WebContainers", "xterm", "Zustand", "Allotment"],
  },
  {
    title: "Backend Infrastructure",
    icon: Database,
    description:
      "Realtime sync, auth boundaries, persistence, and repository integration workflows.",
    items: ["Convex", "Clerk", "GitHub OAuth", "Octokit"],
  },
  {
    title: "AI Orchestration",
    icon: BrainCircuit,
    description:
      "Background agent workflows, async execution, live context enrichment, and model orchestration.",
    items: ["Inngest", "Anthropic", "AI SDK", "Agent Kit", "Firecrawl"],
  },
];

const lifecycle = [
  "User prompt",
  "Context assembly",
  "Workflow routing",
  "Tool execution",
  "Model inference",
  "State sync",
  "UI render",
];

const metrics = [
  ["AI Requests", "1,284", "+12.4%"],
  ["Avg Latency", "2.1s", "-0.4s"],
  ["Token Spend", "$18.42", "controlled"],
  ["Workflow Success", "99.2%", "healthy"],
  ["GitHub Imports", "143", "today"],
  ["Sync Events", "82k", "realtime"],
];

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="mb-10 max-w-4xl"
    >
      <p className="mb-3 text-sm uppercase tracking-[0.25em] text-primary">
        {eyebrow}
      </p>
      <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-9 text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}

export default function TechStackPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-5%] top-[30%] h-[32rem] w-[32rem] rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10 flex flex-wrap gap-4">
            <Link href="/">
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 hover:bg-accent transition">
                <Home className="size-4" /> Dashboard
              </button>
            </Link>
            <Link href="/">
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 hover:bg-accent transition">
                <ArrowLeft className="size-4" /> Back
              </button>
            </Link>
          </div>

          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary">
            Curate Architecture
          </p>
          <h1 className="max-w-6xl text-5xl font-semibold tracking-tight md:text-7xl">
            AI-native browser IDE engineered as a cloud development platform.
          </h1>
          <p className="mt-8 max-w-5xl text-lg leading-9 text-muted-foreground md:text-xl">
            Curate combines realtime backend infrastructure, browser-native
            execution, GitHub workflows, asynchronous AI orchestration, and
            observability into a unified software development environment. This
            is not a text editor with AI autocomplete. It is a systems-level
            browser IDE architecture.
          </p>
        </motion.section>

        <section className="mt-16 grid gap-6 md:grid-cols-4">
          {[
            [
              "Realtime Backend",
              "Convex-powered state synchronization",
              Database,
            ],
            [
              "AI Workflows",
              "Event-driven orchestration via Inngest",
              Workflow,
            ],
            ["Browser Runtime", "WebContainers + terminal execution", Cpu],
            [
              "Observability",
              "Telemetry, diagnostics, operational visibility",
              Activity,
            ],
          ].map(([title, desc, Icon]) => {
            const I = Icon as any;
            return (
              <motion.div
                whileHover={{ y: -4 }}
                key={title as string}
                className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm"
              >
                <I className="mb-4 size-6 text-primary" />
                <h3 className="text-lg font-medium">{title as string}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {desc as string}
                </p>
              </motion.div>
            );
          })}
        </section>

        <section className="mt-28">
          <SectionTitle
            eyebrow="AI Lifecycle"
            title="AI request lifecycle visualization"
            description="AI requests are intentionally decoupled from direct UI rendering to preserve responsiveness and support retries, tool execution, cancellation, and multi-step orchestration."
          />
          <div className="grid gap-4 md:grid-cols-7">
            {lifecycle.map((step, idx) => (
              <div
                key={step}
                className="relative rounded-2xl border border-border bg-card p-5 text-center"
              >
                <Bot className="mx-auto mb-3 size-5 text-primary" />
                <p className="text-sm">{step}</p>
                {idx < lifecycle.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 h-px w-4 bg-border" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-28">
          <SectionTitle
            eyebrow="Operational Visibility"
            title="Mock observability dashboard"
            description="Production AI systems require visibility into cost, latency, workflow health, and infrastructure behavior. Curate treats observability as architecture, not an afterthought."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {metrics.map(([label, value, meta]) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
                <p className="mt-2 text-sm text-primary">{meta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-28">
          <SectionTitle
            eyebrow="Architecture"
            title="System overview"
            description="Curate isolates frontend interaction, state synchronization, AI orchestration, and external integrations into independent architectural layers."
          />
          <div className="grid gap-6 lg:grid-cols-5">
            {[
              ["Developer", "Interactive IDE session", Code2],
              ["Next.js", "Frontend orchestration", Layers3],
              ["Convex", "Realtime backend", Database],
              ["Inngest", "Background workflows", Bot],
              ["External", "Anthropic / GitHub / Firecrawl", Globe],
            ].map(([title, desc, Icon], idx) => {
              const I = Icon as any;
              return (
                <div
                  key={title as string}
                  className="relative rounded-2xl border border-border bg-card p-6"
                >
                  <I className="mb-4 size-6 text-primary" />
                  <h3 className="font-medium">{title as string}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-6">
                    {desc as string}
                  </p>
                  {idx < 4 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 h-px w-6 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-28">
          <SectionTitle
            eyebrow="Technology Stack"
            title="Implementation layers"
            description="Technology choices are organized by engineering responsibility, not superficial badge listing."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {stackGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div
                  key={group.title}
                  className="rounded-2xl border border-border bg-card p-8"
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-xl font-semibold">{group.title}</h3>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {group.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-28 grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-5 flex items-center gap-3 text-primary">
              <Shield className="size-6" />
              <h3 className="text-2xl font-semibold">Security boundaries</h3>
            </div>
            <div className="space-y-5 text-muted-foreground leading-8">
              <p>
                Authentication is isolated through Clerk with GitHub OAuth
                integration and protected route enforcement.
              </p>
              <p>
                Convex remains authoritative for state integrity while
                optimistic UI improves perceived responsiveness.
              </p>
              <p>
                Browser execution avoids naive server-side arbitrary execution
                architectures.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-5 flex items-center gap-3 text-primary">
              <GitBranch className="size-6" />
              <h3 className="text-2xl font-semibold">
                GitHub import lifecycle
              </h3>
            </div>
            <div className="space-y-4 text-muted-foreground leading-8">
              <p>
                OAuth authentication → repository fetch → file ingestion →
                workspace hydration → realtime synchronization.
              </p>
              <p>
                This enables browser-native project onboarding without manual
                archive uploads.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-28 rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 size-5 text-destructive" />
            <div>
              <h3 className="text-xl font-semibold">Architectural reality</h3>
              <p className="mt-3 max-w-4xl leading-8 text-muted-foreground">
                Browser IDEs are materially harder than conventional SaaS
                applications. Runtime execution, terminal behavior, auth
                constraints, browser sandbox boundaries, AI orchestration, and
                realtime sync introduce systems-level complexity far beyond CRUD
                architecture.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
