"use client";

import { useState } from "react";
import { Allotment } from "allotment";

import { cn } from "@/lib/utils";
import { EditorView } from "@/features/editor/components/editor-view";

import { FileExplorer } from "./file-explorer";
import { Id } from "../../../../convex/_generated/dataModel";
import { PreviewView } from "./preview-view";
import { ExportPopover } from "./export-popover";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const MIN_EDITOR_WIDTH = 600;

const DEFAULT_SIDEBAR_WIDTH = 350;
const DEFAULT_MAIN_SIZE = 1000;

const Tab = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex h-full items-center gap-2 border-r border-border px-4 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        isActive &&
          "bg-background text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary",
      )}
    >
      <span>{label}</span>
    </button>
  );
};

export const ProjectIdView = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");

  return (
    <div className="flex h-full flex-col">
      <nav className="flex h-9 items-center border-b border-border bg-sidebar/70 backdrop-blur-xl">
        <Tab
          label="Code"
          isActive={activeView === "editor"}
          onClick={() => setActiveView("editor")}
        />

        <Tab
          label="Preview"
          isActive={activeView === "preview"}
          onClick={() => setActiveView("preview")}
        />

        <div className="ml-4 hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
          <div className="size-2 rounded-full animate-pulse bg-cyan-400" />
          <span>Live preview enabled</span>
        </div>

        <div className="ml-auto flex h-full items-center border-l border-border pl-3 pr-2">
          <ExportPopover projectId={projectId} />
        </div>
      </nav>

      <div className="relative flex-1">
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            activeView === "editor"
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <Allotment
            defaultSizes={[DEFAULT_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}
          >
            <Allotment.Pane
              snap={false}
              minSize={MIN_SIDEBAR_WIDTH}
              maxSize={MAX_SIDEBAR_WIDTH}
              preferredSize={DEFAULT_SIDEBAR_WIDTH}
            >
              <div className="h-full border-r border-border bg-sidebar/40">
                <FileExplorer projectId={projectId} />
              </div>
            </Allotment.Pane>

            <Allotment.Pane
              snap={false}
              minSize={MIN_EDITOR_WIDTH}
            >
              <div className="h-full bg-background">
                <EditorView projectId={projectId} />
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>

        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            activeView === "preview"
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <PreviewView projectId={projectId} />
        </div>
      </div>
    </div>
  );
};
