"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import CreateInvoice from "@/components/dashboard/CreateInvoice";
import TransactionHistory from "@/components/dashboard/TransactionHistory";
import Settings from "@/components/dashboard/Settings";

type Tab = "create" | "transactions" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "create",
    label: "Create Invoice",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("create");

  if (!connected || !publicKey) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-7 h-7 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Connect your Solana wallet to access the merchant dashboard and
            create payment invoices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-6 flex-1">
      {/* Sidebar */}
      <aside className="w-full md:w-56 shrink-0">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-2 md:sticky md:top-24">
          {/* Wallet badge */}
          <div className="px-3 py-3 mb-2 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Wallet
            </p>
            <p className="text-xs font-mono text-gray-300 truncate">
              {publicKey.toBase58().slice(0, 8)}…
              {publicKey.toBase58().slice(-6)}
            </p>
          </div>

          <nav className="space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-emerald-500/15 text-emerald-400 font-medium"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span
                  className={
                    activeTab === tab.id ? "text-emerald-400" : "text-gray-600"
                  }
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {activeTab === "create" && <CreateInvoice />}
        {activeTab === "transactions" && <TransactionHistory />}
        {activeTab === "settings" && <Settings />}
      </main>
    </div>
  );
}
