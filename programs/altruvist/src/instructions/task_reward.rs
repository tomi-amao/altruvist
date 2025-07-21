use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{self, Mint, TokenAccount, TransferChecked},
    token_interface::Token2022,
};

use crate::{
    state::*,
    errors::*,
};

/// Update the reward amount for an existing task
pub fn update_task_reward(
    ctx: Context<UpdateTaskReward>,
    _task_id: String, // Add task_id parameter
    new_reward_amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    
    // Store values we need before borrowing task mutably
    let task_creator = ctx.accounts.task.creator;
    let can_modify = ctx.accounts.task.can_modify(&ctx.accounts.creator.key());
    let current_reward = ctx.accounts.task.reward_amount;
    let task_id = ctx.accounts.task.task_id.clone();
    let task_bump = ctx.accounts.task.bump;
    let can_initiate_decrease = ctx.accounts.task.can_initiate_decrease(&ctx.accounts.creator.key());

    // Validate authority and basic requirements
    require!(can_modify, AltruistError::UnauthorizedTaskCreator);
    require!(new_reward_amount > 0, AltruistError::InvalidRewardAmount);

    let escrow_balance = ctx.accounts.escrow_token_account.amount;

    if new_reward_amount > current_reward {
        // INCREASE: Always allowed
        let additional_amount = new_reward_amount - current_reward;
        let creator_balance = ctx.accounts.creator_token_account.amount;
        require!(creator_balance >= additional_amount, AltruistError::InsufficientEscrowBalance);

        // Transfer additional tokens to escrow
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.creator_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token_interface::transfer_checked(cpi_ctx, additional_amount, ctx.accounts.mint.decimals)?;

        // Clear any pending decrease since we're increasing
        let task = &mut ctx.accounts.task;
        if task.pending_decrease_amount.is_some() {
            task.cancel_decrease(clock.unix_timestamp);
        }
        task.reward_amount = new_reward_amount;
        task.updated_at = clock.unix_timestamp;

        msg!("Task reward increased to: {} tokens", new_reward_amount);
    } else if new_reward_amount < current_reward {
        // DECREASE: Requires time lock for Created status
        require!(can_initiate_decrease, AltruistError::CannotDecreaseRewardInvalidStatus);
        
        // Initiate time-locked decrease
        let task = &mut ctx.accounts.task;
        task.request_decrease(new_reward_amount, clock.unix_timestamp);
        
        msg!("Decrease requested to: {} tokens. Time lock period: {} hours", 
             new_reward_amount, Task::DECREASE_TIME_LOCK / 3600);
    } else {
        // Same amount - just update timestamp
        let task = &mut ctx.accounts.task;
        task.updated_at = clock.unix_timestamp;
        msg!("Task reward amount unchanged: {} tokens", new_reward_amount);
    }

    Ok(())
}

/// Execute a pending reward decrease after time lock period
pub fn execute_pending_decrease(
    ctx: Context<ExecutePendingDecrease>,
    _task_id: String,
) -> Result<()> {
    let clock = Clock::get()?;
    
    // Store values before borrowing task mutably
    let can_execute = ctx.accounts.task.can_execute_decrease(clock.unix_timestamp);
    let pending_amount = ctx.accounts.task.pending_decrease_amount;
    let current_reward = ctx.accounts.task.reward_amount;
    let task_creator = ctx.accounts.task.creator;
    let task_id = ctx.accounts.task.task_id.clone();
    let task_bump = ctx.accounts.task.bump;
    
    require!(can_execute, AltruistError::DecreaseTimeLockNotMet);
    require!(pending_amount.is_some(), AltruistError::NoPendingDecrease);
    
    let new_reward_amount = pending_amount.unwrap();
    let refund_amount = current_reward - new_reward_amount;
    
    // Check escrow has enough balance
    let escrow_balance = ctx.accounts.escrow_token_account.amount;
    require!(escrow_balance >= refund_amount, AltruistError::InsufficientEscrowBalance);

    // Transfer excess tokens back to creator
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.creator_token_account.to_account_info(),
        authority: ctx.accounts.task.to_account_info(),
    };
    let seeds = &[
        b"task".as_ref(),
        task_id.as_bytes(),
        task_creator.as_ref(),
        &[task_bump]
    ];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token_interface::transfer_checked(cpi_ctx, refund_amount, ctx.accounts.mint.decimals)?;

    // Update task with new reward amount and clear pending decrease
    let task = &mut ctx.accounts.task;
    task.execute_decrease(clock.unix_timestamp);

    msg!("Pending decrease executed. New reward amount: {} tokens", new_reward_amount);

    Ok(())
}

/// Cancel a pending reward decrease
pub fn cancel_pending_decrease(
    ctx: Context<CancelPendingDecrease>,
    _task_id: String,
) -> Result<()> {
    let clock = Clock::get()?;
    
    // Validate authority
    require!(
        ctx.accounts.task.can_modify(&ctx.accounts.creator.key()),
        AltruistError::UnauthorizedTaskCreator
    );
    
    require!(
        ctx.accounts.task.pending_decrease_amount.is_some(),
        AltruistError::NoPendingDecrease
    );

    // Cancel the pending decrease
    let task = &mut ctx.accounts.task;
    task.cancel_decrease(clock.unix_timestamp);

    msg!("Pending decrease cancelled");

    Ok(())
}

// Account validation structs

#[derive(Accounts)]
#[instruction(task_id: String, new_reward_amount: u64)]
pub struct UpdateTaskReward<'info> {
    #[account(
        mut,
        seeds = [b"task", task_id.as_bytes(), creator.key().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = task,
        associated_token::token_program = token_program,
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program,
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct ExecutePendingDecrease<'info> {
    #[account(
        mut,
        seeds = [b"task", task_id.as_bytes(), creator.key().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = task,
        associated_token::token_program = token_program,
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program,
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct CancelPendingDecrease<'info> {
    #[account(
        mut,
        seeds = [b"task", task_id.as_bytes(), creator.key().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    pub creator: Signer<'info>,
}