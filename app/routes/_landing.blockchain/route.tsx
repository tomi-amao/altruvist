import { MetaFunction } from "react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSolanaService } from "~/hooks/useSolanaService";
import {
  TrendUp,
  Coins,
  CheckCircle,
  Lightning,
  Info,
  ArrowRight,
  Database,
  Activity,
} from "@phosphor-icons/react";
import { getSolanaConfig } from "~/lib/solana-config";

export const meta: MetaFunction = () => {
  return [
    { title: "Blockchain Statistics | Altruvist" },
    {
      name: "description",
      content:
        "View global blockchain statistics and network information for the Altruvist platform",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

interface BlockchainStats {
  totalSupply: number;
  availableTokens: number;
  circulatingTokens: number;
  completedTasks: number;
  faucetInfo: {
    address: string;
    mint: string;
    rateLimit: string;
    cooldownPeriod: string;
  } | null;
}

export default function BlockchainStatistics() {
  const { blockchainReader } = useSolanaService();
  const faucetSeed = getSolanaConfig().FAUCET_SEED;

  const [stats, setStats] = useState<BlockchainStats>({
    totalSupply: 0,
    availableTokens: 0,
    circulatingTokens: 0,
    completedTasks: 0,
    faucetInfo: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadBlockchainStats();
  }, [blockchainReader]);

  const loadBlockchainStats = async () => {
    if (!blockchainReader) return;

    setIsLoading(true);
    try {
      // Load faucet information
      const faucetInfo = await blockchainReader.getFaucetInfo(faucetSeed);

      // Load completed tasks count
      const completedTasks = await blockchainReader.getCompletedTasksCount();

      if (faucetInfo?.mint) {
        // Load mint supply and faucet balance
        const totalSupply = await blockchainReader.getMintSupply(
          faucetInfo.mint,
        );
        const availableTokens = await blockchainReader.getFaucetTokenBalance(
          faucetInfo.tokenAccount,
        );
        const circulatingTokens = totalSupply - availableTokens;

        setStats({
          totalSupply: totalSupply || 0,
          availableTokens: availableTokens || 0,
          circulatingTokens: circulatingTokens || 0,
          completedTasks: completedTasks || 0,
          faucetInfo: {
            address: faucetInfo.address,
            mint: faucetInfo.mint,
            rateLimit: faucetInfo.rateLimit,
            cooldownPeriod: faucetInfo.cooldownPeriod,
          },
        });
      } else {
        setStats((prev) => ({
          ...prev,
          completedTasks: completedTasks || 0,
        }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading blockchain stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-basePrimary via-basePrimary to-basePrimaryLight">
      <div className="container mx-auto px-6 py-8 mt-20">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ">
            <div>
              <h1 className="text-4xl font-bold text-baseSecondary mb-2 flex items-center gap-3 ">
                <Database size={36} className="text-accentPrimary" />
                Blockchain Statistics
              </h1>
              <p className="text-baseSecondary/70 text-lg">
                Global network statistics and token economy overview
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadBlockchainStats}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-accentPrimary text-white rounded-lg hover:bg-accentPrimary/90 transition-colors disabled:opacity-50"
              >
                <Activity size={20} />
                {isLoading ? "Refreshing..." : "Refresh Data"}
              </button>
              {lastUpdated && (
                <span className="text-sm text-baseSecondary/60">
                  Updated {formatTimeAgo(lastUpdated.getTime())}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Global Statistics Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-accentPrimary to-accentSecondary rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Coins size={32} className="opacity-80" />
              <div className="text-right">
                <p className="text-white/80 text-sm">Total Supply</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : stats.totalSupply.toLocaleString()}
                </p>
                <p className="text-white/60 text-xs">ALTR tokens</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-confirmPrimary to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendUp size={32} className="opacity-80" />
              <div className="text-right">
                <p className="text-white/80 text-sm">Circulating</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : stats.circulatingTokens.toLocaleString()}
                </p>
                <p className="text-white/60 text-xs">In circulation</p>
              </div>
            </div>
          </div>

          <div className="bg-basePrimaryLight rounded-xl p-6 border border-baseSecondary/10">
            <div className="flex items-center justify-between mb-4">
              <Lightning size={32} className="text-yellow-500" />
              <div className="text-right">
                <p className="text-baseSecondary/70 text-sm">Available</p>
                <p className="text-2xl font-bold text-baseSecondary">
                  {isLoading ? "..." : stats.availableTokens.toLocaleString()}
                </p>
                <p className="text-baseSecondary/60 text-xs">In faucet</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle size={32} className="opacity-80" />
              <div className="text-right">
                <p className="text-white/80 text-sm">Completed</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : stats.completedTasks.toLocaleString()}
                </p>
                <p className="text-white/60 text-xs">On-chain tasks</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Economy Overview */}
          <motion.div
            className="bg-basePrimaryLight rounded-xl p-6 border border-baseSecondary/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-baseSecondary mb-6 flex items-center gap-2">
              <TrendUp size={24} className="text-accentPrimary" />
              Token Economy
            </h2>

            <div className="space-y-4">
              <div className="bg-basePrimary rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-baseSecondary">
                    Distribution
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-baseSecondary/70">Circulating</span>
                      <span className="text-baseSecondary font-medium">
                        {(
                          (stats.circulatingTokens / stats.totalSupply) * 100 ||
                          0
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-baseSecondary/10 rounded-full h-2">
                      <div
                        className="bg-confirmPrimary h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(stats.circulatingTokens / stats.totalSupply) * 100 || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-baseSecondary/70">
                        Available (Faucet)
                      </span>
                      <span className="text-baseSecondary font-medium">
                        {(
                          (stats.availableTokens / stats.totalSupply) * 100 || 0
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-baseSecondary/10 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(stats.availableTokens / stats.totalSupply) * 100 || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-basePrimary rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-baseSecondary">
                    {stats.totalSupply.toLocaleString()}
                  </p>
                  <p className="text-sm text-baseSecondary/70">Total Minted</p>
                </div>
                <div className="bg-basePrimary rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-baseSecondary">
                    {stats.circulatingTokens.toLocaleString()}
                  </p>
                  <p className="text-sm text-baseSecondary/70">
                    In Circulation
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Faucet Configuration */}
          <motion.div
            className="bg-basePrimaryLight rounded-xl p-6 border border-baseSecondary/10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-xl font-bold text-baseSecondary mb-6 flex items-center gap-2">
              <Lightning size={24} className="text-accentPrimary" />
              Faucet Configuration
            </h2>

            {stats.faucetInfo ? (
              <div className="space-y-4">
                <div className="bg-basePrimary rounded-lg p-4">
                  <h3 className="font-semibold text-baseSecondary mb-3">
                    Current Settings
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-baseSecondary/70">
                        Rate Limit
                      </span>
                      <p className="font-medium text-baseSecondary">
                        {(
                          parseInt(stats.faucetInfo.rateLimit) / Math.pow(10, 6)
                        ).toLocaleString()}{" "}
                        tokens per request
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-baseSecondary/70">
                        Cooldown Period
                      </span>
                      <p className="font-medium text-baseSecondary">
                        {Math.floor(
                          parseInt(stats.faucetInfo.cooldownPeriod) / 3600,
                        )}{" "}
                        hours
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-baseSecondary/70">
                        Available Balance
                      </span>
                      <p className="font-medium text-baseSecondary">
                        {stats.availableTokens.toLocaleString()} ALTR tokens
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-basePrimary rounded-lg p-4">
                  <h3 className="font-semibold text-baseSecondary mb-3">
                    Addresses
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-baseSecondary/70">
                        Faucet Account
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-xs text-baseSecondary bg-baseSecondary/5 px-2 py-1 rounded break-all">
                          {stats.faucetInfo.address}
                        </p>
                        <a
                          href={`https://explorer.solana.com/account/${stats.faucetInfo.address}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accentPrimary hover:text-accentPrimary/80"
                        >
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-baseSecondary/70">
                        Token Mint
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-xs text-baseSecondary bg-baseSecondary/5 px-2 py-1 rounded break-all">
                          {stats.faucetInfo.mint}
                        </p>
                        <a
                          href={`https://explorer.solana.com/account/${stats.faucetInfo.mint}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accentPrimary hover:text-accentPrimary/80"
                        >
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info
                  size={48}
                  className="text-baseSecondary/50 mx-auto mb-4"
                />
                <h3 className="font-semibold text-baseSecondary mb-2">
                  No Faucet Data
                </h3>
                <p className="text-sm text-baseSecondary/70">
                  Faucet information is not currently available.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Network Information */}
        <motion.div
          className="mt-8 bg-basePrimaryLight rounded-xl p-6 border border-baseSecondary/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-xl font-bold text-baseSecondary mb-4 flex items-center gap-2">
            <Info size={24} className="text-accentPrimary" />
            Network Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-basePrimary rounded-lg p-4">
              <h3 className="font-semibold text-baseSecondary mb-2">Network</h3>
              <p className="text-sm text-baseSecondary/70">Solana Devnet</p>
              <p className="text-xs text-baseSecondary/60 mt-1">
                Test network for development
              </p>
            </div>

            <div className="bg-basePrimary rounded-lg p-4">
              <h3 className="font-semibold text-baseSecondary mb-2">
                Token Standard
              </h3>
              <p className="text-sm text-baseSecondary/70">SPL Token 2022</p>
              <p className="text-xs text-baseSecondary/60 mt-1">
                Latest Solana token program
              </p>
            </div>

            <div className="bg-basePrimary rounded-lg p-4">
              <h3 className="font-semibold text-baseSecondary mb-2">
                Tasks Completed
              </h3>
              <p className="text-sm text-baseSecondary/70">
                {stats.completedTasks} verified
              </p>
              <p className="text-xs text-baseSecondary/60 mt-1">
                Immutable on-chain records
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
