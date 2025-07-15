use anchor_lang::prelude::*;


declare_id!("nWKuomP36HFtZcUTHASRrhZSRvvzUJwnsenaNiXQqjv");

pub mod instructions;
pub mod state;
pub mod errors;
pub mod utils;

use instructions::*;

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
        new_reward_amount: u64,
    ) -> Result<()> {
        instructions::update_task_reward(ctx, new_reward_amount)
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

    /// Complete a task and transfer rewards
    pub fn complete_task(
        ctx: Context<CompleteTask>,
        task_id: String,
    ) -> Result<()> {
        instructions::complete_task(ctx, task_id)
    }

    /// Cancel a task and refund creator
    pub fn cancel_task(
        ctx: Context<CancelTask>,
        task_id: String,
    ) -> Result<()> {
        instructions::cancel_task(ctx, task_id)
    }
}
