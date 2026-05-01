"use client";

import { useEffect, useState } from "react";

interface ReservesData {
  ok: boolean;
  circulation?: number;
  updatedAt?: string | null;
  error?: string;
}

function formatCirculation(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ReservesBadge() {
  const [data, setData] = useState<ReservesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reserves")
      .then(async (res) => {
        const json = await res.json();
        setData(json);
      })
      .catch(() => {
        setData({ ok: false, error: "Reserve data temporarily unavailable" });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#0F1A14] border border-[#14F195]/20 rounded-xl px-4 py-3.5 text-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#8A8A8A] font-mono uppercase tracking-wider">
            PUSD Reserves
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#14F195] bg-[#14F195]/10 border border-[#14F195]/20 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
          Verified
        </div>
      </div>

      {/* Circulation figure */}
      {loading ? (
        <div className="h-7 w-28 bg-white/[0.04] rounded-md animate-pulse mb-2" />
      ) : data?.ok && data.circulation !== undefined ? (
        <div className="mb-2">
          <span className="text-2xl font-semibold text-bone tabular-nums">
            {formatCirculation(data.circulation)}
          </span>
          <span className="text-[#14F195] font-mono text-xs font-semibold ml-1.5">
            PUSD
          </span>
          {data.updatedAt && (
            <span className="text-[#5A5A5A] text-xs ml-2">
              · as of {formatUpdatedAt(data.updatedAt)}
            </span>
          )}
        </div>
      ) : (
        <p className="text-[#8A8A8A] text-xs mb-2 italic">
          {data?.error ?? "Reserve data temporarily unavailable"}
        </p>
      )}

      {/* Attestation lines */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
          <svg
            className="w-3 h-3 text-[#14F195] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Fully backed 1:1 by AED + SAR reserves
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
          <svg
            className="w-3 h-3 text-[#14F195] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Verified via monthly ISAE 3000 attestation
        </div>
      </div>

      {/* Link */}
      <a
        href="https://palmusd.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-[#14F195]/70 hover:text-[#14F195] transition-colors mt-2.5"
      >
        Full reserve details at palmusd.com
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}
