import {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";
import * as anchor from "@coral-xyz/anchor";
import idl from "../../target/idl/altruvist.json";
import { toast } from "react-toastify";
import { Connection } from "@solana/web3.js";

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
}
