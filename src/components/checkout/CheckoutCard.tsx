"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { InvoiceJSON } from "@/types/invoice";
import { getPUSDMint } from "@/lib/constants";
import PayButton from "./PayButton";
import PaymentStatus, { type PayStatus } from "./PaymentStatus";

interface CheckoutCardProps {
  invoice: InvoiceJSON;
}

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now())
  );

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { remaining, minutes, seconds };
}

export default function CheckoutCard({ invoice }: CheckoutCardProps) {
  const [payStatus, setPayStatus] = useState<PayStatus>("idle");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const { remaining, minutes, seconds } = useCountdown(invoice.expiresAt);

  const pusdMint = getPUSDMint();
  const solanaPayUrl = `solana:${invoice.merchantWallet}?amount=${invoice.amount}&spl-token=${pusdMint}&memo=${encodeURIComponent(invoice.id)}`;

  // Poll every 5 s for QR-code payers
  useEffect(() => {
    if (payStatus !== "idle") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoice.id}`);
        if (!res.ok) return;
        const data: InvoiceJSON = await res.json();
        if (data.status === "paid") {
          setTxSig(data.txSignature ?? null);
          setPayStatus("success");
        }
      } catch {
        // ignore network hiccups
      }
    }, 5000);
    return () => clearInterval(id);
  }, [invoice.id, payStatus]);

  const handleSuccess = (signature: string) => {
    setTxSig(signature);
    setPayStatus("success");
  };

  const handleError = (msg: string) => {
    setPayError(msg);
    setPayStatus("error");
  };

  const handleRetry = () => {
    setPayError(null);
    setPayStatus("idle");
  };

  const isTerminal = payStatus === "success" || payStatus === "error";
  const expired = remaining === 0;

  return (
    <div className="w-full max-w-md">
      <div className="bg-ink-2 rounded-2xl border border-white/[0.03] overflow-hidden shadow-panel-xl">
        {/* Header */}
        <div className="bg-white/[0.03] px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-accent-bright"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#8A8A8A] uppercase tracking-wider font-mono">
                Payment to
              </p>
              <p className="text-bone font-medium leading-tight">
                {invoice.merchantName}
              </p>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="px-6 py-8 text-center border-b border-white/[0.06]">
          <p className="font-display text-5xl font-medium text-bone tabular-nums">
            {invoice.amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
          </p>
          <p className="text-accent-bright font-semibold mt-1 tracking-wide font-mono text-sm">
            PUSD
          </p>
          {invoice.description && (
            <p className="text-[#8A8A8A] text-sm mt-3 max-w-xs mx-auto">
              {invoice.description}
            </p>
          )}
        </div>

        {/* Pay area */}
        <div className="px-6 py-5 space-y-4">
          {/* Countdown */}
          {!isTerminal && (
            <div className="flex items-center justify-center gap-1.5 text-sm">
              {expired ? (
                <p className="text-red-400">This invoice has expired</p>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 text-yellow-500 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-yellow-500 font-mono">
                    Expires in {minutes}:{String(seconds).padStart(2, "0")}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Button or status */}
          {isTerminal ? (
            <PaymentStatus
              status={payStatus}
              txSignature={txSig}
              error={payError}
              onRetry={handleRetry}
            />
          ) : (
            <PayButton
              invoice={invoice}
              status={payStatus}
              onStatusChange={setPayStatus}
              onSuccess={handleSuccess}
              onError={handleError}
              disabled={expired}
            />
          )}

          {/* QR code for mobile wallets */}
          {payStatus === "idle" && (
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <p className="text-xs text-center text-[#8A8A8A]">
                Or scan with Solana Pay compatible wallet
              </p>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={solanaPayUrl} size={140} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/[0.02] border-t border-white/[0.06] text-center">
          <p className="text-xs text-[#5A5A5A]">
            Powered by{" "}
            <span className="text-[#8A8A8A] font-medium">PALM PAY</span>
            {" · "}
            <span>PUSD is a stable digital dollar on Solana</span>
          </p>
        </div>
      </div>
    </div>
  );
}
