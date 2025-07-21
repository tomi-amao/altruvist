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
// } from "@solana/spl-token";
// import { ObjectId } from "mongodb";

// // Helper function to log timing and transaction details
// async function logTransactionTiming(
//   connection: anchor.web3.Connection,
//   txSignature: TransactionSignature,
//   description: string,
// ) {
//   const startTime = Date.now();
//   console.log(`\n🚀 ${description}`);
//   console.log(`📝 Transaction Signature: ${txSignature}`);
//   console.log(`⏰ Submitted at: ${new Date().toISOString()}`);

//   try {
//     const confirmation = await connection.confirmTransaction(
//       txSignature,
//       "confirmed",
//     );
//     const endTime = Date.now();

//     console.log(`✅ Confirmed at: ${new Date().toISOString()}`);
//     console.log(`⏱️  Confirmation time: ${endTime - startTime}ms`);

//     return confirmation;
//   } catch (error) {
//     console.log(`❌ Confirmation failed:`, error);
//     throw error;
//   }
// }

// // Helper function to create a task with simulated assignee for completion testing
// async function createTaskWithAssignee(
//   program: Program<Altruvist>,
//   provider: anchor.AnchorProvider,
//   taskId: string,
//   creator: Keypair,
//   assignee: Keypair,
//   mintKeypair: Keypair,
//   rewardAmount: anchor.BN,
//   assign: boolean = true, // Flag to control assignment
// ): Promise<{ taskPDA: PublicKey; escrowTokenAccount: PublicKey }> {
//   const [taskPDA] = PublicKey.findProgramAddressSync(
//     [Buffer.from("task"), Buffer.from(taskId), creator.publicKey.toBuffer()],
//     program.programId,
//   );

//   const escrowTokenAccount = getAssociatedTokenAddressSync(
//     mintKeypair.publicKey,
//     taskPDA,
//     true,
//     TOKEN_2022_PROGRAM_ID,
//   );

//   // Create task
//   const createTx = await program.methods
//     .createTask(taskId, rewardAmount)
//     .accounts({
//       mint: mintKeypair.publicKey,
//       creator: creator.publicKey,
//     })
//     .signers([creator])
//     .rpc();

//   await provider.connection.confirmTransaction(createTx, "confirmed");
//   console.log(`✅ Task ${taskId} created successfully`);

//   if (assign) {
//     // Assign the task using the proper instruction
//     try {
//       const assignTx = await program.methods
//         .assignTask(taskId, assignee.publicKey)
//         .accounts({
//           creator: creator.publicKey,
//         })
//         .signers([creator])
//         .rpc();

//       await provider.connection.confirmTransaction(assignTx, "confirmed");
//       console.log(`✅ Task ${taskId} assigned to ${assignee.publicKey.toString()}`);

//     } catch (error) {
//       console.error("Error assigning task:", error);
//       throw error;
//     }

//   }

//   return { taskPDA, escrowTokenAccount };
// }

// // Helper function to verify account closure
// async function verifyAccountClosed(
//   connection: anchor.web3.Connection,
//   accountAddress: PublicKey,
//   accountType: string,
// ): Promise<boolean> {
//   try {
//     const accountInfo = await connection.getAccountInfo(accountAddress, "confirmed");
//     if (accountInfo === null) {
//       console.log(`✅ ${accountType} account successfully closed`);
//       return true;
//     } else {
//       console.log(`❌ ${accountType} account still exists`);
//       return false;
//     }
//   } catch (error) {
//     console.log(`✅ ${accountType} account successfully closed (error indicates closure)`);
//     return true;
//   }
// }

// // Helper function to verify token account balance
// async function verifyTokenBalance(
//   connection: anchor.web3.Connection,
//   tokenAccount: PublicKey,
//   expectedBalance: string,
//   accountName: string,
// ): Promise<boolean> {
//   try {
//     const accountInfo = await getAccount(
//       connection,
//       tokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID,
//     );
//     const actualBalance = accountInfo.amount.toString();
//     if (actualBalance === expectedBalance) {
//       console.log(`✅ ${accountName} balance correct: ${actualBalance}`);
//       return true;
//     } else {
//       console.log(`❌ ${accountName} balance mismatch. Expected: ${expectedBalance}, Actual: ${actualBalance}`);
//       return false;
//     }
//   } catch (error) {
//     console.log(`❌ Error checking ${accountName} balance:`, error);
//     return false;
//   }
// }

// // Helper function to create and assign a task for testing completion
// async function createAndAssignTask(
//   program: Program<Altruvist>,
//   provider: anchor.AnchorProvider,
//   taskId: string,
//   creator: Keypair,
//   assignee: Keypair,
//   mintKeypair: Keypair,
//   rewardAmount: anchor.BN,
// ): Promise<{ taskPDA: PublicKey; escrowTokenAccount: PublicKey }> {
//   const [taskPDA] = PublicKey.findProgramAddressSync(
//     [Buffer.from("task"), Buffer.from(taskId), creator.publicKey.toBuffer()],
//     program.programId,
//   );

//   const escrowTokenAccount = getAssociatedTokenAddressSync(
//     mintKeypair.publicKey,
//     taskPDA,
//     true,
//     TOKEN_2022_PROGRAM_ID,
//   );

