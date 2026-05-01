"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PayButton from "@/components/checkout/PayButton";
import type { PayStatus } from "@/components/checkout/PaymentStatus";
import type { InvoiceJSON } from "@/types/invoice";
import { DEMO_MERCHANT_WALLET, SOLANA_NETWORK } from "@/lib/constants";

/* ─── Product catalogue ─────────────────────────────────────────── */

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // PUSD
  emoji: string;
  accentFrom: string;
  accentTo: string;
  tag?: string;
}

const PRODUCTS: Product[] = [
  {
    id: "solana-hoodie",
    name: "Solana Hoodie",
    description: "Premium heavyweight hoodie, gradient logo on chest",
    price: 45,
    emoji: "👕",
    accentFrom: "#9945FF",
    accentTo: "#14F195",
    tag: "Best Seller",
  },
  {
    id: "crypto-mug",
    name: "Crypto Coffee Mug",
    description: "Double-walled ceramic, keeps your alpha hot",
    price: 18,
    emoji: "☕",
    accentFrom: "#F7931A",
    accentTo: "#FFD700",
  },
  {
    id: "sticker-pack",
    name: "Dev Sticker Pack",
    description: "12 premium vinyl stickers — Solana, PUSD, web3 OSS",
    price: 8,
    emoji: "🎨",
    accentFrom: "#00C2FF",
    accentTo: "#14F195",
    tag: "Sale",
  },
  {
    id: "node-tshirt",
    name: "Node Runner T-Shirt",
    description: "Softest organic cotton, running validator since 2021",
    price: 28,
    emoji: "🖥️",
    accentFrom: "#14F195",
    accentTo: "#00C2FF",
  },
  {
    id: "ledger-sleeve",
    name: "Hardware Wallet Sleeve",
    description: "Vegan leather case, fits Ledger Nano & Trezor",
    price: 22,
    emoji: "🔐",
    accentFrom: "#FF6B6B",
    accentTo: "#FFD93D",
    tag: "New",
  },
  {
    id: "dao-cap",
    name: "DAO Governance Cap",
    description: "Structured 6-panel cap, embroidered palm logo",
    price: 32,
    emoji: "🧢",
    accentFrom: "#C778DD",
    accentTo: "#9945FF",
  },
];

/* ─── Checkout modal ────────────────────────────────────────────── */

interface CheckoutModalProps {
  product: Product;
  invoice: InvoiceJSON;
  onClose: () => void;
  onSuccess: (sig: string) => void;
}

