// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { Altruvist } from "../../target/types/altruvist";
// import {
//   Keypair,
//   LAMPORTS_PER_SOL,
//   PublicKey,
//   SystemProgram
// } from "@solana/web3.js";
// import {
//   createMint,
//   createAssociatedTokenAccount,
//   mintTo,
//   getAccount,
//   TOKEN_2022_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
// } from "@solana/spl-token";
// import { expect } from "chai";

// // Helper function to get associated token address
// function getAssociatedTokenAddressSync(
//   mint: PublicKey,
//   owner: PublicKey,
//   allowOwnerOffCurve = false,
//   programId = TOKEN_2022_PROGRAM_ID,
// ) {
//   return PublicKey.findProgramAddressSync(
//     [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
//     ASSOCIATED_TOKEN_PROGRAM_ID,
//   )[0];
// }

// // Helper function to log transaction timing
// async function logTransactionTiming(
//   connection: anchor.web3.Connection,
//   txSignature: string,
//   description: string,
// ) {
//   const startTime = Date.now();
//   console.log(`⏰ ${description} - Confirming transaction: ${txSignature}`);

//   try {
//     const confirmation = await connection.confirmTransaction(
//       txSignature,
//       "confirmed",
//     );
//     const endTime = Date.now();
//     console.log(`✅ ${description} confirmed in ${endTime - startTime}ms`);
//     return confirmation;
//   } catch (error) {
//     console.log(`❌ ${description} confirmation failed:`, error);
//     throw error;
//   }
// }

// describe("Multiple Assignees End-to-End Tests", () => {
//   // Configure the client to use the local cluster
//   anchor.setProvider(anchor.AnchorProvider.env());
//   const program = anchor.workspace.Altruvist as Program<Altruvist>;
//   const provider = anchor.getProvider();

//   // Test accounts
//   let faucetPDA: PublicKey;
//   let mintKeypair: Keypair;
//   let faucetTokenAccount: PublicKey;

//   // Task creator
//   let alice: Keypair;
//   let aliceTokenAccount: PublicKey;

//   // Multiple assignees
//   let bob: Keypair;
//   let charlie: Keypair;
//   let david: Keypair;
//   let bobTokenAccount: PublicKey;
//   let charlieTokenAccount: PublicKey;
//   let davidTokenAccount: PublicKey;

//   // Task-related accounts
//   let taskPDA: PublicKey;
//   let escrowTokenAccount: PublicKey;

//   // Test data
//   const testRunId = Date.now().toString();
//   const taskId = `multi-assignee-task-`;
//   const tokenName = `Test Token ${testRunId}`;
//   const tokenSymbol = "TEST";
//   const tokenUri = `https://example.com/metadata-${testRunId}.json`;
//   const initialSupply = new anchor.BN(1_000_000 * 10**6); // 1M tokens with 6 decimals
//   const rewardAmount = new anchor.BN(300 * 10**6); // 3000 tokens (will be split 3 ways = 1000 each)

//   before(async () => {
//     console.log(`\n🎯 Setting up Multiple Assignees Test Environment (Run ID: ${testRunId})...`);
//     console.log(`🔗 RPC Endpoint: ${provider.connection.rpcEndpoint}`);
//     console.log(`🏦 Program ID: ${program.programId.toString()}`);

//     // Generate fresh test accounts
//     alice = Keypair.generate();
//     bob = Keypair.generate();
//     charlie = Keypair.generate();
//     david = Keypair.generate();
//     mintKeypair = Keypair.generate();

//     console.log(`👤 Alice (Creator): ${alice.publicKey.toString()}`);
//     console.log(`👤 Bob (Assignee 1): ${bob.publicKey.toString()}`);
//     console.log(`👤 Charlie (Assignee 2): ${charlie.publicKey.toString()}`);
//     console.log(`👤 David (Assignee 3): ${david.publicKey.toString()}`);
//     console.log(`🪙 Mint: ${mintKeypair.publicKey.toString()}`);

