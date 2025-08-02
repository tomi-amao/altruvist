import { SolanaService } from "./solana.client";
import { BlockchainReaderService } from "./blockchain-reader.client";
import { toast } from "react-toastify";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Altruvist } from "../../target/types/altruvist"; // eslint-disable-line
import { type Address } from "@solana/kit";

export interface TaskEscrowData {
  taskId: string;
  rewardAmount: number;
  creatorWallet: string;
  mintAddress: string;
}

export interface SimulationOptions {
  simulate?: boolean;
  logSimulation?: boolean;
}

// Use types directly from the IDL-generated types
export type TaskAccount = anchor.IdlAccounts<Altruvist>["task"];
export type FaucetAccount = anchor.IdlAccounts<Altruvist>["faucet"];
export type UserRequestRecord =
  anchor.IdlAccounts<Altruvist>["userRequestRecord"];
export type TaskStatus = anchor.IdlTypes<Altruvist>["TaskStatus"];

export class TaskEscrowService {
  private solanaService: SolanaService;
  private blockchainReader: BlockchainReaderService;

  constructor(
    solanaService: SolanaService,
    blockchainReader?: BlockchainReaderService,
  ) {
    this.solanaService = solanaService;
    // Use the provided blockchainReader or create a new one (for backwards compatibility)
    this.blockchainReader = blockchainReader || new BlockchainReaderService();
  }

