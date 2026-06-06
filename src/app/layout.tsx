import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import "allotment/dist/style.css";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Curate",
    template: "%s | Curate",
  },
  description:
    "AI-native browser IDE with real-time collaboration, GitHub workflows, and AI-assisted coding.",
  icons: {
    icon: "/curate.svg",
    shortcut: "/curate.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster
            richColors
            closeButton
            expand
            position="bottom-right"
            visibleToasts={4}
            duration={4000}
            toastOptions={{
              classNames: {
                toast: "curate-toast",
                title: "curate-toast-title",
                description: "curate-toast-description",
                actionButton: "curate-toast-action",
                cancelButton: "curate-toast-cancel",
                closeButton: "curate-toast-close",
              },
            }}
          />
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
