import { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaService } from "~/hooks/useSolanaService";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import { FormField } from "~/components/utils/FormField";
import { Coins, PaperPlaneTilt, Info, Fire } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import WalletInfo from "~/components/tasks/WalletInfo";
import { getSolanaConfig } from "~/lib/solana-config";

interface FaucetInfo {
  address: string;
  mint: string;
  authority: string;
  tokenAccount: string;
  rateLimit: string;
  cooldownPeriod: string;
}

export default function SolanaFaucet() {
  const { connected } = useWallet();
  const { solanaService, blockchainReader } = useSolanaService();

  // Get faucet seed from environment configuration
  const faucetSeed = getSolanaConfig().FAUCET_SEED;

  // Faucet initialization state
  const [initializeLoading, setInitializeLoading] = useState(false);
  const [faucetForm, setFaucetForm] = useState({
    name: "Altruvist Token",
    symbol: "ALTR",
    uri: "https://altruvist.org/token-metadata.json",
    initialSupply: "1000000",
  });

  // Token request state
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({
    mintAddress: "",
    amount: "100",
  });

  // Token burn state
  const [burnLoading, setBurnLoading] = useState(false);
  const [burnForm, setBurnForm] = useState({
    mintAddress: "",
    amount: "50",
  });

  // Simplified state - WalletInfo component handles most wallet data
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [burnDeleteLoading, setBurnDeleteLoading] = useState(false);

  // Load faucet info on component mount
  useEffect(() => {
    if (solanaService && connected) {
      loadFaucetInfo();
    }
  }, [solanaService, connected]);

  // Update form mint addresses when faucet info changes
  useEffect(() => {
    if (faucetInfo?.mint) {
      setRequestForm((prev) => ({ ...prev, mintAddress: faucetInfo.mint }));
      setBurnForm((prev) => ({ ...prev, mintAddress: faucetInfo.mint }));
    }
  }, [faucetInfo]);

  const loadFaucetInfo = async () => {
    if (!solanaService) return;

    setLoadingInfo(true);
    try {
      const info = await blockchainReader?.getFaucetInfo(faucetSeed);
      setFaucetInfo(info);
    } catch (error) {
      console.error("Error loading faucet info:", error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleInitializeFaucet = async () => {
    if (!solanaService) {
      toast.error("Solana service not available");
      return;
    }

    setInitializeLoading(true);
    try {
      const txSignature = await solanaService.initializeFaucet(
        faucetSeed,
        faucetForm.name,
        faucetForm.symbol,
        faucetForm.uri,
        parseInt(faucetForm.initialSupply) || 0,
      );

      if (txSignature) {
        // Reload faucet info after successful initialization
        setTimeout(() => {
          loadFaucetInfo();
        }, 2000);
      }
    } catch (error) {
      console.error("Error initializing faucet:", error);
    } finally {
      setInitializeLoading(false);
    }
  };

  const handleRequestTokens = async () => {
    if (!solanaService) {
      toast.error("Solana service not available");
      return;
    }

    if (!requestForm.mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setRequestLoading(true);
    try {
      const txSignature = await solanaService.requestTokens(
        faucetSeed,
        requestForm.mintAddress,
        parseInt(requestForm.amount) || 0,
      );

      if (txSignature) {
        toast.success(
          "Tokens requested successfully! Check your wallet info above for updated balance.",
        );
      }
    } catch (error) {
      console.error("Error requesting tokens:", error);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleDeleteFaucet = async () => {
    if (!solanaService) {
      toast.error("Solana service not available");
      return;
    }

    setDeleteLoading(true);
    try {
      const txSignature = await solanaService.deleteFaucet(faucetSeed);

      if (txSignature) {
        // Reset faucet info and form
        setFaucetInfo(null);
        setFaucetForm({
          name: "Altruvist Token",
          symbol: "ALTR",
          uri: "https://altruvist.org/token-metadata.json",
          initialSupply: "1000000",
        });
        toast.success("Faucet deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting faucet:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBurnAndDeleteFaucet = async () => {
    if (!solanaService) {
      toast.error("Solana service not available");
      return;
    }

    setBurnDeleteLoading(true);
    try {
      const txSignature = await solanaService.burnAndDeleteFaucet(faucetSeed);

      if (txSignature) {
        // Reset faucet info and form
        setFaucetInfo(null);
        setFaucetForm({
          name: "Altruvist Token",
          symbol: "ALTR",
          uri: "https://altruvist.org/token-metadata.json",
          initialSupply: "1000000",
        });
        toast.success("Tokens burned and faucet deleted successfully");
      }
    } catch (error) {
      console.error("Error burning and deleting faucet:", error);
    } finally {
      setBurnDeleteLoading(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!solanaService) {
      toast.error("Solana service not available");
      return;
    }

    if (!burnForm.mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    if (!burnForm.amount || parseFloat(burnForm.amount) <= 0) {
      toast.error("Please enter a valid amount to burn");
      return;
    }

    setBurnLoading(true);
    try {
      const txSignature = await solanaService.burnUserTokens(
        burnForm.mintAddress,
        parseFloat(burnForm.amount),
      );

      if (txSignature) {
        toast.success(
          "Tokens burned successfully! Check your wallet info above for updated balance.",
        );
      }
    } catch (error) {
      console.error("Error burning tokens:", error);
    } finally {
      setBurnLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-baseSecondary">
            Altruvist Token Faucet
          </h1>
          <p className="text-baseSecondary/70 mt-2">
            Initialize the faucet or request tokens for testing
          </p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Wallet Information Component */}
      {connected && (
        <WalletInfo
          className="mb-8"
          showTransactionHistory={true}
          maxTransactions={8}
        />
      )}

      {/* Faucet Information */}
      {connected && (
        <div className="bg-basePrimaryLight p-6 rounded-lg border border-baseSecondary/20">
          <div className="flex items-center gap-2 mb-4">
            <Info size={20} className="text-baseSecondary" />
            <h2 className="text-xl font-semibold text-baseSecondary">
              Faucet Management
            </h2>
          </div>
          <p className="text-baseSecondary/70 mb-4">
            Manage the token faucet configuration and operations
          </p>

          {loadingInfo ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 rounded-full border-2 border-baseSecondary/50 border-t-transparent animate-spin"></div>
              <span className="ml-2 text-baseSecondary">
                Loading faucet info...
              </span>
            </div>
          ) : faucetInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-baseSecondary">
                  Faucet Address
                </span>
                <code className="text-xs bg-baseSecondary/10 p-2 rounded block break-all text-baseSecondary">
                  {faucetInfo.address}
                </code>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-baseSecondary">
                  Mint Address
                </span>
                <code className="text-xs bg-baseSecondary/10 p-2 rounded block break-all text-baseSecondary">
                  {faucetInfo.mint}
                </code>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-baseSecondary/70 mb-4">
                No faucet found. Initialize one below to get started.
              </p>
            </div>
          )}

          {faucetInfo && (
            <div className="flex gap-4 mt-6">
              <SecondaryButton
                text="Refresh"
                action={loadFaucetInfo}
                ariaLabel="Refresh faucet info"
                type="button"
              />
              <SecondaryButton
                text={deleteLoading ? "Deleting..." : "Delete Faucet"}
                action={handleDeleteFaucet}
                ariaLabel="Delete faucet"
                type="button"
                isDisabled={deleteLoading}
              />
              <SecondaryButton
                text={
                  burnDeleteLoading
                    ? "Burning & Deleting..."
                    : "Burn & Delete Faucet"
                }
                action={handleBurnAndDeleteFaucet}
                ariaLabel="Burn and delete faucet"
                type="button"
                isDisabled={burnDeleteLoading}
              />
            </div>
          )}
        </div>
      )}

      {connected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Initialize Faucet - Only show if no faucet exists */}
          {!faucetInfo && (
            <div className="bg-basePrimaryLight p-6 rounded-lg border border-baseSecondary/20">
              <div className="flex items-center gap-2 mb-4">
                <Coins size={20} className="text-baseSecondary" />
                <h2 className="text-xl font-semibold text-baseSecondary">
                  Initialize Faucet
                </h2>
              </div>
              <p className="text-baseSecondary/70 mb-6">
                Create a new token faucet with initial supply
              </p>

              <div className="space-y-4">
                <FormField
                  htmlFor="token-name"
                  label="Token Name"
                  value={faucetForm.name}
                  onChange={(e) =>
                    setFaucetForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter token name"
                  backgroundColour="bg-basePrimary"
                />

                <FormField
                  htmlFor="token-symbol"
                  label="Token Symbol"
                  value={faucetForm.symbol}
                  onChange={(e) =>
                    setFaucetForm((prev) => ({
                      ...prev,
                      symbol: e.target.value,
                    }))
                  }
                  placeholder="Enter token symbol"
                  backgroundColour="bg-basePrimary"
                />

                <FormField
                  htmlFor="token-uri"
                  label="Metadata URI"
                  value={faucetForm.uri}
                  onChange={(e) =>
                    setFaucetForm((prev) => ({ ...prev, uri: e.target.value }))
                  }
                  placeholder="Enter metadata URI"
                  backgroundColour="bg-basePrimary"
                />

                <FormField
                  htmlFor="initial-supply"
                  label="Initial Supply"
                  type="number"
                  value={faucetForm.initialSupply}
                  onChange={(e) =>
                    setFaucetForm((prev) => ({
                      ...prev,
                      initialSupply: e.target.value,
                    }))
                  }
                  placeholder="Enter initial supply"
                  backgroundColour="bg-basePrimary"
                />

                <PrimaryButton
                  text={
                    initializeLoading ? "Initializing..." : "Initialize Faucet"
                  }
                  action={handleInitializeFaucet}
                  ariaLabel="Initialize faucet"
                  isDisabled={initializeLoading || !connected}
                />
              </div>
            </div>
          )}

          {/* Request Tokens - Adjust grid columns based on whether faucet exists */}
          <div
            className={`bg-basePrimaryLight p-6 rounded-lg border border-baseSecondary/20 ${!faucetInfo ? "lg:col-span-2" : ""}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <PaperPlaneTilt size={20} className="text-baseSecondary" />
              <h2 className="text-xl font-semibold text-baseSecondary">
                Request Tokens
              </h2>
            </div>
            <p className="text-baseSecondary/70 mb-6">
              Request tokens from an existing faucet
            </p>

            <div className="space-y-4">
              <FormField
                htmlFor="mint-address"
                label="Mint Address"
                value={requestForm.mintAddress}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    mintAddress: e.target.value,
                  }))
                }
                placeholder="Enter mint address"
                backgroundColour="bg-basePrimary"
              />

              <FormField
                htmlFor="request-amount"
                label="Amount"
                type="number"
                value={requestForm.amount}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="Enter amount to request"
                backgroundColour="bg-basePrimary"
              />

              <PrimaryButton
                text={requestLoading ? "Requesting..." : "Request Tokens"}
                action={handleRequestTokens}
                ariaLabel="Request tokens"
                isDisabled={
                  requestLoading || !connected || !requestForm.mintAddress
                }
              />
            </div>
          </div>

          {/* Burn Tokens */}
          <div className="bg-basePrimaryLight p-6 rounded-lg border border-baseSecondary/20">
            <div className="flex items-center gap-2 mb-4">
              <Fire size={20} className="text-dangerPrimary" />
              <h2 className="text-xl font-semibold text-baseSecondary">
                Burn Tokens
              </h2>
            </div>
            <p className="text-baseSecondary/70 mb-6">
              Permanently destroy your tokens
            </p>

            <div className="space-y-4">
              <FormField
                htmlFor="burn-mint-address"
                label="Mint Address"
                value={burnForm.mintAddress}
                onChange={(e) =>
                  setBurnForm((prev) => ({
                    ...prev,
                    mintAddress: e.target.value,
                  }))
                }
                placeholder="Enter mint address"
                backgroundColour="bg-basePrimary"
              />

              <FormField
                htmlFor="burn-amount"
                label="Amount to Burn"
                type="number"
                value={burnForm.amount}
                onChange={(e) =>
                  setBurnForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="Enter amount to burn"
                backgroundColour="bg-basePrimary"
              />

              <div className="bg-dangerPrimary/10 border border-dangerPrimary/20 rounded-md p-4">
                <p className="text-dangerPrimary text-sm font-medium">
                  ⚠️ Warning
                </p>
                <p className="text-dangerPrimary/80 text-xs mt-1">
                  Burning tokens is permanent and cannot be undone. Make sure
                  you want to destroy these tokens.
                </p>
              </div>

              <PrimaryButton
                text={burnLoading ? "Burning..." : "Burn Tokens"}
                action={handleBurnTokens}
                ariaLabel="Burn tokens"
                isDisabled={
                  burnLoading ||
                  !connected ||
                  !burnForm.mintAddress ||
                  !burnForm.amount
                }
                className="bg-dangerPrimary hover:bg-dangerPrimary/90"
              />
            </div>
          </div>
        </div>
      )}

      {!connected && (
        <div className="bg-basePrimaryLight p-12 rounded-lg border border-baseSecondary/20 text-center">
          <h3 className="text-xl font-semibold mb-4 text-baseSecondary">
            Connect Your Wallet
          </h3>
          <p className="text-baseSecondary/70 text-center mb-6">
            Please connect your Solana wallet to interact with the faucet
          </p>
          <WalletMultiButton />
        </div>
      )}
    </div>
  );
}
