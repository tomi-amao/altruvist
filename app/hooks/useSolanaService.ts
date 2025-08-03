import { Wallet } from "@coral-xyz/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { SolanaService } from "~/services/solana.client";
import { TaskEscrowService } from "~/services/task-escrow.client";
import { BlockchainReaderService } from "~/services/blockchain-reader.client";
import { TaskRewardServiceImpl } from "~/services/task-reward.client";

export function useSolanaService(): {
  solanaService: SolanaService | null;
  taskEscrowService: TaskEscrowService | null;
  blockchainReader: BlockchainReaderService | null;
  taskRewardService: TaskRewardServiceImpl | null;
} {
  const wallet = useAnchorWallet();

  // Create blockchain reader service - this doesn't require a wallet
  // But we need to make it SSR-safe by only creating it on the client
  const blockchainReader = useMemo(() => {
    // Check if we're on the client side
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return new BlockchainReaderService();
    } catch (error) {
      console.error("Failed to create BlockchainReaderService:", error);
      return null;
    }
  }, []);

  // Memoize the service instance so it's only recreated when wallet changes
  const solanaService = useMemo(() => {
    // Only create service if wallet is connected and has publicKey
    if (!wallet || !wallet.publicKey) {
      return null;
    }
    // Cast the AnchorWallet to anchor.Wallet since they have compatible interfaces
    // Pass the blockchainReader to avoid creating a new instance
    return new SolanaService(wallet as Wallet, blockchainReader || undefined);
  }, [wallet, blockchainReader]);

  // Memoize the task escrow service and only create it when solanaService is available
  const taskEscrowService = useMemo(() => {
    if (!solanaService || !blockchainReader) {
      return null;
    }
    return new TaskEscrowService(solanaService, blockchainReader);
  }, [solanaService, blockchainReader]);
  const taskRewardService = useMemo(() => {
    if (!solanaService || !blockchainReader) {
      return null;
    }
    return new TaskRewardServiceImpl(solanaService, blockchainReader);
  }, [solanaService, blockchainReader]);

  return {
    solanaService,
    taskEscrowService,
    blockchainReader,
    taskRewardService,
  };
}
