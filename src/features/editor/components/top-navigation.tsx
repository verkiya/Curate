import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useFile } from "@/features/projects/hooks/use-files";
import { useEditor } from "../hooks/use-editor";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { FileIcon } from "@react-symbols/icons/utils";
import { PinIcon, XIcon } from "lucide-react";

const Tab = ({
  fileId,
  isFirst,
  projectId,
}: {
  fileId: Id<"files">;
  isFirst: boolean;
  projectId: Id<"projects">;
}) => {
  const file = useFile(fileId);
  const { activeTabId, previewTabId, setActiveTab, openFile, closeTab } =
    useEditor(projectId);

  const isActive = activeTabId === fileId;
  const isPreview = previewTabId === fileId;
  const fileName = file?.name ?? "Loading...";

  return (
    <div
      onClick={() => setActiveTab(fileId)}
      onDoubleClick={() => openFile(fileId, { pinned: true })}
      className={cn(
        "group flex h-8.5 cursor-pointer select-none items-center gap-2 border-x border-y border-transparent px-3 text-muted-foreground transition-colors duration-150",
        "hover:bg-accent/40",
        isActive &&
          " border-x-border border-b-background bg-background text-foreground -mb-px shadow-[inset_0_3px_0_hsl(var(--primary))]",
        isFirst && "border-l-transparent!",
      )}
    >
      {file === undefined ? (
        <div className="size-4 animate-pulse rounded bg-muted" />
      ) : (
        <FileIcon
          fileName={fileName}
          autoAssign
          className="size-4 shrink-0"
        />
      )}

      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "whitespace-nowrap text-sm",
            isPreview && "italic",
          )}
        >
          {fileName}
        </span>

        {isPreview ? (
          <div className="size-1.5 shrink-0 animate-pulse rounded-full bg-yellow-400" />
        ) : (
          <PinIcon className="size-3 shrink-0 rotate-12 text-muted-foreground" />
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          closeTab(fileId);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            closeTab(fileId);
          }
        }}
        className={cn(
          "rounded-sm p-0.5 opacity-0 transition-all duration-150 hover:scale-105 hover:bg-accent/70 group-hover:opacity-100",
          isActive && "opacity-100",
        )}
      >
        <XIcon className="size-3.5 text-red-300" />
      </button>
    </div>
  );
};

export const TopNavigation = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const { openTabs } = useEditor(projectId);

  return (
    <ScrollArea className="flex-1 overflow-hidden">
      <nav className="flex h-8.75 items-center border-b bg-sidebar/95 backdrop-blur-xl">
        {openTabs.length === 0 ? (
          <div className="px-4 text-xs text-muted-foreground">
            Open a file to begin editing
          </div>
        ) : (
          openTabs.map((fileId, index) => (
            <Tab
              key={fileId}
              fileId={fileId}
              isFirst={index === 0}
              projectId={projectId}
            />
          ))
        )}
      </nav>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
