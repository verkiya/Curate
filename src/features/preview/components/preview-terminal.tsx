"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import "@xterm/xterm/css/xterm.css";

interface PreviewTerminalProps {
  output: string;
}

/**
 * A polished xterm.js-based read-only terminal panel.
 *
 * NOTE: The outer header / chrome is rendered by preview-view.tsx —
 * this component is only the terminal viewport itself.
 */
export const PreviewTerminal = ({ output }: PreviewTerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastLengthRef = useRef(0);

  // Initialize the terminal
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    const terminal = new Terminal({
      convertEol: true,
      disableStdin: true,

      // Typography
      fontSize: 12,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Menlo, monospace",
      fontWeight: "400",
      fontWeightBold: "600",
      letterSpacing: 0.4,
      lineHeight: 1.35,

      // Cursor
      cursorBlink: true,
      cursorStyle: "bar",
      cursorWidth: 2,

      // Scrollbar
      scrollback: 5000,

      // Refined dark theme with ANSI color palette
      theme: {
        background: "#0f1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        cursorAccent: "#0f1117",
        selectionBackground: "#264f7844",
        selectionForeground: "#ffffff",
        selectionInactiveBackground: "#264f7822",

        // ANSI colors — a cohesive, muted-but-readable palette
        black: "#1c2028",
        red: "#f47067",
        green: "#57ab5a",
        yellow: "#e0a526",
        blue: "#539bf5",
        magenta: "#c678dd",
        cyan: "#56d4dd",
        white: "#c9d1d9",

        // Bright variants
        brightBlack: "#545d68",
        brightRed: "#ff938a",
        brightGreen: "#6bc46d",
        brightYellow: "#f0c239",
        brightBlue: "#6cb6ff",
        brightMagenta: "#dcb0f0",
        brightCyan: "#76e3ea",
        brightWhite: "#f0f6fc",
      },
    });

    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Write existing output on mount
    if (output) {
      terminal.write(output);
      terminal.scrollToBottom();
      lastLengthRef.current = output.length;
    }

    requestAnimationFrame(() => fitAddon.fit());

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => fitAddon.fit());
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();

      terminal.dispose();

      terminalRef.current = null;
      fitAddonRef.current = null;
    };
    // output intentionally omitted - only used during mount
  }, []);

  // Write output
  useEffect(() => {
    if (!terminalRef.current) return;

    if (output.length < lastLengthRef.current) {
      terminalRef.current.clear();
      lastLengthRef.current = 0;
    }

    const newData = output.slice(lastLengthRef.current);

    if (newData) {
      terminalRef.current.write(newData);

      // Keep latest logs visible
      terminalRef.current.scrollToBottom();

      lastLengthRef.current = output.length;
    }
  }, [output]);

  return (
    <div
      ref={containerRef}
      className="preview-terminal flex-1 min-h-0"
    />
  );
};
