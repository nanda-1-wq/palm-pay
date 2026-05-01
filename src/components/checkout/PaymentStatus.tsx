"use client";

import { SOLANA_NETWORK } from "@/lib/constants";

export type PayStatus = "idle" | "signing" | "confirming" | "success" | "error";

interface PaymentStatusProps {
  status: PayStatus;
  txSignature: string | null;
  error: string | null;
  onRetry: () => void;
}

export default function PaymentStatus({
  status,
  txSignature,
  error,
  onRetry,
}: PaymentStatusProps) {
  const cluster =
    SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  const solscanUrl = txSignature
    ? `https://solscan.io/tx/${txSignature}${cluster}`
    : null;

  if (status === "success") {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 rounded-full bg-accent-bright/20 border border-accent-bright/30 flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7 text-accent-bright"
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
        </div>
        <div>
          <p className="text-bone font-semibold text-lg">Payment confirmed!</p>
          <p className="text-[#C8C8C8] text-sm mt-1">
            Your payment was sent successfully
          </p>
        </div>
        {solscanUrl && (
          <a
            href={solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent-bright hover:text-gold transition-colors"
          >
            View on Solscan
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
        <button
          onClick={() => { window.location.href = '/demo-store'; }}
          className="w-full bg-transparent hover:bg-white/[0.04] border border-white/[0.14] text-[#C8C8C8] hover:text-bone text-sm font-medium py-2.5 rounded-pill transition-colors"
        >
          Return to store
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <div>
          <p className="text-bone font-semibold">Payment failed</p>
          <p className="text-[#C8C8C8] text-sm mt-1 break-words">
            {error ?? "Something went wrong"}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="w-full bg-accent hover:bg-accent-bright text-bone text-sm font-medium py-2.5 rounded-pill transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
