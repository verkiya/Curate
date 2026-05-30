/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Allotment } from "allotment";

import { Navbar } from "./navbar";
import { Id } from "../../../../convex/_generated/dataModel";
import { ConversationSidebar } from "@/features/conversations/components/conversation-sidebar";


const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 700;
const MIN_EDITOR_WIDTH = 600;

const DEFAULT_CONVERSATION_SIDEBAR_WIDTH = 320;
const DEFAULT_MAIN_SIZE = 1180;

const SIDEBAR_WIDTH_STORAGE_KEY = "curate:sidebar-width";

export const ProjectIdLayout = ({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: Id<"projects">;
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(
    DEFAULT_CONVERSATION_SIDEBAR_WIDTH,
  );

  useEffect(() => {
    const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);

    if (!savedWidth) return;

    const parsedWidth = Number(savedWidth);

    if (
      !Number.isNaN(parsedWidth) &&
      parsedWidth >= MIN_SIDEBAR_WIDTH &&
      parsedWidth <= MAX_SIDEBAR_WIDTH
    ) {
      setSidebarWidth(parsedWidth);
    }
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col bg-background text-foreground">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="absolute bottom-20 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/6 blur-3xl" />
      </div>

      <Navbar projectId={projectId} />

      <div className="flex-1 overflow-hidden border-t border-border bg-muted/10">
        <Allotment
          className="flex-1"
          defaultSizes={[sidebarWidth, DEFAULT_MAIN_SIZE]}
          onChange={(sizes) => {
            const width = sizes[0];

            if (typeof width === "number") {
              localStorage.setItem(
                SIDEBAR_WIDTH_STORAGE_KEY,
                String(Math.round(width)),
              );
            }
          }}
        >
          <Allotment.Pane
            snap={false}
            minSize={MIN_SIDEBAR_WIDTH}
            maxSize={MAX_SIDEBAR_WIDTH}
            preferredSize={sidebarWidth}
          >
            <div
              className="
                h-full
                border-r
                border-border
                bg-sidebar/70
                backdrop-blur-xl
                shadow-[1px_0_0_hsl(var(--border)),8px_0_40px_rgba(0,0,0,0.12)]
              "
            >
              <ConversationSidebar projectId={projectId} />
            </div>
          </Allotment.Pane>

          <Allotment.Pane
            snap={false}
            minSize={MIN_EDITOR_WIDTH}
          >
            <div className="relative h-full bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              {children}
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
};
