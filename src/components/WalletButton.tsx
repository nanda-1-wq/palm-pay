"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  return (
    <WalletMultiButton
      style={{
        background: "transparent",
        border: "1px solid rgb(55 65 81)",
        borderRadius: "0.5rem",
        color: "white",
        fontSize: "0.875rem",
        fontWeight: 500,
        height: "2.25rem",
        padding: "0 1rem",
        lineHeight: 1,
      }}
    />
  );
}
