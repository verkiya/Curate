"use client";

import { useState } from "react";
import {
  ChevronRightIcon,
  CopyMinusIcon,
  FilePlusCornerIcon,
  FolderPlusIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useProject } from "../../hooks/use-projects";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  useCreateFile,
  useCreateFolder,
  useFolderContents,
} from "../../hooks/use-files";
import { CreateInput } from "./create-input";
import { LoadingRow } from "./loading-row";
import { Tree } from "./tree";

export const FileExplorer = ({ projectId }: { projectId: Id<"projects"> }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [collapseKey, setCollapseKey] = useState(0);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);

  const project = useProject(projectId);

  const rootFiles = useFolderContents({
    projectId,
    enabled: isOpen,
  });

  const createFile = useCreateFile();
  const createFolder = useCreateFolder();

  const handleCreate = (name: string) => {
    setCreating(null);

    if (creating === "file") {
      createFile({
        projectId,
        name,
        content: "",
        parentId: undefined,
      });
    } else {
      createFolder({
        projectId,
        name,
        parentId: undefined,
      });
    }
  };

  return (
    <div className="h-full bg-sidebar/85 backdrop-blur-xl">
      <ScrollArea className="h-full">
        <div className="sticky top-0 z-10 border-b border-border bg-sidebar/95 shadow-[0_1px_0_hsl(var(--border))] backdrop-blur-xl">
          <div
            role="button"
            onClick={() => setIsOpen((value) => !value)}
            className="group/project flex h-10 w-full cursor-pointer items-center gap-1 px-2 text-left transition hover:bg-accent/30"
          >
            <ChevronRightIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
                isOpen && "rotate-90",
              )}
            />

            {project ? (
              <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
                {project.name}
              </p>
            ) : (
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            )}

            <div className="ml-auto flex items-center gap-1 opacity-70 transition-opacity duration-150 group-hover/project:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsOpen(true);
                      setCreating("file");
                    }}
                    variant="highlight"
                    size="icon-xs"
                    className="size-7 rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  >
                    <FilePlusCornerIcon className="size-4" />
                  </Button>
                </TooltipTrigger>

                <TooltipContent side="bottom">Add file</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsOpen(true);
                      setCreating("folder");
                    }}
                    variant="highlight"
                    size="icon-xs"
                    className="size-7 rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  >
                    <FolderPlusIcon className="size-4" />
                  </Button>
                </TooltipTrigger>

                <TooltipContent side="bottom">Add folder</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCollapseKey((prev) => prev + 1);
                    }}
                    variant="highlight"
                    size="icon-xs"
                    className="size-7 rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  >
                    <CopyMinusIcon className="size-4" />
                  </Button>
                </TooltipTrigger>

                <TooltipContent side="bottom">Collapse all</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="py-1">
          {isOpen && (
            <>
              {rootFiles === undefined && <LoadingRow level={0} />}

              {creating && (
                <CreateInput
                  type={creating}
                  level={0}
                  onSubmit={handleCreate}
                  onCancel={() => setCreating(null)}
                />
              )}

              {rootFiles?.length === 0 && !creating && (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                  <p className="text-xs font-medium text-muted-foreground">
                    Empty workspace
                  </p>

                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    Create a file or folder to get started
                  </p>
                </div>
              )}

              {rootFiles?.map((item) => (
                <Tree
                  key={`${item._id}-${collapseKey}`}
                  item={item}
                  level={0}
                  projectId={projectId}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
