use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, TokenAccount, TransferChecked, CloseAccount},
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
    
    // Validate task_id format (alphanumeric, underscore, hyphen only)
    require!(
        task_id.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-'),
        AltruistError::InvalidTaskIdFormat
    );

    // Check creator's token balance (user-friendly error before transfer)
    let creator_balance = ctx.accounts.creator_token_account.amount;
    require!(creator_balance >= reward_amount, AltruistError::InsufficientBalance);

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
    let task = &ctx.accounts.task;
    let clock = Clock::get()?;
    
    // CRITICAL FIX: Validate that the signer is actually the assigned user
    require!(task.can_complete(), AltruistError::InvalidTaskStatus);
    require!(task.assignee.is_some(), AltruistError::NoAssignee);
    
    let assigned_user = task.assignee.unwrap();
    require!(
        assigned_user == ctx.accounts.assignee.key(),
        AltruistError::UnauthorizedAssignee
    );

    // Store values we need for CPI calls
    let reward_amount = task.reward_amount;
    let creator_key = task.creator;
    let task_bump = task.bump;

    // Check escrow balance (user-friendly error)
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

    // Close the escrow token account and return lamports to creator
    let close_escrow_accounts = CloseAccount {
        account: ctx.accounts.escrow_token_account.to_account_info(),
        destination: ctx.accounts.creator.to_account_info(),
        authority: ctx.accounts.task.to_account_info(),
    };
    let close_escrow_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        close_escrow_accounts,
        signer
    );
    token_interface::close_account(close_escrow_ctx)?;

    // Update task status before closing
    let task = &mut ctx.accounts.task;
    task.update_status(TaskStatus::Completed);
    task.updated_at = clock.unix_timestamp;

    msg!("Task {} completed. Reward transferred to assignee and accounts closed", task_id);

    Ok(())
}

/// Cancel a task and refund creator
pub fn delete_task(
    ctx: Context<DeleteTask>,
    task_id: String,
) -> Result<()> {
    let task = &ctx.accounts.task;
    let clock = Clock::get()?;
    
    // Validate authority and task status
    require!(
        task.can_cancel(&ctx.accounts.creator.key()),
        AltruistError::UnauthorizedTaskCreator
    );

    // Store values we need for CPI calls
    let reward_amount = task.reward_amount;
    let creator_key = task.creator;
    let task_bump = task.bump;

    // Check escrow balance (user-friendly error)
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

    // Close the escrow token account and return lamports to creator
    let close_escrow_accounts = CloseAccount {
        account: ctx.accounts.escrow_token_account.to_account_info(),
        destination: ctx.accounts.creator.to_account_info(),
        authority: ctx.accounts.task.to_account_info(),
    };
    let close_escrow_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        close_escrow_accounts,
        signer
    );
    token_interface::close_account(close_escrow_ctx)?;

    // Update task status before closing
    let task = &mut ctx.accounts.task;
    task.update_status(TaskStatus::Cancelled);
    task.updated_at = clock.unix_timestamp;

    msg!("Task {} cancelled. Tokens refunded to creator and accounts closed", task_id);

    Ok(())
}

/// Assign a task to a specific user
pub fn assign_task(
    ctx: Context<AssignTask>,
    _task_id: String,
    assignee: Pubkey,
) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let clock = Clock::get()?;
    
    // Validate authority - only task creator can assign
    require!(
        task.creator == ctx.accounts.creator.key(),
        AltruistError::UnauthorizedTaskCreator
    );
    
    // Validate task status - can only assign Created tasks
    require!(
        matches!(task.status, TaskStatus::Created),
        AltruistError::InvalidTaskStatus
    );
    
    // Validate assignee is not the creator (creators can't assign to themselves)
    require!(
        assignee != task.creator,
        AltruistError::CannotAssignToCreator
    );
    
    // Assign the task
    task.assignee = Some(assignee);
    task.status = TaskStatus::InProgress;
    task.updated_at = clock.unix_timestamp;

    msg!("Task {} assigned to {}", task.task_id, assignee);

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
        bump = task.bump,
        close = creator,  // Close task account and send lamports to creator
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

    /// CHECK: This account receives the closed task account's lamports
    #[account(
        mut,
        constraint = creator.key() == task.creator @ AltruistError::InvalidCreator
    )]
    pub creator: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub assignee: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct DeleteTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task_id.as_bytes(), creator.key().as_ref()],
        bump = task.bump,
        close = creator,  // Close task account and send lamports to creator
        constraint = task.creator == creator.key() @ AltruistError::UnauthorizedTaskCreator
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

    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct AssignTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task_id.as_bytes(), creator.key().as_ref()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(mut)]
    pub creator: Signer<'info>,
}