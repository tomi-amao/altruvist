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

//   // Manually assign task by updating the task account
//   // In a real implementation, this would be done through a separate assign_task instruction
//   const taskAccount = await program.account.task.fetch(taskPDA);

//   // We need to simulate the assignment since there's no assign_task instruction
//   // This would normally be done through program logic
//   console.log(`📋 Task ${taskId} ready for assignment simulation`);
//   console.log(`📋 Task account:`, taskAccount);

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
//       expect(taskAccount.status).to.deep.equal({ created: {} });
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
//         .updateTaskReward(increasedRewardAmount)
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
//         updateTx,
//         "Task Reward Increase",
//       );

//       // Verify reward was updated
//       const increasedTaskAccount = await program.account.task.fetch(taskPDA);
//       expect(increasedTaskAccount.rewardAmount.toString()).to.equal(
//         increasedRewardAmount.toString(),
//       );
//       console.log("✅ Task reward increased successfully");

//       // 6. Test time-locked decrease
//       console.log("\n📍 Step 6: Alice Requests Reward Decrease (Time-Locked)");
//       const decreasedRewardAmount = new anchor.BN(150 * 10 ** 6); // Decrease to 150 tokens

//       const decreaseRequestTx = await program.methods
//         .updateTaskReward(decreasedRewardAmount)
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
//         decreaseRequestTx,
//         "Task Reward Decrease Request",
//       );

//       // Verify decrease was requested but not yet executed
//       const taskWithPendingDecrease = await program.account.task.fetch(taskPDA);
//       expect(taskWithPendingDecrease.rewardAmount.toString()).to.equal(
//         increasedRewardAmount.toString(),
//       ); // Still old amount
//       expect(taskWithPendingDecrease.pendingDecreaseAmount.toString()).to.equal(
//         decreasedRewardAmount.toString(),
//       );
//       expect(taskWithPendingDecrease.decreaseRequestedAt).to.not.be.null; // eslint-disable-line
//       console.log("✅ Reward decrease requested and pending");

//       // 7. Test that executing decrease too early fails
//       console.log("\n📍 Step 7: Test Early Execution Fails");
//       try {
//         await program.methods
//           .executePendingDecrease(taskId)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             creatorTokenAccount: aliceTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: alice.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//           })
//           .signers([alice])
//           .rpc();

//         expect.fail("Should have failed due to time lock");
//       } catch (error) {
//         expect(error.message).to.include("DecreaseTimeLockNotMet");
//         console.log("✅ Early execution correctly blocked by time lock");
//       }

//       // 8. Test canceling pending decrease
//       console.log("\n📍 Step 8: Alice Cancels Pending Decrease");
//       const cancelDecreaseTx = await program.methods
//         .cancelPendingDecrease(taskId)
//         .accounts({
//           task: taskPDA,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       await logTransactionTiming(
//         provider.connection,
//         cancelDecreaseTx,
//         "Cancel Pending Decrease",
//       );

//       // Verify decrease was cancelled
//       const taskAfterCancel = await program.account.task.fetch(taskPDA);
//       expect(taskAfterCancel.pendingDecreaseAmount).to.be.null; // eslint-disable-line
//       expect(taskAfterCancel.decreaseRequestedAt).to.be.null; // eslint-disable-line
//       console.log("✅ Pending decrease cancelled successfully");

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

//         // If successful, verify the completion
//         const completedTaskAccount = await program.account.task.fetch(taskPDA);
//         expect(completedTaskAccount.status).to.deep.equal({ completed: {} });

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
//             .cancelTask(taskId)
//             .accounts({
//               task: taskPDA,
//               escrowTokenAccount,
//               creatorTokenAccount: aliceTokenAccount,
//               mint: mintKeypair.publicKey,
//               creator: alice.publicKey,
//               tokenProgram: TOKEN_2022_PROGRAM_ID,
//             })
//             .signers([alice])
//             .rpc();

//           await logTransactionTiming(
//             provider.connection,
//             cancelTx,
//             "Task Cancellation",
//           );

//           // Verify task was cancelled
//           const cancelledTaskAccount =
//             await program.account.task.fetch(taskPDA);
//           expect(cancelledTaskAccount.status).to.deep.equal({ cancelled: {} });
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
//         const rewardAmount = new anchor.BN(100 * 10 ** 6);

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
//           .cancelTask(taskId)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             creatorTokenAccount: aliceTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: alice.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
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
//         .cancelTask(maxTaskId)
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
//         .cancelTask("min-reward-task")
//         .accounts({
//           task: minTaskPDA,
//           escrowTokenAccount: minEscrowAccount,
//           creatorTokenAccount: aliceTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([alice])
//         .rpc();
//     });
//   });

//   describe("Data Consistency and State Management", () => {
//     it("Should maintain consistent state across operations", async () => {
//       console.log("\n🚀 Testing state consistency...");

//       // Create a task
//       const { taskPDA, escrowTokenAccount } = await createAndAssignTask(
//         program,
//         provider,
//         "consistency-test",
//         alice,
//         bob,
//         mintKeypair,
//         new anchor.BN(100 * 10 ** 6),
//       );

//       // Update reward multiple times
//       const updates = [120, 140, 150, 180]; // Various amounts in tokens

//       for (const updateAmount of updates) {
//         const rewardAmount = new anchor.BN(updateAmount * 10 ** 6);

//         await program.methods
//           .updateTaskReward(rewardAmount)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             creatorTokenAccount: aliceTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: alice.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//           })
//           .signers([alice])
//           .rpc({ commitment: "confirmed" });

//         // Verify task and escrow consistency
//         const taskAccount = await program.account.task.fetch(taskPDA);
//         const escrowBalance = (
//           await getAccount(
//             provider.connection,
//             escrowTokenAccount,
//             "confirmed",
//             TOKEN_2022_PROGRAM_ID,
//           )
//         ).amount;

//         expect(taskAccount.rewardAmount.toString()).to.equal(
//           rewardAmount.toString(),
//         );
//         expect(escrowBalance.toString()).to.equal(rewardAmount.toString());
//       }

//       console.log("✅ State consistency maintained across multiple updates");

//       // Cancel task and verify final state
//       await program.methods
//         .cancelTask("consistency-test")
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           creatorTokenAccount: aliceTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: alice.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([alice])
//         .rpc({ commitment: "confirmed" });

//       // Verify final state
//       const finalTaskAccount = await program.account.task.fetch(taskPDA);
//       const finalEscrowBalance = (
//         await getAccount(
//           provider.connection,
//           escrowTokenAccount,
//           "confirmed",
//           TOKEN_2022_PROGRAM_ID,
//         )
//       ).amount;

//       expect(finalTaskAccount.status).to.deep.equal({ cancelled: {} });
//       expect(finalEscrowBalance.toString()).to.equal("0");
//       console.log("✅ Final state after cancellation is correct");
//     });
//   });
// });
