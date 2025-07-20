import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { Altruvist } from "../../target/types/altruvist";

// Export the program type
export type AltruvistProgram = Altruvist;

// Generate TypeScript types from IDL accounts
export type TaskAccount = IdlAccounts<Altruvist>["task"];
export type FaucetAccount = IdlAccounts<Altruvist>["faucet"];
export type UserRequestRecord = IdlAccounts<Altruvist>["userRequestRecord"];

// Generate TypeScript types from IDL types
export type TaskStatus = IdlTypes<Altruvist>["TaskStatus"];

// Token account structure (standard SPL token account)
export interface TokenAccountInfo {
  address: string;
  mint: string;
  owner: string;
  amount: bigint;
  delegate?: string;
  state: number;
  isNative?: boolean;
  delegatedAmount?: bigint;
  closeAuthority?: string;
}

// On-chain task data is the same as TaskAccount from IDL
export type OnChainTaskData = TaskAccount;

// Escrow account data structure
export interface EscrowAccountData {
  address: string;
  data: TokenAccountInfo;
  executable: boolean;
  exists: boolean;
  lamports: bigint;
  programAddress: string;
  space: bigint;
}
