import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-gb-sans",
});

const display = Sora({
  subsets: ["latin"],
  variable: "--font-gb-display",
});

export const metadata: Metadata = {
  title: "GBfoods Stock Control",
  description: "Nationwide depot sorting and segregation for GBfoods Ghana.",
  applicationName: "GBfoods Stock Control",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "GB Stock",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fe5000",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn(sans.variable, display.variable)}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