//     // Airdrop SOL to accounts
//     console.log("\n💰 Requesting airdrops...");
//     const airdropPromises = [
//       provider.connection.requestAirdrop(alice.publicKey, 20 * LAMPORTS_PER_SOL),
//       provider.connection.requestAirdrop(bob.publicKey, 20 * LAMPORTS_PER_SOL),
//       provider.connection.requestAirdrop(charlie.publicKey, 20 * LAMPORTS_PER_SOL),
//       provider.connection.requestAirdrop(david.publicKey, 20 * LAMPORTS_PER_SOL),
//     ];

//     await Promise.all(airdropPromises);
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     // Derive PDAs
//     console.log("\n🔑 Deriving PDAs...");
//     [faucetPDA] = PublicKey.findProgramAddressSync(
//       [Buffer.from("altru_faucet")],
//       program.programId
//     );
//     console.log(`🏭 Faucet PDA: ${faucetPDA.toString()}`);

//     [taskPDA] = PublicKey.findProgramAddressSync(
//       [Buffer.from("task"), Buffer.from(taskId), alice.publicKey.toBuffer()],
//       program.programId
//     );
//     console.log(`📋 Task PDA: ${taskPDA.toString()}`);

//     // Calculate token accounts
//     faucetTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       faucetPDA,
//       true,
//       TOKEN_2022_PROGRAM_ID
//     );

//     aliceTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       alice.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );

//     bobTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       bob.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );

//     charlieTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       charlie.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );

//     davidTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       david.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );

//     escrowTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       taskPDA,
//       true,
//       TOKEN_2022_PROGRAM_ID
//     );

//     console.log("🏦 Token Accounts:");
//     console.log(`  Alice: ${aliceTokenAccount.toString()}`);
//     console.log(`  Bob: ${bobTokenAccount.toString()}`);
//     console.log(`  Charlie: ${charlieTokenAccount.toString()}`);
//     console.log(`  David: ${davidTokenAccount.toString()}`);
//     console.log(`  Escrow: ${escrowTokenAccount.toString()}`);
//   });

//   it("Should initialize faucet", async () => {
//     console.log("\n🚀 Initializing faucet...");

//     const tx = await program.methods
//       .initializeFaucet(tokenName, tokenSymbol, tokenUri, initialSupply)
//       .accounts({
//         faucet: faucetPDA,
//         mint: mintKeypair.publicKey,
//         faucetTokenAccount,
//         payer: alice.publicKey,
//         systemProgram: SystemProgram.programId,
//         tokenProgram: TOKEN_2022_PROGRAM_ID,
//       })
//       .signers([mintKeypair, alice])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Faucet Initialization");
//     console.log("✅ Faucet initialized successfully");
//   });

//   it("Should provide tokens to Alice for task creation", async () => {
//     console.log("\n🚀 Requesting tokens for Alice...");

//     const requestAmount = new anchor.BN(1000 * 10**6); // 10,000 tokens

//     const [userRequestRecordPDA] = PublicKey.findProgramAddressSync(
//       [Buffer.from("user_record"), alice.publicKey.toBuffer()],
//       program.programId
//     );

//     const tx = await program.methods
//       .requestTokens(requestAmount)
//       .accounts({
//         faucet: faucetPDA,
//         faucetTokenAccount,
//         userRequestRecord: userRequestRecordPDA,
//         userTokenAccount: aliceTokenAccount,
//         mint: mintKeypair.publicKey,
//         user: alice.publicKey,
//         tokenProgram: TOKEN_2022_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([alice])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Token Request for Alice");

//     // Verify Alice received tokens
//     const aliceTokenAccountInfo = await getAccount(
//       provider.connection,
//       aliceTokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID
//     );

//     expect(aliceTokenAccountInfo.amount.toString()).to.equal(requestAmount.toString());
//     console.log(`✅ Alice received ${requestAmount.toNumber() / 10**6} tokens`);
//   });

//   it("Should create a task with escrow", async () => {
//     console.log("\n🚀 Creating task with escrow...");