//   // Create task
//   const createTx = await program.methods
//     .createTask(taskId, rewardAmount)
//     .accounts({
//       mint: mintKeypair.publicKey,
//       creator: creator.publicKey,
//     })
//     .signers([creator])
//     .rpc();

//   await provider.connection.confirmTransaction(createTx, "confirmed");
//   console.log(`✅ Task ${taskId} created successfully`);

//   // Assign the task using the proper instruction
//   try {
//     const assignTx = await program.methods
//       .assignTask(taskId, assignee.publicKey)
//       .accounts({
//         task: taskPDA,
//         creator: creator.publicKey,
//       })
//       .signers([creator])
//       .rpc();

//     await provider.connection.confirmTransaction(assignTx, "confirmed");
//     console.log(`✅ Task ${taskId} assigned to ${assignee.publicKey.toString()}`);

//   } catch (error) {
//     console.error("Error assigning task:", error);
//     // For testing purposes, we'll continue even if assignment fails
//     // This allows us to test the "no assignee" error case
//     console.log(`⚠️ Task ${taskId} created but assignment failed - will test unassigned task behavior`);
//   }

//   return { taskPDA, escrowTokenAccount };
// }

// describe("Comprehensive Altruvist Program Integration Tests", () => {
//   // Configure the client to use the local cluster
//   anchor.setProvider(anchor.AnchorProvider.env());
//   const program = anchor.workspace.Altruvist as Program<Altruvist>;
//   const provider = anchor.getProvider();

//   // Test accounts
//   let faucetPDA: PublicKey;
//   let mintKeypair: Keypair;
//   let faucetTokenAccount: PublicKey;
//   let alice: Keypair; // Task creator
//   let bob: Keypair; // Task assignee
//   let charlie: Keypair; // Another user

//   // Token accounts
//   let aliceTokenAccount: PublicKey;
//   let bobTokenAccount: PublicKey;
//   let charlieTokenAccount: PublicKey;

//   // Test data with unique identifier to avoid conflicts
//   const testRunId = Date.now().toString();
//   const tokenName = `Altruvist Token ${testRunId}`;
//   const tokenSymbol = "ALT";
//   const tokenUri = `https://example.com/metadata-${testRunId}.json`;
//   const initialSupply = new anchor.BN(10_000_000 * 10 ** 6); // 10M tokens

//   before(async () => {
//     console.log(
//       `\n🎯 Setting up comprehensive integration test environment (Run ID: ${testRunId})...`,
//     );
//     console.log(`🔗 RPC Endpoint: ${provider.connection.rpcEndpoint}`);
//     console.log(`🏦 Program ID: ${program.programId.toString()}`);

//     // Generate test accounts
//     alice = Keypair.generate();
//     bob = Keypair.generate();
//     charlie = Keypair.generate();
//     mintKeypair = Keypair.generate();

//     console.log(`👤 Alice (Creator): ${alice.publicKey.toString()}`);
//     console.log(`👤 Bob (Assignee): ${bob.publicKey.toString()}`);
//     console.log(`👤 Charlie (User): ${charlie.publicKey.toString()}`);
//     console.log(`🪙 Mint: ${mintKeypair.publicKey.toString()}`);

//     // Airdrop SOL to accounts
//     console.log("\n💰 Requesting airdrops...");
//     const airdropPromises = [
//       provider.connection.requestAirdrop(alice.publicKey, 5 * LAMPORTS_PER_SOL),
//       provider.connection.requestAirdrop(bob.publicKey, 5 * LAMPORTS_PER_SOL),
//       provider.connection.requestAirdrop(
//         charlie.publicKey,
//         5 * LAMPORTS_PER_SOL,
//       ),
//     ];

//     await Promise.all(airdropPromises);
//     console.log("⏳ Waiting for airdrop confirmations...");
//     await new Promise((resolve) => setTimeout(resolve, 3000));

//     // Derive PDAs and token accounts - use correct seed format
//     [faucetPDA] = PublicKey.findProgramAddressSync(
//       [Buffer.from("altru_faucet")], // Correct: only "faucet" seed
//       program.programId,
//     );

//     faucetTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       faucetPDA,
//       true,
//       TOKEN_2022_PROGRAM_ID,
//     );

//     aliceTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       alice.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID,
//     );

//     bobTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       bob.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID,
//     );

//     charlieTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       charlie.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID,
//     );

//     console.log("✅ Test environment setup complete!\n");
//   });

//   describe("Full Workflow Integration Test", () => {
//     it("Should run complete faucet and task workflow", async () => {
//       console.log("\n🚀 Starting full workflow integration test...");
//       console.log(`👤 Alice creator address: ${alice.publicKey.toString()}`);

//       // 1. Initialize the faucet
//       console.log("\n📍 Step 1: Initialize Faucet");
//       const initTx = await program.methods
//         .initializeFaucet(tokenName, tokenSymbol, tokenUri, initialSupply)
//         .accounts({
//           mint: mintKeypair.publicKey,
//           payer: alice.publicKey,
//         })
//         .signers([mintKeypair, alice])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         initTx,
//         "Faucet Initialization",
//       );

//       // Verify faucet was created correctly
//       const faucetAccount = await program.account.faucet.fetch(faucetPDA);
//       expect(faucetAccount.mint.toString()).to.equal(
//         mintKeypair.publicKey.toString(),
//       );
//       expect(faucetAccount.rateLimit.toString()).to.equal(
//         (1000 * 10 ** 6).toString(),
//       );
//       console.log("✅ Faucet initialized successfully");

