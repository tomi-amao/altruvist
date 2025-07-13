import {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";

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
