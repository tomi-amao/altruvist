use anchor_lang::prelude::*;

declare_id!("HUYjKd5pjwfSET1EPexQmj256us1JB2zKs2T97ixRrSz");

#[program]
pub mod altruvist {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
