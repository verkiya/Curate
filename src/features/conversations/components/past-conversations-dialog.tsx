"use client";

import { formatDistanceToNow } from "date-fns";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useConversations } from "../hooks/use-conversations";
import { Id } from "../../../../convex/_generated/dataModel";

interface PastConversationsDialogProps {
  projectId: Id<"projects">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (conversationId: Id<"conversations">) => void;
}

export const PastConversationsDialog = ({
  projectId,
  open,
  onOpenChange,
  onSelect,
}: PastConversationsDialogProps) => {
  const conversations = useConversations(projectId);

  const handleSelect = (conversationId: Id<"conversations">) => {
    onSelect(conversationId);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Past Conversations"
      description="Search previous conversations in this project"
    >
      <CommandInput placeholder="Search conversations..." />

      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center">
            <p className="text-sm font-medium">No conversations found</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Start a conversation to see it here.
            </p>
          </div>
        </CommandEmpty>

        <CommandGroup heading={`Conversations (${conversations?.length ?? 0})`}>
          {conversations?.map((conversation) => (
            <CommandItem
              key={conversation._id}
              value={`${conversation.title} ${conversation._id}`}
              onSelect={() => handleSelect(conversation._id)}
              className="cursor-pointer py-2"
            >
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="truncate font-medium">
                  {conversation.title}
                </span>

                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(conversation._creationTime, {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
