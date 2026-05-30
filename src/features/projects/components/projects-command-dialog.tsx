import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import {
  AlertCircleIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useProjects } from "../hooks/use-projects";
import { Doc } from "../../../../convex/_generated/dataModel";

interface ProjectsCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getProjectIcon = (project: Doc<"projects">) => {
  if (project.importStatus === "completed") {
    return <FaGithub className="size-4 text-muted-foreground" />;
  }

  if (project.importStatus === "failed") {
    return <AlertCircleIcon className="size-4 text-destructive" />;
  }

  if (project.importStatus === "importing") {
    return (
      <Loader2Icon className="size-4 animate-spin text-primary" />
    );
  }

  return <SparklesIcon className="size-4 text-cyan-400" />;
};

const getProjectStatus = (project: Doc<"projects">) => {
  if (project.importStatus === "completed") {
    return "GitHub";
  }

  if (project.importStatus === "failed") {
    return "Failed";
  }

  if (project.importStatus === "importing") {
    return "Importing";
  }

  return "Local";
};

export const ProjectsCommandDialog = ({
  open,
  onOpenChange,
}: ProjectsCommandDialogProps) => {
  const router = useRouter();
  const projects = useProjects();

  const handleSelect = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Projects"
      description="Search and navigate to your projects"
    >
      <CommandInput placeholder="Jump to a project..." />

      <CommandList>
        <CommandEmpty>
          No matching projects found.
        </CommandEmpty>

        <CommandGroup
          heading={`Projects (${projects?.length ?? 0})`}
        >
          {projects?.map((project) => (
            <CommandItem
              key={project._id}
              value={`${project.name}-${project._id}`}
              onSelect={() => handleSelect(project._id)}
              className="gap-3"
            >
              {getProjectIcon(project)}

              <span className="flex-1 truncate">
                {project.name}
              </span>

              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {getProjectStatus(project)}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
