"use client";

import { Poppins } from "next/font/google";
import { SquareTerminalIcon, SparklesIcon, CreditCard } from "lucide-react";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

import { ProjectsList } from "./projects-list";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import Image from "next/image";
import { ImportGithubDialog } from "./import-github-dialog";
import { NewProjectDialog } from "./new-project-dialog";
import { ProjectLearningsButton } from "./project-learnings-button";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const ProjectsView = () => {
  const { user } = useUser();
  const { has } = useAuth();
  const isPro =
    user?.publicMetadata?.plan === "pro" ||
    user?.publicMetadata?.stripeSubscriptionStatus === "active" ||
    user?.publicMetadata?.pro === true ||
    // @ts-ignore - Check for Clerk Billing plans/features
    has?.({ plan: "pro" }) ||
    // @ts-ignore
    has?.({ feature: "pro" }) ||
    has?.({ permission: "pro" }) ||
    has?.({ role: "pro" });
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCommandDialogOpen(true);
        }

        if (e.key === "i") {
          e.preventDefault();
          setImportDialogOpen(true);
        }

        if (e.key === "j") {
          e.preventDefault();
          setNewProjectDialogOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDialog
        open={commandDialogOpen}
        onOpenChange={setCommandDialogOpen}
      />

      <ImportGithubDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-sidebar p-6 md:p-16">
        <div className="fixed right-4 top-4 z-50 flex items-center gap-4 md:right-6 md:top-6">
          <Link
            href="/billing"
            className={cn(
              "hidden sm:flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-300 ring-1 ring-inset",
              isPro
                ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:ring-cyan-500/50 hover:from-blue-500/20 hover:to-cyan-500/20 backdrop-blur-md"
                : "bg-background/50 ring-border text-muted-foreground hover:bg-accent hover:text-foreground backdrop-blur-sm",
            )}
          >
            <CreditCard
              className={cn("size-4", isPro ? "text-cyan-400" : "opacity-70")}
            />
            <span
              className={cn(
                "font-medium",
                isPro
                  ? "font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300"
                  : "",
              )}
            >
              {isPro ? "Curate Pro" : "Curate Free"}
            </span>
          </Link>

          <UserButton
            appearance={{
              elements: {
                avatarBox:
                  "size-14 rounded-md bg-card shadow-lg hover:scale-110 transition-transform",
                userButtonPopoverCard:
                  "border border-border bg-card shadow-2xl",
              },
            }}
          />
        </div>

        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl"
            animate={{
              x: [-100, 100, -100],
              y: [-50, 50, -50],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl"
            animate={{
              x: [100, -100, 100],
              y: [50, -50, 50],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-5">
          <div className="flex w-full items-center justify-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
                filter: [
                  "brightness(1.05)",
                  "brightness(1.12)",
                  "brightness(1.05)",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/curate.svg"
                alt="Curate"
                width={40}
                height={40}
                className="brightness-110 contrast-125 md:size-18"
              />
            </motion.div>

            <h1
              className={cn(
                "text-6xl font-semibold tracking-tight",
                font.className,
              )}
            >
              Curate
            </h1>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-primary/90">
              AI-native development workspace
            </p>
          </div>

          <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setNewProjectDialogOpen(true)}
                className="
flex h-full flex-col items-start justify-start gap-6
rounded-xl p-4
bg-gradient-to-br from-primary/90 via-primary/80 to-cyan-500/80
text-primary-foreground
transition-all duration-200
hover:-translate-y-1
hover:shadow-lg hover:shadow-primary/20
hover:from-primary hover:via-primary/90 hover:to-cyan-400
hover:brightness-110
"
              >
                <div className="flex w-full items-center justify-between">
                  <SquareTerminalIcon className="size-4" />

                  <Kbd className="border uppercase">CTRL+J</Kbd>
                </div>

                <span className="text-sm">New Project</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="flex h-full flex-col items-start justify-start gap-6 rounded-xl bg-background p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex w-full items-center justify-between">
                  <FaGithub className="size-4" />

                  <Kbd className="border bg-accent uppercase">CTRL+I</Kbd>
                </div>

                <span className="text-sm">GitHub Import</span>
              </Button>
            </div>

            <ProjectsList onViewAll={() => setCommandDialogOpen(true)} />
          </div>

          <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
            <div className="w-[calc(100vw-3rem)] max-w-md rounded-2xl bg-sidebar/80 backdrop-blur-md">
              <ProjectLearningsButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
