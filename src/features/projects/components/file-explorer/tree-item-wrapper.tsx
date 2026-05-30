import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuShortcut,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

import { getItemPadding } from "./constants";
import { Doc } from "../../../../../convex/_generated/dataModel";

export const TreeItemWrapper = ({
  item,
  children,
  level,
  isActive,
  onClick,
  onDoubleClick,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
}: {
  item: Doc<"files">;
  children: React.ReactNode;
  level: number;
  isActive?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onKeyDown={(e) => {
            if (e.key === "F2") {
              e.preventDefault();
              onRename?.();
            }

            if (e.key === "Delete") {
              e.preventDefault();
              onDelete?.();
            }
          }}
          className={cn(
            "group flex h-8 w-full cursor-pointer items-center gap-1 transition-colors duration-150",
            "hover:bg-accent/40",
            "focus-visible:bg-accent/40 focus-visible:outline-none",
            isActive &&
              "bg-primary/10 text-foreground shadow-[inset_3px_0_0_hsl(var(--primary))]",
          )}
          style={{ paddingLeft: getItemPadding(level, item.type === "file") }}
        >
          {children}
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-60 rounded-xl border-border bg-popover/95 backdrop-blur-xl"
      >
        {item.type === "folder" && (
          <>
            <ContextMenuItem onClick={onCreateFile} className="text-sm">
              New File
            </ContextMenuItem>

            <ContextMenuItem onClick={onCreateFolder} className="text-sm">
              New Folder
            </ContextMenuItem>

            <ContextMenuSeparator />
          </>
        )}

        <ContextMenuItem onClick={onRename} className="text-sm">
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onDelete}
          className="text-sm text-red-400 focus:text-red-400
          "
        >
          Delete Permanently
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
