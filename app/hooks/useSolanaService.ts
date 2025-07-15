import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { SolanaService } from "~/services/solana.client";

export function useSolanaService(): SolanaService | null {
  const wallet = useAnchorWallet();

  // Memoize the service instance so it's only recreated when wallet changes
  const solanaService = useMemo(() => {
    // Only create service if wallet is connected and has publicKey
    if (!wallet || !wallet.publicKey) {
      return null;
    }
    return new SolanaService(wallet);
  }, [wallet]);

  return solanaService;
}
