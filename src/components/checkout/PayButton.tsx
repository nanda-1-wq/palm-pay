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
      const mint = getPUSDMintPublicKey();
      const merchantPubKey = new PublicKey(invoice.merchantWallet);

      const payerAta = await getAssociatedTokenAddress(mint, publicKey);
      const merchantAta = await getAssociatedTokenAddress(mint, merchantPubKey);

      const tx = new Transaction();

      // Create payer ATA if missing (customer pays rent)
      const payerAtaInfo = await connection.getAccountInfo(payerAta);
      if (!payerAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            payerAta,
            publicKey,
            mint
          )
        );
      }

      // Create merchant ATA if missing (customer pays rent)
      const merchantAtaInfo = await connection.getAccountInfo(merchantAta);
      if (!merchantAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            merchantAta,
            merchantPubKey,
            mint
          )
        );
      }

      // SPL transfer
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

      // Memo with invoice ID
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

      const signature = await sendTransaction(tx, connection);

      onStatusChange("confirming");

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Backend verification
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
      const message =
        err instanceof Error ? err.message : "Transaction failed";
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
