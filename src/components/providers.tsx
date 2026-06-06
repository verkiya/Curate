"use client";

import {
  Authenticated,
  Unauthenticated,
  ConvexReactClient,
  AuthLoading,
} from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { UnauthenticatedView } from "@/features/auth/components/unauthenticated-view";
import { AuthLoadingView } from "@/features/auth/components/auth-loading-view";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "./theme-provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isPublicRoute = ["/learnings", "/test"].some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`),
  );

  return (
    <ClerkProvider appearance={{ theme: dark }}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {isPublicRoute ? (
            children
          ) : (
            <>
              <Authenticated>{children}</Authenticated>
              <Unauthenticated>
                <UnauthenticatedView />
              </Unauthenticated>
              <AuthLoading>
                <AuthLoadingView />
              </AuthLoading>
            </>
          )}
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
