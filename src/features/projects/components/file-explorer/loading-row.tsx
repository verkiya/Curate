import { cn } from "@/lib/utils";

import { getItemPadding } from "./constants";
export const LoadingRow = ({
  className,
  level = 0,
}: {
  className?: string;
  level?: number;
}) => {
  return (
    <div
      className={cn(
        "animate-in fade-in flex h-7 items-center gap-2 duration-150",
        className,
      )}
      style={{ paddingLeft: getItemPadding(level, true) }}
    >
      <div className="size-4 rounded-sm bg-muted/80 animate-pulse" />

      <div className="h-3 w-24 rounded bg-muted/80 animate-pulse" />
    </div>
  );
};
