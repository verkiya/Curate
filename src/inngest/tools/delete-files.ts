import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
interface DeleteFilesToolOptions {
  internalKey: string;
}
const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "Provide at least one file ID"),
});
export const createDeleteFilesTool = ({
  internalKey,
}: DeleteFilesToolOptions) => {
  return createTool({
    name: "deleteFiles",
    description:
      "Delete files or folders from the project. If deleting a folder, all contents will be deleted recursively.",
    parameters: z.object({
      fileIds: z
        .array(z.string())
        .describe(
          "Array of Convex Database IDs of the files/folders to delete (obtainable via listFiles). Do not pass file paths.",
        ),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }
      const { fileIds } = parsed.data;
      // Pre-validation pattern: Validate ALL files exist before executing ANY deletions.
      // This ensures we don't end up in a partially-deleted state if the agent provides one valid ID and one invalid ID.
      const filesToDelete: {
        id: string;
        name: string;
        type: string;
      }[] = [];
      for (const fileId of fileIds) {
        let file;
        try {
          //Validate the file exists before running the step
          file = await convex.query(api.system.getFileById, {
            internalKey,
            fileId: fileId as Id<"files">,
          });
        } catch (error) {
          // Guard against agent hallucinating file paths instead of Convex IDs.
          // Returns a helpful message forcing the agent to use listFiles instead of crashing.
          if (
            error instanceof Error &&
            error.message.includes("ArgumentValidationError")
          ) {
            return `Error: Invalid file ID format for "${fileId}". You must pass the actual file ID (e.g. from listFiles), not the file path or name.`;
          }
          return `Error validating file: ${error instanceof Error ? error.message : "Unknown error"}`;
        }

        if (!file) {
          return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
        }
        filesToDelete.push({
          id: file._id,
          name: file.name,
          type: file.type,
        });
      }
      try {
        return await toolStep?.run("delete-files", async () => {
          const results: string[] = [];
          for (const file of filesToDelete) {
            await convex.mutation(api.system.deleteFile, {
              internalKey,
              fileId: file.id as Id<"files">,
            });
            results.push(`Deleted ${file.type} "${file.name}" successfully.`);
          }
          return results.join("\n");
        });
      } catch (error) {
        return `Error deleting files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
