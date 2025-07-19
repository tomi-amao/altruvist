import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaService } from "~/hooks/useSolanaService";
import {
  Wallet,
  CurrencyCircleDollar,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
  Coins,
  Fire,
  HandCoins,
} from "@phosphor-icons/react";

interface FaucetInfo {
  address: string;
  mint: string;
  authority: string;
  tokenAccount: string;
  rateLimit: string;
  cooldownPeriod: string;
}

interface ProgramTransaction {
  signature: string;
  timestamp: number;
  type:
    | "faucet_init"
    | "token_request"
    | "task_create"
    | "task_complete"
    | "task_cancel"
    | "token_burn"
    | "faucet_delete";
  status: "success" | "failed" | "pending";
  amount?: number;
  description: string;
}

interface WalletInfoProps {
  className?: string;
  showTransactionHistory?: boolean;
  maxTransactions?: number;
}

export default function WalletInfo({
  className = "",
  showTransactionHistory = true,
  maxTransactions = 10,
}: WalletInfoProps) {
  const { connected, publicKey } = useWallet();
  const solanaService = useSolanaService();

  // State for wallet information
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<ProgramTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load wallet information when wallet connects
  useEffect(() => {
    if (connected && publicKey && solanaService) {
      loadWalletInfo();
    } else {
      resetState();
    }
  }, [connected, publicKey, solanaService]);

  const resetState = () => {
    setFaucetInfo(null);
    setTokenBalance(0);
    setSolBalance(0);
    setTransactions([]);
    setLastUpdated(null);
  };

  const loadWalletInfo = async () => {
    if (!connected || !publicKey || !solanaService) return;

    setIsLoading(true);
    try {
      // Load faucet information
      const faucet = await solanaService.getFaucetInfo();
      setFaucetInfo(faucet);

      // Load SOL balance
      const solBalance =
        await solanaService.provider.connection.getBalance(publicKey);
      setSolBalance(solBalance / 1_000_000_000); // Convert lamports to SOL

      // Load token balance if faucet exists
      if (faucet?.mint) {
        const balance = await solanaService.getUserTokenBalance(faucet.mint);
        setTokenBalance(balance);
      }

      // Load transaction history if enabled
      if (showTransactionHistory) {
        await loadTransactionHistory();
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading wallet info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionHistory = async () => {
    if (!connected || !publicKey || !solanaService) return;

    try {
      // Get recent transactions for the wallet
      const signatures =
        await solanaService.provider.connection.getSignaturesForAddress(
          publicKey,
          { limit: 50 },
        );

      const programTransactions: ProgramTransaction[] = [];

      // Process each signature to check if it's related to our program
      for (const sigInfo of signatures.slice(0, maxTransactions * 2)) {
        // Get more to filter
        try {
          const tx = await solanaService.provider.connection.getTransaction(
            sigInfo.signature,
            { commitment: "confirmed" },
          );

          if (!tx) continue;

          // Check if transaction involves our program
          const programId = solanaService.program.programId.toString();
          const isOurProgram = tx.transaction.message.accountKeys.some(
            (key) => key.toString() === programId,
          );

          if (isOurProgram) {
            const txType = identifyTransactionType(tx, sigInfo.signature);
            if (txType) {
              programTransactions.push({
                signature: sigInfo.signature,
                timestamp: (sigInfo.blockTime || Date.now() / 1000) * 1000,
                type: txType.type,
                status: sigInfo.err ? "failed" : "success",
                amount: txType.amount,
                description: txType.description,
              });
            }
          }
        } catch (error) {
          console.error(
            `Error processing transaction ${sigInfo.signature}:`,
            error,
          );
        }

        // Limit the number of transactions we process
        if (programTransactions.length >= maxTransactions) break;
      }

      setTransactions(programTransactions.slice(0, maxTransactions));
    } catch (error) {
      console.error("Error loading transaction history:", error);
    }
  };

  const identifyTransactionType = (
    tx: anyg,
  ): {
    type: ProgramTransaction["type"];
    amount?: number;
    description: string;
  } | null => {
    // This is a simplified version - in a real implementation, you'd parse the instruction data
    // to determine the exact transaction type and amounts

    const logs = tx.meta?.logMessages || [];

    // Check for faucet initialization
    if (logs.some((log: string) => log.includes("initialize_faucet"))) {
      return {
        type: "faucet_init",
        description: "Initialized token faucet",
      };
    }

    // Check for token requests
    if (logs.some((log: string) => log.includes("request_tokens"))) {
      return {
        type: "token_request",
        description: "Requested tokens from faucet",
        amount: extractAmountFromLogs(logs),
      };
    }

    // Check for task creation
    if (logs.some((log: string) => log.includes("create_task"))) {
      return {
        type: "task_create",
        description: "Created task with token escrow",
        amount: extractAmountFromLogs(logs),
      };
    }

    // Check for task completion
    if (logs.some((log: string) => log.includes("complete_task"))) {
      return {
        type: "task_complete",
        description: "Completed task and received tokens",
        amount: extractAmountFromLogs(logs),
      };
    }

    // Check for task cancellation
    if (logs.some((log: string) => log.includes("cancel_task"))) {
      return {
        type: "task_cancel",
        description: "Cancelled task and returned tokens",
        amount: extractAmountFromLogs(logs),
      };
    }

    // Check for token burning
    if (logs.some((log: string) => log.includes("burn"))) {
      return {
        type: "token_burn",
        description: "Burned tokens",
        amount: extractAmountFromLogs(logs),
      };
    }

    // Check for faucet deletion
    if (logs.some((log: string) => log.includes("delete_faucet"))) {
      return {
        type: "faucet_delete",
        description: "Deleted token faucet",
      };
    }

    return null;
  };

  const extractAmountFromLogs = (logs: string[]): number | undefined => {
    // This is a simplified extraction - in practice, you'd parse the actual instruction data
    for (const log of logs) {
      const match = log.match(/amount:\s*(\d+)/i);
      if (match) {
        return parseInt(match[1]) / Math.pow(10, 6); // Convert from lamports to tokens
      }
    }
    return undefined;
  };

  const getTransactionIcon = (type: ProgramTransaction["type"]) => {
    switch (type) {
      case "faucet_init":
        return <Coins size={16} className="text-accentPrimary" />;
      case "token_request":
        return <HandCoins size={16} className="text-confirmPrimary" />;
      case "task_create":
        return <CheckCircle size={16} className="text-baseSecondary" />;
      case "task_complete":
        return <CheckCircle size={16} className="text-confirmPrimary" />;
      case "task_cancel":
        return <XCircle size={16} className="text-dangerPrimary" />;
      case "token_burn":
        return <Fire size={16} className="text-dangerPrimary" />;
      case "faucet_delete":
        return <XCircle size={16} className="text-dangerPrimary" />;
      default:
        return <Info size={16} className="text-baseSecondary" />;
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  if (!connected || !publicKey) {
    return (
      <div
        className={`bg-basePrimary rounded-lg p-6 border border-baseSecondary/10 ${className}`}
      >
        <div className="text-center">
          <Wallet size={48} className="text-baseSecondary/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-baseSecondary mb-2">
            No Wallet Connected
          </h3>
          <p className="text-baseSecondary/70 text-sm">
            Connect your Solana wallet to view your information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-basePrimary rounded-lg border border-baseSecondary/10 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-baseSecondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet size={24} className="text-baseSecondary" />
            <div>
              <h3 className="text-lg font-medium text-baseSecondary">
                Wallet Information
              </h3>
              <p className="text-xs text-baseSecondary/70 break-all">
                {publicKey.toString()}
              </p>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-baseSecondary/60 flex items-center gap-1">
              <Clock size={12} />
              Updated {formatTimeAgo(lastUpdated.getTime())}
            </div>
          )}
        </div>
      </div>

      {/* Balances */}
      <div className="p-6 border-b border-baseSecondary/10">
        <h4 className="text-sm font-medium text-baseSecondary mb-4 uppercase tracking-wide">
          Balances
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SOL Balance */}
          <div className="bg-basePrimaryLight rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accentPrimary rounded-full"></div>
              <span className="text-xs font-medium text-baseSecondary/70">
                SOL BALANCE
              </span>
            </div>
            <p className="text-xl font-bold text-baseSecondary">
              {isLoading ? "..." : solBalance.toFixed(4)} SOL
            </p>
          </div>

          {/* Token Balance */}
          <div className="bg-basePrimaryLight rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyCircleDollar size={12} className="text-confirmPrimary" />
              <span className="text-xs font-medium text-baseSecondary/70">
                {faucetInfo ? "ALTR TOKENS" : "NO FAUCET"}
              </span>
            </div>
            <p className="text-xl font-bold text-baseSecondary">
              {isLoading
                ? "..."
                : faucetInfo
                  ? tokenBalance.toLocaleString()
                  : "0"}
              {faucetInfo && " ALTR"}
            </p>
          </div>
        </div>

        {faucetInfo && (
          <div className="mt-4 p-3 bg-baseSecondary/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-baseSecondary/70" />
              <span className="text-xs font-medium text-baseSecondary/70">
                FAUCET INFO
              </span>
            </div>
            <div className="text-xs text-baseSecondary/80 space-y-1">
              <p>
                Rate Limit:{" "}
                {(
                  parseInt(faucetInfo.rateLimit) / Math.pow(10, 6)
                ).toLocaleString()}{" "}
                tokens
              </p>
              <p>
                Cooldown:{" "}
                {Math.floor(parseInt(faucetInfo.cooldownPeriod) / 3600)} hours
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {showTransactionHistory && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-baseSecondary uppercase tracking-wide">
              Program Transactions
            </h4>
            <button
              onClick={loadWalletInfo}
              disabled={isLoading}
              className="text-xs text-baseSecondary/70 hover:text-baseSecondary transition-colors"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 rounded-full border-2 border-baseSecondary/30 border-t-baseSecondary animate-spin"></div>
              <span className="ml-2 text-sm text-baseSecondary/70">
                Loading transactions...
              </span>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.signature}
                  className="flex items-center justify-between p-3 bg-basePrimaryLight rounded-lg hover:bg-baseSecondary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="text-sm font-medium text-baseSecondary">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-baseSecondary/70">
                        <span>{formatTimeAgo(tx.timestamp)}</span>
                        {tx.amount && (
                          <>
                            <span>•</span>
                            <span>{tx.amount.toLocaleString()} tokens</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        tx.status === "success"
                          ? "bg-confirmPrimary"
                          : tx.status === "failed"
                            ? "bg-dangerPrimary"
                            : "bg-accentPrimary"
                      }`}
                    ></div>
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-baseSecondary/70 hover:text-baseSecondary transition-colors"
                    >
                      <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-baseSecondary/70">
                No program transactions found
              </p>
              <p className="text-xs text-baseSecondary/60 mt-1">
                Transactions with the Altruvist program will appear here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
