import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  keymap,
} from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";

import { fetcher } from "./fetcher";
const setSuggestionEffect = StateEffect.define<string | null>();
//StateEffect: A way to send "messages" to update state
// We define one effect type for settings the suggestion text
// StateField: Holds our suggestion state in the editor.
// create()- returns the initial value when the editor loads
//update()- Called on every transaction (keystroke or cursor positioning change) to potentially update the value
const suggestionState = StateField.define<string | null>({
  create() {
    return null;
  },
  update(value, transaction) {
    //Check each effect in this transaction
    //If we find our setSuggestionEffect, return its new value
    //Otherwise, keep the current value unchanged
    for (const effect of transaction.effects) {
      if (effect.is(setSuggestionEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});
// WidgetType: creates custom DOM elements to display in the editor.
// the toDOM() is called by CodeMirror to create the actual HTML element.

class SuggestionWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  toDOM() {
    const span = document.createElement("span");
    span.textContent = this.text;
    span.style.opacity = "0.4"; //Ghost text appearance
    span.style.fontStyle = "italic";
    span.style.color = "hsl(var(--muted-foreground))";
    span.style.pointerEvents = "none"; //Don't interfere with clicks
    return span;
  }
}
let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 200; // Firing the request for autosuggestion
let currentAbortController: AbortController | null = null;

const generatePayload = (view: EditorView, fileName: string) => {
  const code = view.state.doc.toString();
  if (!code || code.trim().length === 0) return null;
  const cursorPosition = view.state.selection.main.head;
  const currentLine = view.state.doc.lineAt(cursorPosition);
  const cursorInLine = cursorPosition - currentLine.from;
  if (currentLine.text.slice(0, cursorInLine).trim().length === 0) {
    return null;
  }
  const previousLines: string[] = [];
  const previousLinesToFetch = Math.min(5, currentLine.number - 1);
  for (let i = previousLinesToFetch; i >= 1; i--) {
    previousLines.push(view.state.doc.line(currentLine.number - i).text);
  }
  const nextLines: string[] = [];
  const totalLines = view.state.doc.lines;
  const linesToFetch = Math.min(5, totalLines - currentLine.number);
  for (let i = 1; i <= linesToFetch; i++) {
    nextLines.push(view.state.doc.line(currentLine.number + i).text);
  }
  return {
    fileName,
    code,
    currentLine: currentLine.text,
    previousLines: previousLines.join("\n"),
    textBeforeCursor: currentLine.text.slice(0, cursorInLine),
    textAfterCursor: currentLine.text.slice(cursorInLine),
    nextLines: nextLines.join("\n"),
    lineNumber: currentLine.number,
  };
};

const createDebouncePlugin = (fileName: string) => {
  return ViewPlugin.fromClass(
    class {
      constructor(_view: EditorView) {}
      update(update: ViewUpdate) {
        // Curate Improvement: We only trigger suggestions on `docChanged` (actual typing),
        // intentionally omitting `selectionSet` (cursor movement).
        // Triggering AI network requests purely on cursor movement causes massive unnecessary API calls and rate limiting.
        if (update.docChanged) {
          this.triggerSuggestion(update.view);
        }
      }
      triggerSuggestion(view: EditorView) {
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }
        if (currentAbortController !== null) {
          currentAbortController.abort();
        }
        isWaitingForSuggestion = true;
        debounceTimer = window.setTimeout(async () => {
          const payload = generatePayload(view, fileName);
          if (!payload) {
            isWaitingForSuggestion = false;
            view.dispatch({ effects: setSuggestionEffect.of(null) });
            return;
          }
          // The AbortController ensures that if the user keeps typing before the AI responds,
          // the old HTTP request is cancelled. This prevents race conditions where an older,
          // stale suggestion arrives after a newer one and overwrites it.
          currentAbortController = new AbortController();
          const suggestion = await fetcher(
            payload,
            currentAbortController.signal,
          );

          isWaitingForSuggestion = false;
          view.dispatch({
            effects: setSuggestionEffect.of(suggestion), //Update the suggestion state with the new suggestion text
          });
        }, DEBOUNCE_DELAY);
      }
      destroy() {
        if (debounceTimer != null) {
          clearTimeout(debounceTimer);
        }
        if (currentAbortController != null) {
          currentAbortController.abort();
        }
      }
    },
  );
};
const renderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }
    update(update: ViewUpdate) {
      //Rebuild decorations if doc changed, cursor moved, or suggestion moved
      const suggestionChanged = update.transactions.some((transaction) => {
        return transaction.effects.some((effect) => {
          return effect.is(setSuggestionEffect);
        });
      });
      //Rebuild decorations if doc changed, cursor moved, or suggestion changed
      const shouldRebuild =
        update.docChanged || update.selectionSet || suggestionChanged;
      if (shouldRebuild) {
        this.decorations = this.build(update.view);
      }
    }
    build(view: EditorView) {
      if (isWaitingForSuggestion) {
        return Decoration.none; //Don't show old suggestion while waiting for new one
      }
      //Get current suggestion from state
      const suggestion = view.state.field(suggestionState);
      if (!suggestion) {
        return Decoration.none;
      }
      //Create a widget decoration at the cursor position
      const cursor = view.state.selection.main.head;
      return Decoration.set([
        Decoration.widget({
          widget: new SuggestionWidget(suggestion),
          side: 1, // Render after the cursor (side:1), not before (side:-1)
        }).range(cursor),
      ]);
    }
  },
  {
    decorations: (plugin) => plugin.decorations, // Tell CodeMirror to use our decorations
  },
);
const acceptSuggestionKeymap = keymap.of([
  {
    key: "Tab",
    run: (view) => {
      const suggestion = view.state.field(suggestionState);
      if (!suggestion) {
        return false; //No suggestions found, let Tab do its normal behavior (indent)
      }
      const cursor = view.state.selection.main.head;
      view.dispatch({
        changes: { from: cursor, insert: suggestion }, //Insert the suggestion text at the cursor position
        selection: { anchor: cursor + suggestion.length }, //Move cursor to the end of the inserted suggestion
        effects: setSuggestionEffect.of(null), //Clear the suggestion after accepting
      });
      return true; // We handled the Tab key, prevent default behavior
    },
  },
]);
export const suggestion = (fileName: string) => [
  suggestionState, //Our state storage
  createDebouncePlugin(fileName), //Handles triggering suggestions with debounce while typing
  renderPlugin, // Renders the ghost text
  acceptSuggestionKeymap, // Tab to accept the suggestion
];
