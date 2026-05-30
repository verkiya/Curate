import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";

import { Doc } from "../../../../convex/_generated/dataModel";

import { useProjectsPartial } from "../hooks/use-projects";
import { CubeLoader } from "./cube-loader";

const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  });
};

const getProjectIcon = (project: Doc<"projects">) => {
  if (project.importStatus === "completed") {
    return <FaGithub className="size-3.5 text-muted-foreground" />;
  }

  if (project.importStatus === "failed") {
    return <AlertTriangleIcon className="size-3.5 text-destructive" />;
  }

  if (project.importStatus === "importing") {
    return <Loader2Icon className="size-3.5 animate-spin text-primary" />;
  }

  return <SparklesIcon className="size-3.5 text-cyan-400" />;
};

interface ProjectsListProps {
  onViewAll: () => void;
}

const ContinueCard = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-primary/80">
        Last updated
      </span>

      <Button
        variant="outline"
        asChild
        className="
          h-auto flex-col items-start justify-start gap-2
          rounded-xl border-primary/20 bg-background p-4
          transition-all duration-200
          hover:border-primary/40
          hover:shadow-md
        "
      >
        <Link href={`/projects/${data._id}`} className="group">
          <div className="flex w-full items-center justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                {getProjectIcon(data)}

                <span className="truncate font-medium">{data.name}</span>
              </div>

              <span className="text-xs text-muted-foreground">
                {formatTimestamp(data.updatedAt)}
              </span>
            </div>

            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </Button>
    </div>
  );
};

const ProjectItem = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <Link
      href={`/projects/${data._id}`}
      className="
        group flex w-full items-center justify-between
        rounded-md px-2 py-2
        text-sm font-medium text-foreground/60
        transition-all duration-200
        hover:bg-accent/40
        hover:text-foreground
      "
    >
      <div className="flex items-center gap-2">
        {getProjectIcon(data)}

        <span className="truncate">{data.name}</span>
      </div>

      <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/60">
        {formatTimestamp(data.updatedAt)}
      </span>
    </Link>
  );
};

export const ProjectsList = ({ onViewAll }: ProjectsListProps) => {
  const projects = useProjectsPartial(5);
  // In Convex, any query being undefined is still in loading state otherwise it'll be null or empty array, if it doesn't exist
  if (projects === undefined) {
    return <CubeLoader />;
  }

  const [mostRecent, ...rest] = projects;

  return (
    <div className="flex flex-col gap-4">
      {mostRecent ? <ContinueCard data={mostRecent} /> : null}

      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Continue working ({rest.length})
            </span>

            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>View all</span>

              <Kbd className="border bg-accent uppercase">CTRL+K</Kbd>
            </button>
          </div>

          <ul className="flex flex-col">
            {rest.map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
