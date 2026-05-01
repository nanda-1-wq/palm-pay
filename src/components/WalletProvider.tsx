"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { SOLANA_RPC_URL, SOLANA_NETWORK } from "@/lib/constants";

import "@solana/wallet-adapter-react-ui/styles.css";

function getNetwork(): WalletAdapterNetwork {
  if (SOLANA_NETWORK === "mainnet-beta") return WalletAdapterNetwork.Mainnet;
  return WalletAdapterNetwork.Devnet;
}

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = getNetwork();
  const endpoint = SOLANA_RPC_URL;

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
