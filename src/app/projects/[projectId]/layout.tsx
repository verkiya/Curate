import type { Metadata } from "next";

import { ProjectIdLayout } from "@/features/projects/components/project-id-layout";

import { Id } from "../../../../convex/_generated/dataModel";
// Layouts are less prone to rerendering, so they make the app somewhat optimized
// Next 16: a file cannot export both `metadata` and `generateMetadata` (see page.tsx).
// Static title here avoids using the [projectId] URL segment as the tab title while
// page generateMetadata runs (Clerk token + Convex fetchQuery).
export const metadata: Metadata = {
  title: "Project",
};

// Check for validator types
// Next's App Router validator expects route params to be strings (e.g. `projectId: string`).
// If you want to keep Convex `Id<"projects">` in downstream code, uncomment the
// alternative implementation below, which accepts `params` as `string` and casts it
// to `Id<"projects">` at runtime. Leave the current implementation active until
// you're ready to uncomment and run the build.

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) => {
  const { projectId } = await params;

  return (
    <ProjectIdLayout projectId={projectId as Id<"projects">}>
      {children}
    </ProjectIdLayout>
  );
};

export default Layout;

/*
// Alternative (uncomment to apply):
// const Layout = async ({
//   children,
//   params,
// }: {
//   children: React.ReactNode;
//   params: Promise<{ projectId: string }>;
// }) => {
//   const { projectId: projectIdStr } = await params;
//   const projectId = projectIdStr as Id<"projects">;
//
//   return <ProjectIdLayout projectId={projectId}>{children}</ProjectIdLayout>;
// };
//
// export default Layout;
*/