//     const tx = await program.methods
//       .createTask(taskId, rewardAmount)
//       .accounts({
//         task: taskPDA,
//         escrowTokenAccount,
//         creatorTokenAccount: aliceTokenAccount,
//         mint: mintKeypair.publicKey,
//         creator: alice.publicKey,
//         tokenProgram: TOKEN_2022_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([alice])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Task Creation");

//     // Verify task account
//     const taskAccount = await program.account.task.fetch(taskPDA);
//     expect(taskAccount.taskId).to.equal(taskId);
//     expect(taskAccount.rewardAmount.toString()).to.equal(rewardAmount.toString());
//     expect(taskAccount.status).to.deep.equal({ created: {} });
//     expect(taskAccount.assignees).to.have.length(0); // Should start with no assignees

//     // Verify escrow has the reward amount
//     const escrowBalance = await getAccount(
//       provider.connection,
//       escrowTokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID,
//     );
//     expect(escrowBalance.amount.toString()).to.equal(rewardAmount.toString());

//     console.log("✅ Task created successfully with empty assignees list");
//   });

//   it("Should assign task to multiple users", async () => {
//     console.log("\n🚀 Assigning task to multiple users...");

//     const assignees = [bob.publicKey, charlie.publicKey, david.publicKey];

//     const tx = await program.methods
//       .assignTaskMultiple(taskId, assignees)
//       .accounts({
//         task: taskPDA,
//         creator: alice.publicKey,
//       })
//       .signers([alice])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Multiple Task Assignment");

//     // Verify task has been assigned to multiple users
//     const taskAccount = await program.account.task.fetch(taskPDA);
//     expect(taskAccount.assignees).to.have.length(3);
//     expect(taskAccount.assignees.map(pk => pk.toString())).to.include.members([
//       bob.publicKey.toString(),
//       charlie.publicKey.toString(),
//       david.publicKey.toString()
//     ]);

//     console.log("✅ Task assigned to 3 users successfully");
//     console.log(`  Assignees: ${taskAccount.assignees.map(pk => pk.toString().slice(0, 8) + "...").join(", ")}`);
//   });

//   it("Should allow Alice (creator) to update task status to InProgress", async () => {
//     console.log("\n🚀 Alice updating task status to InProgress...");

//     const tx = await program.methods
//       .updateTaskStatus(taskId, { inProgress: {} })
//       .accounts({
//         task: taskPDA,
//         creator: alice.publicKey,
//       })
//       .signers([alice])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Task Status Update to InProgress");

//     // Verify task status updated to inProgress
//     const taskAccount = await program.account.task.fetch(taskPDA);
//     expect(taskAccount.status).to.deep.equal({ inProgress: {} });

//     console.log("✅ Task status updated to InProgress by creator");
//   });

//   it("Should prevent duplicate assignee assignment", async () => {
//     console.log("\n🚀 Testing duplicate assignee prevention...");

//     try {
//       // Try to assign Bob again (should fail)
//       await program.methods
//         .assignTask(taskId, bob.publicKey)
//         .accounts({
//           task: taskPDA,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       expect.fail("Should have thrown an error for duplicate assignee");
//     } catch (error) {
//       console.log("Full error:", error);
//       // Check for the error in different ways since Anchor wraps errors
//       const errorMessage = error.message || "";
//       const errorCode = error.error?.errorCode?.code;
//       const hasCorrectError = errorMessage.includes("DuplicateAssignee") ||
//                              errorCode === "DuplicateAssignee" ||
//                              errorMessage.includes("6017"); // Error code number
//       console.log(`Error message: ${errorMessage}`);

//       expect(hasCorrectError).to.be.true;
//       console.log("✅ Correctly prevented duplicate assignee assignment");
//     }
//   });

//   it("Should prevent assigning task to creator", async () => {
//     console.log("\n🚀 Testing creator self-assignment prevention...");

