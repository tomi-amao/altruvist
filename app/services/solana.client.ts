import {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram , Connection } from "@solana/web3.js";
import idl from "../../target/idl/altruvist.json";
import { toast } from "react-toastify";

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
export function getAssociatedTokenAddressSync(mint, owner) {
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
  private wallet: anchor.Wallet;
  private program: anchor.Program;
  private provider!: anchor.AnchorProvider;

  constructor(wallet: anchor.Wallet) {
    this.wallet = wallet;
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
    toast.info(this.provider.connection.rpcEndpoint);
    // console.log(provider.wallet.publicKey.toBase58());

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

      // Derive faucet PDA using standard web3.js approach
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("altru_faucet")],
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
        .rpc();

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
      toast.error(
        `Failed to initialize faucet: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async requestTokens(
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

      // Derive faucet PDA
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("altru_faucet")],
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
        .requestTokens(new anchor.BN(amountWithDecimals))
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
        .rpc();

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
      toast.error(
        `Failed to request tokens: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  async getFaucetInfo(): Promise<{
    address: string;
    mint: string;
    authority: string;
    tokenAccount: string;
    rateLimit: string;
    cooldownPeriod: string;
  } | null> {
    try {
      // Derive faucet PDA
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("altru_faucet")],
        this.program.programId,
      );

      // Use proper typing for the account access
      const faucetAccount = await (
        this.program.account as ProgramAccountNamespace
      ).faucet.fetch(faucetPda);
      return {
        address: faucetPda.toBase58(),
        mint: faucetAccount.mint.toBase58(),
        authority: faucetAccount.authority.toBase58(),
        tokenAccount: faucetAccount.tokenAccount.toBase58(),
        rateLimit: faucetAccount.rateLimit.toString(),
        cooldownPeriod: faucetAccount.cooldownPeriod.toString(),
      };
    } catch (error) {
      console.error("Error fetching faucet info:", error);
      return null;
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

  async deleteFaucet(): Promise<string | undefined> {
    if (!this.wallet || !this.wallet.publicKey) {
      toast.error("Wallet not connected");
      return undefined;
    }

    try {
      toast.info("Deleting faucet...");

      // Derive faucet PDA
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("altru_faucet")],
        this.program.programId
      );

      // Get faucet account to retrieve mint address
      const faucetAccount = await (this.program.account as ProgramAccountNamespace).faucet.fetch(faucetPda);
      const mintPubkey = faucetAccount.mint;

      // Derive faucet token account
      const faucetTokenAccount = getAssociatedTokenAddressSync(
        mintPubkey,
        faucetPda,
        true
      );

      const txSignature = await this.program.methods
        .deleteFaucet()
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
      const latestBlockhash = await this.provider.connection.getLatestBlockhash("confirmed");
      await this.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return txSignature;
    } catch (error) {
      console.error("Error deleting faucet:", error);
      toast.error(`Failed to delete faucet: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  async burnAndDeleteFaucet(): Promise<string | undefined> {
    if (!this.wallet || !this.wallet.publicKey) {
      toast.error("Wallet not connected");
      return undefined;
    }

    try {
      toast.info("Burning tokens and deleting faucet...");

      // Derive faucet PDA
      const [faucetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("altru_faucet")],
        this.program.programId
      );

      // Get faucet account to retrieve mint address
      const faucetAccount = await (this.program.account as ProgramAccountNamespace).faucet.fetch(faucetPda);
      const mintPubkey = faucetAccount.mint;

      // Derive faucet token account
      const faucetTokenAccount = getAssociatedTokenAddressSync(
        mintPubkey,
        faucetPda,
        true
      );

      const txSignature = await this.program.methods
        .burnAndDeleteFaucet()
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
      const latestBlockhash = await this.provider.connection.getLatestBlockhash("confirmed");
      await this.provider.connection.confirmTransaction({
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return txSignature;
    } catch (error) {
      console.error("Error burning and deleting faucet:", error);
      toast.error(`Failed to burn and delete faucet: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }
}
