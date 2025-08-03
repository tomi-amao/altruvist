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

// // Helper function to log timing and transaction details
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
//     const confirmation = await connection.confirmTransaction(txSignature, "confirmed");
//     const endTime = Date.now();

//     console.log(`✅ Confirmed at: ${new Date().toISOString()}`);
//     console.log(`⏱️  Confirmation time: ${endTime - startTime}ms`);

//     return confirmation;
//   } catch (error) {
//     console.log(`❌ Confirmation failed:`, error);
//     throw error;
//   }
// }

// // Helper function to fetch account with retry logic
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

// describe("Task Management System Tests", () => {
//   // Configure the client to use the local cluster
//   anchor.setProvider(anchor.AnchorProvider.env());
//   const program = anchor.workspace.Altruvist as Program<Altruvist>;
//   const provider = anchor.getProvider();

//   // Test accounts
//   let faucetPDA: PublicKey;
//   let faucetBump: number;
//   let mintKeypair: Keypair;
//   let faucetTokenAccount: PublicKey;
//   let creator: Keypair;
//   let assignee: Keypair;
//   let creatorTokenAccount: PublicKey;
//   let assigneeTokenAccount: PublicKey;

//   // Task-related accounts
//   let taskPDA: PublicKey;
//   let taskBump: number;
//   let escrowTokenAccount: PublicKey;

//   // Test data with unique identifier to avoid conflicts
//   const testRunId = Date.now().toString();
//   const tokenName = `Altruvist Token ${testRunId}`;
//   const tokenSymbol = "ALT";
//   const tokenUri = `https://example.com/metadata-${testRunId}.json`;
//   const initialSupply = new anchor.BN(1_000_000 * 10**6); // 1M tokens with 6 decimals
//   const taskId = `test-task-${testRunId}`;
//   const taskDescription = "Complete this test task for rewards";
//   const rewardAmount = new anchor.BN(1000 * 10**6); // 1000 tokens

//   before(async () => {
//     console.log(`\n🎯 Setting up task management test environment (Run ID: ${testRunId})...`);
//     console.log(`🔗 RPC Endpoint: ${provider.connection.rpcEndpoint}`);
//     console.log(`🏦 Program ID: ${program.programId.toString()}`);

//     // Generate fresh test accounts for each run
//     creator = Keypair.generate();
//     assignee = Keypair.generate();
//     mintKeypair = Keypair.generate();

//     console.log(`👤 Creator Public Key: ${creator.publicKey.toString()}`);
//     console.log(`👤 Assignee Public Key: ${assignee.publicKey.toString()}`);
//     console.log(`🪙 Mint Public Key: ${mintKeypair.publicKey.toString()}`);

//     // Airdrop SOL to accounts for transaction fees
//     console.log("\n💰 Requesting airdrops...");
//     const airdropPromises = [
//       provider.connection.requestAirdrop(creator.publicKey, 20 * LAMPORTS_PER_SOL),
//       provider.connection.requestAirdrop(assignee.publicKey, 20 * LAMPORTS_PER_SOL),
//     ];

//     const airdropTxs = await Promise.all(airdropPromises);
//     console.log(`📝 Creator airdrop: ${airdropTxs[0]}`);
//     console.log(`📝 Assignee airdrop: ${airdropTxs[1]}`);

//     // Wait for airdrops to confirm
//     console.log("⏳ Waiting for airdrop confirmations...");
//     await new Promise(resolve => setTimeout(resolve, 3000));

//     // Derive PDAs - use correct seed format
//     console.log("\n🔑 Deriving PDAs...");
//     [faucetPDA, faucetBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("altru_faucet")], // Correct: only "faucet" seed
//       program.programId
//     );
//     console.log(`🏭 Faucet PDA: ${faucetPDA.toString()}, bump: ${faucetBump}`);

//     [taskPDA, taskBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("task"), Buffer.from(taskId), creator.publicKey.toBuffer()],
//       program.programId
//     );
//     console.log(`📋 Task PDA: ${taskPDA.toString()}, bump: ${taskBump}`);

