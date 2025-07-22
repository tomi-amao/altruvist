use anchor_lang::prelude::*;


declare_id!("nWKuomP36HFtZcUTHASRrhZSRvvzUJwnsenaNiXQqjv");

pub mod instructions;
pub mod state;
pub mod errors;
pub mod utils;

use instructions::*;
use state::TaskStatus;

#[program]
pub mod altruvist {
    use super::*;

    /// Initialize the faucet system with Token 2022 mint
    pub fn initialize_faucet(
        ctx: Context<InitializeFaucet>,
        name: String,
        symbol: String,
        uri: String,
        initial_supply: u64,
    ) -> Result<()> {
        instructions::initialize_faucet(ctx, name, symbol, uri, initial_supply)
    }

    /// Allow users to request tokens from the faucet
    pub fn request_tokens(
        ctx: Context<RequestTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::request_tokens(ctx, amount)
    }

    /// Delete the faucet and close all associated accounts
    pub fn delete_faucet(ctx: Context<DeleteFaucet>) -> Result<()> {
        instructions::delete_faucet(ctx)
    }

    /// Burn all remaining tokens and delete the faucet
    pub fn burn_and_delete_faucet(ctx: Context<BurnAndDeleteFaucet>) -> Result<()> {
        instructions::burn_and_delete_faucet(ctx)
    }

    /// Create a new task with escrow
    pub fn create_task(
        ctx: Context<CreateTask>,
        task_id: String,
        reward_amount: u64,
    ) -> Result<()> {
        instructions::create_task(ctx, task_id, reward_amount)
    }

    /// Update task reward amount
    pub fn update_task_reward(
        ctx: Context<UpdateTaskReward>,
        task_id: String,
        new_reward_amount: u64,
    ) -> Result<()> {
        instructions::update_task_reward(ctx, task_id, new_reward_amount)
    }

    /// Assign a task to a specific user
    pub fn assign_task(
        ctx: Context<AssignTask>,
        task_id: String,
        assignee: Pubkey,
    ) -> Result<()> {
        instructions::assign_task(ctx, task_id, assignee)
    }

    /// Assign a task to multiple users at once
    pub fn assign_task_multiple(
        ctx: Context<AssignTask>,
        task_id: String,
        assignees: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::assign_task_multiple(ctx, task_id, assignees)
    }
    
    /// Execute a pending reward decrease after time lock period
    pub fn execute_pending_decrease(
        ctx: Context<ExecutePendingDecrease>,
        task_id: String,
    ) -> Result<()> {
        instructions::execute_pending_decrease(ctx, task_id)
    }

    /// Cancel a pending reward decrease
    pub fn cancel_pending_decrease(
        ctx: Context<CancelPendingDecrease>,
        task_id: String,
    ) -> Result<()> {
        instructions::cancel_pending_decrease(ctx, task_id)
    }

    /// Update task status
    pub fn update_task_status(
        ctx: Context<UpdateTaskStatus>,
        task_id: String,
        new_status: TaskStatus,
    ) -> Result<()> {
        instructions::update_task_status(ctx, task_id, new_status)
    }

    /// Claim reward as an assignee
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        task_id: String,
    ) -> Result<()> {
        instructions::claim_reward(ctx, task_id)
    }

    /// Close a completed task account after all assignees have claimed
    pub fn close_task(
        ctx: Context<CloseTask>,
        task_id: String,
    ) -> Result<()> {
        instructions::close_task(ctx, task_id)
    }

    /// Cancel a task and refund creator
    pub fn delete_task(
        ctx: Context<DeleteTask>,
        task_id: String,
    ) -> Result<()> {
        instructions::delete_task(ctx, task_id)
    }
}