function CheckoutModal({
  product,
  invoice,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [payStatus, setPayStatus] = useState<PayStatus>("idle");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const cluster =
    SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;

  const handleSuccess = useCallback(
    (signature: string) => {
      setTxSig(signature);
      setPayStatus("success");
      onSuccess(signature);
    },
    [onSuccess]
  );

  const handleError = useCallback((msg: string) => {
    setPayError(msg);
    setPayStatus("error");
  }, []);

  const handleRetry = () => {
    setPayError(null);
    setPayStatus("idle");
  };

  // Trap focus and close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && payStatus !== "signing" && payStatus !== "confirming") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, payStatus]);

  const isProcessing = payStatus === "signing" || payStatus === "confirming";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-[#141414] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${product.accentFrom}22, ${product.accentTo}22)`,
                border: `1px solid ${product.accentFrom}33`,
              }}
            >
              {product.emoji}
            </div>
            <div>
              <p className="text-xs text-[#8A8A8A] font-mono uppercase tracking-wider">
                Checkout
              </p>
              <p className="text-bone font-medium text-sm leading-tight">
                {product.name}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-bone hover:bg-white/[0.06] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Success state */}
        {payStatus === "success" ? (
          <div className="px-5 py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#14F195]/20 border border-[#14F195]/30 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-[#14F195]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-bone font-semibold text-lg">Order confirmed!</p>
              <p className="text-[#C8C8C8] text-sm mt-1">
                Your {product.name} is on its way 🎉
              </p>
            </div>
            {txSig && (
              <a
                href={`https://solscan.io/tx/${txSig}${cluster}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#14F195] hover:opacity-80 transition-opacity"
              >
                View on Solscan
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full bg-transparent hover:bg-white/[0.04] border border-white/[0.14] text-[#C8C8C8] hover:text-bone text-sm font-medium py-2.5 rounded-full transition-colors"
            >
              Back to Store
            </button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {/* Amount */}
            <div className="text-center py-3">
              <p className="text-4xl font-semibold text-bone tabular-nums">
                {invoice.amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-[#14F195] font-mono text-sm font-semibold tracking-wider mt-0.5">
                PUSD
              </p>
              <p className="text-[#8A8A8A] text-xs mt-2">{product.description}</p>
            </div>

            {/* Merchant row */}
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-sm">
              <span className="text-[#8A8A8A]">Merchant</span>
              <span className="text-[#C8C8C8] font-medium">Palm Pay Demo Store</span>
            </div>

            {/* Error */}
            {payStatus === "error" && payError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 text-sm text-red-400 break-words">
                {payError}
              </div>
            )}

            {/* Pay / retry button */}
            {payStatus === "error" ? (
              <button
                onClick={handleRetry}
                className="w-full bg-[#14F195]/90 hover:bg-[#14F195] text-[#0A0A0A] text-sm font-semibold py-3 rounded-full transition-colors"
              >
                Try Again
              </button>
            ) : (
              <PayButton
                invoice={invoice}
                status={payStatus}
                onStatusChange={setPayStatus}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}

            {/* Trust row */}
            <p className="text-xs text-center text-[#5A5A5A]">
              Non-custodial · Direct SPL transfer · Devnet demo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Product card ───────────────────────────────────────────────── */

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
  loading: boolean;
}

function ProductCard({ product, onBuy, loading }: ProductCardProps) {
  return (
    <div className="group bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex flex-col">
      {/* Product image area */}
      <div
        className="relative h-48 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${product.accentFrom}18 0%, ${product.accentTo}18 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, ${product.accentFrom}22 0%, transparent 70%)`,
          }}
        />
        <span className="text-6xl select-none relative z-10">{product.emoji}</span>
        {product.tag && (
          <span
            className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: `${product.accentFrom}33`,
              color: product.accentFrom,
              border: `1px solid ${product.accentFrom}55`,
            }}
          >
            {product.tag}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-bone text-base leading-snug">
          {product.name}
        </h3>
        <p className="text-[#8A8A8A] text-sm mt-1 leading-relaxed flex-1">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-xl font-semibold text-bone tabular-nums">
              {product.price}
            </span>
            <span className="text-[#14F195] text-sm font-mono font-semibold ml-1">
              PUSD
            </span>
          </div>
          <button
            onClick={() => onBuy(product)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed border border-white/[0.1] hover:border-white/[0.2] text-bone text-sm font-medium px-4 py-2 rounded-full transition-all"
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                Buy with PUSD
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function DemoStorePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [invoice, setInvoice] = useState<InvoiceJSON | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [lastPurchase, setLastPurchase] = useState<{
    product: Product;
    txSig: string;
  } | null>(null);

  const handleBuy = async (product: Product) => {
    setCreateError(null);
    setLoadingId(product.id);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantWallet: DEMO_MERCHANT_WALLET,
          merchantName: "Palm Pay Demo Store",
          amount: product.price,
          description: `Purchase: ${product.name}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create invoice");
      }
      const newInvoice: InvoiceJSON = await res.json();
      setInvoice(newInvoice);
      setSelectedProduct(product);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Could not create checkout session"
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setInvoice(null);
  };

  const handleSuccess = (sig: string) => {
    if (selectedProduct) {
      setLastPurchase({ product: selectedProduct, txSig: sig });
    }
  };

  const dismissSuccess = () => setLastPurchase(null);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Devnet banner */}
      <div className="bg-[#14F195]/10 border-b border-[#14F195]/20 px-4 py-2.5 text-center">
        <p className="text-xs text-[#14F195]/80">
          <span className="font-semibold text-[#14F195]">Demo mode</span>
          {" — "}
          This store runs on Solana devnet. No real money is exchanged.{" "}
          <Link
            href="/dashboard"
            className="underline underline-offset-2 hover:text-[#14F195] transition-colors"
          >
            Get devnet PUSD via dashboard
          </Link>
        </p>
      </div>

      {/* Last purchase success banner */}
      {lastPurchase && (
        <div className="bg-[#14F195]/10 border-b border-[#14F195]/20 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-5 h-5 rounded-full bg-[#14F195]/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-[#14F195]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[#C8C8C8]">
                <span className="text-bone font-medium">
                  {lastPurchase.product.name}
                </span>{" "}
                purchased!{" "}
                <a
                  href={`https://solscan.io/tx/${lastPurchase.txSig}${
                    SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#14F195] underline underline-offset-2 hover:opacity-80"
                >
                  View on Solscan
                </a>
              </span>
            </div>
            <button
              onClick={dismissSuccess}
              className="text-[#8A8A8A] hover:text-bone text-xs shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-3 font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
            Live on Devnet
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-bone leading-tight">
            Palm Pay Demo Store
          </h1>
          <p className="text-[#8A8A8A] mt-2 text-base max-w-lg">
            A live demo of PUSD checkout. Pick any item and pay with your Solana
            wallet — instant, non-custodial, non-freezable.
          </p>
        </div>

        {/* Create error */}
        {createError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {createError}
          </div>
        )}

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuy={handleBuy}
              loading={loadingId === product.id}
            />
          ))}
        </div>

        {/* Trust footer */}
        <div className="mt-14 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-wrap gap-6 justify-center text-xs text-[#5A5A5A]">
            {[
              "🔒 Non-custodial SPL transfers",
              "⚡ Instant Solana settlement",
              "🚫 PUSD can't be frozen",
              "🔍 Every tx verifiable on-chain",
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p className="text-center text-xs text-[#3A3A3A] mt-4">
            Powered by{" "}
            <Link href="/" className="text-[#5A5A5A] hover:text-[#8A8A8A] transition-colors">
              Palm Pay
            </Link>{" "}
            · Palm USD on Solana
          </p>
        </div>
      </div>

      {/* Checkout modal */}
      {selectedProduct && invoice && (
        <CheckoutModal
          product={selectedProduct}
          invoice={invoice}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
