// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { Altruvist } from "../../target/types/altruvist";
// import { expect } from "chai";
// import {
//   PublicKey,
//   Keypair,
//   SystemProgram,
//   LAMPORTS_PER_SOL,
//   TransactionSignature,
// } from "@solana/web3.js";
// import {
//   TOKEN_2022_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   getAssociatedTokenAddressSync,
//   getAccount,
//   getMint,
// } from "@solana/spl-token";

// async function logTransactionTiming(
//   connection: any,
//   txSignature: TransactionSignature,
//   description: string
// ) {
//   const startTime = Date.now();
//   console.log(`\n🚀 ${description}`);
//   console.log(`📝 Transaction Signature: ${txSignature}`);
//   console.log(`⏰ Submitted at: ${new Date().toISOString()}`);

//   try {
//     const status = await connection.getSignatureStatus(txSignature);
//     console.log(`📊 Initial Status:`, status);

//     const confirmation = await connection.confirmTransaction(txSignature, "confirmed");
//     const endTime = Date.now();

//     console.log(`✅ Confirmed at: ${new Date().toISOString()}`);
//     console.log(`⏱️  Confirmation time: ${endTime - startTime}ms`);
//     console.log(`🔗 Confirmation details:`, confirmation);

//     return confirmation;
//   } catch (error) {
//     console.log(`❌ Confirmation failed:`, error);
//     throw error;
//   }
// }

// async function fetchAccountWithRetry(
//   fetchFunction: () => Promise<any>,
//   accountType: string,
//   maxRetries = 3,
//   delayMs = 1000
// ) {
//   console.log(`\n🔍 Fetching ${accountType} account...`);

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`📦 Attempt ${attempt}/${maxRetries} to fetch ${accountType}`);
//       const startTime = Date.now();

//       const account = await fetchFunction();
//       const endTime = Date.now();

//       console.log(`✅ ${accountType} fetched successfully in ${endTime - startTime}ms`);
//       return account;
//     } catch (error) {
//       console.log(`❌ Attempt ${attempt} failed for ${accountType}:`, error.message);

//       if (attempt === maxRetries) {
//         console.log(`🚫 All ${maxRetries} attempts failed for ${accountType}`);
//         throw error;
//       }

//       console.log(`⏳ Waiting ${delayMs}ms before retry...`);
//       await new Promise(resolve => setTimeout(resolve, delayMs));
//     }
//   }
// }

// describe("Faucet System Tests", () => {
//   anchor.setProvider(anchor.AnchorProvider.env());
//   const program = anchor.workspace.Altruvist as Program<Altruvist>;
//   const provider = anchor.getProvider();

//   let faucetPDA: PublicKey;
//   let faucetBump: number;
//   let mintKeypair: Keypair;
//   let faucetTokenAccount: PublicKey;
//   let user: Keypair;
//   let userTokenAccount: PublicKey;
//   let userRequestRecordPDA: PublicKey;
//   let userRequestRecordBump: number;

//   const tokenName = "Altruvist Token";
//   const tokenSymbol = "ALT";
//   const tokenUri = "https://example.com/metadata.json";
//   const initialSupply = new anchor.BN(1_000_000 * 10**6); // 1M tokens with 6 decimals

//   before(async () => {
//     console.log("\n🎯 Setting up test environment...");
//     console.log(`🔗 RPC Endpoint: ${provider.connection.rpcEndpoint}`);
//     console.log(`🏦 Program ID: ${program.programId.toString()}`);

//     user = Keypair.generate();
//     mintKeypair = Keypair.generate();

//     console.log(`👤 User Public Key: ${user.publicKey.toString()}`);
//     console.log(`🪙 Mint Public Key: ${mintKeypair.publicKey.toString()}`);

//     console.log("\n💰 Requesting airdrop...");
//     const airdropStartTime = Date.now();

//     const airdropTx = await provider.connection.requestAirdrop(user.publicKey, 20 * LAMPORTS_PER_SOL);
//     console.log(`📝 Airdrop transaction: ${airdropTx}`);

