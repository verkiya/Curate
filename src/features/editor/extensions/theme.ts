import { EditorView } from "@codemirror/view";

export const customTheme = EditorView.theme({
  "&": {
    outline: "none !important",
  },

  "&.cm-focused": {
    outline: "none !important",
  },

  ".cm-editor": {
    backgroundColor: "hsl(var(--background))",
  },

  ".cm-content": {
    fontFamily: "var(--font-jetbrains-mono), monospace",
    fontSize: "14px",
    lineHeight: "1.6",
    letterSpacing: "0.01em",
  },

  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "hsl(var(--muted-foreground) / 0.6)",
    fontSize: "13px",
  },

  ".cm-activeLine": {
    backgroundColor: "hsl(var(--accent) / 0.25)",
  },

  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "hsl(var(--foreground) / 0.85)",
  },

  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "hsl(var(--primary) / 0.25)",
  },

  ".cm-content ::selection": {
    backgroundColor: "hsl(var(--primary) / 0.25)",
  },

  ".cm-cursor": {
    borderLeftColor: "hsl(var(--primary))",
    borderLeftWidth: "2px",
  },

  ".cm-scroller": {
    scrollbarWidth: "thin",
    scrollbarColor: "hsl(var(--muted-foreground) / 0.25) transparent",
  },

  ".cm-scroller::-webkit-scrollbar": {
    width: "8px",
    height: "8px",
  },

  ".cm-scroller::-webkit-scrollbar-thumb": {
    backgroundColor: "hsl(var(--muted-foreground) / 0.25)",
    borderRadius: "999px",
    border: "2px solid transparent",
    backgroundClip: "content-box",
  },

  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "hsl(var(--muted-foreground) / 0.4)",
  },
});
