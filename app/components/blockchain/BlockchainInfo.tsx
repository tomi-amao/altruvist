import React, { useState } from "react";
import {
  CaretDown,
  CaretUp,
  ArrowSquareOut,
  Warning,
  Coins,
  Wallet,
  Plus,
} from "@phosphor-icons/react";
import { OnChainTaskData, EscrowAccountData } from "~/types/blockchain";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface BlockchainInfoProps {
  onChainTask?: OnChainTaskData | null;
  escrowInfo?: EscrowAccountData | null;
  isLoading?: boolean;
  rewardAmount?: number;
  taskId?: string;
  creatorWallet?: string;
  userRole?: string[];
  onRetryEscrow?: () => void;
  isRetrying?: boolean;
  onUpdateReward?: (newAmount: number) => void;
  isUpdatingReward?: boolean;
  onAddWallet?: (walletAddress: string) => void;
  isAddingWallet?: boolean;
}

export function BlockchainInfo({
  onChainTask,
  escrowInfo,
  isLoading = false,
  rewardAmount,
  taskId,
  creatorWallet,
  userRole,
  onRetryEscrow,
  isRetrying = false,
  onUpdateReward,
  isUpdatingReward = false,
  onAddWallet,
  isAddingWallet = false,
}: BlockchainInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { connected, publicKey } = useWallet();

  // Don't render if no blockchain data and no reward amount
  if (!onChainTask && !escrowInfo && !rewardAmount) {
    return null;
  }

  const hasBlockchainData = onChainTask || escrowInfo;
  const tokenBalance = escrowInfo?.data?.amount
    ? (Number(escrowInfo.data.amount) / 1000000).toFixed(6)
    : "0";
  const rewardAmountFormatted = onChainTask?.rewardAmount
    ? parseInt(onChainTask.rewardAmount.toString()) / 1000000
    : rewardAmount
      ? rewardAmount
      : "0";

  const escrowStatus = onChainTask?.status?.created
    ? "Active"
    : onChainTask?.status
      ? Object.keys(onChainTask.status)[0]
      : "Unknown";

  // Check if there's a discrepancy between database and blockchain reward amounts
  const onChainRewardAmount = onChainTask?.rewardAmount
    ? parseInt(onChainTask.rewardAmount.toString()) / 1000000
    : 0;
  const databaseRewardAmount = rewardAmount ? rewardAmount : 0;
  const hasRewardDiscrepancy =
    hasBlockchainData &&
    Math.abs(onChainRewardAmount - databaseRewardAmount) > 0.000001; // Account for floating point precision

  // Check if task needs wallet address to be added
  const needsWalletAddress =
    rewardAmount &&
    rewardAmount > 0 &&
    !creatorWallet &&
    userRole?.includes("charity");

  // Show retry button if:
  // 1. No blockchain data exists (no escrow created)
  // 2. User is the creator (charity role)
  // 3. There is a reward amount
  // 4. We have the required data (taskId, creatorWallet)
  const showRetryButton =
    !hasBlockchainData &&
    rewardAmount &&
    rewardAmount > 0 &&
    userRole?.includes("charity") &&
    taskId &&
    creatorWallet &&
    onRetryEscrow;

  // Show update reward button if:
  // 1. There is blockchain data
  // 2. There's a discrepancy between database and blockchain amounts
  // 3. User is the creator (charity role)
  // 4. We have the required data and callback
  const showUpdateRewardButton =
    hasBlockchainData &&
    hasRewardDiscrepancy &&
    userRole?.includes("charity") &&
    taskId &&
    rewardAmount &&
    onUpdateReward;

  const handleAddWallet = () => {
    if (connected && publicKey && onAddWallet) {
      onAddWallet(publicKey.toBase58());
    }
  };

  return (
    <div className="bg-basePrimaryLight rounded-xl p-4 border border-baseSecondary/10 transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8  rounded-lg flex items-center justify-center">
            <Coins size={24} className="text-baseSecondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-baseSecondary">
              Blockchain Escrow
            </h3>
            <p className="text-xs text-baseSecondary/70">
              {hasBlockchainData
                ? "On-chain reward system"
                : "Reward available"}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-baseSecondary/30 border-t-purple-500 rounded-full"></div>
            <span className="text-xs text-baseSecondary/70">Loading...</span>
          </div>
        )}
      </div>

      {/* Wallet Address Required Warning */}
      {needsWalletAddress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Wallet Address Required
            </span>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            This task has a reward amount but no wallet address associated with
            it. Add your wallet address to enable blockchain escrow creation.
          </p>

          {connected && publicKey ? (
            <button
              onClick={handleAddWallet}
              disabled={isAddingWallet}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isAddingWallet
                  ? "bg-blue-200 text-blue-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
              }`}
            >
              {isAddingWallet ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding Wallet...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Connected Wallet
                </>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-blue-600">
                Connect your Solana wallet to add it to this task:
              </p>
              <WalletMultiButton className="!bg-blue-600 !text-white !rounded-lg !px-3 !py-2 !text-sm hover:!bg-blue-700" />
            </div>
          )}
        </div>
      )}

      {/* Reward Discrepancy Warning */}
      {hasRewardDiscrepancy && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Warning className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Reward Amount Mismatch
            </span>
          </div>
          <p className="text-xs text-amber-700 mb-2">
            Database: {databaseRewardAmount.toFixed(6)} ALT | Blockchain:{" "}
            {onChainRewardAmount.toFixed(6)} ALT
          </p>
          <p className="text-xs text-amber-600">
            The reward amount in the database differs from the blockchain.
            Update the blockchain to match the database amount.
          </p>
        </div>
      )}

      {hasBlockchainData ? (
        <>
          {/* Key Information - Always Visible */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-basePrimary rounded-lg p-3 border border-baseSecondary/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-baseSecondary/70 uppercase tracking-wider">
                  Reward Amount
                </span>
              </div>
              <p className="text-lg font-bold text-baseSecondary">
                {rewardAmountFormatted}
              </p>
              <p className="text-xs text-baseSecondary/60">ALT tokens</p>
            </div>

            <div className="bg-basePrimary rounded-lg p-3 border border-baseSecondary/10">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    escrowStatus === "Active"
                      ? "bg-green-500"
                      : escrowStatus === "Created"
                        ? "bg-blue-500"
                        : "bg-gray-500"
                  }`}
                ></div>
                <span className="text-xs font-medium text-baseSecondary/70 uppercase tracking-wider">
                  Status
                </span>
              </div>
              <p className="text-lg font-semibold text-baseSecondary capitalize">
                {escrowStatus}
              </p>
              <p className="text-xs text-baseSecondary/60">Escrow state</p>
            </div>
          </div>

          {/* Update Reward Button */}
          {showUpdateRewardButton && (
            <div className="mb-4">
              <button
                onClick={() => onUpdateReward && onUpdateReward(rewardAmount)}
                disabled={isUpdatingReward}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  ${
                    isUpdatingReward
                      ? "bg-baseSecondary/50 text-basePrimary/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:shadow-md"
                  }`}
              >
                {isUpdatingReward ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating Reward...
                  </div>
                ) : (
                  "Update Blockchain Reward"
                )}
              </button>
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-basePrimary hover:bg-basePrimaryDark rounded-lg transition-colors text-sm font-medium text-baseSecondary border border-baseSecondary/10"
          >
            <span>{isExpanded ? "Hide Details" : "Show More Details"}</span>
            {isExpanded ? (
              <CaretUp className="w-4 h-4" />
            ) : (
              <CaretDown className="w-4 h-4" />
            )}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* On-Chain Task Details */}
              {onChainTask && (
                <div className="bg-basePrimary rounded-lg p-3 border border-baseSecondary/10">
                  <h4 className="text-xs font-semibold text-baseSecondary/80 mb-3 uppercase tracking-wider">
                    Task Escrow Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-baseSecondary/70 block mb-1">
                        Task ID
                      </span>
                      <p className="text-baseSecondary font-mono text-xs break-all bg-basePrimaryLight p-1 rounded">
                        {onChainTask.taskId}
                      </p>
                    </div>

                    <div>
                      <span className="text-baseSecondary/70 block mb-1">
                        Creator
                      </span>
                      <p className="text-baseSecondary font-mono text-xs break-all bg-basePrimaryLight p-1 rounded">
                        {onChainTask.creator?.toString() || "N/A"}
                      </p>
                    </div>

                    {onChainTask.assignee && (
                      <div className="md:col-span-2">
                        <span className="text-baseSecondary/70 block mb-1">
                          Assignee
                        </span>
                        <p className="text-baseSecondary font-mono text-xs break-all bg-basePrimaryLight p-1 rounded">
                          {onChainTask.assignee.toString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-baseSecondary/70 block mb-1">
                        Created
                      </span>
                      <p className="text-baseSecondary text-xs">
                        {onChainTask.createdAt
                          ? new Date(
                              parseInt(onChainTask.createdAt.toString()) * 1000,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Escrow Account Details */}
              {escrowInfo && (
                <div className="bg-basePrimary rounded-lg p-3 border border-baseSecondary/10">
                  <h4 className="text-xs font-semibold text-baseSecondary/80 mb-3 uppercase tracking-wider">
                    Escrow Account Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <span className="text-baseSecondary/70 block mb-1">
                        Escrow Address
                      </span>
                      <p className="text-baseSecondary font-mono text-xs break-all bg-basePrimaryLight p-2 rounded">
                        {escrowInfo.address}
                      </p>
                    </div>

                    <div>
                      <span className="text-baseSecondary/70 block mb-1">
                        Token Balance
                      </span>
                      <p className="text-baseSecondary font-semibold">
                        {tokenBalance} ALT
                      </p>
                    </div>

                    <div>
                      <span className="text-baseSecondary/70 block mb-1">
                        SOL Balance
                      </span>
                      <p className="text-baseSecondary font-semibold">
                        {escrowInfo.lamports
                          ? (Number(escrowInfo.lamports) / 1000000000).toFixed(
                              6,
                            )
                          : "0"}{" "}
                        SOL
                      </p>
                    </div>

                    <div>
                      <span className="text-baseSecondary/70 block mb-1">
                        Token Mint
                      </span>
                      <p className="text-baseSecondary font-mono text-xs break-all bg-basePrimaryLight p-1 rounded">
                        {escrowInfo.data?.mint || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-baseSecondary/70 block mb-1">
                        Account State
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          escrowInfo.data?.state === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {escrowInfo.data?.state === 1
                          ? "Initialized"
                          : escrowInfo.data?.state === 0
                            ? "Uninitialized"
                            : `State ${escrowInfo.data?.state || "Unknown"}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* External Link */}
              {onChainTask?.escrowAccount && (
                <div className="flex justify-center pt-2">
                  <a
                    href={`https://explorer.solana.com/account/${onChainTask.escrowAccount.toString()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r bg-baseSecondary text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <ArrowSquareOut className="w-4 h-4" />
                    View on Solana Explorer
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        // No blockchain data but has reward amount - Show retry option
        <div className="text-center py-4">
          <div className="bg-basePrimary rounded-lg p-4 border border-baseSecondary/10 inline-block max-w-sm">
            <p className="text-sm font-semibold text-baseSecondary mb-1">
              Reward Amount: {rewardAmountFormatted} ALT
            </p>
            <p className="text-xs text-baseSecondary/70 mb-3">
              Escrow not yet created on blockchain
            </p>

            {showRetryButton && (
              <button
                onClick={onRetryEscrow}
                disabled={isRetrying}
                className={`w-full rounded-lg text-sm font-medium transition-all duration-300 ${
                  isRetrying
                    ? "opacity-50 cursor-not-allowed bg-baseSecondary/50 text-basePrimary/50 px-4 py-2"
                    : "animated-border-btn "
                }`}
              >
                <span>
                  {isRetrying ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-basePrimary/30 border-t-basePrimary rounded-full animate-spin"></div>
                      Creating Escrow...
                    </div>
                  ) : (
                    "Create Blockchain Escrow"
                  )}
                </span>
              </button>
            )}

            {!showRetryButton && userRole?.includes("charity") && (
              <p className="text-xs text-baseSecondary/60 italic">
                Connect your Solana wallet to create escrow
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