//     // Get associated token accounts
//     console.log("\n🏦 Calculating associated token accounts...");
//     faucetTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       faucetPDA,
//       true,
//       TOKEN_2022_PROGRAM_ID
//     );
//     console.log(`🏭 Faucet Token Account: ${faucetTokenAccount.toString()}`);

//     creatorTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       creator.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );
//     console.log(`👤 Creator Token Account: ${creatorTokenAccount.toString()}`);

//     assigneeTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       assignee.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );
//     console.log(`👤 Assignee Token Account: ${assigneeTokenAccount.toString()}`);

//     escrowTokenAccount = getAssociatedTokenAddressSync(
//       mintKeypair.publicKey,
//       taskPDA,
//       true,
//       TOKEN_2022_PROGRAM_ID
//     );
//     console.log(`🔒 Escrow Token Account: ${escrowTokenAccount.toString()}`);

//     console.log("✅ Test environment setup complete!\n");
//   });

//   describe("Setup - Initialize Faucet and Request Tokens", () => {
//     it("Should initialize faucet with Token 2022 mint or use existing", async () => {
//       console.log("\n🚀 Initializing faucet for task tests...");

//       // Check if faucet already exists
//       try {
//         const existingFaucet = await program.account.faucet.fetch(faucetPDA);
//         console.log("⚠️  Faucet already exists, using existing faucet");
//         console.log(`📊 Existing faucet mint: ${existingFaucet.mint.toString()}`);

//         // Use the existing mint
//         const mintAccount = await getMint(
//           provider.connection,
//           existingFaucet.mint,
//           "confirmed",
//           TOKEN_2022_PROGRAM_ID
//         );

//         // Update our mint keypair reference (we can't use it, but we can update our token accounts)
//         // Recalculate token accounts with existing mint
//         faucetTokenAccount = getAssociatedTokenAddressSync(
//           existingFaucet.mint,
//           faucetPDA,
//           true,
//           TOKEN_2022_PROGRAM_ID
//         );

//         creatorTokenAccount = getAssociatedTokenAddressSync(
//           existingFaucet.mint,
//           creator.publicKey,
//           false,
//           TOKEN_2022_PROGRAM_ID
//         );

//         assigneeTokenAccount = getAssociatedTokenAddressSync(
//           existingFaucet.mint,
//           assignee.publicKey,
//           false,
//           TOKEN_2022_PROGRAM_ID
//         );

//         escrowTokenAccount = getAssociatedTokenAddressSync(
//           existingFaucet.mint,
//           taskPDA,
//           true,
//           TOKEN_2022_PROGRAM_ID
//         );

//         // Update mintKeypair to use existing mint (we'll need its public key for other operations)
//         // Note: We can't sign with this keypair, but we can use its public key
//         const fakeKeypair = Keypair.generate();
//         Object.defineProperty(fakeKeypair, 'publicKey', {
//           value: existingFaucet.mint,
//           writable: false
//         });
//         mintKeypair = fakeKeypair;

//         console.log("✅ Using existing faucet and mint");
//         return;
//       } catch (error) {
//         // Faucet doesn't exist, proceed with initialization
//         console.log("✅ Faucet doesn't exist, proceeding with initialization");
//       }

//       const tx = await program.methods
//         .initializeFaucet(tokenName, tokenSymbol, tokenUri, initialSupply)
//         .accountsStrict({
//           mint: mintKeypair.publicKey,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           faucet: faucetPDA,
//           faucetTokenAccount,
//           payer: creator.publicKey,
//           systemProgram: SystemProgram.programId,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([mintKeypair, creator])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Faucet Initialization");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Verify faucet account
//       const faucetAccount = await program.account.faucet.fetch(faucetPDA);
//       expect(faucetAccount.mint.toString()).to.equal(mintKeypair.publicKey.toString());

//       console.log("✅ Faucet initialized successfully");
//     });

//     it("Should provide tokens to creator for task creation", async () => {
//       console.log("\n🚀 Requesting tokens for task creator...");

//       const requestAmount = new anchor.BN(10000 * 10**6); // 10,000 tokens

