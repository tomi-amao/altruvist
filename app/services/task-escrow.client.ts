import { SolanaService } from "./solana.client";
import { toast } from "react-toastify";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Altruvist } from "../../target/types/altruvist";

export interface TaskEscrowData {
  taskId: string;
  rewardAmount: number;
  creatorWallet: string;
  mintAddress: string;
}

// Use types directly from the IDL-generated types
export type TaskAccount = anchor.IdlAccounts<Altruvist>["task"];
export type FaucetAccount = anchor.IdlAccounts<Altruvist>["faucet"];
export type UserRequestRecord =
  anchor.IdlAccounts<Altruvist>["userRequestRecord"];
export type TaskStatus = anchor.IdlTypes<Altruvist>["TaskStatus"];

export class TaskEscrowService {
  private solanaService: SolanaService;

  constructor(solanaService: SolanaService) {
    this.solanaService = solanaService;
  }

  /**
   * Create a task escrow on the Solana blockchain
   * This will transfer tokens from the creator's wallet to the escrow account
   */
  async createTaskEscrow(
    taskData: TaskEscrowData,
  ): Promise<string | undefined> {
    try {
      toast.info(`Creating escrow for task: ${taskData.taskId}`);

      // Convert reward amount to the correct decimal places (6 decimals for SPL tokens)
      const rewardAmountWithDecimals = taskData.rewardAmount * Math.pow(10, 6);

      // Get faucet info to get the mint address
      const faucetInfo = await this.solanaService.getFaucetInfo();
      if (!faucetInfo) {
        toast.error("Failed to get faucet information");
        return undefined;
      }

      // Create the task escrow using the Solana program
      // This would interact with your Rust program's create_task instruction
      const txSignature = await this.createTaskOnChain(
        taskData.taskId,
        new anchor.BN(rewardAmountWithDecimals),
        faucetInfo.mint,
      );

      if (txSignature) {
        toast.success(
          `Task escrow created successfully! Transaction: ${txSignature}`,
        );
        return txSignature;
      }

      return undefined;
    } catch (error) {
      console.error("Error creating task escrow:", error);
      toast.error(
        `Failed to create task escrow: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /**
   * Create task on the Solana blockchain using the program
   */
  private async createTaskOnChain(
    taskId: string,
    rewardAmount: anchor.BN,
    mintAddress: string,
  ): Promise<string | undefined> {
    try {
      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Derive the task PDA
      const [taskPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("task"),
          Buffer.from(taskId),
          this.solanaService.wallet.publicKey.toBuffer(),
        ],
        this.solanaService.program.programId,
      );
      console.log("Creating task with PDA:", taskPDA.toBase58());

      // Create the task with escrow
      const txSignature = await this.solanaService.program.methods
        .createTask(taskId, rewardAmount)
        .accounts({
          mint: new PublicKey(mintAddress),
          creator: this.solanaService.wallet.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      // Confirm the transaction
      //   const latestBlockhash =
      //     await this.solanaService.provider.connection.getLatestBlockhash(
      //       "confirmed",
      //     );
      //   await this.solanaService.provider.connection.confirmTransaction({
      //     signature: txSignature,
      //     blockhash: latestBlockhash.blockhash,
      //     lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      //   });
      toast.success(`Task created successfully! Transaction: ${txSignature}`);
      return txSignature;
    } catch (error) {
      console.error("Error creating task on chain:", error);
      throw error;
    }
  }

  /**
   * Complete a task and transfer tokens to the assignee
   */
  async completeTask(
    taskId: string,
    assigneeWallet: string,
  ): Promise<string | undefined> {
    try {
      toast.info(`Completing task: ${taskId}`);

      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Get faucet info for mint address
      const faucetInfo = await this.solanaService.getFaucetInfo();
      if (!faucetInfo) {
        throw new Error("Failed to get faucet information");
      }

      // Derive task PDA
      const [taskPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("task"),
          Buffer.from(taskId),
          this.solanaService.wallet.publicKey.toBuffer(),
        ],
        this.solanaService.program.programId,
      );

      // Complete the task
      const txSignature = await this.solanaService.program.methods
        .completeTask(taskId)
        .accounts({
          task: taskPDA,
          assignee: new PublicKey(assigneeWallet),
          mint: new PublicKey(faucetInfo.mint),
        })
        .rpc();

      // Confirm the transaction
      const latestBlockhash =
        await this.solanaService.provider.connection.getLatestBlockhash(
          "confirmed",
        );
      await this.solanaService.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      toast.success(`Task completed successfully! Transaction: ${txSignature}`);
      return txSignature;
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error(
        `Failed to complete task: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /**
   * Cancel a task and return tokens to the creator
   */
  async cancelTask(taskId: string): Promise<string | undefined> {
    try {
      toast.info(`Cancelling task: ${taskId}`);

      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Get faucet info for mint address
      const faucetInfo = await this.solanaService.getFaucetInfo();
      if (!faucetInfo) {
        throw new Error("Failed to get faucet information");
      }

      // Derive task PDA
      const [taskPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("task"),
          Buffer.from(taskId),
          this.solanaService.wallet.publicKey.toBuffer(),
        ],
        this.solanaService.program.programId,
      );

      // Cancel the task
      const txSignature = await this.solanaService.program.methods
        .cancelTask(taskId)
        .accounts({
          task: taskPDA,
          creator: this.solanaService.wallet.publicKey,
          mint: new PublicKey(faucetInfo.mint),
        })
        .rpc();

      // Confirm the transaction
      const latestBlockhash =
        await this.solanaService.provider.connection.getLatestBlockhash(
          "confirmed",
        );
      await this.solanaService.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      toast.success(`Task cancelled successfully! Transaction: ${txSignature}`);
      return txSignature;
    } catch (error) {
      console.error("Error cancelling task:", error);
      toast.error(
        `Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
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
        this.solanaService.program.programId,
      );

      const taskAccount =
        await this.solanaService.program.account.task.fetch(taskPDA);
      return taskAccount as TaskAccount;
    } catch (error) {
      console.error("Error fetching task info:", error);
      return null;
    }
  }
}
