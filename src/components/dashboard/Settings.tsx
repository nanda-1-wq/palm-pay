"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePUSDBalance } from "@/hooks/usePUSDBalance";
import { getPUSDMint, SOLANA_NETWORK } from "@/lib/constants";

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
    >
      {copied ? (
        <>
          <svg
            className="w-3.5 h-3.5 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {label ?? "Copy"}
        </>
      )}
    </button>
  );
}

function InfoRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-800 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p
          className={`text-sm text-white break-all ${
            mono ? "font-mono" : "font-medium"
          }`}
        >
          {value}
        </p>
      </div>
      {copyable && <CopyButton value={value} />}
    </div>
  );
}

export default function Settings() {
  const { publicKey } = useWallet();
  const { balance, loading, refresh } = usePUSDBalance();

  const mintAddress = getPUSDMint();
  const network = SOLANA_NETWORK;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Settings</h2>

      {/* Wallet card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 px-6 py-2">
        <InfoRow
          label="Connected Wallet"
          value={publicKey?.toBase58() ?? "—"}
          mono
          copyable={!!publicKey}
        />
        <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-800">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              PUSD Balance
            </p>
            <p className="text-sm font-medium text-white">
              {loading ? (
                <span className="text-gray-500">Loading…</span>
              ) : balance === null ? (
                <span className="text-gray-500">—</span>
              ) : (
                <>
                  <span className="text-emerald-400 text-base">
                    {balance.toFixed(2)}
                  </span>{" "}
                  <span className="text-gray-400">PUSD</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
        <InfoRow
          label="PUSD Mint Address"
          value={mintAddress}
          mono
          copyable
        />
        <InfoRow
          label="Network"
          value={network === "mainnet-beta" ? "Mainnet Beta" : "Devnet"}
        />
      </div>

      {/* Network indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            network === "mainnet-beta" ? "bg-emerald-400" : "bg-yellow-400"
          }`}
        />
        <span className="text-gray-400">
          {network === "mainnet-beta"
            ? "Connected to Solana Mainnet"
            : "Connected to Solana Devnet — for testing only"}
        </span>
      </div>
    </div>
  );
}