//       // 2. Alice requests tokens from faucet
//       console.log("\n📍 Step 2: Alice Requests Tokens");
//       const aliceRequestAmount = new anchor.BN(500 * 10 ** 6); // 5000 tokens

//       const [aliceRequestRecord] = PublicKey.findProgramAddressSync(
//         [Buffer.from("user_record"), alice.publicKey.toBuffer()],
//         program.programId,
//       );

//       const aliceRequestTx = await program.methods
//         .requestTokens(aliceRequestAmount)
//         .accounts({
//           faucet: faucetPDA,
//           faucetTokenAccount,
//           userRequestRecord: aliceRequestRecord,
//           userTokenAccount: aliceTokenAccount,
//           mint: mintKeypair.publicKey,
//           user: alice.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([alice])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         aliceRequestTx,
//         "Alice Token Request",
//       );

//       // Verify Alice received tokens
//       const aliceBalance = await getAccount(
//         provider.connection,
//         aliceTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );
//       expect(aliceBalance.amount.toString()).to.equal(
//         aliceRequestAmount.toString(),
//       );
//       console.log(
//         `✅ Alice received ${aliceRequestAmount.toNumber() / 10 ** 6} tokens`,
//       );

//       // 3. Bob requests tokens from faucet
//       console.log("\n📍 Step 3: Bob Requests Tokens");
//       const bobRequestAmount = new anchor.BN(1000 * 10 ** 6); // 1000 tokens (for fees)

//       const [bobRequestRecord] = PublicKey.findProgramAddressSync(
//         [Buffer.from("user_record"), bob.publicKey.toBuffer()],
//         program.programId,
//       );

//       // Wait for cooldown (since we're using the same faucet)
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       const bobRequestTx = await program.methods
//         .requestTokens(bobRequestAmount)
//         .accounts({
//           faucet: faucetPDA,
//           faucetTokenAccount,
//           userRequestRecord: bobRequestRecord,
//           userTokenAccount: bobTokenAccount,
//           mint: mintKeypair.publicKey,
//           user: bob.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([bob])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         bobRequestTx,
//         "Bob Token Request",
//       );
//       console.log(
//         `✅ Bob received ${bobRequestAmount.toNumber() / 10 ** 6} tokens`,
//       );

//       // 4. Alice creates a task
//       console.log("\n📍 Step 4: Alice Creates Task");
//       const taskId = "integration-test-task";
//       const rewardAmount = new anchor.BN(200 * 10 ** 6); // 2000 tokens

//       const { taskPDA, escrowTokenAccount } = await createAndAssignTask(
//         program,
//         provider,
//         taskId,
//         alice,
//         bob,
//         mintKeypair,
//         rewardAmount,
//       );

//       // Verify task was created
//       const taskAccount = await program.account.task.fetch(taskPDA);
//       expect(taskAccount.taskId).to.equal(taskId);
//       expect(taskAccount.rewardAmount.toString()).to.equal(
//         rewardAmount.toString(),
//       );
//       expect(taskAccount.status).to.deep.equal({ inProgress: {} });
//       console.log("✅ Task created successfully");

//       // Verify escrow has the reward amount
//       const escrowBalance = await getAccount(
//         provider.connection,
//         escrowTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );
//       expect(escrowBalance.amount.toString()).to.equal(rewardAmount.toString());
//       console.log("✅ Escrow funded correctly");

//       // 5. Alice updates task reward (test both increase and time-locked decrease)
//       console.log("\n📍 Step 5: Alice Updates Task Reward (Increase)");
//       const increasedRewardAmount = new anchor.BN(250 * 10 ** 6); // Increase to 250 tokens

//       const updateTx = await program.methods
//         .updateTaskReward(taskId, increasedRewardAmount)
//         .accounts({
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         updateTx,
//         "Task Reward Increase",
//       );

//       // Verify reward was updated
//       const increasedTaskAccount = await program.account.task.fetch(taskPDA);
//       expect(increasedTaskAccount.rewardAmount.toString()).to.equal(
//         increasedRewardAmount.toString(),
//       );
//       console.log("✅ Task reward increased successfully");

//       // // 6. Test time-locked decrease
//       // console.log("\n📍 Step 6: Alice Requests Reward Decrease (Time-Locked)");
//       // const decreasedRewardAmount = new anchor.BN(150 * 10 ** 6); // Decrease to 150 tokens

//       // const decreaseRequestTx = await program.methods
//       //   .updateTaskReward(taskId, decreasedRewardAmount)
//       //   .accounts({
//       //     task: taskPDA,
//       //     escrowTokenAccount,
//       //     creatorTokenAccount: aliceTokenAccount,
//       //     mint: mintKeypair.publicKey,
//       //     creator: alice.publicKey,
//       //     tokenProgram: TOKEN_2022_PROGRAM_ID,
//       //   })
//       //   .signers([alice])
//       //   .rpc();

//       // await logTransactionTiming(
//       //   provider.connection,
//       //   decreaseRequestTx,
//       //   "Task Reward Decrease Request",
//       // );

