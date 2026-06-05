import Image from "next/image";
import { JetBrains_Mono } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";

import { CodeEditor } from "./code-editor";
import { useEditor } from "../hooks/use-editor";
import { TopNavigation } from "./top-navigation";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { AlertTriangleIcon } from "lucide-react";

const font = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["200", "300"],
});

const DEBOUNCE_MS = 300; // Autosave time

export const EditorView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const { activeTabId, previewTabId, openFile } = useEditor(projectId);
  const activeFile = useFile(activeTabId);
  const updateFile = useUpdateFile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId; // A file is allowed to be empty

  const codeSymbols = ["{ }", "<>", "()", "</>", "[]"];

  const [particles] = useState(() =>
    Array.from({ length: 3 }).map(() => ({
      left: Math.random() * 100,
      duration: 10 + Math.random() * 6,
      delay: Math.random() * 6,
      symbol: codeSymbols[Math.floor(Math.random() * codeSymbols.length)],
    })),
  );

  // Cleaning up pending debounced updates on unmount or file change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeTabId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>

      {activeTabId && <FileBreadcrumbs projectId={projectId} />}

      <div className="min-h-0 flex-1 bg-background">
        {/* EMPTY STATE */}
        {!activeFile && (
          <div className="relative flex size-full items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/10">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* Floating code particles */}
            {particles.map((p, i) => (
              <motion.span
                key={i}
                className="absolute font-mono text-xs text-muted-foreground/20"
                style={{
                  left: `${p.left}%`,
                  top: "-10px",
                }}
                animate={{
                  y: ["0vh", "70vh"],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {p.symbol}
              </motion.span>
            ))}

            {/* Main content */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="
                flex flex-col items-center
                rounded-3xl
                border border-border/50
                bg-card/20
                px-10 py-8
                backdrop-blur-sm
              "
            >
              <div className="flex items-center">
                <Image
                  src="/logo-alt.svg"
                  alt="Curate"
                  width={50}
                  height={50}
                  className="opacity-35"
                />

                <span
                  className={cn(
                    font.className,
                    "flex items-center text-3xl font-semibold text-foreground/80 md:text-4xl",
                  )}
                >
                  urate
                </span>
              </div>

              <div className="mt-6 space-y-1 text-center">
                <p className="text-sm text-muted-foreground">
                  Open a file from the explorer to begin editing
                </p>

                <p className="text-xs text-muted-foreground/70">
                  Click to preview • Double-click to pin
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* TEXT EDITOR - You can use Ctrl + F for the search feature*/}
        {isActiveFileText && (
          <CodeEditor
            key={activeFile._id}
            fileName={activeFile.name}
            initialValue={activeFile.content}
            onChange={(content: string) => {
              if (previewTabId === activeFile._id) {
                openFile(activeFile._id, { pinned: true });
              }

              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              timeoutRef.current = setTimeout(() => {
                updateFile({
                  id: activeFile._id,
                  content,
                });
              }, DEBOUNCE_MS);
            }}
          />
        )}
        {/* BINARY FILE MESSAGE */}
        {isActiveFileBinary && (
          <div className="flex size-full items-center justify-center">
            <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <AlertTriangleIcon className="size-10 text-amber-500" />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    This file can&apos;t be previewed in the editor.
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Binary file or unsupported encoding detected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
