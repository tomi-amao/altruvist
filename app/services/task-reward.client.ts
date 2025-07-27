import { SolanaService } from "./solana.client";
import { BlockchainReaderService } from "./blockchain-reader.client";
import { toast } from "react-toastify";
import { PublicKey } from "@solana/web3.js";

export interface TaskRewardService {
  /**
   * Assign task to volunteer on the blockchain when charity accepts their application
   */
  assignTaskToVolunteer(
    taskId: string,
    volunteerWalletAddress: string,
    creatorWalletAddress: string,
  ): Promise<string | undefined>;

  /**
   * Update task status on the blockchain
   */
  updateTaskStatus(
    taskId: string,
    newStatus: "InProgress" | "Completed" | "Cancelled",
    creatorWalletAddress: string,
  ): Promise<string | undefined>;

  /**
   * Allow volunteer to claim their token reward
   */
  claimReward(
    taskId: string,
    creatorWalletAddress: string,
  ): Promise<string | undefined>;

  /**
   * Check if volunteer can claim rewards for a task
   */
  canClaimReward(
    taskId: string,
    volunteerWalletAddress: string,
    creatorWalletAddress: string,
  ): Promise<boolean>;
}

export class TaskRewardServiceImpl implements TaskRewardService {
  constructor(
    private solanaService: SolanaService,
    private blockchainReader: BlockchainReaderService,
  ) {}

  async assignTaskToVolunteer(
    taskId: string,
    volunteerWalletAddress: string,
    creatorWalletAddress: string,
  ): Promise<string | undefined> {
    try {
      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Creator wallet not connected");
      }

      // Verify the caller is the task creator
      if (
        this.solanaService.wallet.publicKey.toBase58() !== creatorWalletAddress
      ) {
        throw new Error(
          "Only task creator can assign volunteers. Please check your connected wallet account.",
        );
      }

      toast.info(`Assigning task to volunteer...`);

      const volunteerPubkey = new PublicKey(volunteerWalletAddress);

      const txSignature = await this.solanaService.program.methods
        .assignTask(taskId, volunteerPubkey)
        .accounts({
          creator: this.solanaService.wallet.publicKey,
        })
        .rpc({
          commitment: "confirmed",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0,
        });

      toast.success(
        `Volunteer assigned successfully! Transaction: ${txSignature}`,
      );
      return txSignature;
    } catch (error) {
      console.error("Error assigning task to volunteer:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Assignment transaction already processed, checking task status...",
        );
        toast.info(
          "Transaction was already processed. Checking assignment status...",
        );

        // Check if the volunteer was actually assigned to the task
        try {
          const taskInfo = await this.blockchainReader.getTaskInfo(
            taskId,
            creatorWalletAddress,
          );
          if (taskInfo) {
            const volunteerPubkey = new PublicKey(volunteerWalletAddress);
            const isAssigned = taskInfo.assignees.some(
              (assignee) => assignee.toBase58() === volunteerPubkey.toBase58(),
            );

            if (isAssigned) {
              toast.success(
                "Volunteer was already assigned to this task successfully!",
              );
              return "already_processed";
            } else {
              toast.warning(
                "Transaction processed but volunteer assignment status unclear",
              );
              return "already_processed";
            }
          }
        } catch (checkError) {
          console.error("Error checking task assignment:", checkError);
          toast.warning(
            "Transaction already processed but assignment status unclear",
          );
          return "already_processed";
        }
      }

      // Handle duplicate assignment errors
      if (
        error instanceof Error &&
        (error.message.includes("DuplicateAssignee") ||
          error.message.includes("Duplicate assignee detected"))
      ) {
        toast.warn("This volunteer is already assigned to this task.");
        return undefined;
      }
      // Handle wallet-related errors
      if (
        error instanceof Error &&
        (error.message.includes("WalletSignTransactionError") ||
          error.message.includes("User rejected the request"))
      ) {
        toast.error("Transaction was rejected. Please try again.");
        return undefined;
      }

      toast.error(
        `Failed to assign volunteer: ${error instanceof Error ? error.message : String(error)}`,
      );