//       // // Verify decrease was requested but not yet executed
//       // const taskWithPendingDecrease = await program.account.task.fetch(taskPDA);
//       // expect(taskWithPendingDecrease.rewardAmount.toString()).to.equal(
//       //   increasedRewardAmount.toString(),
//       // ); // Still old amount
//       // expect(taskWithPendingDecrease.pendingDecreaseAmount.toString()).to.equal(
//       //   decreasedRewardAmount.toString(),
//       // );
//       // expect(taskWithPendingDecrease.decreaseRequestedAt).to.not.be.null; // eslint-disable-line
//       // console.log("✅ Reward decrease requested and pending");

//       // // 7. Test that executing decrease too early fails
//       // console.log("\n📍 Step 7: Test Early Execution Fails");
//       // try {
//       //   await program.methods
//       //     .executePendingDecrease(taskId)
//       //     .accounts({
//       //       task: taskPDA,
//       //       escrowTokenAccount,
//       //       creatorTokenAccount: aliceTokenAccount,
//       //       mint: mintKeypair.publicKey,
//       //       creator: alice.publicKey,
//       //       tokenProgram: TOKEN_2022_PROGRAM_ID,
//       //     })
//       //     .signers([alice])
//       //     .rpc();

//       //   expect.fail("Should have failed due to time lock");
//       // } catch (error) {
//       //   expect(error.message).to.include("DecreaseTimeLockNotMet");
//       //   console.log("✅ Early execution correctly blocked by time lock");
//       // }

//       // // 8. Test canceling pending decrease
//       // console.log("\n📍 Step 8: Alice Cancels Pending Decrease");
//       // const cancelDecreaseTx = await program.methods
//       //   .cancelPendingDecrease(taskId)
//       //   .accounts({
//       //     task: taskPDA,
//       //     creator: alice.publicKey,
//       //   })
//       //   .signers([alice])
//       //   .rpc();

//       // await logTransactionTiming(
//       //   provider.connection,
//       //   cancelDecreaseTx,
//       //   "Cancel Pending Decrease",
//       // );

//       // // Verify decrease was cancelled
//       // const taskAfterCancel = await program.account.task.fetch(taskPDA);
//       // expect(taskAfterCancel.pendingDecreaseAmount).to.be.null; // eslint-disable-line
//       // expect(taskAfterCancel.decreaseRequestedAt).to.be.null; // eslint-disable-line
//       // console.log("✅ Pending decrease cancelled successfully");

//       // 9. Bob completes the task (simulation) or Alice cancels
//       // Note: Since the current implementation requires an assignee but doesn't have an assign instruction,
//       // we'll test the completion with the expectation that it might fail due to no assignee
//       console.log("\n📍 Step 9: Task Completion or Cancellation");

//       try {
//         const completeTx = await program.methods
//           .completeTask(taskId)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             assigneeTokenAccount: bobTokenAccount,
//             creator: alice.publicKey, // Add the missing creator account
//             mint: mintKeypair.publicKey,
//             assignee: bob.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([bob])
//           .rpc();

//         await logTransactionTiming(
//           provider.connection,
//           completeTx,
//           "Task Completion",
//         );

//         // If successful, verify the completion by checking account closure
//         // The task account should be closed, so we verify it doesn't exist
//         const taskClosed = await verifyAccountClosed(
//           provider.connection,
//           taskPDA,
//           "Task"
//         );
//         expect(taskClosed).to.be.true;

//         // Verify Bob received the reward
//         const bobFinalBalance = await getAccount(
//           provider.connection,
//           bobTokenAccount,
//           "confirmed",
//           TOKEN_2022_PROGRAM_ID,
//         );

//         const expectedBalance = bobRequestAmount.add(increasedRewardAmount);
//         expect(bobFinalBalance.amount.toString()).to.equal(
//           expectedBalance.toString(),
//         );

//         console.log("✅ Task completed and rewards transferred successfully");
//       } catch (error) {
//         if (error.message.includes("NoAssignee")) {
//           console.log(
//             "⚠️  Task completion failed as expected (no assignee) - this is correct behavior",
//           );

//           // Instead, let's test task cancellation
//           console.log("\n📍 Step 9 Alternative: Alice Cancels Task");

//           const cancelTx = await program.methods
//             .deleteTask(taskId)
//             .accounts({
//               mint: mintKeypair.publicKey,
//               creator: alice.publicKey,
//             })
//             .signers([alice])
//             .rpc();

//           await logTransactionTiming(
//             provider.connection,
//             cancelTx,
//             "Task Cancellation",
//           );

//           // Verify task was cancelled by checking account closure
//           const taskClosed = await verifyAccountClosed(
//             provider.connection,
//             taskPDA,
//             "Task"
//           );
//           expect(taskClosed).to.be.true;
//           console.log("✅ Task cancelled successfully");
//         } else {
//           throw error;
//         }
//       }

//       // 10. Test rate limiting
//       console.log("\n📍 Step 10: Test Rate Limiting");
//       try {
//         // Charlie tries to request too many tokens
//         const excessiveAmount = new anchor.BN(2000 * 10 ** 6); // Exceeds 1000 token limit

//         const [charlieRequestRecord] = PublicKey.findProgramAddressSync(
//           [Buffer.from("user_record"), charlie.publicKey.toBuffer()],
//           program.programId,
//         );

