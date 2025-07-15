use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, TokenAccount, TransferChecked},
    token_interface::Token2022,
};

use crate::{
    state::*,
    errors::*,
};

/// Create a new task with escrow functionality
pub fn create_task(
    ctx: Context<CreateTask>,
    task_id: String,
    reward_amount: u64,
) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let clock = Clock::get()?;

    // Validate inputs
    require!(task_id.len() <= 50, AltruistError::TaskIdTooLong);
    require!(reward_amount > 0, AltruistError::InvalidRewardAmount);

    // Check creator's token balance
    let creator_balance = ctx.accounts.creator_token_account.amount;
    require!(creator_balance >= reward_amount, AltruistError::InsufficientEscrowBalance);

    // Initialize task account
    task.task_id = task_id.clone();
    task.reward_amount = reward_amount;
    task.status = TaskStatus::Created;
    task.creator = ctx.accounts.creator.key();
    task.escrow_account = ctx.accounts.escrow_token_account.key();
    task.assignee = None;
    task.created_at = clock.unix_timestamp;
    task.updated_at = clock.unix_timestamp;
    task.pending_decrease_amount = None;
    task.decrease_requested_at = None;
    task.bump = ctx.bumps.task;

    // Transfer reward tokens to escrow
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.creator_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.escrow_token_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token_interface::transfer_checked(cpi_ctx, reward_amount, ctx.accounts.mint.decimals)?;

    msg!("Task created: {} with reward: {} tokens", task_id, reward_amount);

    Ok(())
}

/// Complete a task and transfer rewards to assignee
pub fn complete_task(
    ctx: Context<CompleteTask>,
    task_id: String,
) -> Result<()> {
    // Store values we need before borrowing task mutably
    let can_complete = ctx.accounts.task.can_complete();
    let task_assignee = ctx.accounts.task.assignee;
    let reward_amount = ctx.accounts.task.reward_amount;
    let creator_key = ctx.accounts.task.creator;
    let task_bump = ctx.accounts.task.bump;

    // Validate task can be completed
    require!(can_complete, AltruistError::InvalidTaskStatus);
    require!(task_assignee.is_some(), AltruistError::NoAssignee);

    let assignee = task_assignee.unwrap();
    require!(assignee == ctx.accounts.assignee.key(), AltruistError::UnauthorizedTaskCreator);

    // Check escrow balance
    let escrow_balance = ctx.accounts.escrow_token_account.amount;
    require!(escrow_balance >= reward_amount, AltruistError::InsufficientEscrowBalance);

    // Transfer reward tokens to assignee
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.assignee_token_account.to_account_info(),
        authority: ctx.accounts.task.to_account_info(),
    };
    let seeds = &[
        b"task".as_ref(),
        task_id.as_bytes(),
        creator_key.as_ref(),
        &[task_bump]
    ];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token_interface::transfer_checked(cpi_ctx, reward_amount, ctx.accounts.mint.decimals)?;

    // Now we can safely borrow task mutably to update status
    let task = &mut ctx.accounts.task;
    task.update_status(TaskStatus::Completed);

    msg!("Task {} completed. Reward transferred to assignee", task_id);

    Ok(())
}

/// Cancel a task and refund creator
pub fn cancel_task(
    ctx: Context<CancelTask>,
    task_id: String,
) -> Result<()> {
    // Store values we need before any CPI calls
    let can_cancel = ctx.accounts.task.can_cancel(&ctx.accounts.creator.key());
    let reward_amount = ctx.accounts.task.reward_amount;
    let creator_key = ctx.accounts.task.creator;
    let task_bump = ctx.accounts.task.bump;

    // Validate authority and task status
    require!(can_cancel, AltruistError::UnauthorizedTaskCreator);

    // Check escrow balance
    let escrow_balance = ctx.accounts.escrow_token_account.amount;
    require!(escrow_balance >= reward_amount, AltruistError::InsufficientEscrowBalance);

    // Refund tokens to creator
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.creator_token_account.to_account_info(),
        authority: ctx.accounts.task.to_account_info(),
    };
    let seeds = &[
        b"task".as_ref(),
        task_id.as_bytes(),
        creator_key.as_ref(),
        &[task_bump]
    ];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token_interface::transfer_checked(cpi_ctx, reward_amount, ctx.accounts.mint.decimals)?;

    // Now we can safely borrow task mutably to update status
    let task = &mut ctx.accounts.task;
    task.update_status(TaskStatus::Cancelled);

    msg!("Task {} cancelled. Tokens refunded to creator", task_id);

    Ok(())
}

// Account validation structs

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = creator,
        space = Task::LEN,
        seeds = [b"task", task_id.as_bytes(), creator.key().as_ref()],
        bump
    )]
    pub task: Account<'info, Task>,

    #[account(
        init,
        payer = creator,
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

    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct CompleteTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task_id.as_bytes(), task.creator.as_ref()],
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
        init_if_needed,
        payer = assignee,
        associated_token::mint = mint,
        associated_token::authority = assignee,
        associated_token::token_program = token_program,
    )]
    pub assignee_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub assignee: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct CancelTask<'info> {
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