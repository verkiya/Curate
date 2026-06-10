import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// In Next.js 16, middleware.ts was renamed to proxy.ts.
// Clerk must allow these through at the edge so providers.tsx can render public pages.
// "/" is public here only at the edge — providers.tsx still gates ProjectsView behind auth.
const isPublicRoute = createRouteMatcher([
  "/",
  "/learnings(.*)",
  "/test(.*)",
  "/api/inngest(.*)",
]);
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
