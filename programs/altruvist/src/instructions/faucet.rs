use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, MintTo, TokenAccount, TransferChecked, Burn},
    token_2022::{close_account, CloseAccount},
};

use anchor_spl::{
    token_interface::{
        token_metadata_initialize,
        Token2022, TokenMetadataInitialize,
    },
};

use crate::{
    utils::update_account_lamports_to_minimum_balance,
    state::*,
    errors::*,
};

/// Initialize the faucet system with Token 2022 mint and metadata
pub fn initialize_faucet(
    ctx: Context<InitializeFaucet>,
    faucet_seed: String,
    name: String,
    symbol: String,
    uri: String,
    initial_supply: u64,
) -> Result<()> {
    // Validate input lengths
    require!(name.len() <= 32, AltruistError::DescriptionTooLong);
    require!(symbol.len() <= 10, AltruistError::DescriptionTooLong);
    require!(uri.len() <= 200, AltruistError::DescriptionTooLong);
    require!(faucet_seed.len() <= 32, AltruistError::DescriptionTooLong);

    // Store values we need before borrowing faucet mutably
    let faucet_key = ctx.accounts.faucet.key();
    let faucet_token_account_key = ctx.accounts.faucet_token_account.key();
    let mint_key = ctx.accounts.mint.key();
    let faucet_bump = ctx.bumps.faucet;

    // Initialize faucet account
    let faucet = &mut ctx.accounts.faucet;
    faucet.mint = mint_key;
    faucet.authority = faucet_key;
    faucet.token_account = faucet_token_account_key;
    faucet.rate_limit = 1000 * 10_u64.pow(6); // 1000 tokens with 6 decimals
    faucet.cooldown_period = 86400; // 24 hours in seconds
    faucet.bump = faucet_bump;

    let seeds = &[faucet_seed.as_bytes(), &[faucet_bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = TokenMetadataInitialize {
        program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.mint.to_account_info(),
        mint_authority: ctx.accounts.faucet.to_account_info(),
        update_authority: ctx.accounts.faucet.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(), 
        cpi_accounts,
        signer
    );
    token_metadata_initialize(cpi_ctx, name.clone(), symbol.clone(), uri.clone())?;
    
    ctx.accounts.mint.reload()?;
    msg!("📋 Mint decimals: {}", ctx.accounts.mint.decimals);

    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    // Mint initial supply to faucet
    if initial_supply > 0 {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.faucet_token_account.to_account_info(),
            authority: ctx.accounts.faucet.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token_interface::mint_to(cpi_ctx, initial_supply)?;
    }

    msg!("Faucet initialized with mint: {}", mint_key);
    msg!("Initial supply: {} tokens", initial_supply);

    Ok(())
}

/// Allow users to request tokens from the faucet with rate limiting
pub fn request_tokens(ctx: Context<RequestTokens>, faucet_seed: String, amount: u64) -> Result<()> {
    let faucet = &ctx.accounts.faucet;
    let user_record = &mut ctx.accounts.user_request_record;
    let clock = Clock::get()?;

    // Validate request amount
    require!(amount > 0, AltruistError::InvalidRewardAmount);
    require!(amount <= faucet.rate_limit, AltruistError::RequestAmountTooHigh);

    // Check faucet balance
    let faucet_balance = ctx.accounts.faucet_token_account.amount;
    require!(faucet_balance >= amount, AltruistError::InsufficientFaucetBalance);

    // Check rate limiting
    if user_record.last_request > 0 {
        let time_since_last = clock.unix_timestamp - user_record.last_request;
        require!(
            time_since_last >= faucet.cooldown_period,
            AltruistError::CooldownNotMet
        );
    }

    // Transfer tokens from faucet to user
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.faucet_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.faucet.to_account_info(),
    };
    let faucet_bump = faucet.bump;
    let seeds = &[faucet_seed.as_bytes(), &[faucet_bump]];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token_interface::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    // Update user request record
    user_record.user = ctx.accounts.user.key();
    user_record.last_request = clock.unix_timestamp;
    user_record.total_received = user_record.total_received.checked_add(amount)
        .ok_or(AltruistError::ArithmeticOverflow)?;
    user_record.request_count = user_record.request_count.checked_add(1)
        .ok_or(AltruistError::ArithmeticOverflow)?;
    user_record.bump = ctx.bumps.user_request_record;

    msg!("User {} received {} tokens", ctx.accounts.user.key(), amount);

    Ok(())
}

/// Delete the faucet and close all associated accounts
pub fn delete_faucet(ctx: Context<DeleteFaucet>, faucet_seed: String) -> Result<()> {
    let faucet = &ctx.accounts.faucet;
    
    // Only allow deletion if faucet token account is empty
    let faucet_balance = ctx.accounts.faucet_token_account.amount;
    require!(faucet_balance == 0, AltruistError::FaucetNotEmpty);

    // Get faucet PDA seeds for signing
    let faucet_bump = faucet.bump;
    let seeds = &[faucet_seed.as_bytes(), &[faucet_bump]];
    let signer = &[&seeds[..]];

    // Close the faucet token account first (returns rent to payer)
    let close_token_account_cpi = anchor_spl::token_interface::CloseAccount {
        account: ctx.accounts.faucet_token_account.to_account_info(),
        destination: ctx.accounts.payer.to_account_info(),
        authority: ctx.accounts.faucet.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        close_token_account_cpi,
        signer
    );
    anchor_spl::token_interface::close_account(cpi_ctx)?;

    msg!("Faucet token account closed");

    // Close the mint account using proper CPI call to token extensions program
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.mint.to_account_info(),
            destination: ctx.accounts.payer.to_account_info(),
            authority: ctx.accounts.faucet.to_account_info(),
        },
        signer
    ))?;

    msg!("Mint account closed");
    
    msg!("Faucet deleted successfully");
    Ok(())
}

