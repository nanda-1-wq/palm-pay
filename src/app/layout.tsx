import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import AppWalletProvider from "@/components/WalletProvider";
import WalletButton from "@/components/WalletButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Palm Pay — Censorship-Resistant Checkout for PUSD",
  description:
    "Accept PUSD payments on Solana. No freeze. No blacklist. Instant settlement.",
  icons: {
    icon: "/palm-tree.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <AppWalletProvider>
          <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold text-lg tracking-tight"
              >
                <Image
                  src="/palm-tree.svg"
                  alt="Palm Pay logo"
                  width={20}
                  height={28}
                  className="shrink-0"
                />
                <span>Palm Pay</span>
              </Link>
              <nav className="flex items-center gap-5 text-sm">
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/demo-store"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Demo Store
                </Link>
                <WalletButton />
              </nav>
            </div>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
        </AppWalletProvider>
      </body>
    </html>
  );
}