//       // Get user request record PDA
//       const [userRequestRecordPDA] = PublicKey.findProgramAddressSync(
//         [Buffer.from("user_record"), creator.publicKey.toBuffer()],
//         program.programId
//       );

//       const tx = await program.methods
//         .requestTokens(requestAmount)
//         .accounts({
//           faucet: faucetPDA,
//           faucetTokenAccount,
//           userRequestRecord: userRequestRecordPDA,
//           userTokenAccount: creatorTokenAccount,
//           mint: mintKeypair.publicKey,
//           user: creator.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([creator])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Token Request for Creator");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Verify creator received tokens
//       const creatorTokenAccountInfo = await getAccount(
//         provider.connection,
//         creatorTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );

//       expect(creatorTokenAccountInfo.amount.toString()).to.equal(requestAmount.toString());
//       console.log(`✅ Creator received ${requestAmount.toNumber() / 10**6} tokens`);
//     });
//   });

//   describe("Task Creation", () => {
//     it("Should create a new task with escrow", async () => {
//       console.log("\n🚀 Starting task creation test...");
//       console.log(`📋 Task ID: ${taskId}`);
//       console.log(`💰 Reward Amount: ${rewardAmount.toNumber() / 10**6} tokens`);
//       console.log(`📝 Description: ${taskDescription}`);

//       const tx = await program.methods
//         .createTask(taskId, rewardAmount, taskDescription)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           creatorTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: creator.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([creator])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Task Creation");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Verify task account
//       const taskAccount = await fetchAccountWithRetry(
//         () => program.account.task.fetch(taskPDA),
//         "task"
//       );

//       console.log(`📊 Task account data:`, {
//         taskId: taskAccount.taskId,
//         rewardAmount: taskAccount.rewardAmount.toString(),
//         status: taskAccount.status,
//         creator: taskAccount.creator.toString(),
//         escrowAccount: taskAccount.escrowAccount.toString(),
//         assignee: taskAccount.assignee?.toString() || "None",
//         description: taskAccount.description,
//         createdAt: taskAccount.createdAt.toNumber(),
//         updatedAt: taskAccount.updatedAt.toNumber(),
//         bump: taskAccount.bump,
//       });

//       expect(taskAccount.taskId).to.equal(taskId);
//       expect(taskAccount.rewardAmount.toString()).to.equal(rewardAmount.toString());
//       expect(taskAccount.status).to.deep.equal({ created: {} });
//       expect(taskAccount.creator.toString()).to.equal(creator.publicKey.toString());
//       expect(taskAccount.escrowAccount.toString()).to.equal(escrowTokenAccount.toString());
//       expect(taskAccount.assignee).to.be.null;
//       expect(taskAccount.description).to.equal(taskDescription);
//       expect(taskAccount.bump).to.equal(taskBump);

//       // Verify escrow account balance
//       const escrowAccountInfo = await fetchAccountWithRetry(
//         () => getAccount(provider.connection, escrowTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID),
//         "escrow token account"
//       );

//       console.log(`📊 Escrow account data:`, {
//         mint: escrowAccountInfo.mint.toString(),
//         owner: escrowAccountInfo.owner.toString(),
//         amount: escrowAccountInfo.amount.toString(),
//       });

//       expect(escrowAccountInfo.amount.toString()).to.equal(rewardAmount.toString());
//       expect(escrowAccountInfo.owner.toString()).to.equal(taskPDA.toString());

//       console.log("✅ Task created successfully with proper escrow");
//     });

//     it("Should fail to create task with insufficient balance", async () => {
//       const insufficientReward = new anchor.BN(100000 * 10**6); // 100,000 tokens (more than creator has)
//       const badTaskId = "insufficient-balance-task";

//       const [badTaskPDA] = PublicKey.findProgramAddressSync(
//         [Buffer.from("task"), Buffer.from(badTaskId), creator.publicKey.toBuffer()],
//         program.programId
//       );

//       const badEscrowTokenAccount = getAssociatedTokenAddressSync(
//         mintKeypair.publicKey,
//         badTaskPDA,
//         true,
//         TOKEN_2022_PROGRAM_ID
//       );

