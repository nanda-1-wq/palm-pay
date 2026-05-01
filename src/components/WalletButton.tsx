"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  return (
    <WalletMultiButton
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "9999px",
        color: "#C8C8C8",
        fontSize: "0.875rem",
        fontWeight: 500,
        height: "2.25rem",
        padding: "0 1rem",
        lineHeight: 1,
      }}
    />
  );
}