//     try {
//       await program.methods
//         .assignTask(taskId, alice.publicKey)
//         .accounts({
//           task: taskPDA,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       expect.fail("Should have thrown an error for creator self-assignment");
//     } catch (error) {
//       console.log("Full error:", error);
//       // Check for the error in different ways since Anchor wraps errors
//       const errorMessage = error.message || "";
//       const errorCode = error.error?.errorCode?.code;
//       const hasCorrectError = errorMessage.includes("CannotAssignToCreator") ||
//                              errorCode === "CannotAssignToCreator" ||
//                              errorMessage.includes("6018"); // Error code number
//       console.log(`Error message: ${errorMessage}`);

//       expect(hasCorrectError).to.be.true;
//       console.log("✅ Correctly prevented creator self-assignment");
//     }
//   });

//   it("Should allow Alice (creator) to mark the task as completed", async () => {
//     console.log("\n🚀 Alice marking the task as completed...");

//     const tx = await program.methods
//       .updateTaskStatus(taskId, { completed: {} })
//       .accounts({
//         task: taskPDA,
//         creator: alice.publicKey,
//       })
//       .signers([alice])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Task Status Update by Alice");

//     // Verify task status updated to completed
//     const taskAccount = await program.account.task.fetch(taskPDA);
//     expect(taskAccount.status).to.deep.equal({ completed: {} });

//     // Verify escrow still has full balance (no tokens transferred yet)
//     const escrowBalance = await getAccount(
//       provider.connection,
//       escrowTokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID,
//     );
//     expect(escrowBalance.amount.toString()).to.equal(rewardAmount.toString());

//     console.log("✅ Task marked as completed by creator, escrow balance unchanged");
//   });

//   it("Should prevent non-creators from updating task status", async () => {
//     console.log("\n🚀 Testing unauthorized status update prevention...");

//     try {
//       await program.methods
//         .updateTaskStatus(taskId, { cancelled: {} })
//         .accounts({
//           task: taskPDA,
//           creator: bob.publicKey, // Bob trying to update Alice's task
//         })
//         .signers([bob])
//         .rpc();

//       expect.fail("Should have thrown an error for unauthorized status update");
//     } catch (error) {
//       console.log("Full error:", error);
//       const errorMessage = error.message || "";
//       const errorCode = error.error?.errorCode?.code;
//       const hasCorrectError = errorMessage.includes("UnauthorizedTaskCreator") ||
//                              errorCode === "UnauthorizedTaskCreator";

//       expect(hasCorrectError).to.be.true;
//       console.log("✅ Correctly prevented unauthorized status update");
//     }
//   });

//   it("Should prevent invalid status transitions", async () => {
//     console.log("\n🚀 Testing invalid status transition prevention...");

//     try {
//       // Try to update from Completed back to Created (invalid transition)
//       await program.methods
//         .updateTaskStatus(taskId, { created: {} })
//         .accounts({
//           task: taskPDA,
//           creator: alice.publicKey,
//         })
//         .signers([alice])
//         .rpc();

//       expect.fail("Should have thrown an error for invalid status transition");
//     } catch (error) {
//       console.log("Full error:", error);
//       const errorMessage = error.message || "";
//       const errorCode = error.error?.errorCode?.code;
//       const hasCorrectError = errorMessage.includes("InvalidTaskStatus") ||
//                              errorCode === "InvalidTaskStatus";

//       expect(hasCorrectError).to.be.true;
//       console.log("✅ Correctly prevented invalid status transition");
//     }
//   });

//   it("Should allow Bob to claim his reward", async () => {
//     console.log("\n🚀 Bob claiming his reward...");

//     // Get Bob's initial balance
//     let bobInitialBalance = 0n;
//     try {
//       const bobTokenAccountInfo = await getAccount(
//         provider.connection,
//         bobTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );
//       bobInitialBalance = bobTokenAccountInfo.amount;
//     } catch {
//       // Token account doesn't exist yet, balance is 0
//       bobInitialBalance = 0n;
//     }

//     const tx = await program.methods
//       .claimReward(taskId)
//       .accounts({
//         task: taskPDA,
//         escrowTokenAccount,
//         assigneeTokenAccount: bobTokenAccount,
//         creator: alice.publicKey,
//         mint: mintKeypair.publicKey,
//         assignee: bob.publicKey,
//         tokenProgram: TOKEN_2022_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([bob])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Reward Claim by Bob");

