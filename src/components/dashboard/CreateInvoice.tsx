"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { QRCodeSVG } from "qrcode.react";
import type { InvoiceJSON } from "@/types/invoice";

interface CreatedInvoice {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function CreateInvoice() {
  const { publicKey } = useWallet();
  const [merchantName, setMerchantName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceJSON | null>(null);
  const [copied, setCopied] = useState(false);
  const [sessionInvoices, setSessionInvoices] = useState<CreatedInvoice[]>([]);

  // Load merchant name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("palm_pay_merchant_name");
    if (saved) setMerchantName(saved);
  }, []);

  const paymentUrl =
    createdInvoice && typeof window !== "undefined"
      ? `${window.location.origin}/pay/${createdInvoice.id}`
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0.01) {
      setError("Amount must be at least 0.01 PUSD");
      return;
    }

    setLoading(true);
    setError(null);
    setCreatedInvoice(null);

    try {
      localStorage.setItem("palm_pay_merchant_name", merchantName);

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantWallet: publicKey.toBase58(),
          merchantName: merchantName.trim() || "Merchant",
          amount: parsedAmount,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create invoice");
        return;
      }

      setCreatedInvoice(data);
      setSessionInvoices((prev) => [
        {
          id: data.id,
          amount: data.amount,
          description: data.description,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);
      setAmount("");
      setDescription("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!paymentUrl) return;
    await navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-ink-2 rounded-xl border border-white/[0.06] p-6">
        <h2 className="text-lg font-semibold mb-5 text-bone">Create Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#C8C8C8] mb-1.5">
              Merchant Name
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Your business name"
              className="w-full bg-ink border border-white/[0.10] rounded-lg px-3 py-2.5 text-sm text-bone placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[#C8C8C8] mb-1.5">
              Amount{" "}
              <span className="text-[#5A5A5A] text-xs font-mono">(PUSD)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                className="w-full bg-ink border border-white/[0.10] rounded-lg px-3 py-2.5 text-sm text-bone placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 transition-colors pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold font-mono font-medium">
                PUSD
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#C8C8C8] mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this payment for?"
              className="w-full bg-ink border border-white/[0.10] rounded-lg px-3 py-2.5 text-sm text-bone placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-bright disabled:bg-accent/40 disabled:cursor-not-allowed text-bone font-medium py-2.5 rounded-pill text-sm transition-colors"
          >
            {loading ? "Creating…" : "Create Invoice"}
          </button>
        </form>
      </div>

      {createdInvoice && (
        <div className="bg-ink-2 rounded-xl border border-accent/30 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-bright shrink-0" />
            <h3 className="font-semibold text-accent-bright">Invoice Created</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            {/* QR Code */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={paymentUrl} size={140} />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <p className="text-xs text-[#8A8A8A] uppercase tracking-wider font-mono mb-1">
                  Payment Link
                </p>
                <p className="text-sm text-[#C8C8C8] break-all font-mono bg-ink border border-white/[0.06] rounded px-2.5 py-2">
                  {paymentUrl}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#8A8A8A] font-mono mb-0.5">Amount</p>
                  <p className="text-gold font-mono font-medium">
                    {createdInvoice.amount} PUSD
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8A8A8A] font-mono mb-0.5">Status</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                    pending
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[#8A8A8A] font-mono mb-0.5">Description</p>
                  <p className="text-bone">
                    {createdInvoice.description || "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-sm bg-transparent hover:bg-white/[0.04] border border-white/[0.14] text-[#C8C8C8] hover:text-bone px-3 py-2 rounded-pill transition-colors"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-4 h-4 text-accent-bright"
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
                    Copied!
                  </>
                ) : (
                  <>
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionInvoices.length > 0 && (
        <div className="bg-ink-2 rounded-xl border border-white/[0.06] p-6">
          <h3 className="text-sm font-medium text-[#8A8A8A] font-mono uppercase tracking-wider mb-4">
            Created This Session
          </h3>
          <ul className="divide-y divide-white/[0.04]">
            {sessionInvoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between py-3 text-sm gap-3"
              >
                <div className="min-w-0">
                  <p className="text-bone truncate">
                    {inv.description || "No description"}
                  </p>
                  <p className="text-[#5A5A5A] text-xs mt-0.5">
                    {new Date(inv.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gold font-mono font-medium">
                    {inv.amount} PUSD
                  </p>
                  <a
                    href={`/pay/${inv.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#8A8A8A] hover:text-[#C8C8C8] transition-colors"
                  >
                    view →
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