/// Burn all remaining tokens in the faucet and then delete all associated accounts
pub fn burn_and_delete_faucet(ctx: Context<BurnAndDeleteFaucet>, faucet_seed: String) -> Result<()> {
    let faucet = &ctx.accounts.faucet;
    let faucet_balance = ctx.accounts.faucet_token_account.amount;

    // Get faucet PDA seeds for signing
    let faucet_bump = faucet.bump;
    let seeds = &[faucet_seed.as_bytes(), &[faucet_bump]];
    let signer = &[&seeds[..]];

    // If there are tokens remaining, burn them all
    if faucet_balance > 0 {
        msg!("Burning {} tokens before deletion", faucet_balance);
        
        let burn_cpi = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.faucet_token_account.to_account_info(),
            authority: ctx.accounts.faucet.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            burn_cpi,
            signer
        );
        
        token_interface::burn(cpi_ctx, faucet_balance)?;
        msg!("Successfully burned {} tokens", faucet_balance);
    }

    // Close the faucet token account (returns rent to payer)
    let close_token_account_cpi = anchor_spl::token_interface::CloseAccount {
        account: ctx.accounts.faucet_token_account.to_account_info(),
        destination: ctx.accounts.payer.to_account_info(),
        authority: ctx.accounts.faucet.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        close_token_account_cpi,
        signer
    );
    anchor_spl::token_interface::close_account(cpi_ctx)?;

    msg!("Faucet token account closed");

    // Close the mint account using proper CPI call to token extensions program
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.mint.to_account_info(),
            destination: ctx.accounts.payer.to_account_info(),
            authority: ctx.accounts.faucet.to_account_info(),
        },
        signer
    ))?;

    msg!("Mint account closed");
    
    msg!("Faucet burned and deleted successfully");
    Ok(())
}

// Account validation structs

#[derive(Accounts)]
#[instruction(faucet_seed: String)]
pub struct InitializeFaucet<'info> {
    #[account(
        init,
        payer = payer,
        space = Faucet::LEN,
        seeds = [faucet_seed.as_bytes()],
        bump
    )]
    pub faucet: Account<'info, Faucet>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = faucet,
        mint::token_program = token_program,
        extensions::metadata_pointer::authority = faucet,
        extensions::metadata_pointer::metadata_address = mint,
        extensions::close_authority::authority = faucet,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = faucet,
        associated_token::token_program = token_program,
    )]
    pub faucet_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(faucet_seed: String)]
pub struct RequestTokens<'info> {
    #[account(
        seeds = [faucet_seed.as_bytes()],
        bump = faucet.bump
    )]
    pub faucet: Account<'info, Faucet>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = faucet,
        associated_token::token_program = token_program,
    )]
    pub faucet_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserRequestRecord::LEN,
        seeds = [b"user_record", user.key().as_ref()],
        bump
    )]
    pub user_request_record: Account<'info, UserRequestRecord>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        address = faucet.mint
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(faucet_seed: String)]
pub struct DeleteFaucet<'info> {
    #[account(
        mut,
        seeds = [faucet_seed.as_bytes()],
        bump = faucet.bump,
        close = payer
    )]
    pub faucet: Account<'info, Faucet>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = faucet,
        associated_token::token_program = token_program,
    )]
    pub faucet_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        address = faucet.mint,
        extensions::close_authority::authority = faucet,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(faucet_seed: String)]
pub struct BurnAndDeleteFaucet<'info> {
    #[account(
        mut,
        seeds = [faucet_seed.as_bytes()],
        bump = faucet.bump,
        close = payer
    )]
    pub faucet: Account<'info, Faucet>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = faucet,
        associated_token::token_program = token_program,
    )]
    pub faucet_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        address = faucet.mint,
        extensions::close_authority::authority = faucet,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}