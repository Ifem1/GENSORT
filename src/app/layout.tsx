import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "GENSORT – Water Colour Sort on GenLayer",
    template: "%s | GENSORT",
  },
  description:
    "A fully onchain Water Colour Sort puzzle game powered by GenLayer intelligent contracts. Sort the colours, beat the chain.",
  keywords: ["puzzle", "genlayer", "blockchain", "water colour sort", "crypto game"],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1020",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="animated-bg min-h-dvh font-sans text-text-main antialiased">
        {/* Noise texture overlay */}
        <div
          className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient orbs */}
        <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-primary-purple/8 blur-3xl pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-electric-cyan/6 blur-3xl pointer-events-none -z-10" />

        {/* Navigation */}
        <Navbar />

        {/* Main content */}
        <main className="relative z-10 page-container">{children}</main>
      </body>
    </html>
  );
}
