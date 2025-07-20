import { Wallet } from "@coral-xyz/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { SolanaService } from "~/services/solana.client";
import { TaskEscrowService } from "~/services/task-escrow.client";

export function useSolanaService(): {
  solanaService: SolanaService | null;
  taskEscrowService: TaskEscrowService | null;
} {
  const wallet = useAnchorWallet();

  // Memoize the service instance so it's only recreated when wallet changes
  const solanaService = useMemo(() => {
    // Only create service if wallet is connected and has publicKey
    if (!wallet || !wallet.publicKey) {
      return null;
    }
    // Cast the AnchorWallet to anchor.Wallet since they have compatible interfaces
    return new SolanaService(wallet as Wallet);
  }, [wallet]);

  // Memoize the task escrow service and only create it when solanaService is available
  const taskEscrowService = useMemo(() => {
    if (!solanaService) {
      return null;
    }
    return new TaskEscrowService(solanaService);
  }, [solanaService]);

  return { solanaService, taskEscrowService };
}
