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
  // Public Route Bypass Pattern:
  // We check the pathname before rendering the Auth providers.
  // This allows public pages (like /learnings) to render immediately server-side
  // without triggering the <AuthLoading> flash or redirecting to the <UnauthenticatedView>.
  const isPublicRoute = ["/learnings", "/test"].some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`),
  );

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "oklch(0.62 0.18 262)",
          colorBackground: "oklch(0.2 0.012 262)",
          colorText: "oklch(0.97 0.004 260)",
          colorDanger: "oklch(0.67 0.22 25)",
          colorSuccess: "oklch(0.72 0.16 150)",
          colorInputBackground: "oklch(0.28 0.012 262)",
          colorInputText: "oklch(0.97 0.004 260)",
          colorTextOnPrimaryBackground: "oklch(0.985 0 0)",
          borderRadius: "0.5rem",
        },
      }}
    >
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
