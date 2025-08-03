import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  CheckCircle,
  Wallet,
  CurrencyCircleDollar,
} from "@phosphor-icons/react";

interface TokenRewardOptInProps {
  taskRewardAmount?: number;
  onOptInChange: (walletAddress?: string) => void; // Simplified - just pass wallet address or undefined
  userWalletAddress?: string; // User's saved wallet from profile
}

export function TokenRewardOptIn({
  taskRewardAmount,
  onOptInChange,
  userWalletAddress,
}: TokenRewardOptInProps) {
  const { connected, publicKey } = useWallet();
  const [wantsTokenReward, setWantsTokenReward] = useState(false);

  // Determine which wallet address to use (connected wallet takes priority)
  const effectiveWalletAddress =
    connected && publicKey ? publicKey.toBase58() : userWalletAddress;

  const handleOptInChange = (checked: boolean) => {
    setWantsTokenReward(checked);

    if (checked && effectiveWalletAddress) {
      onOptInChange(effectiveWalletAddress); // Pass wallet address when opting in
    } else {
      onOptInChange(undefined); // Pass undefined when opting out
    }
  };

  // Don't show opt-in if task has no reward amount
  if (!taskRewardAmount || taskRewardAmount <= 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-confirmPrimary/5 to-confirmPrimary/10 border border-confirmPrimary/20 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <CurrencyCircleDollar size={20} className="text-confirmPrimary" />
        <h3 className="text-lg font-medium text-baseSecondary">
          Token Rewards Available
        </h3>
      </div>

      <div className="space-y-3">
        <p className="text-baseSecondary/80 text-sm">
          This task offers{" "}
          <span className="font-semibold text-confirmPrimary">
            {taskRewardAmount} ALTR tokens
          </span>{" "}
          as a reward upon completion. Would you like to earn tokens for
          completing this task?
        </p>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsTokenReward}
              onChange={(e) => handleOptInChange(e.target.checked)}
              className="w-4 h-4 text-confirmPrimary bg-basePrimary border-baseSecondary/30 rounded focus:ring-confirmPrimary focus:ring-2"
            />
            <span className="text-baseSecondary text-sm">
              Yes, I want to earn token rewards for this task
            </span>
          </label>

          {wantsTokenReward && (
            <div className="space-y-3 ml-6">
              {!effectiveWalletAddress ? (
                <div className="space-y-2">
                  <p className="text-baseSecondary/70 text-sm">
                    You need a connected Solana wallet to receive token rewards:
                  </p>
                  <WalletMultiButton className="!bg-confirmPrimary !text-white !rounded-lg !px-4 !py-2 !text-sm hover:!bg-confirmPrimary/90" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-confirmPrimary">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">
                      Wallet Connected
                    </span>
                  </div>
                  <div className="bg-basePrimary/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet size={14} className="text-baseSecondary/70" />
                      <span className="text-xs font-medium text-baseSecondary/70">
                        REWARD ADDRESS
                      </span>
                    </div>
                    <p className="text-xs text-baseSecondary/90 font-mono break-all">
                      {effectiveWalletAddress}
                    </p>
                  </div>
                  <p className="text-xs text-baseSecondary/60">
                    Tokens will be sent to this address when you complete the
                    task.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {wantsTokenReward && !effectiveWalletAddress && (
          <div className="bg-accentPrimary/10 border border-amber-600/20 rounded-lg p-3">
            <p className="text-amber-600 text-sm">
              <strong>Note:</strong> You must connect a Solana wallet before
              applying to receive token rewards. You can also add a wallet
              address to your profile settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
