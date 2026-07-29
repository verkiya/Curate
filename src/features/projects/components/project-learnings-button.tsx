"use client";

import Link from "next/link";
import { BrainIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ProjectLearningsButton = () => {
  return (
    <Button
      asChild
      variant="outline"
      className="w-full rounded-none border bg-background px-4 py-6 text-sm hover:bg-accent"
    >
      <Link href="/learnings" className="w-full" target="_blank">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainIcon className="size-4" />
            <span>What I Learned Building Curate</span>
          </div>

          <span className="text-xs text-muted-foreground">Read →</span>
        </div>
      </Link>
    </Button>
  );
};
