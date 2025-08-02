import { MetaFunction } from "react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolanaService } from "~/hooks/useSolanaService";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import { FormField } from "~/components/utils/FormField";
import {
  Wallet,
  HandCoins,
  Info,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";
import WalletInfo from "~/components/tasks/WalletInfo";
import { getSolanaConfig } from "~/lib/solana-config";

export const meta: MetaFunction = () => {
  return [
    { title: "Blockchain Dashboard | Altruvist" },
    {
      name: "description",
      content: "Manage your tokens and interact with the Altruvist blockchain",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

interface FaucetInfo {
  address: string;
  mint: string;
  authority: string;
  tokenAccount: string;
  rateLimit: string;
  cooldownPeriod: string;
}

export default function BlockchainDashboard() {
  const { connected, publicKey } = useWallet();
  const { solanaService, blockchainReader } = useSolanaService();

  // Get faucet seed from environment configuration
  const faucetSeed = getSolanaConfig().FAUCET_SEED;

  // State management
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);

  const [requestAmount, setRequestAmount] = useState("100");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Load blockchain data
  useEffect(() => {
    if (connected && solanaService && blockchainReader) {
      loadBlockchainData();
    }
  }, [connected, solanaService, blockchainReader]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const loadBlockchainData = async () => {
    if (!blockchainReader || !solanaService) return;

    setIsLoading(true);
    try {
      // Load faucet information
      const faucet = await blockchainReader.getFaucetInfo(faucetSeed);
      setFaucetInfo(faucet);

      if (faucet?.mint && publicKey) {
        // Load only user balance for personal dashboard
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestTokens = async () => {
    if (!solanaService || !faucetInfo) {
      toast.error("Service not available");
      return;
    }

    const amount = parseInt(requestAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsRequesting(true);
    try {
      const txSignature = await solanaService.requestTokens(
        faucetSeed,
        faucetInfo.mint,
        amount,
      );

      if (txSignature) {
        toast.success(`Successfully requested ${amount} tokens!`);

        // Set cooldown (assuming 24 hours as default)
        const cooldownHours = Math.floor(
          parseInt(faucetInfo.cooldownPeriod) / 3600,
        );
        setCooldownRemaining(cooldownHours * 3600);

        // Refresh data
        setTimeout(() => loadBlockchainData(), 2000);
      }
    } catch (error) {
      console.error("Error requesting tokens:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const formatCooldown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const maxRequestAmount = faucetInfo
    ? Math.floor(parseInt(faucetInfo.rateLimit) / Math.pow(10, 6))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-basePrimary via-basePrimary to-basePrimaryLight">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-baseSecondary mb-2 flex items-center gap-3">
                Blockchain Dashboard
              </h1>
              <p className="text-baseSecondary/70 text-lg">
                Manage your Altruvist tokens and blockchain interactions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <WalletMultiButton className="!bg-accentPrimary hover:!bg-accentPrimary/90 !rounded-xl !px-6 !py-3 !font-medium" />
            </div>
          </div>
        </motion.div>

        {!connected ? (
          /* Not Connected State */
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-basePrimaryLight rounded-2xl p-12 border border-baseSecondary/10 max-w-2xl mx-auto">
              <Wallet
                size={64}
                className="text-baseSecondary/50 mx-auto mb-6"
              />
              <h2 className="text-2xl font-bold text-baseSecondary mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-baseSecondary/70 mb-8 text-lg">
                Connect your Solana wallet to access token features, request
                ALTR tokens, and interact with the Altruvist blockchain.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4">
                  <HandCoins
                    size={32}
                    className="text-accentPrimary mx-auto mb-3"
                  />
                  <h3 className="font-semibold text-baseSecondary mb-2">
                    Request Tokens
                  </h3>
                  <p className="text-sm text-baseSecondary/70">
                    Get ALTR tokens for task rewards
                  </p>
                </div>
                <div className="text-center p-4">
                  <HandCoins
                    size={32}
                    className="text-confirmPrimary mx-auto mb-3"
                  />
                  <h3 className="font-semibold text-baseSecondary mb-2">
                    Track Balance
                  </h3>
                  <p className="text-sm text-baseSecondary/70">
                    Monitor your token holdings
                  </p>
                </div>
                <div className="text-center p-4">
                  <CheckCircle
                    size={32}
                    className="text-accentSecondary mx-auto mb-3"
                  />
                  <h3 className="font-semibold text-baseSecondary mb-2">
                    Earn Rewards
                  </h3>
                  <p className="text-sm text-baseSecondary/70">
                    Complete tasks to earn tokens
                  </p>
                </div>
              </div>
              <WalletMultiButton className="!bg-accentPrimary hover:!bg-accentPrimary/90 !rounded-xl !px-8 !py-4 !text-lg !font-medium" />
            </div>
          </motion.div>
        ) : (
          /* Connected State */
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Token Request Section */}
              <motion.div
                className="lg:col-span-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="bg-basePrimaryLight rounded-xl p-6 border border-baseSecondary/10 h-fit">
                  <div className="flex items-center gap-3 mb-6">
                    <HandCoins
                      size={24}
                      weight="duotone"
                      className="text-baseSecondary"
                    />
                    <h2 className="text-xl font-bold text-baseSecondary">
                      Request Tokens
                    </h2>
                  </div>

                  {faucetInfo ? (
                    <div className="space-y-4">
                      <div className="bg-basePrimary rounded-lg p-4 border border-baseSecondary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Info size={16} className="text-accentPrimary" />
                          <span className="text-sm font-medium text-baseSecondary">
                            Faucet Limits
                          </span>
                        </div>
                        <div className="text-sm text-baseSecondary/70 space-y-1">
                          <p>
                            Max per request: {maxRequestAmount.toLocaleString()}{" "}
                            tokens
                          </p>
                          <p>
                            Cooldown:{" "}
                            {Math.floor(
                              parseInt(faucetInfo.cooldownPeriod) / 3600,
                            )}{" "}
                            hours
                          </p>
                        </div>
                      </div>

                      {cooldownRemaining > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Warning size={16} className="text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">
                              Cooldown Active
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700">
                            Next request available in:{" "}
                            {formatCooldown(cooldownRemaining)}
                          </p>
                        </div>
                      )}

                      <FormField
                        htmlFor="request-amount"
                        label="Amount to Request"
                        type="number"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(e.target.value)}
                        placeholder="Enter amount"
                        backgroundColour="bg-basePrimary"
                        helperText={`Maximum: ${maxRequestAmount.toLocaleString()} tokens`}
                      />

                      <PrimaryButton
                        text={isRequesting ? "Requesting..." : "Request Tokens"}
                        action={handleRequestTokens}
                        ariaLabel="Request tokens from faucet"
                        isDisabled={
                          isRequesting ||
                          !requestAmount ||
                          parseInt(requestAmount) <= 0 ||
                          parseInt(requestAmount) > maxRequestAmount ||
                          cooldownRemaining > 0
                        }
                      />

                      <SecondaryButton
                        text="Refresh Data"
                        action={loadBlockchainData}
                        ariaLabel="Refresh blockchain data"
                        isDisabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Warning
                        size={48}
                        className="text-yellow-500 mx-auto mb-4"
                      />
                      <h3 className="font-semibold text-baseSecondary mb-2">
                        No Faucet Available
                      </h3>
                      <p className="text-sm text-baseSecondary/70">
                        The token faucet is not currently available. Please
                        check back later.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Wallet Information Section */}
              <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <WalletInfo showTransactionHistory={true} maxTransactions={5} />
              </motion.div>
            </div>

            {/* Additional Information */}
            <motion.div
              className="bg-basePrimaryLight rounded-xl p-6 border border-baseSecondary/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-xl font-bold text-baseSecondary mb-4 flex items-center gap-2">
                <Info size={24} className="text-baseSecondary" />
                How It Works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="bg-yellow-400/80 rounded-lg p-3 flex-shrink-0">
                    <span className="text-accentPrimary font-bold text-lg">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-baseSecondary mb-2">
                      Request Tokens
                    </h3>
                    <p className="text-sm text-baseSecondary/70">
                      Use the faucet to request ALTR tokens for participating in
                      the platform.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-confirmPrimary/10 rounded-lg p-3 flex-shrink-0">
                    <span className="text-confirmPrimary font-bold text-lg">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-baseSecondary mb-2">
                      Complete Tasks
                    </h3>
                    <p className="text-sm text-baseSecondary/70">
                      Use your tokens to secure task escrows and earn rewards
                      for completing volunteer work.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 ">
                  <div className="bg-accentSecondary/10 rounded-lg p-3 flex-shrink-0 bg-orange-500/50">
                    <span className="text-accentSecondary font-bold text-lg ">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-baseSecondary mb-2 ">
                      Earn Rewards
                    </h3>
                    <p className="text-sm text-baseSecondary/70">
                      Receive token rewards for successfully completing tasks
                      and helping charities.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