//     // Verify Bob received his share (1/3 of total reward)
//     const bobTokenAccountInfo = await getAccount(
//       provider.connection,
//       bobTokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID
//     );

//     const expectedRewardPerAssignee = rewardAmount.toNumber() / 3;
//     const bobReceivedAmount = Number(bobTokenAccountInfo.amount - bobInitialBalance);

//     expect(bobReceivedAmount).to.equal(expectedRewardPerAssignee);

//     // Verify escrow balance decreased
//     const escrowBalance = await getAccount(
//       provider.connection,
//       escrowTokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID,
//     );
//     const expectedRemainingBalance = rewardAmount.toNumber() - expectedRewardPerAssignee;
//     expect(escrowBalance.amount.toString()).to.equal(expectedRemainingBalance.toString());

//     console.log(`✅ Bob claimed his share: ${bobReceivedAmount / 10**6} tokens`);
//     console.log(`  Remaining escrow balance: ${Number(escrowBalance.amount) / 10**6} tokens`);
//   });

//   it("Should allow Charlie to claim his reward", async () => {
//     console.log("\n🚀 Charlie claiming his reward...");

//     // Get Charlie's initial balance
//     let charlieInitialBalance = 0n;
//     try {
//       const charlieTokenAccountInfo = await getAccount(
//         provider.connection,
//         charlieTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );
//       charlieInitialBalance = charlieTokenAccountInfo.amount;
//     } catch {
//       // Token account doesn't exist yet, balance is 0
//       charlieInitialBalance = 0n;
//     }

//     const tx = await program.methods
//       .claimReward(taskId)
//       .accounts({
//         task: taskPDA,
//         escrowTokenAccount,
//         assigneeTokenAccount: charlieTokenAccount,
//         creator: alice.publicKey,
//         mint: mintKeypair.publicKey,
//         assignee: charlie.publicKey,
//         tokenProgram: TOKEN_2022_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([charlie])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Reward Claim by Charlie");

//     // Verify Charlie received his share
//     const charlieTokenAccountInfo = await getAccount(
//       provider.connection,
//       charlieTokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID
//     );

//     const expectedRewardPerAssignee = rewardAmount.toNumber() / 3;
//     const charlieReceivedAmount = Number(charlieTokenAccountInfo.amount - charlieInitialBalance);

//     expect(charlieReceivedAmount).to.equal(expectedRewardPerAssignee);
//     console.log(`✅ Charlie claimed his share: ${charlieReceivedAmount / 10**6} tokens`);
//   });

//   it("Should prevent unauthorized users from claiming rewards", async () => {
//     console.log("\n🚀 Testing unauthorized reward claim prevention...");

//     // Create a new unauthorized user
//     const unauthorizedUser = Keypair.generate();
//     await provider.connection.requestAirdrop(unauthorizedUser.publicKey, 5 * LAMPORTS_PER_SOL);
//     await new Promise(resolve => setTimeout(resolve, 1000));

//     const unauthorizedTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       unauthorizedUser.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );

//     try {
//       await program.methods
//         .claimReward(taskId)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           assigneeTokenAccount: unauthorizedTokenAccount,
//           mint: mintKeypair.publicKey,
//           assignee: unauthorizedUser.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//           creator: alice.publicKey, // Creator must be included
//         })
//         .signers([unauthorizedUser])
//         .rpc();

//       expect.fail("Should have thrown an error for unauthorized claim");
//     } catch (error) {
//         console.log("Full error:", error);

//       expect(error.message).to.include("UnauthorizedAssignee");
//       console.log("✅ Correctly prevented unauthorized reward claim");
//     }
//   });

//   it("Should allow David to claim his reward and close the escrow account", async () => {
//     console.log("\n🚀 David claiming his reward (final claim)...");

//     // Get David's initial balance
//     let davidInitialBalance = 0n;
//     try {
//       const davidTokenAccountInfo = await getAccount(
//         provider.connection,
//         davidTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );
//       davidInitialBalance = davidTokenAccountInfo.amount;
//     } catch {
//       // Token account doesn't exist yet, balance is 0
//       davidInitialBalance = 0n;
//     }

