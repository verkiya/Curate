/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Poppins } from "next/font/google";
import { BotIcon, CloudIcon, GitBranchIcon, ZapIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ProjectLearningsButton } from "@/features/projects/components/project-learnings-button";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CHARS = "01アイウエオカキクケコABCDEF{}[]<>/\\";

const CodeStream = ({ x, delay }: { x: string; delay: number }) => {
  const [chars, setChars] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const generate = () =>
      Array.from(
        { length: 12 },
        () => CHARS[Math.floor(Math.random() * CHARS.length)],
      );
    setChars(generate());
    const interval = setInterval(
      () => {
        setChars((prev) => {
          const next = [...prev];
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
          return next;
        });
      },
      shouldReduceMotion ? 800 : 120,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute top-0 flex flex-col gap-3 font-mono text-[10px] text-blue-400/20 select-none pointer-events-none"
      aria-hidden="true"
      style={{ left: x }}
      animate={shouldReduceMotion ? undefined : { y: ["-10%", "110%"] }}
      transition={
        shouldReduceMotion
          ? undefined
          : {
              duration: 12,
              delay,
              repeat: Infinity,
              ease: "linear",
            }
      }
    >
      {chars.map((c, i) => (
        <span key={i} style={{ opacity: 1 - i * 0.07 }}>
          {c}
        </span>
      ))}
    </motion.div>
  );
};

const streams = [
  { x: "5%", delay: 0 },
  { x: "15%", delay: 3 },
  { x: "28%", delay: 7 },
  { x: "42%", delay: 1.5 },
  { x: "58%", delay: 5 },
  { x: "70%", delay: 2.5 },
  { x: "82%", delay: 8 },
  { x: "92%", delay: 4 },
];

const CornerBracket = ({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) => {
  const base = "absolute w-5 h-5";
  const border = "border-blue-500/40";
  const styles = {
    tl: `${base} top-3 left-3 border-t border-l ${border}`,
    tr: `${base} top-3 right-3 border-t border-r ${border}`,
    bl: `${base} bottom-3 left-3 border-b border-l ${border}`,
    br: `${base} bottom-3 right-3 border-b border-r ${border}`,
  };
  return <div className={styles[position]} />;
};

const features = [
  {
    icon: BotIcon,
    label: "AI Coding",
    desc: "Pair with intelligent agents",
  },
  {
    icon: CloudIcon,
    label: "Cloud IDE",
    desc: "Zero-setup execution env",
  },
  {
    icon: GitBranchIcon,
    label: "GitHub Native",
    desc: "Commit, branch & PR in-flow",
  },
  {
    icon: ZapIcon,
    label: "Agent Workspace",
    desc: "Autonomous task pipelines",
  },
];

export const UnauthenticatedView = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-sidebar overflow-hidden py-16">
      {/* Code streams background */}
      <div className="absolute inset-0 pointer-events-none hidden sm:block">
        {streams.map((s, i) => (
          <CodeStream key={i} x={s.x} delay={s.delay} />
        ))}
      </div>

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-3xl"
          animate={
            useReducedMotion()
              ? undefined
              : { x: [-80, 80, -80], y: [-40, 40, -40] }
          }
          transition={
            useReducedMotion()
              ? undefined
              : { duration: 20, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-blue-400/8 rounded-full blur-3xl"
          animate={
            useReducedMotion()
              ? undefined
              : { x: [80, -80, 80], y: [40, -40, 40] }
          }
          transition={
            useReducedMotion()
              ? undefined
              : { duration: 25, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </div>

      {/* Main card */}
      <motion.div
        role="main"
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm mx-auto px-6"
        initial={useReducedMotion() ? undefined : { opacity: 0, y: 24 }}
        animate={useReducedMotion() ? undefined : { opacity: 1, y: 0 }}
        transition={
          useReducedMotion() ? undefined : { duration: 0.6, ease: "easeOut" }
        }
      >
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.04, 1],
              filter: [
                "brightness(1.10)",
                "brightness(1.25)",
                "brightness(1.10)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/curate.svg"
              alt="Curate"
              width={32}
              height={32}
              className="brightness-110 contrast-125"
            />
          </motion.div>
          <h1 className={cn("text-4xl font-semibold", font.className)}>
            Curate
          </h1>
        </motion.div>

        <motion.div
          className="w-full h-px bg-border"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full rounded-lg border border-blue-500/25 bg-background/70 backdrop-blur-md p-8 flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <CornerBracket position="tl" />
          <CornerBracket position="tr" />
          <CornerBracket position="bl" />
          <CornerBracket position="br" />

          {/* Hero copy */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2
              className={cn(
                "text-lg font-semibold text-foreground uppercase tracking-wide",
                font.className,
              )}
            >
              AI-native development workspace
            </h2>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              Build, edit and ship software with AI agents,
              <br />
              cloud execution and GitHub workflows.
            </p>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            className="grid grid-cols-2 gap-2 w-full"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.45 }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                className="flex flex-col gap-1.5 rounded-md border border-blue-500/15 bg-blue-500/5 px-3 py-3 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all duration-200"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.07, duration: 0.35 }}
              >
                <f.icon className="w-3.5 h-3.5 text-blue-400/70" />
                <span
                  className={cn(
                    "text-[11px] font-semibold text-foreground/90 uppercase tracking-wider",
                    font.className,
                  )}
                >
                  {f.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/70 leading-tight">
                  {f.desc}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="w-full flex flex-col gap-2"
          >
            <SignInButton mode="modal">
              <Button
                variant="outline"
                size="default"
                className="w-full border-blue-500/25 hover:text-green-400/60 uppercase font-mono tracking-widest hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300"
                aria-label="Sign in to Curate"
              >
                {">"} Continue
              </Button>
            </SignInButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating ProjectLearningsButton (preserved) */}
      <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 hidden sm:block">
        <div className="w-[calc(100vw-3rem)] max-w-sm rounded-2xl bg-sidebar/80 backdrop-blur-md">
          <ProjectLearningsButton />
        </div>
      </div>
    </div>
  );
};
