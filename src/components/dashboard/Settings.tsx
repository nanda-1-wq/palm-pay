"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePUSDBalance } from "@/hooks/usePUSDBalance";
import { getPUSDMint, SOLANA_NETWORK } from "@/lib/constants";
import ReservesBadge from "@/components/ReservesBadge";

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
      className="flex items-center gap-1.5 text-xs bg-ink hover:bg-white/[0.04] border border-white/[0.10] text-[#8A8A8A] hover:text-bone px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
    >
      {copied ? (
        <>
          <svg
            className="w-3.5 h-3.5 text-accent-bright"
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
    <div className="flex items-start justify-between gap-4 py-4 border-b border-white/[0.06] last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-[#8A8A8A] uppercase tracking-wider font-mono mb-1">
          {label}
        </p>
        <p
          className={`text-sm text-bone break-all ${
            mono ? "font-mono text-gold" : "font-medium"
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
      <h2 className="text-lg font-semibold text-bone">Settings</h2>

      {/* Wallet card */}
      <div className="bg-ink-2 rounded-xl border border-white/[0.06] px-6 py-2">
        <InfoRow
          label="Connected Wallet"
          value={publicKey?.toBase58() ?? "—"}
          mono
          copyable={!!publicKey}
        />
        <div className="flex items-start justify-between gap-4 py-4 border-b border-white/[0.06]">
          <div className="min-w-0">
            <p className="text-xs text-[#8A8A8A] uppercase tracking-wider font-mono mb-1">
              PUSD Balance
            </p>
            <p className="text-sm font-medium text-bone">
              {loading ? (
                <span className="text-[#5A5A5A]">Loading…</span>
              ) : balance === null ? (
                <span className="text-[#5A5A5A]">—</span>
              ) : (
                <>
                  <span className="text-gold font-mono text-base">
                    {balance.toFixed(2)}
                  </span>{" "}
                  <span className="text-[#8A8A8A] font-mono text-xs">PUSD</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs bg-ink hover:bg-white/[0.04] disabled:opacity-50 border border-white/[0.10] text-[#8A8A8A] hover:text-bone px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
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
            network === "mainnet-beta" ? "bg-accent-bright" : "bg-yellow-400"
          }`}
        />
        <span className="text-[#8A8A8A]">
          {network === "mainnet-beta"
            ? "Connected to Solana Mainnet"
            : "Connected to Solana Devnet — for testing only"}
        </span>
      </div>

      {/* PUSD Reserve health */}
      <div>
        <p className="text-xs text-[#8A8A8A] uppercase tracking-wider font-mono mb-2">
          PUSD Reserve Health
        </p>
        <ReservesBadge />
      </div>
    </div>
  );
}
