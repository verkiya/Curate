"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col gap-10 bg-background p-10 text-foreground">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Button Variants</h1>

        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>

          <Button variant="soft">Soft</Button>

          <Button variant="secondary">Secondary</Button>

          <Button variant="outline">Outline</Button>

          <Button variant="ghost">Ghost</Button>

          <Button variant="tab">Tab</Button>

          <Button variant="success">Success</Button>

          <Button variant="destructive">Destructive</Button>

          <Button variant="dangerGhost">Danger Ghost</Button>

          <Button variant="link">Link</Button>

          <Button variant="highlight">Highlight</Button>

          <Button variant="glass">Glass</Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Button Sizes</h2>

        <div className="flex flex-wrap items-center gap-4">
          <Button size="icon-xs">+</Button>

          <Button size="icon-sm">+</Button>

          <Button size="icon">+</Button>

          <Button size="icon-lg">+</Button>

          <Button size="sm">Small</Button>

          <Button>Default</Button>

          <Button size="lg">Large</Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Disabled</h2>

        <div className="flex flex-wrap gap-4">
          <Button disabled>Default</Button>

          <Button variant="soft" disabled>
            Soft
          </Button>

          <Button variant="outline" disabled>
            Outline
          </Button>

          <Button variant="success" disabled>
            Success
          </Button>

          <Button variant="destructive" disabled>
            Destructive
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Toast Testing</h2>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() =>
              toast("Default Toast", {
                description:
                  "This is how a standard Curate notification looks.",
              })
            }
          >
            Default Toast
          </Button>

          <Button
            variant="success"
            onClick={() =>
              toast.success("Deployment successful", {
                description: "Your application has been deployed successfully.",
              })
            }
          >
            Success Toast
          </Button>

          <Button
            variant="destructive"
            onClick={() =>
              toast.error("Deployment failed", {
                description:
                  "Something went wrong while deploying your project.",
              })
            }
          >
            Error Toast
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast.warning("High token usage", {
                description:
                  "This request may consume more tokens than expected.",
              })
            }
          >
            Warning Toast
          </Button>

          <Button
            variant="soft"
            onClick={() =>
              toast.info("AI suggestion available", {
                description: "Curate generated a code improvement suggestion.",
              })
            }
          >
            Info Toast
          </Button>

          <Button
            variant="tab"
            onClick={() =>
              toast.promise(
                new Promise((resolve) =>
                  setTimeout(() => resolve("done"), 3000),
                ),
                {
                  loading: "Generating code...",
                  success: "Code generated successfully",
                  error: "Failed to generate code",
                },
              )
            }
          >
            Promise Toast
          </Button>

          <Button
            variant="highlight"
            onClick={() =>
              toast("Action Required", {
                description:
                  "Review the generated changes before applying them.",
                action: {
                  label: "Review",
                  onClick: () => console.log("Review clicked"),
                },
                cancel: {
                  label: "Dismiss",
                  onClick: () => console.log("Dismiss clicked"),
                },
              })
            }
          >
            Action Toast
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Real Curate Use Cases</h2>

        <div className="flex flex-wrap gap-4">
          <Button>New Project</Button>

          <Button variant="soft">Explain Code</Button>

          <Button variant="soft">Generate Docs</Button>

          <Button variant="outline">Rename File</Button>

          <Button variant="tab">Editor</Button>

          <Button variant="tab">Preview</Button>

          <Button variant="success">Deploy</Button>

          <Button variant="dangerGhost">Delete File</Button>
        </div>
      </div>
    </div>
  );
}
