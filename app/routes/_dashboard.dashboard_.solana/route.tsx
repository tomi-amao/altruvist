import { MetaFunction } from "react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";

import {
  Rocket,
  CheckCircle,
  XCircle,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { address } from "@solana/kit";
import { createClient, SolanaService } from "../../services/solana.client";
import { toast } from "react-toastify";
import {
  createStandardToast,
  createSingleButtonToast,
} from "~/components/utils/ToastContent";

export const meta: MetaFunction = () => {
  return [
    { title: "Solana Program | Altruvist" },
    {
      name: "description",
      content: "Interact with the Altruvist Solana program",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

interface TransactionResult {
  signature: string;
  status: "success" | "error";
  message: string;
}

export default function SolanaPage() {
  const wallet = useAnchorWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [lastTransaction, setLastTransaction] =
    useState<TransactionResult | null>(null);

  async function tutorial() {
    try {
      // Check if wallet is connected
      if (!wallet || !wallet.publicKey) {
        toast.error("Please connect your wallet first");
        return;
      }

      setIsLoading(true);
      toast(wallet.publicKey?.toBase58() || "No public key found");

      // Create SolanaService instance with the entire wallet context
      const solanaService = new SolanaService(wallet);

      const client = createClient();
      const account = address("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
      const { value: balance } = await client.rpc.getBalance(account).send();
      console.log(`Balance: ${balance} lamports.`);

      const txSignature = await solanaService.initialiseProgram();

      if (txSignature) {
        toast.success(
          createSingleButtonToast(
            "Transaction completed! View details on Solana Explorer",
            "View",
            () => {
              window.open(
                `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
                "_blank",
              );
            },
            {
              icon: <CheckCircle size={20} className="text-confirmPrimary" />,
              buttonIcon: <ArrowSquareOut size={16} />,
            },
          ),
          {
            position: "bottom-right",
            icon: false,
            autoClose: 8000,
          },
        );

        setLastTransaction({
          signature: txSignature,
          status: "success",
          message: "Program initialized and balance retrieved successfully!",
        });
      }
    } catch (error) {
      console.error("Error:", error);

      // Error toast example
      toast.error(
        createStandardToast(
          "Failed to initialize program. Please try again.",
          <XCircle size={20} className="text-dangerPrimary" />,
        ),
        {
          position: "bottom-right",
          icon: false,
        },
      );

      setLastTransaction({
        signature: "",
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-basePrimary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-baseSecondary mb-4 flex items-center justify-center gap-3">
            <Rocket size={40} className="text-accentPrimary" />
            Solana Program
          </h1>
          <p className="text-baseSecondary/70 text-lg">
            Interact with the Altruvist Solana program on the blockchain
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <motion.div
            className="bg-basePrimaryLight rounded-xl p-6 shadow-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold text-baseSecondary mb-6">
              Program Controls
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-basePrimary rounded-lg border border-baseSecondary/20">
                <h3 className="font-medium text-baseSecondary mb-2">
                  Initialize Program
                </h3>
                <p className="text-baseSecondary/70 text-sm mb-4">
                  Initialize the Altruvist Solana program and log a greeting
                  message to the blockchain.
                </p>

                <PrimaryButton
                  text={isLoading ? "Initializing..." : "Initialize Program"}
                  action={tutorial}
                  ariaLabel="Initialize Solana program"
                />
              </div>

              {!wallet?.publicKey && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    💡 Please connect your Solana wallet to interact with the
                    program
                  </p>
                </div>
              )}
            </div>
          </motion.div>
          {/* Transaction History */}
          <motion.div
            className="bg-basePrimaryLight rounded-xl p-6 shadow-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-baseSecondary mb-6">
              Transaction Status
            </h2>

            {lastTransaction ? (
              <div
                className={`p-4 rounded-lg border ${
                  lastTransaction.status === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {lastTransaction.status === "success" ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      lastTransaction.status === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {lastTransaction.status === "success" ? "Success" : "Error"}
                  </span>
                </div>

                <p
                  className={`text-sm mb-3 ${
                    lastTransaction.status === "success"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {lastTransaction.message}
                </p>

                {lastTransaction.signature && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      Transaction Signature:
                    </p>
                    <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">
                      {lastTransaction.signature}
                    </div>
                    <SecondaryButton
                      text="View on Solana Explorer"
                      action={() => {
                        window.open(
                          `https://explorer.solana.com/tx/${lastTransaction.signature}?cluster=devnet`,
                          "_blank",
                        );
                      }}
                      ariaLabel="View transaction on Solana Explorer"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Initialize the program to see transaction details here
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Program Information */}
        <motion.div
          className="mt-8 bg-basePrimaryLight rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-baseSecondary mb-4">
            Program Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-baseSecondary mb-2">
                Program ID
              </h3>
            </div>

            <div>
              <h3 className="font-medium text-baseSecondary mb-2">Network</h3>
              <div className="bg-basePrimary p-3 rounded border border-baseSecondary/20">
                <span className="text-blue-600 font-medium">Devnet</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