//     console.log("⏳ Waiting for airdrop confirmation...");
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     const airdropEndTime = Date.now();
//     console.log(`⏱️  Airdrop wait time: ${airdropEndTime - airdropStartTime}ms`);

//     const balance = await provider.connection.getBalance(user.publicKey);
//     console.log(`💳 User balance after airdrop: ${balance / LAMPORTS_PER_SOL} SOL`);

//     console.log("\n🔑 Deriving PDAs...");
//     [faucetPDA, faucetBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("altru_faucet")],
//       program.programId
//     );
//     console.log(`🏭 Faucet PDA: ${faucetPDA.toString()}, bump: ${faucetBump}`);

//     [userRequestRecordPDA, userRequestRecordBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("user_record"), user.publicKey.toBuffer()],
//       program.programId
//     );
//     console.log(`📊 User Request Record PDA: ${userRequestRecordPDA.toString()}, bump: ${userRequestRecordBump}`);

//     console.log("\n🏦 Calculating associated token accounts...");
//     faucetTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       faucetPDA,
//       true,
//       TOKEN_2022_PROGRAM_ID
//     );
//     console.log(`🏭 Faucet Token Account: ${faucetTokenAccount.toString()}`);

//     userTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       user.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );
//     console.log(`👤 User Token Account: ${userTokenAccount.toString()}`);

//     console.log("✅ Test environment setup complete!\n");
//   });

// //   describe("Faucet Initialization", () => {
// //     it("Should initialize faucet with Token 2022 mint", async () => {
// //       console.log("\n🚀 Starting faucet initialization test...");
// //       console.log(`📊 Token Details: ${tokenName} (${tokenSymbol})`);
// //       console.log(`💰 Initial Supply: ${initialSupply.toString()} (${initialSupply.toNumber() / 10**6} tokens)`);

// //       const txStartTime = Date.now();

// //       const tx = await program.methods
// //         .initializeFaucet(tokenName, tokenSymbol, tokenUri, initialSupply)
// //         .accounts({
// //           mint: mintKeypair.publicKey,
// //           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
// //           faucet: faucetPDA,
// //           faucetTokenAccount,
// //           payer: user.publicKey,
// //           systemProgram: SystemProgram.programId,
// //           tokenProgram: TOKEN_2022_PROGRAM_ID,
// //         })
// //         .signers([mintKeypair, user])
// //         .rpc();

// //       const txEndTime = Date.now();
// //       console.log(`⏱️  Transaction submission time: ${txEndTime - txStartTime}ms`);

// //       await logTransactionTiming(provider.connection, tx, "Faucet Initialization");

// //       console.log("\n⏳ Additional safety delay...");
// //       await new Promise(resolve => setTimeout(resolve, 1000));

// //       console.log("\n📋 Verifying created accounts...");

// //       console.log("🔍 Fetching faucet account...");
// //       const faucetAccount = await program.account.faucet.fetch(faucetPDA);
// //       console.log("✅ Faucet account fetched successfully");
// //       console.log(`📊 Faucet account data:`, {
// //         mint: faucetAccount.mint.toString(),
// //         authority: faucetAccount.authority.toString(),
// //         tokenAccount: faucetAccount.tokenAccount.toString(),
// //         rateLimit: faucetAccount.rateLimit.toNumber(),
// //         cooldownPeriod: faucetAccount.cooldownPeriod.toNumber(),
// //         bump: faucetAccount.bump
// //       });

// //       expect(faucetAccount.mint.toString()).to.equal(mintKeypair.publicKey.toString());
// //       expect(faucetAccount.authority.toString()).to.equal(faucetPDA.toString());
// //       expect(faucetAccount.tokenAccount.toString()).to.equal(faucetTokenAccount.toString());
// //       expect(faucetAccount.rateLimit.toNumber()).to.equal(1000 * 10**6);
// //       expect(faucetAccount.cooldownPeriod.toNumber()).to.equal(86400);
// //       expect(faucetAccount.bump).to.equal(faucetBump);

// //       const mintAccount = await fetchAccountWithRetry(
// //         () => getMint(provider.connection, mintKeypair.publicKey, "confirmed", TOKEN_2022_PROGRAM_ID),
// //         "mint"
// //       );

