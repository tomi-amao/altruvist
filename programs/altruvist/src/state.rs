use anchor_lang::prelude::*;

/// Faucet PDA that controls the mint authority
#[account]
pub struct Faucet {
    /// The mint this faucet controls
    pub mint: Pubkey,
    /// Authority of the faucet (PDA)
    pub authority: Pubkey,
    /// Token account that holds the faucet's tokens
    pub token_account: Pubkey,
    /// Rate limit per request (in tokens)
    pub rate_limit: u64,
    /// Cooldown period between requests (in seconds)
    pub cooldown_period: i64,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Faucet {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // authority
        32 + // token_account
        8 +  // rate_limit
        8 +  // cooldown_period
        1;   // bump
}

/// User request tracking for rate limiting
#[account]
pub struct UserRequestRecord {
    /// User's public key
    pub user: Pubkey,
    /// Timestamp of last request
    pub last_request: i64,
    /// Total tokens received
    pub total_received: u64,
    /// Number of requests made
    pub request_count: u32,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl UserRequestRecord {
    pub const LEN: usize = 8 + // discriminator
        32 + // user
        8 +  // last_request
        8 +  // total_received
        4 +  // request_count
        1;   // bump
}

/// Task status enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TaskStatus {
    Created,
    InProgress,
    Completed,
    Cancelled,
}

/// Task account structure
#[account]
pub struct Task {
    /// Unique task identifier
    pub task_id: String,
    /// Reward amount in tokens
    pub reward_amount: u64,
    /// Current task status
    pub status: TaskStatus,
    /// Task creator's public key
    pub creator: Pubkey,
    /// Escrow token account holding rewards
    pub escrow_account: Pubkey,
    /// Optional assignee public key
    pub assignee: Option<Pubkey>,
    /// Creation timestamp
    pub created_at: i64,
    /// Last updated timestamp
    pub updated_at: i64,
    /// Pending decrease amount (if any)
    pub pending_decrease_amount: Option<u64>,
    /// Timestamp when decrease was requested
    pub decrease_requested_at: Option<i64>,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Task {
    pub const LEN: usize = 8 + // discriminator
        4 + 50 + // task_id (String with max 50 chars)
        8 + // reward_amount
        1 + 1 + // status (enum + discriminator)
        32 + // creator
        32 + // escrow_account
        1 + 32 + // assignee (Option<Pubkey>)
        8 + // created_at
        8 + // updated_at
        1 + 8 + // pending_decrease_amount (Option<u64>)
        1 + 8 + // decrease_requested_at (Option<i64>)
        1; // bump

    // Time lock period for decreases (6 hours in seconds)
    pub const DECREASE_TIME_LOCK: i64 = 6 * 60 * 60;

    /// Check if task can be modified by the given authority
    pub fn can_modify(&self, authority: &Pubkey) -> bool {
        &self.creator == authority && matches!(self.status, TaskStatus::Created)
    }

    /// Check if task can be completed
    pub fn can_complete(&self) -> bool {
        matches!(self.status, TaskStatus::Created | TaskStatus::InProgress)
    }

    /// Check if task can be cancelled
    pub fn can_cancel(&self, authority: &Pubkey) -> bool {
        &self.creator == authority && !matches!(self.status, TaskStatus::Completed | TaskStatus::Cancelled)
    }

    /// Check if a decrease can be initiated (only for Created status)
    pub fn can_initiate_decrease(&self, authority: &Pubkey) -> bool {
        &self.creator == authority && matches!(self.status, TaskStatus::Created)
    }

    /// Check if a pending decrease can be executed
    pub fn can_execute_decrease(&self, current_time: i64) -> bool {
        if let (Some(_), Some(requested_at)) = (self.pending_decrease_amount, self.decrease_requested_at) {
            current_time >= requested_at + Self::DECREASE_TIME_LOCK
        } else {
            false
        }
    }

    /// Update the task status and timestamp
    pub fn update_status(&mut self, new_status: TaskStatus) {
        self.status = new_status;
        self.updated_at = Clock::get().unwrap().unix_timestamp;
    }

    /// Assign task to a user
    pub fn assign_to(&mut self, assignee: Pubkey) {
        self.assignee = Some(assignee);
        self.update_status(TaskStatus::InProgress);
    }

    /// Request a decrease in reward amount
    pub fn request_decrease(&mut self, new_amount: u64, current_time: i64) {
        self.pending_decrease_amount = Some(new_amount);
        self.decrease_requested_at = Some(current_time);
        self.updated_at = current_time;
    }

    /// Execute a pending decrease
    pub fn execute_decrease(&mut self, current_time: i64) {
        if let Some(new_amount) = self.pending_decrease_amount {
            self.reward_amount = new_amount;
        }
        self.pending_decrease_amount = None;
        self.decrease_requested_at = None;
        self.updated_at = current_time;
    }

    /// Cancel a pending decrease
    pub fn cancel_decrease(&mut self, current_time: i64) {
        self.pending_decrease_amount = None;
        self.decrease_requested_at = None;
        self.updated_at = current_time;
    }
}