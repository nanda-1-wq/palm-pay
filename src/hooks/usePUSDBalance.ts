"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { getPUSDMintPublicKey } from "@/lib/solana";
import { PUSD_DECIMALS } from "@/lib/constants";

interface PUSDBalance {
  balance: number | null;
  loading: boolean;
  refresh: () => void;
}

/**
 * React hook that returns the PUSD token balance for the currently connected wallet.
 *
 * Fetches the associated token account (ATA) for the active wallet and reads its balance.
 * Returns balance=0 if the wallet has no PUSD ATA yet.
 * Re-fetches automatically when the connection or wallet changes.
 *
 * @returns { balance, loading, refresh }
 *   - balance: PUSD balance in human-readable units (null if wallet disconnected)
 *   - loading: true while the balance is being fetched
 *   - refresh: manually trigger a balance re-fetch
 */
export function usePUSDBalance(): PUSDBalance {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      const mint = getPUSDMintPublicKey();
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      const account = await getAccount(connection, ata);
      const raw = Number(account.amount);
      setBalance(raw / Math.pow(10, PUSD_DECIMALS));
    } catch {
      // Token account doesn't exist yet — balance is 0
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refresh: fetchBalance };
}