//       try {
//         await program.methods
//           .createTask(badTaskId, insufficientReward, "This should fail")
//           .accounts({
//             task: badTaskPDA,
//             escrowTokenAccount: badEscrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: creator.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([creator])
//           .rpc();

//         expect.fail("Should have thrown an error");
//       } catch (error) {
//         expect(error.message).to.include("InsufficientEscrowBalance");
//         console.log("✅ Correctly failed with insufficient balance");
//       }
//     });

//     it("Should fail to create task with invalid inputs", async () => {
//       const longTaskId = "a".repeat(51); // Task ID too long
//       const longDescription = "a".repeat(501); // Description too long
//       const zeroReward = new anchor.BN(0); // Zero reward

//       // Test task ID too long
//       try {
//         const [longTaskPDA] = PublicKey.findProgramAddressSync(
//           [Buffer.from("task"), Buffer.from(longTaskId), creator.publicKey.toBuffer()],
//           program.programId
//         );

//         const longEscrowTokenAccount = getAssociatedTokenAddressSync(
//           mintKeypair.publicKey,
//           longTaskPDA,
//           true,
//           TOKEN_2022_PROGRAM_ID
//         );

//         await program.methods
//           .createTask(longTaskId, rewardAmount, "Valid description")
//           .accounts({
//             task: longTaskPDA,
//             escrowTokenAccount: longEscrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: creator.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([creator])
//           .rpc();

//         expect.fail("Should have thrown an error for long task ID");
//       } catch (error) {
//         expect(error.message).to.include("TaskIdTooLong");
//         console.log("✅ Correctly failed with task ID too long");
//       }

//       // Test description too long
//       try {
//         const validTaskId = "valid-task-id";
//         const [validTaskPDA] = PublicKey.findProgramAddressSync(
//           [Buffer.from("task"), Buffer.from(validTaskId), creator.publicKey.toBuffer()],
//           program.programId
//         );

//         const validEscrowTokenAccount = getAssociatedTokenAddressSync(
//           mintKeypair.publicKey,
//           validTaskPDA,
//           true,
//           TOKEN_2022_PROGRAM_ID
//         );

//         await program.methods
//           .createTask(validTaskId, rewardAmount, longDescription)
//           .accounts({
//             task: validTaskPDA,
//             escrowTokenAccount: validEscrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: creator.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([creator])
//           .rpc();

//         expect.fail("Should have thrown an error for long description");
//       } catch (error) {
//         expect(error.message).to.include("DescriptionTooLong");
//         console.log("✅ Correctly failed with description too long");
//       }

//       // Test zero reward
//       try {
//         const zeroTaskId = "zero-reward-task";
//         const [zeroTaskPDA] = PublicKey.findProgramAddressSync(
//           [Buffer.from("task"), Buffer.from(zeroTaskId), creator.publicKey.toBuffer()],
//           program.programId
//         );

//         const zeroEscrowTokenAccount = getAssociatedTokenAddressSync(
//           mintKeypair.publicKey,
//           zeroTaskPDA,
//           true,
//           TOKEN_2022_PROGRAM_ID
//         );

//         await program.methods
//           .createTask(zeroTaskId, zeroReward, "Valid description")
//           .accounts({
//             task: zeroTaskPDA,
//             escrowTokenAccount: zeroEscrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: creator.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([creator])
//           .rpc();

//         expect.fail("Should have thrown an error for zero reward");
//       } catch (error) {
//         expect(error.message).to.include("InvalidRewardAmount");
//         console.log("✅ Correctly failed with zero reward amount");
//       }
//     });
//   });

//   describe("Task Reward Updates", () => {
//     it("Should increase task reward amount", async () => {
//       console.log("\n🚀 Testing task reward increase...");

//       const newRewardAmount = new anchor.BN(1500 * 10**6); // Increase to 1500 tokens
//       const additionalAmount = newRewardAmount.sub(rewardAmount);

//       console.log(`💰 New Reward Amount: ${newRewardAmount.toNumber() / 10**6} tokens`);
//       console.log(`➕ Additional Amount: ${additionalAmount.toNumber() / 10**6} tokens`);