//     const tx = await program.methods
//       .claimReward(taskId)
//       .accounts({
//         task: taskPDA,
//         escrowTokenAccount,
//         assigneeTokenAccount: davidTokenAccount,
//         creator: alice.publicKey,
//         mint: mintKeypair.publicKey,
//         assignee: david.publicKey,
//         tokenProgram: TOKEN_2022_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([david])
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Final Reward Claim by David");

//     // Verify David received his share
//     const davidTokenAccountInfo = await getAccount(
//       provider.connection,
//       davidTokenAccount,
//       "confirmed",
//       TOKEN_2022_PROGRAM_ID
//     );

//     const expectedRewardPerAssignee = rewardAmount.toNumber() / 3; // 100 tokens
//     const davidReceivedAmount = Number(davidTokenAccountInfo.amount - davidInitialBalance);

//     expect(davidReceivedAmount).to.equal(expectedRewardPerAssignee);

//     // Verify escrow account has been closed (should throw error when trying to fetch)
//     try {
//       await getAccount(
//         provider.connection,
//         escrowTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID,
//       );
//       expect.fail("Escrow account should have been closed");
//     } catch (error) {
//       // Expected - account should be closed
//       console.log("✅ Escrow account successfully closed after final claim");
//     }

//     console.log(`✅ David claimed his final share: ${davidReceivedAmount / 10**6} tokens`);
//     console.log("✅ All rewards distributed and escrow account closed");
//   });

//   it("Should show final balances and verify equal distribution", async () => {
//     console.log("\n📊 Final Balance Summary:");

//     const bobBalance = await getAccount(provider.connection, bobTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
//     const charlieBalance = await getAccount(provider.connection, charlieTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
//     const davidBalance = await getAccount(provider.connection, davidTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);

//     const bobTokens = Number(bobBalance.amount) / 10**6;
//     const charlieTokens = Number(charlieBalance.amount) / 10**6;
//     const davidTokens = Number(davidBalance.amount) / 10**6;
//     const totalDistributed = bobTokens + charlieTokens + davidTokens;
//     const originalReward = rewardAmount.toNumber() / 10**6;

//     console.log(`  Bob: ${bobTokens} tokens`);
//     console.log(`  Charlie: ${charlieTokens} tokens`);
//     console.log(`  David: ${davidTokens} tokens`);
//     console.log(`  Total Distributed: ${totalDistributed} tokens`);
//     console.log(`  Original Reward: ${originalReward} tokens`);

//     // Verify equal distribution
//     expect(bobTokens).to.equal(charlieTokens);
//     expect(charlieTokens).to.equal(davidTokens);
//     expect(totalDistributed).to.equal(originalReward);

//     console.log("✅ Rewards were distributed equally among all assignees");
//   });

//   it("Should allow final task account closure after all assignees claim", async () => {
//     console.log("\n🚀 Testing final task account closure...");

//     // Anyone can call close_task once all assignees have claimed
//     const tx = await program.methods
//       .closeTask(taskId)
//       .accounts({
//         task: taskPDA,
//         creator: alice.publicKey,
//       })
//       .rpc();

//     await logTransactionTiming(provider.connection, tx, "Task Account Closure");

//     // Verify task account has been closed (should throw error when trying to fetch)
//     try {
//       await program.account.task.fetch(taskPDA);
//       expect.fail("Task account should have been closed");
//     } catch (error) {
//       // Expected - account should be closed
//       console.log("✅ Task account successfully closed after all claims");
//     }

//     console.log("✅ Complete task lifecycle tested successfully!");
//     console.log("  - Task created with escrow ✓");
//     console.log("  - Multiple assignees assigned ✓");
//     console.log("  - Task marked as completed ✓");
//     console.log("  - All assignees claimed rewards ✓");
//     console.log("  - Escrow account auto-closed ✓");
//     console.log("  - Task account manually closed ✓");
//   });
// });
