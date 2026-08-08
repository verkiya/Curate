"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import {
  AlertTriangleIcon,
  CloudCheckIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import { formatDistanceToNow } from "date-fns";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  useProject,
  useRenameProject,
  useRemoveProject,
} from "../hooks/use-projects";

type WorkspaceStatusVariant =
  "loading" | "busy" | "error" | "warning" | "imported" | "ready";

type WorkspaceStatus = {
  label: string;
  tooltip: string;
  variant: WorkspaceStatusVariant;
  showSpinner: boolean;
};

const savedTooltip = (updatedAt: number | undefined) =>
  updatedAt
    ? `Saved ${formatDistanceToNow(updatedAt, { addSuffix: true })}`
    : "Loading...";

/** Maps schema importStatus / exportStatus to navbar badge + icon. */
const getWorkspaceStatus = (
  project: Doc<"projects"> | null | undefined,
): WorkspaceStatus => {
  if (!project) {
    return {
      label: "Loading",
      tooltip: "Loading project...",
      variant: "loading",
      showSpinner: false,
    };
  }

  const { importStatus, exportStatus, exportRepoUrl, updatedAt } = project;

  if (importStatus === "importing") {
    return {
      label: "Importing",
      tooltip: "Importing project from GitHub...",
      variant: "busy",
      showSpinner: true,
    };
  }

  if (importStatus === "failed") {
    return {
      label: "Import failed",
      tooltip: "GitHub import failed. Try importing the repository again.",
      variant: "error",
      showSpinner: false,
    };
  }

  if (exportStatus === "exporting") {
    return {
      label: "Exporting",
      tooltip: "Exporting project to GitHub...",
      variant: "busy",
      showSpinner: true,
    };
  }

  if (exportStatus === "failed") {
    return {
      label: "Export failed",
      tooltip: "GitHub export failed. Open export to retry.",
      variant: "error",
      showSpinner: false,
    };
  }

  if (exportStatus === "cancelled") {
    return {
      label: "Export cancelled",
      tooltip: "GitHub export was cancelled.",
      variant: "warning",
      showSpinner: false,
    };
  }

  if (exportStatus === "completed") {
    return {
      label: "Exported",
      tooltip: exportRepoUrl
        ? `Exported to GitHub. ${savedTooltip(updatedAt)}`
        : `Export completed. ${savedTooltip(updatedAt)}`,
      variant: "imported",
      showSpinner: false,
    };
  }

  if (importStatus === "completed") {
    return {
      label: "Imported",
      tooltip: `Imported from GitHub. ${savedTooltip(updatedAt)}`,
      variant: "imported",
      showSpinner: false,
    };
  }

  return {
    label: "Ready",
    tooltip: savedTooltip(updatedAt),
    variant: "ready",
    showSpinner: false,
  };
};

const badgeClassByVariant: Record<WorkspaceStatusVariant, string> = {
  loading: "border-border/60 bg-muted/40 text-muted-foreground",
  busy: "border-primary/20 bg-primary/10 text-primary",
  error: "border-destructive/25 bg-destructive/10 text-destructive",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  imported: "border-border/60 bg-muted/40 text-muted-foreground",
  ready: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
};

const WorkspaceStatusIcon = ({ status }: { status: WorkspaceStatus }) => {
  if (status.showSpinner) {
    return <Loader2Icon className="size-4 animate-spin text-primary" />;
  }

  if (status.variant === "error" || status.variant === "warning") {
    return (
      <AlertTriangleIcon
        className={cn(
          "size-4",
          status.variant === "error" ? "text-destructive" : "text-amber-500",
        )}
      />
    );
  }

  if (status.variant === "imported" && status.label === "Imported") {
    return <FaGithub className="size-3.5 text-muted-foreground" />;
  }

  if (status.variant === "imported") {
    return <CloudCheckIcon className="size-4 text-muted-foreground" />;
  }

  return <CloudCheckIcon className="size-4 text-cyan-400" />;
};

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const Navbar = ({ projectId }: { projectId: Id<"projects"> }) => {
  const router = useRouter();
  const project = useProject(projectId);
  const renameProject = useRenameProject();
  const removeProject = useRemoveProject();

  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  const handleStartRename = () => {
    if (!project) return;

    setName(project.name);
    setIsRenaming(true);
  };

  const handleSubmit = () => {
    if (!project) return;

    setIsRenaming(false);

    const trimmedName = name.trim();

    if (!trimmedName || trimmedName === project.name) return;

    renameProject({
      id: projectId,
      name: trimmedName,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
    }
  };

  const handleRemove = () => {
    setIsRemoving(true);

    // Redirect immediately to avoid reactive queries crashing the project page
    router.push("/");

    // Fire off the delete async
    removeProject({ id: projectId })
      .catch((error) => {
        console.error("Failed to delete project:", error);
      })
      .finally(() => {
        setIsRemoving(false);
      });
  };

  const workspaceStatus = getWorkspaceStatus(project);

  return (
    <nav className="flex h-12 items-center justify-between gap-x-2 border-b border-border/80 bg-sidebar/70 px-4 backdrop-blur-xl shadow-[0_1px_0_hsl(var(--border))]">
      <div className="flex items-center gap-x-2">
        <Breadcrumb>
          <BreadcrumbList className="gap-1!">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  className="h-8! w-fit! p-1.5!  "
                  asChild
                >
                  <Link href="/">
                    <Image
                      src="/curate.svg"
                      alt="Curate logo"
                      width={20}
                      height={20}
                    />

                    <span
                      className={cn(
                        "text-sm font-semibold tracking-tight",
                        font.className,
                      )}
                    >
                      Curate
                    </span>
                  </Link>
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator className="ml-0! mr-1" />

            <BreadcrumbItem>
              {isRenaming ? (
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={handleSubmit}
                  onKeyDown={handleKeyDown}
                  className="
                    h-7
                    w-56
                    rounded-md
                    border
                    border-border
                    bg-card
                    px-3
                    text-sm
                    font-medium
                    text-foreground
                    shadow-sm
                    outline-none
                    transition
                    placeholder:text-muted-foreground
                    focus:border-primary/40
                    focus:ring-2
                    focus:ring-primary/15
                  "
                />
              ) : (
                <BreadcrumbPage
                  onClick={handleStartRename}
                  className="
                    max-w-48
                    cursor-pointer
                    truncate
                    rounded-md
                    px-2
                    py-1
                    text-sm
                    font-medium
                    transition
                    hover:bg-accent/70
                    hover:text-foreground
                  "
                >
                  {project?.name ?? "Loading..."}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              badgeClassByVariant[workspaceStatus.variant],
            )}
          >
            {workspaceStatus.label}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-5 w-5 items-center justify-center">
              <WorkspaceStatusIcon status={workspaceStatus} />
            </div>
          </TooltipTrigger>

          <TooltipContent>{workspaceStatus.tooltip}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this project? This action cannot
                be undone and all files and conversations will be permanently
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemove}
                disabled={isRemoving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRemoving ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <UserButton
          appearance={{
            elements: {
              avatarBox:
                "size-9! rounded-lg bg-card shadow-sm transition hover:scale-105 hover:shadow-md",
              userButtonPopoverCard: "bg-card rounded-xl shadow-2xl",
              userButtonPopoverActionButton: "transition hover:bg-accent",
              userButtonPopoverFooter: "hidden",
            },
          }}
        />
      </div>
    </nav>
  );
};