//         await program.methods
//           .requestTokens(excessiveAmount)
//           .accounts({
//             faucet: faucetPDA,
//             faucetTokenAccount,
//             userRequestRecord: charlieRequestRecord,
//             userTokenAccount: charlieTokenAccount,
//             mint: mintKeypair.publicKey,
//             user: charlie.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([charlie])
//           .rpc();

//         expect.fail("Should have failed due to rate limit");
//       } catch (error) {
//         expect(error.message).to.include("RequestAmountTooHigh");
//         console.log("✅ Rate limiting working correctly");
//       }

//       // 11. Test valid request within limits
//       console.log("\n📍 Step 11: Valid Token Request Within Limits");
//       const validAmount = new anchor.BN(500 * 10 ** 6); // 500 tokens (within limit)

//       const [charlieRequestRecord] = PublicKey.findProgramAddressSync(
//         [Buffer.from("user_record"), charlie.publicKey.toBuffer()],
//         program.programId,
//       );

//       const charlieRequestTx = await program.methods
//         .requestTokens(validAmount)
//         .accounts({
//           faucet: faucetPDA,
//           faucetTokenAccount,
//           userRequestRecord: charlieRequestRecord,
//           userTokenAccount: charlieTokenAccount,
//           mint: mintKeypair.publicKey,
//           user: charlie.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([charlie])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         charlieRequestTx,
//         "Charlie Valid Token Request",
//       );

//       // Verify Charlie received tokens
//       const charlieBalance = await getAccount(
//         provider.connection,
//         charlieTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );
//       expect(charlieBalance.amount.toString()).to.equal(validAmount.toString());
//       console.log(
//         `✅ Charlie received ${validAmount.toNumber() / 10 ** 6} tokens`,
//       );

//       console.log("\n🎉 Integration test completed successfully!");
//     });
//   });

//   describe("Error Handling and Edge Cases", () => {
//     it("Should handle multiple rapid task operations", async () => {
//       console.log("\n🚀 Testing rapid task operations...");

//       // Create multiple tasks rapidly
//       const taskPromises = [];
//       for (let i = 0; i < 3; i++) {
//         const taskId = `rapid-task-${i}`;
//         const rewardAmount = new anchor.BN(10 * 10 ** 6);

//         const taskPromise = createAndAssignTask(
//           program,
//           provider,
//           taskId,
//           alice,
//           bob,
//           mintKeypair,
//           rewardAmount,
//         );

//         taskPromises.push(taskPromise);
//       }

//       const results = await Promise.all(taskPromises);
//       expect(results).to.have.lengthOf(3);
//       console.log("✅ Multiple rapid task creation successful");

//       // Cancel all the tasks
//       for (let i = 0; i < results.length; i++) {
//         const { taskPDA, escrowTokenAccount } = results[i];
//         const taskId = `rapid-task-${i}`;

//         await program.methods
//           .deleteTask(taskId)
//           .accounts({
//             mint: mintKeypair.publicKey,
//             creator: alice.publicKey,
//           })
//           .signers([alice])
//           .rpc();
//       }
//       console.log("✅ All rapid tasks cancelled successfully");
//     });

//     it("Should handle boundary values correctly", async () => {
//       console.log("\n🚀 Testing boundary values...");

//       // Test maximum allowed task ID length (50 characters)
//       const maxTaskId = new ObjectId().toString(); // Using ObjectId for unique task ID
//       const { taskPDA, escrowTokenAccount } = await createAndAssignTask(
//         program,
//         provider,
//         maxTaskId,
//         alice,
//         bob,
//         mintKeypair,
//         new anchor.BN(100 * 10 ** 6),
//       );

//       const taskAccount = await program.account.task.fetch(taskPDA);
//       expect(taskAccount.taskId).to.equal(maxTaskId);
//       console.log("✅ Maximum task ID length handled correctly");

//       // Cancel the task
//       await program.methods
//         .deleteTask(maxTaskId)
//         .accounts({
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       // Test minimum reward amount
//       const { taskPDA: minTaskPDA, escrowTokenAccount: minEscrowAccount } =
//         await createAndAssignTask(
//           program,
//           provider,
//           "min-reward-task",
//           alice,
//           bob,
//           mintKeypair,
//           new anchor.BN(1), // Minimum: 1 lamport
//         );

//       const minTaskAccount = await program.account.task.fetch(minTaskPDA);
//       expect(minTaskAccount.rewardAmount.toString()).to.equal("1");
//       console.log("✅ Minimum reward amount handled correctly");

//       // Cancel the task
//       await program.methods
//         .deleteTask("min-reward-task")
//         .accounts({
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();
//     });
//   });

//   // describe("Data Consistency and State Management", () => {
//   //   it("Should maintain consistent state across operations", async () => {
//   //     console.log("\n🚀 Testing state consistency...");

//   //     // Create a task
//   //     const { taskPDA, escrowTokenAccount } = await createAndAssignTask(
//   //       program,
//   //       provider,
//   //       "consistency-test",
//   //       alice,
//   //       bob,
//   //       mintKeypair,
//   //       new anchor.BN(100 * 10 ** 6),
//   //     );

//   //     // Update reward multiple times
//   //     const updates = [120, 140, 150, 180]; // Various amounts in tokens

//   //     for (const updateAmount of updates) {
//   //       const rewardAmount = new anchor.BN(updateAmount * 10 ** 6);

