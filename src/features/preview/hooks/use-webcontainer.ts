import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import { buildFileTree, getFilePath } from "../utils/file-tree";
import { Id } from "../../../../convex/_generated/dataModel";
import { useFiles } from "@/features/projects/hooks/use-files";

//Singleton Webcontainer instance
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let cleanupPromise: Promise<void> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  // Wait for any in-progress teardown to finish before booting
  if (cleanupPromise) {
    await cleanupPromise;
    cleanupPromise = null;
  }

  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  if (!bootPromise) {
    bootPromise = WebContainer.boot({ coep: "credentialless" });
  }
  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
};

const teardownWebContainer = () => {
  if (webcontainerInstance) {
    // Instance exists — tear it down immediately
    try {
      webcontainerInstance.teardown();
    } catch {
      // Instance may already be dead — safe to ignore
    }
    webcontainerInstance = null;
    bootPromise = null;
  } else if (bootPromise) {
    // Boot is still in progress — schedule teardown for when it completes
    const pendingBoot = bootPromise;
    bootPromise = null;
    cleanupPromise = pendingBoot
      .then((instance) => {
        try {
          instance.teardown();
        } catch {
          // Boot may have partially failed
        }
      })
      .catch(() => {
        // Boot itself failed — nothing to tear down
      })
      .finally(() => {
        webcontainerInstance = null;
      });
  }
};
interface UseWebContainerProps {
  projectId: Id<"projects">;
  enabled: boolean;
  isImporting?: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
}
export const useWebContainer = ({
  projectId,
  enabled,
  isImporting,
  settings,
}: UseWebContainerProps) => {
  const [status, setStatus] = useState<
    "idle" | "booting" | "installing" | "running" | "error"
  >("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("");
  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);

  //Fetch files from Convex (auto-updates )
  const files = useFiles(projectId);
  useEffect(() => {
    if (
      !enabled ||
      !files ||
      files.length === 0 ||
      hasStartedRef.current ||
      isImporting
    ) {
      return;
    }
    hasStartedRef.current = true;
    let cancelled = false;

    const start = async () => {
      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");
        const appendOutput = (data: string) => {
          setTerminalOutput((prev) => prev + data);
        };
        const container = await getWebContainer();
        if (cancelled) return;

        containerRef.current = container;
        const fileTree = buildFileTree(files);
        await container.mount(fileTree);
        if (cancelled) return;

        container.on("server-ready", (_port, url) => {
          if (cancelled) return;
          console.log(`[webcontainer] server ready: ${url}`);
          setPreviewUrl(url);
          setStatus("running");
        });

        container.on("error", (err) => {
          if (cancelled) return;
          console.error("[webcontainer] runtime error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Container crashed unexpectedly",
          );
          setStatus("error");
        });
        setStatus("installing");
        // Parse install command (default: npm install)
        const installCmd = settings?.installCommand || "npm install";
        const [installBin, ...installArgs] = installCmd.split(" ");
        appendOutput(`$ ${installCmd}\n`);
        const installProcess = await container.spawn(installBin, installArgs);
        installProcess.output
          .pipeTo(
            new WritableStream({
              write(data) {
                if (!cancelled) appendOutput(data);
              },
            }),
          )
          .catch(() => {});

        const installExitCode = await installProcess.exit;
        if (cancelled) return;
        if (installExitCode !== 0) {
          throw new Error(`${installCmd} failed with code ${installExitCode}`);
        }

        // Parse the dev command (default: npm run dev)

        const devCmd = settings?.devCommand || "npm run dev";
        const [devBin, ...devArgs] = devCmd.split(" ");
        appendOutput(`\n$ ${devCmd}\n`);
        const devProcess = await container.spawn(devBin, devArgs);
        devProcess.output
          .pipeTo(
            new WritableStream({
              write(data) {
                if (!cancelled) appendOutput(data);
              },
            }),
          )
          .catch(() => {});
      } catch (error) {
        if (cancelled) return;
        setError(error instanceof Error ? error.message : "Unknown error");
        setStatus("error");
      }
    };
    start();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    files,
    isImporting,
    restartKey,
    settings?.devCommand,
    settings?.installCommand,
  ]);

  // Sync file changes (hot-reload)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files) return; // Removed `status !== "running"` check

    const syncFiles = async () => {
      const filesMap = new Map(files.map((f) => [f._id, f]));
      for (const file of files) {
        if (
          file.type !== "file" ||
          file.storageId ||
          file.content === undefined
        ) {
          continue;
        }
        const filePath = getFilePath(file, filesMap);
        try {
          await container.fs.writeFile(filePath, file.content);
        } catch {
          // Container may have been torn down — safe to ignore
        }
      }
    };
    syncFiles();
  }, [files]); // Removed `status` from deps

  //Reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
      setTerminalOutput("");
    }
  }, [enabled]);

  // Cleanup WebContainer when hook unmounts
  useEffect(() => {
    return () => {
      teardownWebContainer();
    };
  }, []);

  //Restart the entire WebContainer process
  const restart = useCallback(() => {
    if (error?.includes("Only a single WebContainer instance")) {
      window.location.reload();
      return;
    }

    teardownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setTerminalOutput("");
    setRestartKey((k) => k + 1);
  }, [error]);
  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  };
};
