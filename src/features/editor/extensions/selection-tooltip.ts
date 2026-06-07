import { Tooltip, showTooltip, EditorView } from "@codemirror/view";
import { StateField, EditorState } from "@codemirror/state";
import { showQuickEditEffect, quickEditState } from "./quick-edit";

let editorView: EditorView | null = null;

const createIcon = (path: string) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", "size-4 shrink-0");

  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );

  pathElement.setAttribute("d", path);

  svg.appendChild(pathElement);

  return svg;
};

const createTooltipForSelection = (state: EditorState): readonly Tooltip[] => {
  const selection = state.selection.main;

  if (selection.empty) {
    return [];
  }

  const isQuickEditActive = state.field(quickEditState);

  if (isQuickEditActive) {
    return [];
  }

  return [
    {
      pos: selection.to,
      above: false,
      strictSide: false,

      create() {
        const dom = document.createElement("div");

        dom.className =
          "z-50 flex select-none items-center gap-1 rounded-xl border border-border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-xl backdrop-blur-xl";

        const createActionButton = ({
          label,
          shortcut,
          icon,
          onClick,
          isPrimary = false,
        }: {
          label: string;
          shortcut?: string;
          icon: SVGSVGElement;
          onClick: () => void;
          isPrimary?: boolean;
        }) => {
          const button = document.createElement("button");
          button.type = "button";

          button.className = isPrimary
            ? "flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 font-sans text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-90 focus:outline-none"
            : "flex items-center gap-2 rounded-lg px-3 py-1.5 font-sans text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus:outline-none";

          const labelWrapper = document.createElement("div");
          labelWrapper.className = "flex items-center gap-2";

          labelWrapper.appendChild(icon);

          const text = document.createElement("span");
          text.textContent = label;

          labelWrapper.appendChild(text);
          button.appendChild(labelWrapper);

          if (shortcut) {
            const shortcutPill = document.createElement("span");
            shortcutPill.textContent = shortcut;
            shortcutPill.className =
              "rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-xs font-medium text-muted-foreground";

            button.appendChild(shortcutPill);
          }

          button.onclick = onClick;

          return button;
        };

        const askChatIcon = createIcon(
          "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
        );

        const quickEditIcon = createIcon(
          "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
        );

        const addToChatButton = createActionButton({
          label: "Ask the Chat",
          icon: askChatIcon,
          onClick: () => {
            if (!editorView) {
              return;
            }

            const selection = editorView.state.selection.main;

            if (selection.empty) {
              return;
            }

            const selectedText = editorView.state.doc.sliceString(
              selection.from,
              selection.to,
            );

            window.dispatchEvent(
              new CustomEvent("curate:add-to-chat", {
                detail: { text: selectedText },
              }),
            );
          },
        });

        const quickEditButton = createActionButton({
          label: "Quick Edit",
          shortcut: "CTRL + .",
          icon: quickEditIcon,
          isPrimary: true,
          onClick: () => {
            if (!editorView) {
              return;
            }

            editorView.dispatch({
              effects: showQuickEditEffect.of(true),
            });
          },
        });

        dom.appendChild(addToChatButton);
        dom.appendChild(quickEditButton);

        return { dom };
      },
    },
  ];
};

const selectionTooltipField = StateField.define<readonly Tooltip[]>({
  create(state) {
    return createTooltipForSelection(state);
  },

  update(tooltips, transaction) {
    if (transaction.docChanged || transaction.selection) {
      return createTooltipForSelection(transaction.state);
    }

    for (const effect of transaction.effects) {
      if (effect.is(showQuickEditEffect)) {
        return createTooltipForSelection(transaction.state);
      }
    }

    return tooltips;
  },

  provide: (field) =>
    showTooltip.computeN([field], (state) => state.field(field)),
});

const captureViewExtension = EditorView.updateListener.of((update) => {
  editorView = update.view;
});

export const selectionTooltip = () => [
  selectionTooltipField,
  captureViewExtension,
];
