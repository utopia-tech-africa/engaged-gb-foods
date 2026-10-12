import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";

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
  icons: {
    icon: "/favicon.svg",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