// //       console.log(`📊 Mint account data:`, {
// //         mintAuthority: mintAccount.mintAuthority?.toString(),
// //         decimals: mintAccount.decimals,
// //         supply: mintAccount.supply.toString()
// //       });

// //       expect(mintAccount.mintAuthority.toString()).to.equal(faucetPDA.toString());
// //       expect(mintAccount.decimals).to.equal(6);

// //       const faucetTokenAccountInfo = await fetchAccountWithRetry(
// //         () => getAccount(provider.connection, faucetTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID),
// //         "faucet token account"
// //       );

// //       console.log(`📊 Faucet token account data:`, {
// //         mint: faucetTokenAccountInfo.mint.toString(),
// //         owner: faucetTokenAccountInfo.owner.toString(),
// //         amount: faucetTokenAccountInfo.amount.toString()
// //       });

// //       expect(faucetTokenAccountInfo.amount.toString()).to.equal(initialSupply.toString());

// //       console.log("✅ All verifications passed!");
// //     });

// //     it("Should fail to initialize faucet twice", async () => {
// //       try {
// //         await program.methods
// //           .initializeFaucet(tokenName, tokenSymbol, tokenUri, initialSupply)
// //           .accounts({
// //             faucet: faucetPDA,
// //             mint: mintKeypair.publicKey,
// //             faucetTokenAccount,
// //             payer: provider.wallet.publicKey,
// //             tokenProgram: TOKEN_2022_PROGRAM_ID,
// //             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
// //             systemProgram: SystemProgram.programId,
// //           })
// //           .signers([mintKeypair])
// //           .rpc();

// //         expect.fail("Should have thrown an error");
// //       } catch (error) {
// //         expect(error.message).to.include("already in use");
// //       }
// //     });
// //   });

// //   describe("Token Requests", () => {
// //     it("Should allow user to request tokens from faucet", async () => {
// //       const requestAmount = new anchor.BN(500 * 10**6); // 500 tokens

// //       console.log("\n🚀 Starting token request test...");
// //       console.log(`💰 Request Amount: ${requestAmount.toString()} (${requestAmount.toNumber() / 10**6} tokens)`);

// //       const txStartTime = Date.now();

// //       const tx = await program.methods
// //         .requestTokens(requestAmount)
// //         .accounts({
// //           faucet: faucetPDA,
// //           faucetTokenAccount,
// //           userRequestRecord: userRequestRecordPDA,
// //           userTokenAccount,
// //           mint: mintKeypair.publicKey,
// //           user: user.publicKey,
// //           tokenProgram: TOKEN_2022_PROGRAM_ID,
// //           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
// //           systemProgram: SystemProgram.programId,
// //         })
// //         .signers([user])
// //         .rpc();

// //       const txEndTime = Date.now();
// //       console.log(`⏱️  Transaction submission time: ${txEndTime - txStartTime}ms`);

// //       await logTransactionTiming(provider.connection, tx, "Token Request");
// //       await new Promise(resolve => setTimeout(resolve, 1000));

// //       const userTokenAccountInfo = await fetchAccountWithRetry(
// //         () => getAccount(provider.connection, userTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID),
// //         "user token account"
// //       );

// //       console.log(`📊 User token account data:`, {
// //         mint: userTokenAccountInfo.mint.toString(),
// //         owner: userTokenAccountInfo.owner.toString(),
// //         amount: userTokenAccountInfo.amount.toString()
// //       });

// //       expect(userTokenAccountInfo.amount.toString()).to.equal(requestAmount.toString());

// //       console.log("🔍 Fetching user request record...");
// //       const userRequestRecord = await program.account.userRequestRecord.fetch(userRequestRecordPDA);
// //       console.log("✅ User request record fetched successfully");
// //       console.log(`📊 User request record data:`, {
// //         user: userRequestRecord.user.toString(),
// //         totalReceived: userRequestRecord.totalReceived.toString(),
// //         requestCount: userRequestRecord.requestCount,
// //         lastRequest: userRequestRecord.lastRequest.toNumber()
// //       });

