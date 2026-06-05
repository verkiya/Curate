import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";

import { cn } from "@/lib/utils";
import { getItemPadding } from "./constants";

export const RenameInput = ({
  type,
  defaultValue,
  isOpen,
  level,
  onSubmit,
  onCancel,
}: {
  type: "file" | "folder";
  defaultValue: string;
  isOpen?: boolean;
  level: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = () => {
    const trimmedValue = value.trim() || defaultValue;
    onSubmit(trimmedValue);
  };

  return (
    <div
      className="
        animate-in
        fade-in
        flex
        h-7
        w-full
        items-center
        gap-1.5
        rounded-md
        border
        border-primary/15
        bg-primary/8
        pr-2
        duration-150
        focus-within:border-primary/25
        focus-within:bg-primary/10
      "
      style={{ paddingLeft: getItemPadding(level, type === "file") }}
    >
      <div className="flex items-center gap-1.5">
        {type === "folder" && (
          <ChevronRightIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
              isOpen && "rotate-90",
            )}
          />
        )}

        {type === "file" && (
          <FileIcon fileName={value} autoAssign className="size-4 shrink-0" />
        )}

        {type === "folder" && (
          <FolderIcon
            className="size-4 shrink-0 text-cyan-400"
            folderName={value}
          />
        )}
      </div>

      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }

          if (e.key === "Escape") {
            onCancel();
          }
        }}
        onFocus={(e) => {
          if (type === "folder") {
            e.currentTarget.select();
            return;
          }

          const value = e.currentTarget.value;
          const lastDotIndex = value.lastIndexOf(".");

          if (lastDotIndex > 0) {
            e.currentTarget.setSelectionRange(0, lastDotIndex);
          } else {
            e.currentTarget.select();
          }
        }}
        className="
          flex-1
          bg-transparent
          text-[13px]
          font-medium
          text-foreground
          caret-primary
          outline-none
          placeholder:text-muted-foreground/60
        "
      />
    </div>
  );
};