//       const tx = await program.methods
//         .updateTaskReward(newRewardAmount)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           creatorTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: creator.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([creator])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Task Reward Increase");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Verify task reward updated
//       const taskAccount = await program.account.task.fetch(taskPDA);
//       expect(taskAccount.rewardAmount.toString()).to.equal(newRewardAmount.toString());

//       // Verify escrow balance increased
//       const escrowAccountInfo = await getAccount(
//         provider.connection,
//         escrowTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );
//       expect(escrowAccountInfo.amount.toString()).to.equal(newRewardAmount.toString());

//       console.log("✅ Task reward increased successfully");
//     });

//     it("Should decrease task reward amount and refund excess", async () => {
//       console.log("\n🚀 Testing task reward decrease...");

//       const newRewardAmount = new anchor.BN(800 * 10**6); // Decrease to 800 tokens
//       console.log(`💰 New Reward Amount: ${newRewardAmount.toNumber() / 10**6} tokens`);

//       // Get creator balance before
//       const creatorBalanceBefore = (await getAccount(
//         provider.connection,
//         creatorTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       )).amount;

//       const tx = await program.methods
//         .updateTaskReward(newRewardAmount)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           creatorTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: creator.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([creator])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Task Reward Decrease");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Verify task reward updated
//       const taskAccount = await program.account.task.fetch(taskPDA);
//       expect(taskAccount.rewardAmount.toString()).to.equal(newRewardAmount.toString());

//       // Verify escrow balance decreased
//       const escrowAccountInfo = await getAccount(
//         provider.connection,
//         escrowTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );
//       expect(escrowAccountInfo.amount.toString()).to.equal(newRewardAmount.toString());

//       // Verify creator received refund
//       const creatorBalanceAfter = (await getAccount(
//         provider.connection,
//         creatorTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       )).amount;

//       const refundAmount = new anchor.BN(700 * 10**6); // 1500 - 800 = 700 tokens refunded
//       expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(Number(refundAmount.toString()));

//       console.log("✅ Task reward decreased and excess refunded successfully");
//     });

//     it("Should fail to update reward with unauthorized user", async () => {
//       const unauthorizedUser = Keypair.generate();

//       // Airdrop SOL for transaction fees
//       await provider.connection.requestAirdrop(unauthorizedUser.publicKey, 5 * LAMPORTS_PER_SOL);
//       await new Promise(resolve => setTimeout(resolve, 2000));

//       try {
//         await program.methods
//           .updateTaskReward(new anchor.BN(2000 * 10**6))
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: unauthorizedUser.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//           })
//           .signers([unauthorizedUser])
//           .rpc();

//         expect.fail("Should have thrown an error");
//       } catch (error) {
//         expect(error.message).to.include("UnauthorizedTaskCreator");
//         console.log("✅ Correctly failed with unauthorized user");
//       }
//     });

//     it("Should fail to update reward to zero", async () => {
//       try {
//         await program.methods
//           .updateTaskReward(new anchor.BN(0))
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: creator.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//           })
//           .signers([creator])
//           .rpc();

//         expect.fail("Should have thrown an error");
//       } catch (error) {
//         expect(error.message).to.include("InvalidRewardAmount");
//         console.log("✅ Correctly failed with zero reward amount");
//       }
//     });
//   });

//   describe("Task Completion", () => {
//     before(async () => {
//       // First, we need to manually assign the task to the assignee
//       // This would normally be done through a separate assign_task instruction
//       // For testing purposes, we'll update the task account directly
//       console.log("\n🔧 Setting up task assignee for completion tests...");

//       // We need to manually assign the task since there's no assign_task instruction in the current implementation
//       // This would typically be done through an admin function or separate instruction
//       const taskAccount = await program.account.task.fetch(taskPDA);
//       console.log(`📋 Task status before assignment: ${JSON.stringify(taskAccount.status)}`);
//     });

//     it("Should complete task and transfer rewards to assignee", async () => {
//       console.log("\n🚀 Testing task completion...");

//       // For this test, we'll simulate the assignee completing the task
//       // In a real scenario, the task would have been assigned first

