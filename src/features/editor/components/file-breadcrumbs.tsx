import React from "react";
import { FileIcon } from "@react-symbols/icons/utils";

import { useFilePath } from "@/features/projects/hooks/use-files";
import { useEditor } from "@/features/editor/hooks/use-editor";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Id } from "../../../../convex/_generated/dataModel";

export const FileBreadcrumbs = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const { activeTabId } = useEditor(projectId);
  const filePath = useFilePath(activeTabId);

  if (!filePath || !activeTabId) {
    return (
      <div className="border-b border-border/80 bg-background/95 px-4 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-pulse rounded bg-muted/80" />
          <div className="h-3 w-48 animate-pulse rounded bg-muted/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/80 bg-background/95 px-4 py-2 backdrop-blur-xl">
      <div className="overflow-hidden">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden">
            {filePath.map((item, index) => {
              const isLast = index === filePath.length - 1;

              return (
                <React.Fragment key={item._id}>
                  <BreadcrumbItem className="min-w-0 text-xs">
                    {isLast ? (
                      <BreadcrumbPage
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-1
                          rounded-md
                          bg-primary/5
                          px-1.5
                          py-0.5
                          font-semibold
                          text-foreground
                          transition-colors
                          duration-150
                          hover:bg-accent/20
                        "
                      >
                        <FileIcon
                          fileName={item.name}
                          autoAssign
                          className="size-4 shrink-0"
                        />

                        <span className="truncate">{item.name}</span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbPage
                        className="
                          truncate
                          rounded-md
                          px-1.5
                          py-0.5
                          text-muted-foreground
                          transition-colors
                          duration-150
                          hover:bg-accent/40
                          hover:text-foreground
                        "
                      >
                        {item.name}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>

                  {!isLast && (
                    <BreadcrumbSeparator className="shrink-0 text-muted-foreground/70" />
                  )}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};
