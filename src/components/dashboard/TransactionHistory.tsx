"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { InvoiceJSON } from "@/types/invoice";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  expired: "bg-red-500/15 text-red-400 border-red-500/20",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        STATUS_STYLES[status] ?? STATUS_STYLES.cancelled
      }`}
    >
      {status}
    </span>
  );
}

export default function TransactionHistory() {
  const { publicKey } = useWallet();
  const [invoices, setInvoices] = useState<InvoiceJSON[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/invoices?merchant=${publicKey.toBase58()}`
      );
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data: InvoiceJSON[] = await res.json();
      // Sort newest first
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totalVolume = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Transactions</h2>
          {invoices.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
              {totalVolume > 0 && (
                <>
                  {" · "}
                  <span className="text-emerald-400 font-medium">
                    {totalVolume.toFixed(2)} PUSD
                  </span>{" "}
                  total paid
                </>
              )}
            </p>
          )}
        </div>
        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors shrink-0"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
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

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading && invoices.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <svg
              className="w-5 h-5 animate-spin mr-2"
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
            Loading…
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <svg
              className="w-10 h-10 mb-3 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No invoices yet</p>
            <p className="text-xs mt-1">
              Create your first invoice in the Create Invoice tab
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="text-left px-5 py-3 font-medium">
                      Description
                    </th>
                    <th className="text-right px-5 py-3 font-medium">
                      Amount
                    </th>
                    <th className="text-center px-5 py-3 font-medium">
                      Status
                    </th>
                    <th className="text-center px-5 py-3 font-medium">
                      Tx Link
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-white max-w-[200px] truncate">
                        {inv.description || (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                        <span
                          className={
                            inv.status === "paid"
                              ? "text-emerald-400"
                              : "text-white"
                          }
                        >
                          {inv.amount.toFixed(2)}
                        </span>
                        <span className="text-gray-600 ml-1 text-xs">
                          PUSD
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {inv.txSignature ? (
                          <a
                            href={`https://solscan.io/tx/${inv.txSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            View
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
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-800">
              {invoices.map((inv) => (
                <div key={inv.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">
                        {inv.description || "No description"}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="text-white font-medium shrink-0 tabular-nums text-sm">
                      {inv.amount.toFixed(2)}{" "}
                      <span className="text-gray-500 font-normal text-xs">
                        PUSD
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inv.status} />
                    {inv.txSignature && (
                      <a
                        href={`https://solscan.io/tx/${inv.txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View on Solscan →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