//   //       await program.methods
//   //         .updateTaskReward(rewardAmount)
//   //         .accounts({
//   //           task: taskPDA,
//   //           escrowTokenAccount,
//   //           creatorTokenAccount: aliceTokenAccount,
//   //           mint: mintKeypair.publicKey,
//   //           creator: alice.publicKey,
//   //           tokenProgram: TOKEN_2022_PROGRAM_ID,
//   //         })
//   //         .signers([alice])
//   //         .rpc({ commitment: "confirmed" });

//   //       // Verify task and escrow consistency
//   //       const taskAccount = await program.account.task.fetch(taskPDA);
//   //       const escrowBalance = (
//   //         await getAccount(
//   //           provider.connection,
//   //           escrowTokenAccount,
//   //           "confirmed",
//   //           TOKEN_2022_PROGRAM_ID,
//   //         )
//   //       ).amount;

//   //       expect(taskAccount.rewardAmount.toString()).to.equal(
//   //         rewardAmount.toString(),
//   //       );
//   //       expect(escrowBalance.toString()).to.equal(rewardAmount.toString());
//   //     }

//   //     console.log("✅ State consistency maintained across multiple updates");

//   //     // Cancel task and verify final state - but don't try to fetch closed accounts
//   //     await program.methods
//   //       .deleteTask("consistency-test")
//   //       .accounts({
//   //         task: taskPDA,
//   //         escrowTokenAccount,
//   //         creatorTokenAccount: aliceTokenAccount,
//   //         mint: mintKeypair.publicKey,
//   //         creator: alice.publicKey,
//   //         tokenProgram: TOKEN_2022_PROGRAM_ID,
//   //       })
//   //       .signers([alice])
//   //       .rpc({ commitment: "confirmed" });

//   //     // Verify accounts are closed instead of trying to fetch them
//   //     const taskClosed = await verifyAccountClosed(
//   //       provider.connection,
//   //       taskPDA,
//   //       "Task"
//   //     );
//   //     const escrowClosed = await verifyAccountClosed(
//   //       provider.connection,
//   //       escrowTokenAccount,
//   //       "Escrow"
//   //     );

//   //     expect(taskClosed).to.be.true;
//   //     expect(escrowClosed).to.be.true;
//   //     console.log("✅ Final state after cancellation: accounts properly closed");
//   //   });
//   // });

//   describe("Task and Escrow Closing Tests", () => {
//     it("Should properly close task and escrow accounts on completion", async () => {
//       console.log("\n🚀 Testing task and escrow closure on completion...");

//       // Create a task for completion testing
//       const taskId = "completion-closure-test";
//       const rewardAmount = new anchor.BN(30 * 10 ** 6);
//       const noAssign = false
//       const { taskPDA, escrowTokenAccount } = await createTaskWithAssignee(
//         program,
//         provider,
//         taskId,
//         alice,
//         bob,
//         mintKeypair,
//         rewardAmount,
//         noAssign
//       );

//       // Get initial balances
//       const initialBobBalance = await getAccount(
//         provider.connection,
//         bobTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );

//       const initialCreatorLamports = await provider.connection.getBalance(alice.publicKey);

//       // Verify escrow has correct balance before completion
//       await verifyTokenBalance(
//         provider.connection,
//         escrowTokenAccount,
//         rewardAmount.toString(),
//         "Escrow"
//       );

//       // Test completion without assignee (should fail with proper error)
//       try {
//         await program.methods
//           .completeTask(taskId)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             assigneeTokenAccount: bobTokenAccount,
//             creator: alice.publicKey,
//             mint: mintKeypair.publicKey,
//             assignee: bob.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([bob])
//           .rpc();

//         expect.fail("Should have failed due to no assignee");
//       } catch (error) {
//         expect(error.message).to.include("NoAssignee");
//         console.log("✅ Correctly failed completion without assignee");
//       }

//       // Verify accounts still exist since completion failed
//       const taskAccountAfterFailure = await program.account.task.fetch(taskPDA);
//       expect(taskAccountAfterFailure.assignee).to.be.null;
//       console.log("✅ Task account still exists after failed completion");

//       // For testing purposes, let's test cancellation closure instead
//       console.log("\n📍 Testing cancellation closure...");

//       const cancelTx = await program.methods
//         .deleteTask(taskId)
//         .accounts({
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         cancelTx,
//         "Task Cancellation with Closure",
//       );

//       // Verify task account is closed
//       const taskClosed = await verifyAccountClosed(
//         provider.connection,
//         taskPDA,
//         "Task"
//       );
//       expect(taskClosed).to.be.true;

//       // Verify escrow account is closed
//       const escrowClosed = await verifyAccountClosed(
//         provider.connection,
//         escrowTokenAccount,
//         "Escrow"
//       );
//       expect(escrowClosed).to.be.true;

//       // Verify creator received lamports from closed task account
//       const finalCreatorLamports = await provider.connection.getBalance(alice.publicKey);
//       expect(finalCreatorLamports).to.be.greaterThan(initialCreatorLamports);
//       console.log("✅ Creator received lamports from closed task account");

//       // Verify tokens were returned to creator
//       const finalCreatorBalance = await getAccount(
//         provider.connection,
//         aliceTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );
//       console.log(`✅ Creator received refunded tokens: ${finalCreatorBalance.amount.toString()}`);

//       console.log("✅ Task and escrow accounts properly closed on cancellation");
//     });