//       const tx = await program.methods
//         .completeTask(taskId)
//         .accounts({
//           task: taskPDA,
//           escrowTokenAccount,
//           assigneeTokenAccount,
//           mint: mintKeypair.publicKey,
//           assignee: assignee.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([assignee])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Task Completion");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Verify task status updated to completed
//       const taskAccount = await program.account.task.fetch(taskPDA);
//       expect(taskAccount.status).to.deep.equal({ completed: {} });

//       // Verify assignee received tokens
//       const assigneeAccountInfo = await fetchAccountWithRetry(
//         () => getAccount(provider.connection, assigneeTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID),
//         "assignee token account"
//       );

//       expect(assigneeAccountInfo.amount.toString()).to.equal("800000000"); // 800 tokens from last reward update

//       // Verify escrow is empty
//       const escrowAccountInfo = await getAccount(
//         provider.connection,
//         escrowTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );
//       expect(escrowAccountInfo.amount.toString()).to.equal("0");

//       console.log("✅ Task completed and rewards transferred successfully");
//     });

//     it("Should fail to complete already completed task", async () => {
//       try {
//         await program.methods
//           .completeTask(taskId)
//           .accounts({
//             task: taskPDA,
//             escrowTokenAccount,
//             assigneeTokenAccount,
//             mint: mintKeypair.publicKey,
//             assignee: assignee.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//           })
//           .signers([assignee])
//           .rpc();

//         expect.fail("Should have thrown an error");
//       } catch (error) {
//         expect(error.message).to.include("InvalidTaskStatus");
//         console.log("✅ Correctly failed to complete already completed task");
//       }
//     });
//   });

//   describe("Task Cancellation", () => {
//     let cancelTaskId: string;
//     let cancelTaskPDA: PublicKey;
//     let cancelEscrowTokenAccount: PublicKey;
//     const cancelRewardAmount = new anchor.BN(500 * 10**6);

//     before(async () => {
//       // Create a new task for cancellation testing
//       console.log("\n🔧 Creating task for cancellation tests...");

//       cancelTaskId = "cancel-test-task";
//       [cancelTaskPDA] = PublicKey.findProgramAddressSync(
//         [Buffer.from("task"), Buffer.from(cancelTaskId), creator.publicKey.toBuffer()],
//         program.programId
//       );

//       cancelEscrowTokenAccount = getAssociatedTokenAddressSync(
//         mintKeypair.publicKey,
//         cancelTaskPDA,
//         true,
//         TOKEN_2022_PROGRAM_ID
//       );

//       const tx = await program.methods
//         .createTask(cancelTaskId, cancelRewardAmount, "Task to be cancelled")
//         .accounts({
//           task: cancelTaskPDA,
//           escrowTokenAccount: cancelEscrowTokenAccount,
//           creatorTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: creator.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([creator])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Cancel Test Task Creation");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       console.log("✅ Cancel test task created");
//     });

//     it("Should cancel task and refund creator", async () => {
//       console.log("\n🚀 Testing task cancellation...");

//       // Get creator balance before cancellation
//       const creatorBalanceBefore = (await getAccount(
//         provider.connection,
//         creatorTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       )).amount;

//       const tx = await program.methods
//         .cancelTask(cancelTaskId)
//         .accounts({
//           task: cancelTaskPDA,
//           escrowTokenAccount: cancelEscrowTokenAccount,
//           creatorTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: creator.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//         })
//         .signers([creator])
//         .rpc();

//       await logTransactionTiming(provider.connection, tx, "Task Cancellation");
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Verify task status updated to cancelled
//       const taskAccount = await program.account.task.fetch(cancelTaskPDA);
//       expect(taskAccount.status).to.deep.equal({ cancelled: {} });

//       // Verify creator received refund
//       const creatorBalanceAfter = (await getAccount(
//         provider.connection,
//         creatorTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       )).amount;

//       expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(Number(cancelRewardAmount.toString()));

//       // Verify escrow is empty
//       const escrowAccountInfo = await getAccount(
//         provider.connection,
//         cancelEscrowTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );
//       expect(escrowAccountInfo.amount.toString()).to.equal("0");

//       console.log("✅ Task cancelled and creator refunded successfully");
//     });

