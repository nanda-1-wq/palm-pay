"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { getPUSDMintPublicKey } from "@/lib/solana";
import { PUSD_DECIMALS } from "@/lib/constants";
import type { InvoiceJSON } from "@/types/invoice";
import type { PayStatus } from "./PaymentStatus";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

interface PayButtonProps {
  invoice: InvoiceJSON;
  status: PayStatus;
  onStatusChange: (s: PayStatus) => void;
  onSuccess: (txSignature: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function PayButton({
  invoice,
  status,
  onStatusChange,
  onSuccess,
  onError,
  disabled,
}: PayButtonProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const handlePay = async () => {
    if (!publicKey) return;

    onStatusChange("signing");

    try {
      // ── Step 1: resolve addresses ──────────────────────────────────
      const mint = getPUSDMintPublicKey();
      console.log("[PayButton] mint:", mint.toBase58());
      console.log("[PayButton] payer:", publicKey.toBase58());
      console.log("[PayButton] invoice:", {
        id: invoice.id,
        amount: invoice.amount,
        amountLamports: invoice.amountLamports,
        merchantWallet: invoice.merchantWallet,
      });

      const merchantPubKey = new PublicKey(invoice.merchantWallet);
      const payerAta = await getAssociatedTokenAddress(mint, publicKey);
      // allowOwnerOffCurve: true — merchant wallet may be a PDA/multisig
      const merchantAta = await getAssociatedTokenAddress(mint, merchantPubKey, true);
      console.log("[PayButton] payerAta:", payerAta.toBase58());
      console.log("[PayButton] merchantAta:", merchantAta.toBase58());

      // ── Step 2: check ATAs ─────────────────────────────────────────
      const tx = new Transaction();

      const payerAtaInfo = await connection.getAccountInfo(payerAta);
      console.log("[PayButton] payerAta exists:", !!payerAtaInfo, "lamports:", payerAtaInfo?.lamports);
      if (!payerAtaInfo) {
        console.log("[PayButton] adding createATA instruction for payer");
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            payerAta,
            publicKey,
            mint
          )
        );
      }

      const merchantAtaInfo = await connection.getAccountInfo(merchantAta);
      console.log("[PayButton] merchantAta exists:", !!merchantAtaInfo);
      if (!merchantAtaInfo) {
        console.log("[PayButton] adding createATA instruction for merchant");
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            merchantAta,
            merchantPubKey,
            mint
          )
        );
      }

      // ── Step 3: build transaction ──────────────────────────────────
      tx.add(
        createTransferCheckedInstruction(
          payerAta,
          mint,
          merchantAta,
          publicKey,
          BigInt(invoice.amountLamports),
          PUSD_DECIMALS
        )
      );

      tx.add(
        new TransactionInstruction({
          keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(invoice.id, "utf-8"),
        })
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      console.log("[PayButton] transaction built, sending to wallet...");

      // ── Step 4: send ───────────────────────────────────────────────
      const signature = await sendTransaction(tx, connection);
      console.log("[PayButton] tx sent, signature:", signature);

      onStatusChange("confirming");

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      console.log("[PayButton] tx confirmed");

      // ── Step 5: backend verification ──────────────────────────────
      const verifyRes = await fetch(`/api/invoices/${invoice.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txSignature: signature }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.error ?? "Payment verification failed");
      }

      onSuccess(signature);
    } catch (err: unknown) {
      console.error("[PayButton] PAYMENT FAILED:", err);
      let message = "Transaction failed";
      if (err instanceof Error) {
        // Some SPL errors have empty .message but a useful .name
        message = err.message || err.name || "Transaction failed";
      }
      console.error("[PayButton] error message:", message);
      onError(message);
    }
  };

  if (!publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="w-full bg-transparent hover:bg-white/[0.04] border border-white/[0.14] text-[#C8C8C8] hover:text-bone font-medium py-3 rounded-pill text-sm transition-colors"
      >
        Connect Wallet to Pay
      </button>
    );
  }

  const isProcessing = status === "signing" || status === "confirming";

  return (
    <button
      onClick={handlePay}
      disabled={isProcessing || disabled}
      className="w-full bg-accent hover:bg-accent-bright disabled:bg-accent/40 disabled:cursor-not-allowed text-bone font-semibold py-3 rounded-pill text-sm transition-colors flex items-center justify-center gap-2"
    >
      {status === "signing" && (
        <>
          <svg
            className="w-4 h-4 animate-spin"
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
          Confirm in wallet…
        </>
      )}
      {status === "confirming" && (
        <>
          <svg
            className="w-4 h-4 animate-spin"
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
          Confirming on-chain…
        </>
      )}
      {status === "idle" && "Pay with PUSD"}
    </button>
  );
}
