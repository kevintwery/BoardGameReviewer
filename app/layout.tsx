import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { NavBar } from "@/components/ui/NavBar";
import { SiteFooter } from "@/components/ui/SiteFooter";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Board Game Review",
    template: "%s | Board Game Review",
  },
  description: "Rate board games, learn how to play, and swap house rules and strategies.",
  openGraph: {
    type: "website",
    siteName: "Board Game Review",
    title: "Board Game Review",
    description: "Rate board games, learn how to play, and swap house rules and strategies.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* suppressHydrationWarning is needed because the "dark" class is
            applied client-side (see lib/theme.ts) before React hydrates,
            which would otherwise cause a harmless server/client mismatch warning. */}
        <body suppressHydrationWarning>
          <NavBar />
          {children}
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
