// Client-side configuration for Solana
export function getSolanaConfig() {
  // Client-side fallback - check for environment variables passed from the server

  if (typeof window !== "undefined" && window.ENV) {
    return {
      FAUCET_SEED: window.ENV.SOLANA_FAUCET_SEED,
    };
  }

  return {
    FAUCET_SEED: undefined,
  };
}