  /**
   * Simulate a transaction before executing it
   * This helps identify potential issues and estimate compute units
   */
  private async simulateTransaction(
    transaction: Transaction,
    description: string = "Transaction",
  ) {
    try {
      console.log(`🔍 Simulating ${description}...`);

      const versionedTransaction = new anchor.web3.VersionedTransaction(
        transaction.compileMessage(),
      );
      const simulation =
        await this.solanaService.provider.connection.simulateTransaction(
          versionedTransaction,
          {
            sigVerify: false, // Skip signature verification for simulation
            replaceRecentBlockhash: true, // Use a fresh blockhash
          },
        );
      console.log(JSON.stringify(simulation).replace(/,/g, ",\n"));

      if (simulation.value.err) {
        console.error(
          `❌ ${description} simulation failed:`,
          simulation.value.err,
        );
        toast.error(
          `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
        );
        return false;
      }

      if (simulation.value.logs) {
        console.log(`📋 ${description} Logs:`, simulation.value.logs);
      }

      toast.info(
        `✅ ${description} simulation successful! Compute units: ${simulation.value.unitsConsumed || "N/A"}`,
      );
      return true;
    } catch (error) {
      console.error(`❌ Error simulating ${description}:`, error);
      toast.error(
        `Simulation error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Create a task escrow on the Solana blockchain
   * This will transfer tokens from the creator's wallet to the escrow account
   */
  async createTaskEscrow(
    taskData: TaskEscrowData,
    options: SimulationOptions = {},
  ): Promise<string | undefined> {
    try {
      toast.info(`Creating escrow for task: ${taskData.taskId}`);

      // Convert reward amount to the correct decimal places (6 decimals for SPL tokens)
      const rewardAmountWithDecimals = taskData.rewardAmount * Math.pow(10, 6);

      // Get faucet info to get the mint address
      const faucetInfo = await this.blockchainReader.getFaucetInfo();
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
        options,
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
    options: SimulationOptions = {},
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

      // Build the transaction instruction

      // Create transaction for simulation
      if (options.simulate) {
        const instruction = await this.solanaService.program.methods
          .createTask(taskId, rewardAmount)
          .accounts({
            mint: new PublicKey(mintAddress),
            creator: this.solanaService.wallet.publicKey,
          })
          .instruction();
        const transaction = new Transaction();
        const latestBlockhash =
          await this.solanaService.provider.connection.getLatestBlockhash(
            "confirmed",
          );
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = this.solanaService.wallet.publicKey;
        transaction.add(instruction);

        const simulationSuccess = await this.simulateTransaction(
          transaction,
          "Create Task",
        );

        if (!simulationSuccess) {
          return undefined;
        }

        if (options.logSimulation) {
          console.log("🔍 Create Task Transaction Details:", {
            taskId,
            rewardAmount: rewardAmount.toString(),
            mintAddress,
            taskPDA: taskPDA.toBase58(),
            creator: this.solanaService.wallet.publicKey.toBase58(),
          });
        }
      }

      // Execute the actual transaction
      const txSignature = await this.solanaService.program.methods
        .createTask(taskId, rewardAmount)
        .accounts({
          mint: new PublicKey(mintAddress),
          creator: this.solanaService.wallet.publicKey,
        })
        .rpc({
          commitment: "confirmed",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0,
        });
      console.log(txSignature);

      toast.success(`Task created successfully! Transaction: ${txSignature}`);
      return txSignature;
    } catch (error) {
      console.error("Error creating task on chain:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Transaction already processed, checking if task exists...",
        );
        toast.info(
          "Transaction was already processed. Checking task status...",
        );

        // Check if the task actually exists on-chain
        try {
          const taskInfo = await this.getTaskInfo(
            taskId,
            this.solanaService.wallet.publicKey.toBase58(),
          );
          if (taskInfo) {
            toast.success("Task already exists on blockchain!");
            // Return a placeholder signature since we can't get the original one
            return "already_processed";
          }
        } catch (checkError) {
          console.error("Error checking task existence:", checkError);
        }

        toast.warning("Transaction already processed but task status unclear");
        return "already_processed";
      }

      throw error;
    }
  }

  /**
   * Complete a task and transfer tokens to the assignee
   */
  async completeTask(
    taskId: string,
    assigneeWallet: string,
    options: SimulationOptions = {},
  ): Promise<string | undefined> {
    try {
      toast.info(`Completing task: ${taskId}`);

      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Get faucet info for mint address
      const faucetInfo = await this.blockchainReader.getFaucetInfo();
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

      // Build the transaction instruction for simulation
      if (options.simulate) {
        const instruction = await this.solanaService.program.methods
          .completeTask(taskId)
          .accounts({
            task: taskPDA,
            assignee: new PublicKey(assigneeWallet),
            mint: new PublicKey(faucetInfo.mint),
          })
          .instruction();

        const transaction = new Transaction();
        const latestBlockhash =
          await this.solanaService.provider.connection.getLatestBlockhash(
            "confirmed",
          );
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = this.solanaService.wallet.publicKey;
        transaction.add(instruction);

        const simulationSuccess = await this.simulateTransaction(
          transaction,
          "Complete Task",
        );

        if (!simulationSuccess) {
          return undefined;
        }
      }

      // Complete the task
      const txSignature = await this.solanaService.program.methods
        .completeTask(taskId)
        .accounts({
          task: taskPDA,
          assignee: new PublicKey(assigneeWallet),
          mint: new PublicKey(faucetInfo.mint),
        })
        .rpc({
          commitment: "confirmed",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0,
        });

      toast.success(`Task completed successfully! Transaction: ${txSignature}`);
      return txSignature;
    } catch (error) {
      console.error("Error completing task:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Complete transaction already processed, checking task status...",
        );
        toast.info(
          "Transaction was already processed. Checking task status...",
        );

        // Check if the task was actually completed
        try {
          const taskInfo = await this.getTaskInfo(
            taskId,
            this.solanaService.wallet.publicKey.toBase58(),
          );
          if (taskInfo && taskInfo.status && "completed" in taskInfo.status) {
            toast.success("Task was already completed successfully!");
            return "already_processed";
          } else {
            toast.warning(
              "Transaction processed but task completion status unclear",
            );
            return "already_processed";
          }
        } catch (checkError) {
          console.error("Error checking task completion:", checkError);
          toast.warning(
            "Transaction already processed but task status unclear",
          );
          return "already_processed";
        }
      }

      toast.error(
        `Failed to complete task: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /**
   * Delete a task and return tokens to the creator
   */
  async deleteTask(
    taskId: string,
    options: SimulationOptions = {},
  ): Promise<string | undefined> {
    try {
      toast.info(`Cancelling task: ${taskId}`);

      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Get faucet info for mint address
      const faucetInfo = await this.blockchainReader.getFaucetInfo();
      if (!faucetInfo) {
        throw new Error("Failed to get faucet information");
      }

      // Derive task PDA

      // Build the transaction instruction for simulation
      if (options.simulate) {
        const instruction = await this.solanaService.program.methods
          .deleteTask(taskId)
          .accounts({
            creator: this.solanaService.wallet.publicKey,
            mint: new PublicKey(faucetInfo.mint),
          })
          .instruction();

        const transaction = new Transaction();
        const latestBlockhash =
          await this.solanaService.provider.connection.getLatestBlockhash(
            "confirmed",
          );
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = this.solanaService.wallet.publicKey;
        transaction.add(instruction);

        const simulationSuccess = await this.simulateTransaction(
          transaction,
          "Delete Task",
        );

        if (!simulationSuccess) {
          return undefined;
        }
      }

      // Cancel the task
      const txSignature = await this.solanaService.program.methods
        .deleteTask(taskId)
        .accounts({
          creator: this.solanaService.wallet.publicKey,
          mint: new PublicKey(faucetInfo.mint),
        })
        .rpc({
          commitment: "confirmed",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0,
        });

      toast.success(`Task cancelled successfully! Transaction: ${txSignature}`);
      return txSignature;
    } catch (error) {
      console.error("Error cancelling task:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Delete transaction already processed, checking if task still exists...",
        );
        toast.info(
          "Transaction was already processed. Checking task status...",
        );

        // Check if the task still exists on-chain (it should be deleted if transaction succeeded)
        try {
          const taskInfo = await this.getTaskInfo(
            taskId,
            this.solanaService.wallet.publicKey.toBase58(),
          );
          if (!taskInfo) {
            toast.success("Task was already deleted successfully!");
            return "already_processed";
          } else {
            toast.warning("Transaction processed but task still exists");
            return "already_processed";
          }
        } catch (checkError) {
          console.error("Error checking task existence:", checkError);
          toast.warning(
            "Transaction already processed but task status unclear",
          );
          return "already_processed";
        }
      }

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
    return this.blockchainReader.getTaskInfo(taskId, creatorWallet);
  }

  async getEscrowInfo(escrowAddress: Address) {
    return this.blockchainReader.getEscrowInfo(escrowAddress);
  }

  /**
   * Update task reward amount on the blockchain
   */
  async updateTaskReward(
    taskId: string,
    newRewardAmount: number,
    options: SimulationOptions = {},
  ): Promise<string | undefined> {
    try {
      toast.info(`Updating task reward: ${taskId}`);

      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Convert reward amount to the correct decimal places (6 decimals for SPL tokens)
      const newRewardAmountWithDecimals = new anchor.BN(
        newRewardAmount * Math.pow(10, 6),
      );

      // Get faucet info for mint address
      const faucetInfo = await this.blockchainReader.getFaucetInfo();
      if (!faucetInfo) {
        throw new Error("Failed to get faucet information");
      }

      // Build the transaction instruction for simulation
      if (options.simulate) {
        const instruction = await this.solanaService.program.methods
          .updateTaskReward(taskId, newRewardAmountWithDecimals)
          .accounts({
            mint: new PublicKey(faucetInfo.mint),
            creator: this.solanaService.wallet.publicKey,
          })
          .instruction();

        const transaction = new Transaction();
        const latestBlockhash =
          await this.solanaService.provider.connection.getLatestBlockhash(
            "confirmed",
          );
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = this.solanaService.wallet.publicKey;
        transaction.add(instruction);

        const simulationSuccess = await this.simulateTransaction(
          transaction,
          "Update Task Reward",
        );

        if (!simulationSuccess) {
          return undefined;
        }
      }

      // Update the task reward
      const txSignature = await this.solanaService.program.methods
        .updateTaskReward(taskId, newRewardAmountWithDecimals)
        .accounts({
          mint: new PublicKey(faucetInfo.mint),
          creator: this.solanaService.wallet.publicKey,
        })
        .rpc({
          commitment: "confirmed",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0,
        });

      toast.success(
        `Task reward updated successfully! Transaction: ${txSignature}`,
      );
      return txSignature;
    } catch (error) {
      console.error("Error updating task reward:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Update transaction already processed, checking task status...",
        );
        toast.info(
          "Transaction was already processed. Checking task status...",
        );

        // Check if the task reward was actually updated
        try {
          const taskInfo = await this.getTaskInfo(
            taskId,
            this.solanaService.wallet.publicKey.toBase58(),
          );
          if (
            taskInfo &&
            taskInfo.rewardAmount.toString() ===
              (newRewardAmount * Math.pow(10, 6)).toString()
          ) {
            toast.success("Task reward was already updated successfully!");
            return "already_processed";
          } else {
            toast.warning(
              "Transaction processed but task reward update status unclear",
            );
            return "already_processed";
          }
        } catch (checkError) {
          console.error("Error checking task reward update:", checkError);
          toast.warning(
            "Transaction already processed but task status unclear",
          );
          return "already_processed";
        }
      }

      toast.error(
        `Failed to update task reward: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }
}
