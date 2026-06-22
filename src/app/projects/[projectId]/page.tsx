// Check for validator types
// Next expects URL params to be strings. To avoid the Next validator error,
// uncomment the alternative implementation below which accepts `projectId` as
// `string` and casts it to `Id<"projects">` at runtime.

import { ProjectIdView } from "@/features/projects/components/project-id-view";

import { Id } from "../../../../convex/_generated/dataModel";

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ projectId: string }>;
// }): Promise<Metadata> {
//   const { projectId } = await params;

// Server-side Convex auth (generateMetadata + fetchQuery):
//
// Client: ConvexProviderWithClerk attaches a Clerk JWT to every useQuery automatically,
// so verifyAuth in Convex works without extra setup.
//
// Server: generateMetadata runs outside the React tree—no ConvexProviderWithClerk.
// fetchQuery is a one-off HTTP call with no session unless we pass a token explicitly.
// Without { token }, ctx.auth.getUserIdentity() is null, verifyAuth throws, and the
// catch below falls back to title "Project" even when the user is signed in.
//
// Fix: auth() reads the session from request cookies; getToken({ template: "convex" })
// mints the JWT that matches convex/auth.config.ts (applicationID: "convex"). Pass it as
// fetchQuery's third argument. Template name must match the Clerk Dashboard JWT template.
//
// If !token (logged out), skip fetchQuery and use the fallback title.
//   const { getToken } = await auth();
//   const token = await getToken({ template: "convex" });

//   if (!token) {
//     return { title: "Project" };
//   }

//   try {
//     const projectName = await fetchQuery(
//       api.projects.getProjectName,
//       { id: projectId as Id<"projects"> },
//       { token },
//     );

//     return {
//       title: projectName ?? "Project",
//     };
//   } catch {
//     return { title: "Project" };
//   }
// }

const ProjectIdPage = async ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) => {
  const { projectId } = await params;

  return <ProjectIdView projectId={projectId as Id<"projects">} />;
};

export default ProjectIdPage;
/*
// Alternative (uncomment to apply):
// const ProjectIdPage = async ({
//   params,
// }: {
//   params: Promise<{ projectId: string }>;
// }) => {
//   const { projectId: projectIdStr } = await params;
//   const projectId = projectIdStr as Id<"projects">;
//
//   return <ProjectIdView projectId={projectId} />;
// };
//
// export default ProjectIdPage;
*/