// //       expect(userRequestRecord.user.toString()).to.equal(user.publicKey.toString());
// //       expect(userRequestRecord.totalReceived.toString()).to.equal(requestAmount.toString());
// //       expect(userRequestRecord.requestCount).to.equal(1);
// //       expect(userRequestRecord.lastRequest.toNumber()).to.be.greaterThan(0);

// //       console.log("✅ All verifications passed!");
// //     });

// //     it("Should fail when requesting more than rate limit", async () => {
// //       const excessiveAmount = new anchor.BN(2000 * 10**6); // 2000 tokens (exceeds 1000 limit)

// //       try {
// //         await program.methods
// //           .requestTokens(excessiveAmount)
// //           .accounts({
// //             faucet: faucetPDA,
// //             faucetTokenAccount,
// //             userRequestRecord: userRequestRecordPDA,
// //             userTokenAccount,
// //             mint: mintKeypair.publicKey,
// //             user: user.publicKey,
// //             tokenProgram: TOKEN_2022_PROGRAM_ID,
// //             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
// //             systemProgram: SystemProgram.programId,
// //           })
// //           .signers([user])
// //           .rpc();

// //         expect.fail("Should have thrown an error");
// //       } catch (error) {
// //         expect(error.message).to.include("RequestAmountTooHigh");
// //       }
// //     });

// //     it("Should fail when requesting tokens too quickly (cooldown)", async () => {
// //       const requestAmount = new anchor.BN(100 * 10**6);

// //       try {
// //         await program.methods
// //           .requestTokens(requestAmount)
// //           .accounts({
// //             faucet: faucetPDA,
// //             faucetTokenAccount,
// //             userRequestRecord: userRequestRecordPDA,
// //             userTokenAccount,
// //             mint: mintKeypair.publicKey,
// //             user: user.publicKey,
// //             tokenProgram: TOKEN_2022_PROGRAM_ID,
// //             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
// //             systemProgram: SystemProgram.programId,
// //           })
// //           .signers([user])
// //           .rpc();

// //         expect.fail("Should have thrown an error");
// //       } catch (error) {
// //         expect(error.message).to.include("CooldownNotMet");
// //       }
// //     });

// //     it("Should fail when requesting zero tokens", async () => {
// //       const zeroAmount = new anchor.BN(0);

// //       try {
// //         await program.methods
// //           .requestTokens(zeroAmount)
// //           .accounts({
// //             faucet: faucetPDA,
// //             faucetTokenAccount,
// //             userRequestRecord: userRequestRecordPDA,
// //             userTokenAccount,
// //             mint: mintKeypair.publicKey,
// //             user: user.publicKey,
// //             tokenProgram: TOKEN_2022_PROGRAM_ID,
// //             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
// //             systemProgram: SystemProgram.programId,
// //           })
// //           .signers([user])
// //           .rpc();

// //         expect.fail("Should have thrown an error");
// //       } catch (error) {
// //         expect(error.message).to.include("InvalidRewardAmount");
// //       }
// //     });
// //   });

// //   describe("Faucet Data Retrieval", () => {
// //     it("Should correctly fetch faucet account data", async () => {
// //       const faucetAccount = await program.account.faucet.fetch(faucetPDA);

// //       expect(faucetAccount.mint.toString()).to.equal(mintKeypair.publicKey.toString());
// //       expect(faucetAccount.authority.toString()).to.equal(faucetPDA.toString());
// //       expect(faucetAccount.tokenAccount.toString()).to.equal(faucetTokenAccount.toString());
// //       expect(faucetAccount.rateLimit.toNumber()).to.equal(1000 * 10**6);
// //       expect(faucetAccount.cooldownPeriod.toNumber()).to.equal(86400);
// //     });

// //     it("Should correctly fetch user request record", async () => {
// //       const userRequestRecord = await program.account.userRequestRecord.fetch(userRequestRecordPDA);

