"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home, TerminalSquare } from "lucide-react";

export default function NotFound() {
  const pathname = usePathname();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_0_0_1px_hsl(var(--border)),0_20px_80px_rgba(0,0,0,0.45),0_0_60px_rgba(21,112,239,0.08)]">
        {/* IDE chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-sidebar px-4 py-3">
          <div className="size-3 rounded-full bg-destructive/80" />
          <div className="size-3 rounded-full bg-chart-3/80" />
          <div className="size-3 rounded-full bg-chart-2/80" />

          <div className="ml-4 rounded-md border border-border bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
            workspace-router.ts
          </div>
        </div>

        {/* Terminal */}
        <div className="space-y-8 p-8 font-mono">
          <div className="flex items-center gap-3">
            <TerminalSquare className="size-6 text-cyan-400" />

            <span className="text-sm font-medium tracking-wide text-foreground">
              Curate Runtime
            </span>
          </div>

          <div className="space-y-4 text-sm leading-7">
            <p className="text-foreground">
              <span className="mr-2 text-primary">$</span>
              resolve-route {pathname}
            </p>

            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
              [404] RouteNotFoundException
            </p>

            <p className="text-foreground">
              <span className="mr-2 text-primary">→</span>
              The requested resource does not exist in the current workspace.
            </p>

            <p className="text-foreground">
              <span className="mr-2 text-primary">→</span>
              Possible causes:
            </p>

            <ul className="space-y-2 pl-6 text-muted-foreground">
              <li>• Invalid route path</li>
              <li>• Project was removed</li>
              <li>• Stale navigation state</li>
              <li>• Mistyped URL</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition hover:bg-accent"
            >
              <Home className="size-4" />
              Open Dashboard
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              <ArrowLeft className="size-4" />
              Go Back
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Tip: Press Ctrl + K to search projects and quickly navigate your
              workspace.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
