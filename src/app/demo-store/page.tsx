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
    accentFrom: "#9945FF",
    accentTo: "#14F195",
    tag: "Best Seller",
  },
  {
    id: "crypto-mug",
    name: "Crypto Coffee Mug",
    description: "Double-walled ceramic, keeps your alpha hot",
    price: 18,
    accentFrom: "#F7931A",
    accentTo: "#FFD700",
  },
  {
    id: "sticker-pack",
    name: "Dev Sticker Pack",
    description: "12 premium vinyl stickers - Solana, PUSD, web3 OSS",
    price: 8,
    accentFrom: "#00C2FF",
    accentTo: "#14F195",
    tag: "Sale",
  },
  {
    id: "node-tshirt",
    name: "Node Runner T-Shirt",
    description: "Softest organic cotton, running validator since 2021",
    price: 28,
    accentFrom: "#14F195",
    accentTo: "#00C2FF",
  },
  {
    id: "ledger-sleeve",
    name: "Hardware Wallet Sleeve",
    description: "Vegan leather case, fits Ledger Nano & Trezor",
    price: 22,
    accentFrom: "#FF6B6B",
    accentTo: "#FFD93D",
    tag: "New",
  },
  {
    id: "dao-cap",
    name: "DAO Governance Cap",
    description: "Structured 6-panel cap, embroidered palm logo",
    price: 32,
    accentFrom: "#C778DD",
    accentTo: "#9945FF",
  },
];

/* ─── Abstract product visuals (no emojis, no external images) ──── */

function ProductVisual({ product, size = 80 }: { product: Product; size?: number }) {
  const gid = `g-${product.id}`;
  const { accentFrom, accentTo } = product;

  const shapes: Record<string, React.ReactNode> = {
    "solana-hoodie": (
      // Two overlapping offset circles
      <>
        <circle cx="38" cy="44" r="22" fill={`url(#${gid})`} opacity="0.9" />
        <circle cx="58" cy="36" r="18" fill={`url(#${gid})`} opacity="0.55" />
      </>
    ),
    "crypto-mug": (
      // Concentric rings + center dot
      <>
        <circle cx="48" cy="40" r="26" fill="none" stroke={`url(#${gid})`} strokeWidth="2" opacity="0.4" />
        <circle cx="48" cy="40" r="18" fill="none" stroke={`url(#${gid})`} strokeWidth="2.5" opacity="0.65" />
        <circle cx="48" cy="40" r="9" fill={`url(#${gid})`} opacity="0.9" />
      </>
    ),
    "sticker-pack": (
      // 3×3 grid of rounded squares
      <>
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={28 + col * 14}
              y={22 + row * 14}
              width="10"
              height="10"
              rx="2.5"
              fill={`url(#${gid})`}
              opacity={0.4 + (row + col) * 0.08}
            />
          ))
        )}
      </>
    ),
    "node-tshirt": (
      // Three horizontal signal-wave lines
      <>
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M20 ${30 + i * 10} Q34 ${25 + i * 10} 48 ${30 + i * 10} Q62 ${35 + i * 10} 76 ${30 + i * 10}`}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={2.5 - i * 0.5}
            strokeLinecap="round"
            opacity={0.9 - i * 0.2}
          />
        ))}
      </>
    ),
    "ledger-sleeve": (
      // Shield outline with inner accent
      <>
        <path
          d="M48 16 L72 26 L72 46 C72 60 60 70 48 74 C36 70 24 60 24 46 L24 26 Z"
          fill={`url(#${gid})`}
          opacity="0.25"
          stroke={`url(#${gid})`}
          strokeWidth="1.5"
        />
        <path
          d="M48 26 L62 33 L62 47 C62 56 55 62 48 65 C41 62 34 56 34 47 L34 33 Z"
          fill={`url(#${gid})`}
          opacity="0.55"
        />
      </>
    ),
    "dao-cap": (
      // Regular hexagon
      <>
        <polygon
          points="48,18 68,29 68,51 48,62 28,51 28,29"
          fill={`url(#${gid})`}
          opacity="0.3"
          stroke={`url(#${gid})`}
          strokeWidth="1.5"
        />
        <polygon
          points="48,26 62,34 62,50 48,58 34,50 34,34"
          fill={`url(#${gid})`}
          opacity="0.6"
        />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentFrom} />
          <stop offset="100%" stopColor={accentTo} />
        </linearGradient>
      </defs>
      {shapes[product.id]}
    </svg>
  );
}

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
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${product.accentFrom}22, ${product.accentTo}22)`,
                border: `1px solid ${product.accentFrom}33`,
              }}
            >
              <ProductVisual product={product} size={36} />
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
              <span className="text-[#C8C8C8] font-medium">PALM PAY Demo Store</span>
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
        <div className="relative z-10">
          <ProductVisual product={product} size={80} />
        </div>
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
          {" - "}
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
            PALM PAY Demo Store
          </h1>
          <p className="text-[#8A8A8A] mt-2 text-base max-w-lg">
            A live demo of PUSD checkout. Pick any item and pay with your Solana
            wallet - instant, non-custodial, non-freezable.
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
              {
                label: "Non-custodial SPL transfers",
                icon: (
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
              },
              {
                label: "Instant Solana settlement",
                icon: (
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
              },
              {
                label: "PUSD can't be frozen",
                icon: (
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
              {
                label: "Every tx verifiable on-chain",
                icon: (
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                ),
              },
            ].map(({ label, icon }) => (
              <span key={label} className="flex items-center gap-1.5">
                {icon}
                {label}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-[#3A3A3A] mt-4">
            Powered by{" "}
            <Link href="/" className="text-[#5A5A5A] hover:text-[#8A8A8A] transition-colors">
              PALM PAY
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