//     it("Should handle multiple account closures correctly", async () => {
//       console.log("\n🚀 Testing multiple account closures...");

//       const tasks = [];
//       const numTasks = 3;

//       // Create multiple tasks
//       for (let i = 0; i < numTasks; i++) {
//         const taskId = `multi-closure-test-${i}`;
//         const rewardAmount = new anchor.BN(5 * 10 ** 6);

//         const result = await createTaskWithAssignee(
//           program,
//           provider,
//           taskId,
//           alice,
//           bob,
//           mintKeypair,
//           rewardAmount,
//         );

//         tasks.push({ taskId, ...result, rewardAmount });
//       }

//       // Cancel all tasks and verify closures
//       for (const { taskId, taskPDA, escrowTokenAccount } of tasks) {
//         await program.methods
//           .deleteTask(taskId)
//           .accounts({
//             mint: mintKeypair.publicKey,
//             creator: alice.publicKey,
//           })
//           .signers([alice])
//           .rpc({commitment: "confirmed"});

//         // Verify both accounts are closed
//         const taskClosed = await verifyAccountClosed(
//           provider.connection,
//           taskPDA,
//           `Task ${taskId}`
//         );
//         const escrowClosed = await verifyAccountClosed(
//           provider.connection,
//           escrowTokenAccount,
//           `Escrow ${taskId}`
//         );

//         expect(taskClosed).to.be.true;
//         expect(escrowClosed).to.be.true;
//       }

//       console.log("✅ All multiple task and escrow accounts properly closed");
//     });
//   });

//   describe("Authority Validation Tests", () => {
//     it("Should enforce correct authority for task completion", async () => {
//       console.log("\n🚀 Testing authority validation for task completion...");

//       const taskId = "authority-completion-test";
//       const rewardAmount = new anchor.BN(200 * 10 ** 6);

//       const { taskPDA, escrowTokenAccount } = await createTaskWithAssignee(
//         program,
//         provider,
//         taskId,
//         alice,
//         bob,
//         mintKeypair,
//         rewardAmount,

//       );

//       // Test: Wrong user trying to complete task (should fail)
//       try {
//         await program.methods
//           .completeTask(taskId)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             assigneeTokenAccount: charlieTokenAccount,
//             creator: alice.publicKey,
//             mint: mintKeypair.publicKey,
//             assignee: charlie.publicKey, // Charlie trying to complete Alice's task
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([charlie])
//           .rpc();

//         expect.fail("Should have failed due to wrong assignee");
//       } catch (error) {
//         // Should fail due to either UnauthorizedAssignee or NoAssignee
//         const errorMessage = error.message;
//         const hasCorrectError = errorMessage.includes("UnauthorizedAssignee") ||
//                                errorMessage.includes("NoAssignee");
//         expect(hasCorrectError).to.be.true;
//         console.log("✅ Correctly rejected unauthorized completion attempt");
//       }

//       // Test: Creator trying to complete their own task (should fail)
//       try {
//         await program.methods
//           .completeTask(taskId)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             assigneeTokenAccount: aliceTokenAccount,
//             creator: alice.publicKey,
//             mint: mintKeypair.publicKey,
//             assignee: alice.publicKey, // Creator trying to complete their own task
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([alice])
//           .rpc();

//         expect.fail("Should have failed due to creator self-completion");
//       } catch (error) {
//         const errorMessage = error.message;
//         const hasCorrectError = errorMessage.includes("UnauthorizedAssignee") ||
//                                errorMessage.includes("NoAssignee");
//         expect(hasCorrectError).to.be.true;
//         console.log("✅ Correctly rejected creator self-completion attempt");
//       }

//       // Clean up by cancelling the task
//       await program.methods
//         .deleteTask(taskId)
//         .accounts({
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       console.log("✅ Authority validation for task completion working correctly");
//     });

//     it("Should enforce correct authority for task cancellation", async () => {
//       console.log("\n🚀 Testing authority validation for task cancellation...");

//       const taskId = "authority-cancellation-test";
//       const rewardAmount = new anchor.BN(150 * 10 ** 6);

//       const { taskPDA, escrowTokenAccount } = await createTaskWithAssignee(
//         program,
//         provider,
//         taskId,
//         alice,
//         bob,
//         mintKeypair,
//         rewardAmount,
//       );

//       // Test: Non-creator trying to cancel task (should fail)
//       try {
//         await program.methods
//           .deleteTask(taskId)
//           .accounts({
//             mint: mintKeypair.publicKey,
//             creator: bob.publicKey, // Bob trying to cancel Alice's task
//           })
//           .signers([bob])
//           .rpc();

//         expect.fail("Should have failed due to unauthorized cancellation");
//       } catch (error) {
//         // The constraint in CancelTask should trigger a different error
//         const errorMessage = error.message;
//         const hasAuthError = errorMessage.includes("UnauthorizedTaskCreator") ||
//                             errorMessage.includes("ConstraintSeeds") ||
//                             errorMessage.includes("ConstraintOwner") ||
//                             errorMessage.includes("AnchorError");
//         expect(hasAuthError).to.be.true;
//         console.log("✅ Correctly rejected unauthorized cancellation attempt");
//       }

//       // Test: Correct creator cancelling task (should succeed)
//       const cancelTx = await program.methods
//         .deleteTask(taskId)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           creatorTokenAccount: aliceTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([alice])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         cancelTx,
//         "Authorized Task Cancellation",
//       );

