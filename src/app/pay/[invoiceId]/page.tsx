"use client";

import { use, useEffect, useState } from "react";
import type { InvoiceJSON } from "@/types/invoice";
import CheckoutCard from "@/components/checkout/CheckoutCard";
import { SOLANA_NETWORK } from "@/lib/constants";

export default function PayPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = use(params);
  const [invoice, setInvoice] = useState<InvoiceJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setInvoice(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#8A8A8A]">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading invoice…
        </div>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-6xl font-bold text-[#3A3A3A]">404</p>
          <p className="text-bone font-medium">Invoice not found</p>
          <p className="text-[#8A8A8A] text-sm">
            This payment link is invalid or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (invoice.status === "expired") {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-yellow-500"
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
          </div>
          <p className="text-bone font-medium">This invoice has expired</p>
          <p className="text-[#8A8A8A] text-sm">
            Please ask the merchant for a new payment link.
          </p>
        </div>
      </div>
    );
  }

  if (invoice.status === "paid") {
    const cluster =
      SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent-bright/20 border border-accent-bright/30 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-accent-bright"
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
            <p className="text-bone text-xl font-semibold">Payment received</p>
            <p className="text-[#C8C8C8] text-sm mt-1">
              {invoice.amount} PUSD to {invoice.merchantName}
            </p>
          </div>
          {invoice.txSignature && (
            <a
              href={`https://solscan.io/tx/${invoice.txSignature}${cluster}`}
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <CheckoutCard invoice={invoice} />
    </div>
  );
}
