import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import AppWalletProvider from "@/components/WalletProvider";
import WalletButton from "@/components/WalletButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "PALM PAY - Censorship-Resistant Checkout for PUSD",
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
      className={`${inter.variable} ${sourceSerif4.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-ink text-bone">
        <AppWalletProvider>
          <header className="border-b border-white/[0.06] bg-ink/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold text-lg tracking-tight text-bone"
              >
                <span
                  className="shrink-0 flex items-center justify-center"
                  style={{ background: "#F5F0E8", width: 28, height: 28, padding: 3, borderRadius: 8 }}
                >
                  <Image
                    src="/palm-tree.svg"
                    alt="PALM PAY logo"
                    width={18}
                    height={24}
                    style={{ background: "transparent" }}
                  />
                </span>
                <span>PALM PAY</span>
              </Link>
              <nav className="flex items-center gap-5 text-sm">
                <Link
                  href="/dashboard"
                  className="nav-link text-[#C8C8C8] hover:text-bone transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/demo-store"
                  className="nav-link text-[#C8C8C8] hover:text-bone transition-colors"
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
