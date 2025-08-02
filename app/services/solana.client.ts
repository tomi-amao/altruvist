import {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
} from "@solana/kit";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import { getBurnCheckedInstruction } from "@solana-program/token-2022";
 
import idl from "../../target/idl/altruvist.json";
import { toast } from "react-toastify";
import { BlockchainReaderService } from "./blockchain-reader.client";
import { getSolanaConfig } from "~/lib/solana-config";

// Define interfaces for type safety
interface FaucetAccount {
  mint: PublicKey;
  authority: PublicKey;
  tokenAccount: PublicKey;
  rateLimit: anchor.BN;
  cooldownPeriod: anchor.BN;
  bump: number;
}

interface ProgramAccountNamespace {
  faucet: {
    fetch: (address: PublicKey) => Promise<FaucetAccount>;
  };
}

export type Client = {
  rpc: Rpc<SolanaRpcApi>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

let client: Client | undefined;
export function createClient(): Client {
  if (!client) {
    client = {
      // rpc: createSolanaRpc('http://127.0.0.1:8899'),
      // rpcSubscriptions: createSolanaRpcSubscriptions('ws://127.0.0.1:8900'),
      rpc: createSolanaRpc("https://api.devnet.solana.com "),
      rpcSubscriptions: createSolanaRpcSubscriptions(
        "wss://api.devnet.solana.com/",
      ),
    };
  }
  return client;
}

client = createClient();

// Token program constants
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

export function getAssociatedTokenAddressSync(
  mint: PublicKey,
  owner: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

// Helper function to derive ATA using standard web3.js approach
async function getAssociatedTokenAddressViaKit(
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return ata;
}

export class SolanaService {
  public wallet: anchor.Wallet;
  public program: anchor.Program;
  public provider!: anchor.AnchorProvider;
  private blockchainReader: BlockchainReaderService;

  constructor(
    wallet: anchor.Wallet,
    blockchainReader?: BlockchainReaderService,
  ) {
    this.wallet = wallet;
    // Use the provided blockchainReader or create a new one (for backwards compatibility)
    // Only create a new one if we're on the client side
    if (blockchainReader) {
      this.blockchainReader = blockchainReader;
    } else if (typeof window !== "undefined") {
      this.blockchainReader = new BlockchainReaderService();
    } else {
      // For SSR, create a placeholder that will be replaced on the client
      this.blockchainReader = {} as BlockchainReaderService;
    }
    this.program = this.getProgram();
  }

  private getProgram(): anchor.Program {
    const network = "https://api.devnet.solana.com";
    const connection = new Connection(network, "confirmed");

    this.provider = new anchor.AnchorProvider(
      connection,
      this.wallet,
      anchor.AnchorProvider.defaultOptions(),
    );
    anchor.setProvider(this.provider);

    return new anchor.Program(idl);
  }

  async initialiseProgram(): Promise<string | undefined> {
    toast.info(`Initializing program... ${this.program.programId.toBase58()}`);
    try {
      const txSignature = await this.program.methods.initialize().rpc();

      toast.success(
        `Program initialized successfully! Transaction signature: ${txSignature}`,
      );

      // Get the latest blockhash for the confirmation strategy
      const latestBlockhash =
        await this.provider.connection.getLatestBlockhash("confirmed");

      // Use the new TransactionConfirmationStrategy approach
      await this.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return txSignature;
    } catch (error) {
      console.error("Error initializing program:", error);
      toast.error(
        `Failed to initialize program: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async initializeFaucet(
    faucetSeed: string,
    name: string,
    symbol: string,
    uri: string,
    initialSupply: number,
  ): Promise<string | undefined> {
    if (!this.wallet || !this.wallet.publicKey) {
      toast.error("Wallet not connected");
      return undefined;
    }

    try {
      toast.info("Initializing faucet...");

      // Derive faucet PDA using configurable seed
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(faucetSeed)],
        this.program.programId,
      );

      // Generate mint keypair
      const mintKeypair = anchor.web3.Keypair.generate();

      // Derive faucet token account
      const faucetTokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        faucetPda,
      );
      console.log(`faucetTokenAccount: ${faucetTokenAccount.toBase58()}`);

      const initialSupplyWithDecimals = initialSupply * Math.pow(10, 6); // 6 decimals

      const txSignature = await this.program.methods
        .initializeFaucet(
          faucetSeed,
          name,
          symbol,
          uri,
          new anchor.BN(initialSupplyWithDecimals),
        )
        .accounts({
          mint: mintKeypair.publicKey,
          payer: this.wallet.publicKey,
        })
        .signers([mintKeypair])
        .rpc({
          commitment: "confirmed",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0,
        });

      toast.success(
        `Faucet initialized! Mint: ${mintKeypair.publicKey.toBase58()}`,
      );
      toast.success(`Transaction signature: ${txSignature}`);

      // Confirm transaction
      const latestBlockhash =
        await this.provider.connection.getLatestBlockhash("confirmed");
      await this.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return txSignature;
    } catch (error) {
      console.error("Error initializing faucet:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Initialize transaction already processed, checking if faucet exists...",
        );
        toast.info(
          "Transaction was already processed. Checking faucet status...",
        );

        // Check if the faucet was actually created
        try {
          const faucetInfo =
            await this.blockchainReader.getFaucetInfo(faucetSeed);
          if (faucetInfo) {
            toast.success("Faucet was already initialized successfully!");
            return "already_processed";
          }
        } catch (checkError) {
          console.error("Error checking faucet existence:", checkError);
        }

        toast.warning(
          "Transaction already processed but faucet status unclear",
        );
        return "already_processed";
      }

      // Handle wallet unlock error
      if (
        error instanceof Error &&
        (error.message.includes(
          "WalletSignTransactionError: Unexpected error",
        ) ||
          error.name === "WalletSignTransactionError")
      ) {
        toast.error("Please unlock your Solana wallet and try again");
        return undefined;
      }

      toast.error(
        `Failed to initialize faucet: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async requestTokens(
    faucetSeed: string,
    mintAddress: string,
    amount: number,
  ): Promise<string | undefined> {
    if (!this.wallet || !this.wallet.publicKey) {
      toast.error("Wallet not connected");
      return undefined;
    }

    try {
      toast.info(`Requesting ${amount} tokens...`);

      const mintPubkey = new PublicKey(mintAddress);

      // Derive faucet PDA using configurable seed
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(faucetSeed)],
        this.program.programId,
      );

      // Derive user request record PDA
      const [userRequestRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_record"), this.wallet.publicKey.toBuffer()],
        this.program.programId,
      );

      // Derive token accounts
      const faucetTokenAccount = await getAssociatedTokenAddressViaKit(
        mintPubkey,
        faucetPda,
      );

      const userTokenAccount = await getAssociatedTokenAddressViaKit(
        mintPubkey,
        this.wallet.publicKey,
      );

      const amountWithDecimals = amount * Math.pow(10, 6); // 6 decimals

      const txSignature = await this.program.methods
        .requestTokens(faucetSeed, new anchor.BN(amountWithDecimals))
        .accounts({
          faucet: faucetPda,
          faucetTokenAccount: faucetTokenAccount,
          userRequestRecord: userRequestRecord,
          userTokenAccount: userTokenAccount,
          mint: mintPubkey,
          user: this.wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          commitment: "confirmed", // More reliable than 'processed'
          preflightCommitment: "confirmed", // Consistent commitment levels
          skipPreflight: false, // Keep error checking
          maxRetries: 0, // Disable automatic retries (handle manually)
        });

      toast.success(`Requested ${amount} tokens successfully!`);
      toast.success(`Transaction signature: ${txSignature}`);

      // Confirm transaction
      const latestBlockhash =
        await this.provider.connection.getLatestBlockhash("confirmed");
      await this.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return txSignature;
    } catch (error) {
      console.error("Error requesting tokens:", error);

      // Handle specific case where transaction has already been processed
      if (
        error instanceof Error &&
        error.message.includes("This transaction has already been processed")
      ) {
        console.warn(
          "Request transaction already processed, checking user balance...",
        );
        toast.info(
          "Transaction was already processed. Checking token balance...",
        );

        // Check if the user's token balance has increased (indicating successful request)
        try {
          const currentBalance = await this.getUserTokenBalance(mintAddress);
          if (currentBalance > 0) {
            toast.success("Tokens were already requested successfully!");
            return "already_processed";
          }
        } catch (checkError) {
          console.error("Error checking token balance:", checkError);
        }

        toast.warning("Transaction already processed but token status unclear");
        return "already_processed";
      }

      // Handle cooldown error
      if (
        error instanceof Error &&
        (error.message.includes("CooldownNotMet") ||
          error.message.includes("Error Code: 6016") ||
          error.message.includes("Cooldown period not met"))
      ) {
        toast.error(
          "You must wait before requesting tokens again. Please try again later.",
        );
        return undefined;
      }

      // Handle unlock error
      if (
        error instanceof Error &&
        (error.message.includes(
          "WalletSignTransactionError: Unexpected error",
        ) ||
          error.name === "WalletSignTransactionError")
      ) {
        toast.error("Please unlock your Solana wallet and try again");
        return undefined;
      }

      toast.error(
        `Failed to request tokens: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async getUserTokenBalance(mintAddress: string): Promise<number> {
    if (!this.wallet.publicKey) return 0;

    try {
      const mintPubkey = new PublicKey(mintAddress);
      const userTokenAccount = await getAssociatedTokenAddressViaKit(
        mintPubkey,
        this.wallet.publicKey,
      );

      const tokenAccountInfo =
        await this.provider.connection.getTokenAccountBalance(userTokenAccount);
      return parseFloat(tokenAccountInfo.value.uiAmount?.toString() || "0");
    } catch (error) {
      console.error("Error fetching user token balance:", error);
      return 0;
    }
  }

  async deleteFaucet(faucetSeed?: string): Promise<string | undefined> {
    if (!this.wallet || !this.wallet.publicKey) {
      toast.error("Wallet not connected");
      return undefined;
    }

    try {
      toast.info("Deleting faucet...");

      // Use environment-based faucet seed if not provided
      const seed = faucetSeed || getSolanaConfig().FAUCET_SEED;

      // Derive faucet PDA using configurable seed
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        this.program.programId,
      );

      // Get faucet account to retrieve mint address
      const faucetAccount = await (
        this.program.account as ProgramAccountNamespace
      ).faucet.fetch(faucetPda);
      const mintPubkey = faucetAccount.mint;

      // Derive faucet token account
      const faucetTokenAccount = getAssociatedTokenAddressSync(
        mintPubkey,
        faucetPda,
      );

      const txSignature = await this.program.methods
        .deleteFaucet(seed)
        .accounts({
          faucet: faucetPda,
          faucetTokenAccount: faucetTokenAccount,
          mint: mintPubkey,
          payer: this.wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Faucet deleted successfully!");
      toast.success(`Transaction signature: ${txSignature}`);

      // Confirm transaction
      const latestBlockhash =
        await this.provider.connection.getLatestBlockhash("confirmed");
      await this.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return txSignature;
    } catch (error) {
      console.error("Error deleting faucet:", error);
      toast.error(
        `Failed to delete faucet: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async burnAndDeleteFaucet(faucetSeed?: string): Promise<string | undefined> {
    if (!this.wallet || !this.wallet.publicKey) {
      toast.error("Wallet not connected");
      return undefined;
    }

    try {
      toast.info("Burning tokens and deleting faucet...");

      // Use environment-based faucet seed if not provided
      const seed = faucetSeed || getSolanaConfig().FAUCET_SEED;

      // Derive faucet PDA using configurable seed
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        this.program.programId,
      );

      // Get faucet account to retrieve mint address
      const faucetAccount = await (
        this.program.account as ProgramAccountNamespace
      ).faucet.fetch(faucetPda);
      const mintPubkey = faucetAccount.mint;

      // Derive faucet token account
      const faucetTokenAccount = getAssociatedTokenAddressSync(
        mintPubkey,
        faucetPda,
      );

      const txSignature = await this.program.methods
        .burnAndDeleteFaucet(seed)
        .accounts({
          faucet: faucetPda,
          faucetTokenAccount: faucetTokenAccount,
          mint: mintPubkey,
          payer: this.wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Tokens burned and faucet deleted successfully!");
      toast.success(`Transaction signature: ${txSignature}`);

      // Confirm transaction
      const latestBlockhash =
        await this.provider.connection.getLatestBlockhash("confirmed");
      await this.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return txSignature;
    } catch (error) {
      console.error("Error burning and deleting faucet:", error);
      toast.error(
        `Failed to burn and delete faucet: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async burnUserTokens(
    mintAddress: string,
    amount: number,
    decimals: number = 6,
  ): Promise<string | undefined> {
    if (!this.wallet || !this.wallet.publicKey) {
      toast.error("Wallet not connected");
      return undefined;
    }

    try {
      toast.info(`Burning ${amount} tokens...`);

      const mintPubkey = new PublicKey(mintAddress);

      // Get user's token account
      const userTokenAccount = await getAssociatedTokenAddressViaKit(
        mintPubkey,
        this.wallet.publicKey,
      );

      // Check if token account exists and has balance
      try {
        const tokenAccountInfo =
          await this.provider.connection.getTokenAccountBalance(
            userTokenAccount,
          );
        const currentBalance = parseFloat(
          tokenAccountInfo.value.uiAmount?.toString() || "0",
        );

        if (currentBalance < amount) {
          toast.error(
            `Insufficient balance. You have ${currentBalance} tokens but tried to burn ${amount}`,
          );
          return undefined;
        }

        console.log(
          `Current balance: ${currentBalance}, trying to burn: ${amount}`,
        );
      } catch (error) {
        console.error("Token account check failed:", error);
        toast.error("Token account not found. Please request tokens first.");
        return undefined;
      }

      // Calculate amount with decimals
      const amountWithDecimals = amount * Math.pow(10, decimals);

      // Use getBurnCheckedInstruction to get the correct instruction format
      const burnIx = getBurnCheckedInstruction({
        account: address(userTokenAccount.toBase58()),
        mint: address(mintAddress),
        authority: address(this.wallet.publicKey.toBase58()),
        amount: BigInt(amountWithDecimals),
        decimals: decimals,
      });

      // Convert to standard TransactionInstruction format
      const standardBurnIx = new anchor.web3.TransactionInstruction({
        keys: [
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: mintPubkey, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
        ],
        programId: TOKEN_2022_PROGRAM_ID,
        data: Buffer.from(burnIx.data), // Use the correct instruction data from getBurnCheckedInstruction
      });

      // Create transaction
      const transaction = new anchor.web3.Transaction();
      transaction.add(standardBurnIx);

      // Send using Anchor provider (handles wallet signing automatically)
      const txSignature = await this.provider.sendAndConfirm(transaction);

      toast.success(`Burned ${amount} tokens successfully!`);
      toast.success(`Transaction signature: ${txSignature}`);

      return txSignature;
    } catch (error) {
      console.error("Error burning tokens:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (
          error.message.includes("insufficient funds") ||
          error.message.includes("Attempt to debit")
        ) {
          toast.error(
            "Insufficient balance or token account not properly funded. Please check your token balance.",
          );
        } else if (error.message.includes("AccountNotFound")) {
          toast.error("Token account not found. Please request tokens first.");
        } else {
          toast.error(`Failed to burn tokens: ${error.message}`);
        }
      } else {
        toast.error(`Failed to burn tokens: ${String(error)}`);
      }
      return undefined;
    }
  }
}