//     it("Should fail to cancel already cancelled task", async () => {
//       try {
//         await program.methods
//           .cancelTask(cancelTaskId)
//           .accounts({
//             task: cancelTaskPDA,
//             escrowTokenAccount: cancelEscrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: creator.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//           })
//           .signers([creator])
//           .rpc();

//         expect.fail("Should have thrown an error");
//       } catch (error) {
//         expect(error.message).to.include("UnauthorizedTaskCreator");
//         console.log("✅ Correctly failed to cancel already cancelled task");
//       }
//     });

//     it("Should fail to cancel task with unauthorized user", async () => {
//       // Create another task for this test
//       const unauthorizedTaskId = "unauthorized-cancel-task";
//       const [unauthorizedTaskPDA] = PublicKey.findProgramAddressSync(
//         [Buffer.from("task"), Buffer.from(unauthorizedTaskId), creator.publicKey.toBuffer()],
//         program.programId
//       );

//       const unauthorizedEscrowTokenAccount = getAssociatedTokenAddressSync(
//         mintKeypair.publicKey,
//         unauthorizedTaskPDA,
//         true,
//         TOKEN_2022_PROGRAM_ID
//       );

//       // Create the task first
//       await program.methods
//         .createTask(unauthorizedTaskId, new anchor.BN(300 * 10**6), "Test task")
//         .accounts({
//           task: unauthorizedTaskPDA,
//           escrowTokenAccount: unauthorizedEscrowTokenAccount,
//           creatorTokenAccount,
//           mint: mintKeypair.publicKey,
//           creator: creator.publicKey,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//         })
//         .signers([creator])
//         .rpc();

//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Try to cancel with unauthorized user
//       const unauthorizedUser = Keypair.generate();
//       await provider.connection.requestAirdrop(unauthorizedUser.publicKey, 5 * LAMPORTS_PER_SOL);
//       await new Promise(resolve => setTimeout(resolve, 2000));

//       try {
//         await program.methods
//           .cancelTask(unauthorizedTaskId)
//           .accounts({
//             task: unauthorizedTaskPDA,
//             escrowTokenAccount: unauthorizedEscrowTokenAccount,
//             creatorTokenAccount,
//             mint: mintKeypair.publicKey,
//             creator: unauthorizedUser.publicKey,
//             tokenProgram: TOKEN_2022_PROGRAM_ID,
//           })
//           .signers([unauthorizedUser])
//           .rpc();

//         expect.fail("Should have thrown an error");
//       } catch (error) {
//         expect(error.message).to.include("UnauthorizedTaskCreator");
//         console.log("✅ Correctly failed to cancel with unauthorized user");
//       }
//     });
//   });

//   describe("Task Data Retrieval", () => {
//     it("Should correctly fetch task account data", async () => {
//       // Fetch the original completed task
//       const taskAccount = await program.account.task.fetch(taskPDA);

//       expect(taskAccount.taskId).to.equal(taskId);
//       expect(taskAccount.rewardAmount.toString()).to.equal("800000000"); // 800 tokens
//       expect(taskAccount.status).to.deep.equal({ completed: {} });
//       expect(taskAccount.creator.toString()).to.equal(creator.publicKey.toString());
//       expect(taskAccount.escrowAccount.toString()).to.equal(escrowTokenAccount.toString());
//       expect(taskAccount.description).to.equal(taskDescription);
//       expect(taskAccount.createdAt.toNumber()).to.be.greaterThan(0);
//       expect(taskAccount.updatedAt.toNumber()).to.be.greaterThan(0);

//       console.log("✅ Task data fetched and validated successfully");
//     });

//     it("Should correctly get token balances", async () => {
//       // Check assignee balance (should have received rewards)
//       const assigneeBalance = await getAccount(
//         provider.connection,
//         assigneeTokenAccount,
//         "confirmed",
//         TOKEN_2022_PROGRAM_ID
//       );

//       expect(assigneeBalance.amount.toString()).to.equal("800000000"); // 800 tokens

//       console.log(`✅ Assignee token balance: ${Number(assigneeBalance.amount) / 10**6} tokens`);
//     });
//   });
// });
