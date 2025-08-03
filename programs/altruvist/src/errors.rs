use anchor_lang::prelude::*;

#[error_code]
pub enum AltruistError {
    #[msg("Insufficient faucet balance")]
    InsufficientFaucetBalance,
    
    #[msg("Rate limit exceeded. Please wait before requesting again")]
    RateLimitExceeded,
    
    #[msg("Request amount exceeds the maximum allowed")]
    RequestAmountTooHigh,
    
    #[msg("Task not found")]
    TaskNotFound,
    
    #[msg("Unauthorized: Only task creator can perform this action")]
    UnauthorizedTaskCreator,
    
    #[msg("Invalid task status for this operation")]
    InvalidTaskStatus,
    
    #[msg("Task already completed")]
    TaskAlreadyCompleted,
    
    #[msg("Task already cancelled")]
    TaskAlreadyCancelled,
    
    #[msg("Cannot complete task: no assignee")]
    NoAssignee,
    
    #[msg("Insufficient escrow balance")]
    InsufficientEscrowBalance,
    
    #[msg("Invalid reward amount")]
    InvalidRewardAmount,
    
    #[msg("Task ID too long (max 50 characters)")]
    TaskIdTooLong,
    
    #[msg("Description too long (max 500 characters)")]
    DescriptionTooLong,
    
    #[msg("Invalid mint authority")]
    InvalidMintAuthority,
    
    #[msg("Token account ownership mismatch")]
    TokenAccountOwnershipMismatch,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Cooldown period not met")]
    CooldownNotMet,
    
    #[msg("Cannot decrease reward: task status must be Created")]
    CannotDecreaseRewardInvalidStatus,
    
    #[msg("Time lock period not met for reward decrease")]
    DecreaseTimeLockNotMet,
    
    #[msg("No pending decrease found")]
    NoPendingDecrease,
    
    #[msg("Cannot increase reward above pending decrease amount")]
    InvalidIncreaseWithPendingDecrease,
    
    #[msg("Cannot delete faucet: token account must be empty")]
    FaucetNotEmpty,

    #[msg("Unauthorized assignee")]
    UnauthorizedAssignee,

    #[msg("Invalid task ID format")]
    InvalidTaskIdFormat,

    #[msg("Insufficient balance")]
    InsufficientBalance,

    #[msg("Invalid creator")]
    InvalidCreator,

    #[msg("Cannot assign task to creator")]
    CannotAssignToCreator,

    #[msg("Too many assignees (max 10 allowed)")]
    TooManyAssignees,

    #[msg("No assignees provided")]
    NoAssignees,

    #[msg("Duplicate assignee detected")]
    DuplicateAssignee,

    #[msg("Assignee has already claimed their reward")]
    AlreadyClaimed,
}