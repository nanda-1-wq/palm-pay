"use client";

import { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const BASE_STYLE: React.CSSProperties = {
  background: "#F5F0E8",
  border: "1px solid #F5F0E8",
  borderRadius: "9999px",
  color: "#000000",
  fontSize: "0.875rem",
  fontWeight: 600,
  height: "2.25rem",
  padding: "0 1rem",
  lineHeight: 1,
  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
};

const HOVER_STYLE: React.CSSProperties = {
  ...BASE_STYLE,
  background: "#4F8059",
  border: "1px solid #4F8059",
  color: "#F5F0E8",
};

export default function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <WalletMultiButton />;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "contents" }}
    >
      <WalletMultiButton style={hovered ? HOVER_STYLE : BASE_STYLE} />
    </div>
  );
}
