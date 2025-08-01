import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolanaService } from "~/hooks/useSolanaService";
import {
  CurrencyCircleDollar,
  CheckCircle,
  Clock,
  Wallet,
} from "@phosphor-icons/react";

interface ClaimRewardButtonProps {
  task: {
    id: string;
    title: string;
    rewardAmount?: number;
    creatorWalletAddress?: string;
    status: string;
  };
  taskApplication: {
    id: string;
    volunteerWalletAddress?: string;
    status: string;
  };
  onRewardClaimed?: () => void;
}

export function ClaimRewardButton({
  task,
  taskApplication,
  onRewardClaimed,
}: ClaimRewardButtonProps) {
  const { connected, publicKey } = useWallet();
  const { taskRewardService } = useSolanaService();
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [canClaim, setCanClaim] = useState<boolean | null>(null);

  // Check if user can claim rewards
  const checkClaimEligibility = async () => {
    if (
      !taskRewardService ||
      !taskApplication.volunteerWalletAddress ||
      !task.creatorWalletAddress
    ) {
      return;
    }

    try {
      const eligible = await taskRewardService.canClaimReward(
        task.id,
        taskApplication.volunteerWalletAddress,
        task.creatorWalletAddress,
      );
      setCanClaim(eligible);
    } catch (error) {
      console.error("Error checking claim eligibility:", error);
      setCanClaim(false);
    }
  };

  // Check eligibility when component mounts or dependencies change
  useEffect(() => {
    if (task.rewardAmount && task.status === "COMPLETED") {
      checkClaimEligibility();
    }
  }, [task.id, task.rewardAmount, task.status]);

  const handleClaimReward = async () => {
    if (!taskRewardService || !task.creatorWalletAddress) {
      return;
    }

    setIsClaimingReward(true);

    try {
      const txSignature = await taskRewardService.claimReward(
        task.id,
        task.creatorWalletAddress,
      );

      if (txSignature) {
        setRewardClaimed(true);
        onRewardClaimed?.();
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
    } finally {
      setIsClaimingReward(false);
    }
  };

  // Don't show if task has no reward or volunteer doesn't have wallet address (indicating no token reward wanted)
  if (!task.rewardAmount || !taskApplication.volunteerWalletAddress) {
    return null;
  }

  // Don't show if task is not completed
  if (task.status !== "COMPLETED") {
    return (
      <div className="bg-accentPrimary/10 border border-accentPrimary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={20} className="text-accentPrimary" />
          <h3 className="font-medium text-baseSecondary">
            Token Rewards Pending
          </h3>
        </div>
        <p className="text-baseSecondary/70 text-sm">
          Your reward of{" "}
          <span className="font-semibold">{task.rewardAmount} ALTR tokens</span>{" "}
          will be available to claim once the task is marked as completed.
        </p>
      </div>
    );
  }

  // Show if reward already claimed
  if (rewardClaimed || canClaim === false) {
    return (
      <div className="bg-confirmPrimary/10 border border-confirmPrimary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={20} className="text-confirmPrimary" />
          <h3 className="font-medium text-baseSecondary">Reward Claimed</h3>
        </div>
        <p className="text-baseSecondary/70 text-sm">
          You have successfully claimed your reward of{" "}
          <span className="font-semibold">{task.rewardAmount} ALTR tokens</span>{" "}
          for completing this task.
        </p>
      </div>
    );
  }

  // Check wallet connection
  if (!connected || !publicKey) {
    return (
      <div className="bg-basePrimaryLight border border-baseSecondary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CurrencyCircleDollar size={20} className="text-baseSecondary" />
          <h3 className="font-medium text-baseSecondary">Claim Token Reward</h3>
        </div>
        <p className="text-baseSecondary/70 text-sm mb-3">
          Connect your Solana wallet to claim your reward of{" "}
          <span className="font-semibold">{task.rewardAmount} ALTR tokens</span>
          .
        </p>
        <WalletMultiButton className="!bg-confirmPrimary !text-white !rounded-lg !px-4 !py-2 !text-sm hover:!bg-confirmPrimary/90" />
      </div>
    );
  }

  // Check if connected wallet matches the application wallet
  const connectedWalletAddress = publicKey.toBase58();
  if (
    taskApplication.volunteerWalletAddress &&
    connectedWalletAddress !== taskApplication.volunteerWalletAddress
  ) {
    return (
      <div className="bg-dangerPrimary/10 border border-dangerPrimary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={20} className="text-dangerPrimary" />
          <h3 className="font-medium text-baseSecondary">
            Wrong Wallet Connected
          </h3>
        </div>
        <p className="text-baseSecondary/70 text-sm">
          Please connect the wallet you used when applying for this task to
          claim your reward.
        </p>
        <div className="mt-2 p-2 bg-basePrimary/50 rounded text-xs font-mono">
          Expected: {taskApplication.volunteerWalletAddress}
        </div>
      </div>
    );
  }

  // Show claim button
  return (
    <div className="bg-confirmPrimary/10 border border-confirmPrimary/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <CurrencyCircleDollar size={20} className="text-confirmPrimary" />
        <h3 className="font-medium text-baseSecondary">Claim Token Reward</h3>
      </div>
      <p className="text-baseSecondary/70 text-sm mb-4">
        Congratulations! You've completed "
        <span className="font-medium">{task.title}</span>". You can now claim
        your reward of{" "}
        <span className="font-semibold text-confirmPrimary">
          {task.rewardAmount} ALTR tokens
        </span>
        .
      </p>

      <button
        onClick={handleClaimReward}
        disabled={isClaimingReward || canClaim === false}
        aria-label="Claim token reward"
        className={`w-fit  rounded-lg text-sm font-medium transition-all  animated-border-btn duration-300 `}
      >
        <span>{isClaimingReward ? "Claiming..." : "Claim Reward"}</span>
      </button>

      {canClaim === null && (
        <p className="text-xs text-baseSecondary/60 mt-2">
          Checking reward availability...
        </p>
      )}
    </div>
  );
}