// //       expect(userRequestRecord.user.toString()).to.equal(user.publicKey.toString());
// //       expect(userRequestRecord.totalReceived.toNumber()).to.equal(500 * 10**6);
// //       expect(userRequestRecord.requestCount).to.equal(1);
// //       expect(userRequestRecord.lastRequest.toNumber()).to.be.greaterThan(0);
// //     });
// //   });

//   describe("Faucet Deletion", () => {
//     it("Should burn all tokens and delete faucet successfully", async () => {
//       console.log("\n🚀 Starting burn and delete faucet test...");

//       // Initialize a new faucet with tokens for this test
//       const burnMintKeypair = Keypair.generate();
//       const burnInitialSupply = new anchor.BN(5000 * 10**6); // 5000 tokens

//       const initTx = await program.methods
//         .initializeFaucet("Burn Token", "BURN", "https://burn.test", burnInitialSupply)
//         .accounts({
//           mint: burnMintKeypair.publicKey,
//           payer: user.publicKey,
//         })
//         .signers([burnMintKeypair, user])
//         .rpc();

//       await logTransactionTiming(provider.connection, initTx, "Faucet Initialization for Burn Test");

//       const burnFaucetTokenAccount = getAssociatedTokenAddressSync(
//         burnMintKeypair.publicKey,
//         faucetPDA,
//         true,
//         TOKEN_2022_PROGRAM_ID
//       );

//       // Verify the faucet has tokens before burning
//       const tokenAccountInfoBefore = await getAccount(
//         provider.connection,
//         burnFaucetTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );

//       console.log(`💰 Faucet token balance before burn: ${tokenAccountInfoBefore.amount.toString()}`);
//       expect(tokenAccountInfoBefore.amount.toString()).to.equal(burnInitialSupply.toString());

//       // Get initial rent balances
//       const initialPayerBalance = await provider.connection.getBalance(user.publicKey);
//       console.log(`👤 Initial payer balance: ${initialPayerBalance / LAMPORTS_PER_SOL} SOL`);

//       const txStartTime = Date.now();

//       const burnTx = await program.methods
//         .burnAndDeleteFaucet()
//         .accounts({
//           faucet: faucetPDA,
//           faucetTokenAccount: burnFaucetTokenAccount,
//           mint: burnMintKeypair.publicKey,
//           payer: user.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([user])
//         .rpc();

//       const txEndTime = Date.now();
//       console.log(`⏱️  Transaction submission time: ${txEndTime - txStartTime}ms`);

//       await logTransactionTiming(provider.connection, burnTx, "Burn and Delete Faucet");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       console.log("\n📋 Verifying accounts are closed...");

//       // Verify faucet PDA is closed
//       try {
//         await program.account.faucet.fetch(faucetPDA);
//         expect.fail("Faucet account should be closed");
//       } catch (error) {
//         console.log("✅ Faucet PDA successfully closed");
//       }

//       // Verify mint account is closed
//       try {
//         await getMint(provider.connection, burnMintKeypair.publicKey, "confirmed", TOKEN_2022_PROGRAM_ID);
//         expect.fail("Mint account should be closed");
//       } catch (error) {
//         console.log("✅ Mint account successfully closed");
//       }

//       // Verify faucet token account is closed
//       try {
//         await getAccount(provider.connection, burnFaucetTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
//         expect.fail("Faucet token account should be closed");
//       } catch (error) {
//         console.log("✅ Faucet token account successfully closed");
//       }

//       // Verify rent was returned to payer
//       const finalPayerBalance = await provider.connection.getBalance(user.publicKey);
//       console.log(`👤 Final payer balance: ${finalPayerBalance / LAMPORTS_PER_SOL} SOL`);

//       const rentRecovered = finalPayerBalance - initialPayerBalance;
//       console.log(`💰 Rent recovered: ${rentRecovered / LAMPORTS_PER_SOL} SOL`);

//       // Should have recovered some rent (accounts were closed)
//       expect(rentRecovered).to.be.greaterThan(0);

//       console.log("✅ Burn and delete faucet completed successfully!");
//       console.log(`🔥 ${burnInitialSupply.toNumber() / 10**6} tokens were permanently burned`);
//     });
//   });
// });
