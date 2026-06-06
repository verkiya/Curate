"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { CubeLoader } from "@/features/projects/components/cube-loader";

const STATUS_MESSAGES = [
  "Loading editor...",
  "Connecting AI providers...",
  "Restoring workspace...",
  "Syncing project state...",
  "Preparing runtime...",
];

export const AuthLoadingView = () => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-[-10%] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card/70 p-8 backdrop-blur-xl shadow-[0_0_0_1px_hsl(var(--border)),0_20px_60px_rgba(0,0,0,0.35)]"
      >
        {/* IDE title bar */}
        <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
          <div className="size-3 rounded-full bg-destructive/80" />
          <div className="size-3 rounded-full bg-chart-3/80" />
          <div className="size-3 rounded-full bg-chart-2/80" />

          <div className="ml-4 rounded-md border border-border bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
            boot.log
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          {/* Status badge */}
          <div className="mb-4 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Booting Workspace
          </div>

          {/* Loader */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10"
          >
            <CubeLoader className="size-7 text-primary" />
          </motion.div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Preparing workspace
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Preparing your development environment.
          </p>

          {/* Animated status */}
          <motion.div
            key={statusIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-xs text-muted-foreground"
          >
            {STATUS_MESSAGES[statusIndex]}
          </motion.div>

          {/* Footer */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="size-2 animate-pulse rounded-full bg-cyan-400" />
            Runtime v1 • Workspace Session
          </div>
        </div>
      </motion.div>
    </div>
  );
};
