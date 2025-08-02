import { MetaFunction } from "react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSolanaService } from "~/hooks/useSolanaService";
import {
  Lightning,
  Info,
  ArrowRight,
  Database,
  Activity,
  Percent,
} from "@phosphor-icons/react";
import { getSolanaConfig } from "~/lib/solana-config";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "~/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

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
          faucetInfo: {
            address: faucetInfo.address,
            mint: faucetInfo.mint,
            rateLimit: faucetInfo.rateLimit,
            cooldownPeriod: faucetInfo.cooldownPeriod,
          },
        });
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

  // Chart configuration
  const tokenDistributionConfig = {
    circulating: {
      label: "Circulating Tokens",
      color: "hsl(142, 76%, 36%)",
    },
    available: {
      label: "Available (Faucet)",
      color: "hsl(45, 93%, 47%)",
    },
  };

  // Prepare chart data
  const tokenDistributionData = [
    {
      name: "Circulating",
      value: stats.circulatingTokens,
      percentage: (
        (stats.circulatingTokens / stats.totalSupply) * 100 || 0
      ).toFixed(1),
      fill: tokenDistributionConfig.circulating.color,
    },
    {
      name: "Available",
      value: stats.availableTokens,
      percentage: (
        (stats.availableTokens / stats.totalSupply) * 100 || 0
      ).toFixed(1),
      fill: tokenDistributionConfig.available.color,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-basePrimary via-basePrimary to-basePrimaryLight">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-16 sm:mt-20 max-w-7xl">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-baseSecondary mb-2 flex items-center gap-2 sm:gap-3">
                <Database
                  size={28}
                  className="text-baseSecondary sm:w-9 sm:h-9"
                />
                <span className="break-words">Blockchain Statistics</span>
              </h1>
              <p className="text-baseSecondary/70 text-sm sm:text-base lg:text-lg">
                Global network statistics and token economy overview
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <button
                onClick={loadBlockchainStats}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-baseSecondary text-white rounded-lg hover:bg-baseSecondary/90 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                <Activity size={18} />
                {isLoading ? "Refreshing..." : "Refresh Data"}
              </button>
              {lastUpdated && (
                <span className="text-xs sm:text-sm text-baseSecondary/60">
                  Updated {formatTimeAgo(lastUpdated.getTime())}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Token Distribution Pie Chart */}
        <motion.div
          className="bg-basePrimaryLight rounded-lg sm:rounded-xl p-4 sm:p-6 border border-baseSecondary/10 mb-6 sm:mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-baseSecondary mb-4 sm:mb-6 flex items-center gap-2 justify-center">
            <Percent size={20} className="text-baseSecondary sm:w-6 sm:h-6" />
            Token Distribution
          </h2>

          <div className="w-full overflow-hidden">
            <ChartContainer
              config={tokenDistributionConfig}
              className="h-[280px] sm:h-[320px] lg:h-[360px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()} tokens`,
                        name,
                      ]}
                    />
                  }
                />
                <Pie
                  data={tokenDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  innerRadius="40%"
                  outerRadius="75%"
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {tokenDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
            <div className="bg-basePrimary rounded-lg p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {stats.totalSupply.toLocaleString()}
              </p>
              <p className="text-sm sm:text-base text-baseSecondary/70">
                Total Supply
              </p>
            </div>
            <div className="bg-basePrimary rounded-lg p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {(
                  (stats.circulatingTokens / stats.totalSupply) * 100 || 0
                ).toFixed(1)}
                %
              </p>
              <p className="text-sm sm:text-base text-baseSecondary/70">
                In Circulation
              </p>
            </div>
            <div className="bg-basePrimary rounded-lg p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                {(
                  (stats.availableTokens / stats.totalSupply) * 100 || 0
                ).toFixed(1)}
                %
              </p>
              <p className="text-sm sm:text-base text-baseSecondary/70">
                Available
              </p>
            </div>
          </div>
        </motion.div>

        {/* Faucet Configuration */}
        <motion.div
          className="bg-basePrimaryLight rounded-lg sm:rounded-xl p-4 sm:p-6 border border-baseSecondary/10 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-baseSecondary mb-4 sm:mb-6 flex items-center gap-2">
            <Lightning size={20} className="text-baseSecondary sm:w-6 sm:h-6" />
            Faucet Configuration
          </h2>

          {stats.faucetInfo ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-basePrimary rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-baseSecondary mb-3 text-sm sm:text-base">
                  Current Settings
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm text-baseSecondary/70">
                      Rate Limit
                    </span>
                    <p className="font-medium text-baseSecondary text-sm sm:text-base">
                      {(
                        parseInt(stats.faucetInfo.rateLimit) / Math.pow(10, 6)
                      ).toLocaleString()}{" "}
                      tokens per request
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-baseSecondary/70">
                      Cooldown Period
                    </span>
                    <p className="font-medium text-baseSecondary text-sm sm:text-base">
                      {Math.floor(
                        parseInt(stats.faucetInfo.cooldownPeriod) / 3600,
                      )}{" "}
                      hours
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-baseSecondary/70">
                      Available Balance
                    </span>
                    <p className="font-medium text-baseSecondary text-sm sm:text-base">
                      {stats.availableTokens.toLocaleString()} ALTR tokens
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-basePrimary rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-baseSecondary mb-3 text-sm sm:text-base">
                  Addresses
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm text-baseSecondary/70">
                      Faucet Account
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-xs text-baseSecondary bg-baseSecondary/5 px-2 py-1 rounded break-all flex-1 min-w-0">
                        {stats.faucetInfo.address}
                      </p>
                      <a
                        href={`https://explorer.solana.com/account/${stats.faucetInfo.address}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accentPrimary hover:text-accentPrimary/80 flex-shrink-0"
                      >
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-baseSecondary/70">
                      Token Mint
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-xs text-baseSecondary bg-baseSecondary/5 px-2 py-1 rounded break-all flex-1 min-w-0">
                        {stats.faucetInfo.mint}
                      </p>
                      <a
                        href={`https://explorer.solana.com/account/${stats.faucetInfo.mint}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accentPrimary hover:text-accentPrimary/80 flex-shrink-0"
                      >
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Info
                size={40}
                className="text-baseSecondary/50 mx-auto mb-4 sm:w-12 sm:h-12"
              />
              <h3 className="font-semibold text-baseSecondary mb-2 text-sm sm:text-base">
                No Faucet Data
              </h3>
              <p className="text-xs sm:text-sm text-baseSecondary/70">
                Faucet information is not currently available.
              </p>
            </div>
          )}
        </motion.div>

        {/* Network Information */}
        <motion.div
          className="bg-basePrimaryLight rounded-lg sm:rounded-xl p-4 sm:p-6 border border-baseSecondary/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-baseSecondary mb-4 flex items-center gap-2">
            <Info size={20} className="text-baseSecondary sm:w-6 sm:h-6" />
            Network Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-basePrimary rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-baseSecondary mb-2 text-sm sm:text-base">
                Network
              </h3>
              <p className="text-xs sm:text-sm text-baseSecondary/70">
                Solana Devnet
              </p>
              <p className="text-xs text-baseSecondary/60 mt-1">
                Test network for development
              </p>
            </div>

            <div className="bg-basePrimary rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-baseSecondary mb-2 text-sm sm:text-base">
                Token Standard
              </h3>
              <p className="text-xs sm:text-sm text-baseSecondary/70">
                SPL Token 2022
              </p>
              <p className="text-xs text-baseSecondary/60 mt-1">
                Latest Solana token program
              </p>
            </div>

            <div className="bg-basePrimary rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
              <h3 className="font-semibold text-baseSecondary mb-2 text-sm sm:text-base">
                Token Economy
              </h3>
              <p className="text-xs sm:text-sm text-baseSecondary/70">
                ALTR Token Distribution
              </p>
              <p className="text-xs text-baseSecondary/60 mt-1">
                Real-time blockchain data
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