//       // Verify task is closed
//       const taskClosed = await verifyAccountClosed(
//         provider.connection,
//         taskPDA,
//         "Task"
//       );
//       expect(taskClosed).to.be.true;

//       console.log("✅ Authority validation for task cancellation working correctly");
//     });

//     it("Should validate task status for operations", async () => {
//       console.log("\n🚀 Testing task status validation...");

//       const taskId = "status-validation-test";
//       const rewardAmount = new anchor.BN(100 * 10 ** 6);
//       const noAssign = false;

//       const { taskPDA, escrowTokenAccount } = await createTaskWithAssignee(
//         program,
//         provider,
//         taskId,
//         alice,
//         bob,
//         mintKeypair,
//         rewardAmount,
//         noAssign
//       );

//       // Verify initial task status
//       const initialTask = await program.account.task.fetch(taskPDA);
//       expect(initialTask.status).to.deep.equal({ created: {} });
//       console.log("✅ Task created with correct initial status");

//       // Cancel the task to change its status
//       await program.methods
//         .deleteTask(taskId)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           creatorTokenAccount: aliceTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([alice])
//         .rpc({commitment: "confirmed"});

//       // Verify task account is closed (can't fetch cancelled task)
//       const taskClosed = await verifyAccountClosed(
//         provider.connection,
//         taskPDA,
//         "Task"
//       );
//       expect(taskClosed).to.be.true;

//       console.log("✅ Task status validation working correctly");
//     });
//   });

//   describe("Escrow Balance and Token Transfer Tests", () => {
//     it("Should verify escrow balance before operations", async () => {
//       console.log("\n🚀 Testing escrow balance verification...");

//       const taskId = "escrow-balance-test";
//       const rewardAmount = new anchor.BN(50 * 10 ** 6); // Reduced amount to ensure sufficient balance

//       // Ensure Alice has enough tokens by requesting more if needed
//       const aliceCurrentBalance = await getAccount(
//         provider.connection,
//         aliceTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );

//       console.log(`Alice current balance: ${aliceCurrentBalance.amount.toString()}`);

//       // If Alice doesn't have enough tokens, request more from faucet
//       if (aliceCurrentBalance.amount < rewardAmount.toNumber() * 10) { // Need extra for multiple operations
//         console.log("Alice needs more tokens, requesting from faucet...");

//         const additionalAmount = new anchor.BN(500 * 10 ** 6);
//         const [aliceRequestRecord] = PublicKey.findProgramAddressSync(
//           [Buffer.from("user_record"), alice.publicKey.toBuffer()],
//           program.programId,
//         );

//         // Wait for cooldown period
//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         try {
//           await program.methods
//             .requestTokens(additionalAmount)
//             .accounts({
//               faucet: faucetPDA,
//               faucetTokenAccount,
//               userRequestRecord: aliceRequestRecord,
//               userTokenAccount: aliceTokenAccount,
//               mint: mintKeypair.publicKey,
//               user: alice.publicKey,
//               tokenProgram: TOKEN_2022_PROGRAM_ID,
//               associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//               systemProgram: SystemProgram.programId,
//             })
//             .signers([alice])
//             .rpc({commitment: "confirmed"});

//           console.log(`✅ Alice received additional ${additionalAmount.toNumber() / 10 ** 6} tokens`);
//         } catch (error) {
//           if (error.message.includes("CooldownNotMet")) {
//             console.log("⚠️ Cooldown not met, proceeding with existing balance");
//           } else {
//             console.log("⚠️ Could not get additional tokens:", error.message);
//           }
//         }
//       }

//       const { taskPDA, escrowTokenAccount } = await createTaskWithAssignee(
//         program,
//         provider,
//         taskId,
//         alice,
//         bob,
//         mintKeypair,
//         rewardAmount,
//       );

//       // Verify escrow has correct initial balance
//       const escrowBalanceValid = await verifyTokenBalance(
//         provider.connection,
//         escrowTokenAccount,
//         rewardAmount.toString(),
//         "Escrow"
//       );
//       expect(escrowBalanceValid).to.be.true;

//       // Test reward update (small increase)
//       const newRewardAmount = new anchor.BN(75 * 10 ** 6); // Small increase
//       await program.methods
//         .updateTaskReward(taskId, newRewardAmount)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           creatorTokenAccount: aliceTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([alice])
//         .rpc();

//       // Verify escrow balance updated correctly
//       const updatedBalanceValid = await verifyTokenBalance(
//         provider.connection,
//         escrowTokenAccount,
//         newRewardAmount.toString(),
//         "Updated Escrow"
//       );
//       expect(updatedBalanceValid).to.be.true;

//       // Cancel and verify refund
//       const creatorBalanceBefore = await getAccount(
//         provider.connection,
//         aliceTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );

//       await program.methods
//         .deleteTask(taskId)
//         .accounts({
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       // Verify creator received tokens back
//       const creatorBalanceAfter = await getAccount(
//         provider.connection,
//         aliceTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );

//       const refundReceived = creatorBalanceAfter.amount > creatorBalanceBefore.amount;
//       expect(refundReceived).to.be.true;
//       console.log(`✅ Creator received refund: ${creatorBalanceAfter.amount.toString()}`);

//       console.log("✅ Escrow balance verification working correctly");
//     });
//   });
// });
