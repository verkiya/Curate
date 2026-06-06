import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",

        soft: "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15",

        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",

        dangerGhost:
          "text-destructive hover:bg-destructive/10 hover:text-destructive",

        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",

        tab: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",

        success:
          "border border-emerald-500/20 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20",

        glass: "border bg-background/60 backdrop-blur-xl hover:bg-accent/60",

        link: "text-primary underline-offset-4 hover:underline",

        highlight: "bg-transparent hover:bg-accent-foreground/5",
      },

      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",

        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",

        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",

        icon: "size-9",

        "icon-lg": "size-10",

        "icon-sm": "size-8",

        "icon-xs": "size-5.5 rounded",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-size={size}
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
