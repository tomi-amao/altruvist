import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Altruvist } from "../../target/types/altruvist";
import { expect } from "chai";

describe("altruvist", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Altruvist as Program<Altruvist>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);

    // Verify the transaction was successful
    expect(tx).to.be.a("string");
    expect(tx).to.have.lengthOf(88); // Solana transaction signatures are 88 characters long
  });
});
