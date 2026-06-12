"use client";

import { useState } from "react";
import { Allotment } from "allotment";
import {
  Loader2Icon,
  TerminalSquareIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { useWebContainer } from "@/features/preview/hooks/use-webcontainer";
import { PreviewSettingsPopover } from "@/features/preview/components/preview-settings-popover";
import { PreviewTerminal } from "@/features/preview/components/preview-terminal";
import { Button } from "@/components/ui/button";
import { useProject } from "../hooks/use-projects";
import { Id } from "../../../../convex/_generated/dataModel";

export const PreviewView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const project = useProject(projectId);

  const [showTerminal, setShowTerminal] = useState(true);

  const { status, previewUrl, error, restart, terminalOutput } =
    useWebContainer({
      projectId,
      enabled: true,
      isImporting: project?.importStatus === "importing",
      settings: project?.settings,
    });

  const isLoading = status === "booting" || status === "installing";

  return (
    <div className="h-full flex flex-col bg-background">
      {/* TOP BAR */}
      <div className="h-11 flex items-center justify-between border-b bg-muted/20 shrink-0 px-2">
        <div className="flex items-center">
          <Button
            size="icon"
            variant="secondary"
            className="size-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={restart}
            title="Restart container"
          >
            <RefreshCwIcon
              className={`size-4 ${isLoading ? "animate-spin text-primary" : ""}`}
            />
          </Button>
        </div>

        <div className="flex-1 flex justify-center max-w-xl mx-4">
          <div className="flex w-full items-center gap-2.5 px-3 py-1.5 bg-background border rounded-md text-xs font-mono shadow-sm transition-colors hover:border-border/80">
            <div
              className={`size-2 rounded-full shrink-0 ${
                status === "running"
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                  : status === "installing"
                    ? "bg-yellow-500 animate-pulse"
                    : status === "booting"
                      ? "bg-blue-500 animate-pulse"
                      : status === "error"
                        ? "bg-red-500"
                        : "bg-muted-foreground/30"
              }`}
            />

            <div className="flex-1 truncate text-muted-foreground flex items-center gap-2">
              {isLoading && (
                <span className="flex items-center gap-1.5">
                  <Loader2Icon className="size-3 animate-spin text-primary/80" />
                  {status === "booting"
                    ? "Starting container..."
                    : "Installing dependencies..."}
                </span>
              )}

              {!isLoading && previewUrl && (
                <span className="text-foreground/90">{previewUrl}</span>
              )}

              {!isLoading && !previewUrl && !error && (
                <span>Ready to preview</span>
              )}

              {error && <span className="text-red-400">Container error</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={showTerminal ? "secondary" : "ghost"}
            className="size-7 rounded-md text-muted-foreground hover:text-foreground"
            title="Toggle terminal"
            onClick={() => setShowTerminal((value) => !value)}
          >
            <TerminalSquareIcon className="size-4" />
          </Button>

          <PreviewSettingsPopover
            projectId={projectId}
            initialValues={project?.settings}
            onSave={restart}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0">
        <Allotment vertical>
          {/* PREVIEW */}
          <Allotment.Pane>
            {/* ERROR */}
            {error && (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3 max-w-md mx-auto text-center">
                  <AlertTriangleIcon className="size-7 text-yellow-500" />

                  <p className="text-sm font-medium">{error}</p>

                  <Button size="sm" variant="outline" onClick={restart}>
                    <RefreshCwIcon className="size-4" />
                    Restart container
                  </Button>
                </div>
              </div>
            )}

            {/* TERMINAL BOOT ANIMATION */}
            {isLoading && !error && (
              <div className="size-full flex items-center justify-center">
                <BootAnimation />
              </div>
            )}

            {/* WAITING FOR SERVER */}
            {!isLoading && !error && !previewUrl && (
              <div className="size-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">
                    Waiting for development server
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Start a server to see the preview.
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {previewUrl && (
              <motion.div
                className="size-full flex flex-col"
                initial={{
                  opacity: 0,
                  scale: 0.995,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{ duration: 0.35 }}
              >
                <iframe
                  src={previewUrl}
                  className="flex-1 border-0"
                  title="Preview"
                />
              </motion.div>
            )}
          </Allotment.Pane>

          {/* TERMINAL */}
          {showTerminal && (
            <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
              <div className="h-full flex flex-col bg-background border-t">
                <div className="h-7 flex items-center justify-between px-3 text-xs border-b border-border/50 bg-muted/30 shrink-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                    <TerminalSquareIcon className="size-3" />
                    Terminal
                  </div>
                </div>

                <PreviewTerminal output={terminalOutput} />
              </div>
            </Allotment.Pane>
          )}
        </Allotment>
      </div>
    </div>
  );
};

function BootAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Core animation */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <motion.div
          className="absolute h-40 w-40 rounded-full border border-primary/20"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute h-28 w-28 rounded-full border border-primary/40"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Pulse */}
        <motion.div
          className="absolute h-16 w-16 rounded-full bg-primary/15"
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.3, 0.9, 0.3],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Core */}
        <motion.div
          className="h-5 w-5 rounded-full bg-primary"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      </div>

      {/* Status */}
      <div className="text-center">
        <motion.div
          className="text-sm font-medium"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Initializing Curate Runtime
        </motion.div>

        <div className="mt-2 text-xs text-muted-foreground">
          Preparing workspace, dependencies and preview environment
        </div>
      </div>

      {/* Progress bars */}
      <div className="w-80 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-primary"
              animate={{
                x: ["-100%", "300%"],
              }}
              transition={{
                duration: 1.8 + i * 0.3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