      return undefined;
    }
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NOT_STARTED",
    creatorWalletAddress: string,
  ): Promise<string | undefined> {
    try {
      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Creator wallet not connected");
      }

      // Verify the caller is the task creator
      if (
        this.solanaService.wallet.publicKey.toBase58() !== creatorWalletAddress
      ) {
        throw new Error(
          "Only task creator can update task status. Please check your connected wallet account.",
        );
      }

      toast.info(`Updating task status to ${newStatus}...`);

      // Convert status to the format expected by the Solana program
      // Use explicit camelCase format for Anchor enum variants
      let statusObj;
      switch (newStatus) {
        case "IN_PROGRESS":
          statusObj = { inProgress: {} };
          break;
        case "COMPLETED":
          statusObj = { completed: {} };
          break;
        case "CANCELLED":
          statusObj = { cancelled: {} };
          break;
        case "NOT_STARTED":
          statusObj = { notStarted: {} };
          break;
        default:
          throw new Error(`Invalid status: ${newStatus}`);
      }

      console.log(`Updating task ${taskId} status to`, statusObj);

      const [taskPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("task"),
          Buffer.from(taskId),
          new PublicKey(creatorWalletAddress).toBuffer(),
        ],
        this.solanaService.program.programId,
      );
      console.log(`Task PDA for ${taskId}:`, taskPDA.toBase58());

      const txSignature = await this.solanaService.program.methods
        .updateTaskStatus(taskId, statusObj)
        .accountsStrict({
          creator: this.solanaService.wallet.publicKey,
          task: taskPDA,
        })
        .rpc({
          commitment: "confirmed",
        });

      toast.success(
        `Task status updated successfully! Transaction: ${txSignature}`,
      );
      return txSignature;
    } catch (error) {
      console.error("Error updating task status:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Status update transaction already processed, checking task status...",
        );
        toast.info(
          "Transaction was already processed. Checking task status...",
        );

        // Check if the task status was actually updated
        try {
          const taskInfo = await this.blockchainReader.getTaskInfo(
            taskId,
            creatorWalletAddress,
          );
          if (taskInfo && taskInfo.status) {
            // Check if the status matches what we intended to set
            const expectedStatusKey = newStatus.toLowerCase();
            const currentStatus = taskInfo.status;

            // Check if the current status matches our intended update
            if (expectedStatusKey in currentStatus) {
              toast.success(
                `Task status was already updated to ${newStatus} successfully!`,
              );
              return "already_processed";
            } else {
              // Get the current status for feedback
              const currentStatusKey = Object.keys(currentStatus)[0];
              const currentStatusDisplay =
                currentStatusKey.charAt(0).toUpperCase() +
                currentStatusKey.slice(1);
              toast.warning(
                `Transaction processed but task status is ${currentStatusDisplay}, not ${newStatus}`,
              );
              return "already_processed";
            }
          }
        } catch (checkError) {
          console.error("Error checking task status update:", checkError);
          toast.warning(
            "Transaction already processed but status update unclear",
          );
          return "already_processed";
        }
      }

      // Handle wallet-related errors
      if (
        error instanceof Error &&
        (error.message.includes("WalletSignTransactionError") ||
          error.message.includes("User rejected the request"))
      ) {
        toast.error("Transaction was rejected. Please try again.");
        return undefined;
      }

      // Handle invalid status transition errors
      if (
        error instanceof Error &&
        error.message.includes("InvalidStatusTransition")
      ) {
        toast.error(
          `Cannot change task status to ${newStatus}. Invalid status transition.`,
        );
        return undefined;
      }

      toast.error(
        `Failed to update task status: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async claimReward(
    taskId: string,
    creatorWalletAddress: string,
  ): Promise<string | undefined> {
    try {
      if (!this.solanaService.wallet?.publicKey) {
        throw new Error("Volunteer wallet not connected");
      }

      toast.info(`Claiming reward for task...`);

      // Get faucet info for mint address
      const faucetInfo = await this.blockchainReader.getFaucetInfo();
      if (!faucetInfo) {
        throw new Error("Failed to get faucet information");
      }

      const [taskPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("task"),
          Buffer.from(taskId),
          new PublicKey(creatorWalletAddress).toBuffer(),
        ],
        this.solanaService.program.programId,
      );

      const txSignature = await this.solanaService.program.methods
        .claimReward(taskId)
        .accounts({
          creator: new PublicKey(creatorWalletAddress),
          mint: new PublicKey(faucetInfo.mint),
          assignee: this.solanaService.wallet.publicKey,
          task: taskPDA,
        })
        .rpc({
          commitment: "confirmed",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0,
        });

      toast.success(`Reward claimed successfully! Transaction: ${txSignature}`);
      return txSignature;
    } catch (error) {
      console.error("Error claiming reward:", error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("UnauthorizedAssignee")) {
          toast.error("You are not assigned to this task");
        } else if (error.message.includes("AlreadyClaimed")) {
          toast.error("You have already claimed your reward for this task");
        } else if (error.message.includes("InvalidTaskStatus")) {
          toast.error("Task must be completed before claiming rewards");
        } else {
          toast.error(`Failed to claim reward: ${error.message}`);
        }
      } else {
        toast.error("Failed to claim reward");
      }

      return undefined;
    }
  }

  async canClaimReward(
    taskId: string,
    volunteerWalletAddress: string,
    creatorWalletAddress: string,
  ): Promise<boolean> {
    try {
      // Get task info from blockchain
      const taskInfo = await this.blockchainReader.getTaskInfo(
        taskId,
        creatorWalletAddress,
      );
      if (!taskInfo) {
        return false;
      }

      // Check if task is completed
      if (!taskInfo.status || !("completed" in taskInfo.status)) {
        return false;
      }

      // Check if volunteer is assigned to this task
      const volunteerPubkey = new PublicKey(volunteerWalletAddress);
      const isAssigned = taskInfo.assignees.some(
        (assignee) => assignee.toBase58() === volunteerPubkey.toBase58(),
      );

      if (!isAssigned) {
        return false;
      }

      // Check if volunteer has already claimed
      const alreadyClaimed = taskInfo.claimedAssignees.some(
        (claimedAssignee) =>
          claimedAssignee.toBase58() === volunteerPubkey.toBase58(),
      );

      return !alreadyClaimed;
    } catch (error) {
      console.error("Error checking claim eligibility:", error);
      return false;
    }
  }
}
