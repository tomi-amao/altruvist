import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { SolanaService } from "~/services/solana.client";

export function useBountyService(): SolanaService | null {
  const wallet = useAnchorWallet();

  // Memoize the service instance so it's only recreated when wallet changes
  const solanaService = useMemo(() => {
    return new SolanaService(wallet);
  }, [wallet]);

  return solanaService;
}
