"use client";

import { useEffect, useState } from "react";
import ky from "ky";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

import { cn } from "@/lib/utils";

import { Id } from "../../../../convex/_generated/dataModel";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PromptDifficulty = "easy" | "moderate";

type PromptExample = {
  id: string;
  label: string;
  difficulty: PromptDifficulty;
  prompt: string;
};

const PROMPT_PLACEHOLDER =
  "I need a Vite + React pomodoro timer with start, pause, and reset—show minutes and seconds in a large circular display...";

const PROMPT_EXAMPLES: PromptExample[] = [
  {
    id: "todo-app",
    label: "Todo app",
    difficulty: "easy",
    prompt:
      "Create a Vite + React todo app. Users can add tasks, mark them complete, and delete them. Persist todos in localStorage. Use a simple, clean layout with a header and task list.",
  },
  {
    id: "landing-page",
    label: "Landing page",
    difficulty: "easy",
    prompt:
      "Build a static product landing page with HTML, CSS, and vanilla JS. Include a hero, three feature cards, social proof quotes, and a footer. Style it with Tailwind via CDN and make it responsive.",
  },
  {
    id: "calculator",
    label: "Calculator",
    difficulty: "easy",
    prompt:
      "Build a Vite + React calculator with add, subtract, multiply, and divide. Include clear and equals buttons in a responsive grid layout. Show the current expression and result at the top.",
  },
  {
    id: "expense-tracker",
    label: "Expense tracker",
    difficulty: "moderate",
    prompt:
      "Build a Vite + React expense tracker. Let users log expenses with title, amount, category, and date. Show a running total, filter by category, and persist data in localStorage. Use separate components for the form and expense list.",
  },
  {
    id: "kanban-board",
    label: "Kanban board",
    difficulty: "moderate",
    prompt:
      "Create a Vite + React kanban board with three columns: To Do, In Progress, and Done. Users can add cards and move them between columns with buttons (no drag-and-drop). Store the board in localStorage.",
  },
  {
    id: "notes-app",
    label: "Notes app",
    difficulty: "moderate",
    prompt:
      "Build a Vite + React notes app with a sidebar of note titles, a text editor, and a save button. Let users create, select, edit, and delete notes. Persist all notes in localStorage.",
  },
];

const EXAMPLE_GROUPS: { difficulty: PromptDifficulty; title: string }[] = [
  { difficulty: "easy", title: "Easy" },
  { difficulty: "moderate", title: "Moderate" },
];

const difficultyChipClass: Record<PromptDifficulty, string> = {
  easy: "border-cyan-500/20 hover:border-cyan-500/35 hover:bg-cyan-500/5",
  moderate:
    "border-violet-500/20 hover:border-violet-500/35 hover:bg-violet-500/5",
};

export const NewProjectDialog = ({
  open,
  onOpenChange,
}: NewProjectDialogProps) => {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setInput("");
    }
  }, [open]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text) return;

    setIsSubmitting(true);

    try {
      const { projectId } = await ky
        .post("/api/projects/create-with-prompt", {
          json: {
            prompt: message.text.trim(),
          },
        })
        .json<{ projectId: Id<"projects"> }>();

      toast.success("Project created");

      onOpenChange(false);
      setInput("");

      router.push(`/projects/${projectId}`);
    } catch {
      toast.error("Unable to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="bg-gradient-to-b from-muted/40 to-transparent">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="text-xl">
              What do you want to build?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-6 pb-4">
            {EXAMPLE_GROUPS.map((group) => (
              <div key={group.difficulty}>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>

                <div className="flex flex-wrap gap-2">
                  {PROMPT_EXAMPLES.filter(
                    (example) => example.difficulty === group.difficulty,
                  ).map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      onClick={() =>
                        setInput((current) =>
                          current === example.prompt ? "" : example.prompt,
                        )
                      }
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs transition-colors",
                        input === example.prompt
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                        difficultyChipClass[example.difficulty],
                      )}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <PromptInput
          onSubmit={handleSubmit}
          className="rounded-none border-none"
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder={PROMPT_PLACEHOLDER}
              onChange={(e) => setInput(e.target.value)}
              value={input}
              disabled={isSubmitting}
              className="min-h-[140px]"
            />
          </PromptInputBody>

          <PromptInputFooter>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Press Enter to create</span>
            </div>

            <div className="flex items-center gap-2">
              <PromptInputButton
                tooltip="Clear"
                aria-label="Clear prompt"
                variant="secondary"
                onClick={() => setInput("")}
                disabled={!input || isSubmitting}
              >
                <XIcon className="size-4" />
              </PromptInputButton>

              <PromptInputSubmit disabled={!input || isSubmitting}>
                {isSubmitting ? "Creating..." : undefined}
              </PromptInputSubmit>
            </div>
          </PromptInputFooter>
        </PromptInput>
      </DialogContent>
    </Dialog>
  );
};
