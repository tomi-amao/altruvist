import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { fetchToken } from "@solana-program/token-2022";
import { address, type Address, createSolanaRpc } from "@solana/kit";
import idl from "../../target/idl/altruvist.json"; // eslint-disable-line
import { Altruvist } from "../../target/types/altruvist"; // eslint-disable-line
import { getSolanaConfig } from "~/lib/solana-config";

// Import types from the existing service
import type { TaskAccount } from "./task-escrow.client";

/**
 * Read-only blockchain service for fetching on-chain data without requiring a wallet connection
 * This service can be used independently to read blockchain state
 */
export class BlockchainReaderService {
  private connection: Connection;
  private program: anchor.Program<Altruvist>;

  constructor(network: string = "https://api.devnet.solana.com") {
    this.connection = new Connection(network, "confirmed");

    // Create a provider without wallet for read-only operations
    const provider = new anchor.AnchorProvider(
      this.connection,
      {} as anchor.Wallet, // Empty wallet object since we're only reading
      anchor.AnchorProvider.defaultOptions(),
    );

    // Create the program with proper typing
    this.program = new anchor.Program(idl as Altruvist, provider);
  }

  /**
   * Get faucet information from the blockchain
   */
  async getFaucetInfo(faucetSeed?: string): Promise<{
    address: string;
    mint: string;
    authority: string;
    tokenAccount: string;
    rateLimit: string;
    cooldownPeriod: string;
  } | null> {
    try {
      // Use environment-based faucet seed if not provided
      const seed = faucetSeed || getSolanaConfig().FAUCET_SEED;

      // Derive faucet PDA with configurable seed
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        this.program.programId,
      );

      // Use the properly typed program account access
      const faucetAccount = await this.program.account.faucet.fetch(faucetPda);

      return {
        address: faucetPda.toBase58(),
        mint: faucetAccount.mint.toBase58(),
        authority: faucetAccount.authority.toBase58(),
        tokenAccount: faucetAccount.tokenAccount.toBase58(),
        rateLimit: faucetAccount.rateLimit.toString(),
        cooldownPeriod: faucetAccount.cooldownPeriod.toString(),
      };
    } catch (error) {
      console.error("Error fetching faucet info:", error);
      return null;
    }
  }

  /**
   * Get task information from the blockchain
   */
  async getTaskInfo(
    taskId: string,
    creatorWallet: string,
  ): Promise<TaskAccount | null> {
    try {
      const [taskPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("task"),
          Buffer.from(taskId),
          new PublicKey(creatorWallet).toBuffer(),
        ],
        this.program.programId,
      );
      console.log("Fetching task info for PDA:", taskPDA.toBase58());

      // Use the properly typed program account access
      const taskAccount = await this.program.account.task.fetch(taskPDA);

      return taskAccount as TaskAccount;
    } catch (error) {
      console.error("Error fetching task info:", error);
      return null;
    }
  }

  /**
   * Get escrow account information
   */
  async getEscrowInfo(escrowAddress: Address) {
    try {
      const rpc = createSolanaRpc("https://api.devnet.solana.com");
      const escrowAccount = await fetchToken(
        rpc,
        address(escrowAddress.toString()),
      );

      if (!escrowAccount) {
        console.error("Escrow account not found:", escrowAddress);
        return null;
      }
      return escrowAccount;
    } catch (error) {
      console.error("Error fetching escrow info:", error);
      return null;
    }
  }

  /**
   * Get user token balance for a specific mint
   */
  async getUserTokenBalance(
    mintAddress: string,
    userWallet: string,
  ): Promise<number> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const userPubkey = new PublicKey(userWallet);

      // Derive associated token account
      const TOKEN_2022_PROGRAM_ID = new PublicKey(
        "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      );
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      );

      const [userTokenAccount] = PublicKey.findProgramAddressSync(
        [
          userPubkey.toBuffer(),
          TOKEN_2022_PROGRAM_ID.toBuffer(),
          mintPubkey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      const tokenAccountInfo =
        await this.connection.getTokenAccountBalance(userTokenAccount);
      return parseFloat(tokenAccountInfo.value.uiAmount?.toString() || "0");
    } catch (error) {
      console.error("Error fetching user token balance:", error);
      return 0;
    }
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSolBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(
        new PublicKey(walletAddress),
      );
      return balance / 1000000000; // Convert lamports to SOL
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      return 0;
    }
  }

  /**
   * Check if an account exists on the blockchain
   */
  async accountExists(address: string): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(
        new PublicKey(address),
      );
      return accountInfo !== null;
    } catch (error) {
      console.error("Error checking account existence:", error);
      return false;
    }
  }

  /**
   * Get total supply of a token mint
   */
  async getMintSupply(mintAddress: string): Promise<number> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const mintInfo = await this.connection.getTokenSupply(mintPubkey);
      return parseFloat(mintInfo.value.uiAmount?.toString() || "0");
    } catch (error) {
      console.error("Error fetching mint supply:", error);
      return 0;
    }
  }

  /**
   * Get faucet token account balance
   */
  async getFaucetTokenBalance(faucetTokenAccount: string): Promise<number> {
    try {
      const tokenAccountPubkey = new PublicKey(faucetTokenAccount);
      const tokenAccountInfo =
        await this.connection.getTokenAccountBalance(tokenAccountPubkey);
      return parseFloat(tokenAccountInfo.value.uiAmount?.toString() || "0");
    } catch (error) {
      console.error("Error fetching faucet token balance:", error);
      return 0;
    }
  }

  /**
   * Get count of completed on-chain tasks
   */
  async getCompletedTasksCount(): Promise<number> {
    try {
      // Get all program accounts for tasks
      const taskAccounts = await this.connection.getProgramAccounts(
        this.program.programId,
        {
          filters: [
            {
              memcmp: {
                offset: 0, // Discriminator offset for task accounts
                bytes: "task", // This would be the actual discriminator, needs to match your program
              },
            },
          ],
        },
      );

      let completedCount = 0;

      // Check each task account to see if it's completed
      for (const accountInfo of taskAccounts) {
        try {
          // Deserialize the account data to check task status
          const taskData = this.program.coder.accounts.decode(
            "task",
            accountInfo.account.data,
          );

          // Check if task is completed (assuming there's a status field)
          // This will depend on your task account structure
          if (taskData.isCompleted || taskData.status === 2) {
            // Adjust based on your enum values
            completedCount++;
          }
        } catch (error) {
          // Skip accounts that can't be deserialized as tasks
          console.log("Skipping account due to deserialization error:", error);

          continue;
        }
      }

      return completedCount;
    } catch (error) {
      console.error("Error fetching completed tasks count:", error);
      return 0;
    }
  }
}
