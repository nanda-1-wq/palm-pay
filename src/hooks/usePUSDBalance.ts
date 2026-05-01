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
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refresh: fetchBalance };
}
