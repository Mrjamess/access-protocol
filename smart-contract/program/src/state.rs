use bonfida_utils::pubkey;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::account_info::AccountInfo;
use solana_program::program_error::ProgramError;
use solana_program::pubkey::Pubkey;

use crate::error::MediaError;

// Just a random mint for now
const MEDIA_MINT: Pubkey = pubkey!("EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp");

pub const SECONDS_IN_DAY: u64 = 3600 * 24;

#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone, Copy)]
pub enum Tag {
    Uninitialized,
    StakePool,
    StakeAccount,
    CentralState,
    Deleted,
}
#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct StakePool {
    // Tag
    pub tag: Tag,

    // Total amount staked in the pool
    pub total_staked: u64,

    // Last unix timestamp when rewards were paid to the pool owner
    // through a permissionless crank
    pub last_crank_time: i64,

    // Owner of the stake pool and the rewards_destination token account
    pub owner: [u8; 32],

    // Address to which rewards are sent
    pub rewards_destination: [u8; 32],

    // Stake pool nonce
    pub nonce: u8,

    // Name of the stake pool (used for PDA derivation)
    pub name: String,
}
#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct StakeAccount {
    // Tag
    pub tag: Tag,

    // Owner of the stake account
    pub owner: [u8; 32],

    // Amount staked in the account
    pub stake_amount: u64,
}
#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct CentralState {
    // Tag
    pub tag: Tag,

    // Central state nonce
    pub signer_nonce: u8,

    // Daily inflation in token amount, inflation is paid from
    // the reserve owned by the central state
    pub daily_inflation: u64,

    // Mint of the token being emitted
    pub token_mint: [u8; 32],
}

impl CentralState {
    pub const LEN: usize = 1 + 1 + 8 + 32;

    pub fn new(signer_nonce: u8, daily_inflation: u64, token_mint: [u8; 32]) -> Self {
        Self {
            tag: Tag::CentralState,
            signer_nonce,
            daily_inflation,
            token_mint,
        }
    }

    pub fn create_key(signer_nonce: &u8, program_id: &Pubkey) -> Pubkey {
        let signer_seeds: &[&[u8]] = &[&program_id.to_bytes(), &[*signer_nonce]];
        let key = Pubkey::create_program_address(signer_seeds, program_id).unwrap();
        key
    }

    pub fn save(&self, mut dst: &mut [u8]) {
        self.serialize(&mut dst).unwrap()
    }

    pub fn from_account_info(a: &AccountInfo) -> Result<CentralState, ProgramError> {
        let mut data = &a.data.borrow() as &[u8];
        if data[0] != Tag::CentralState as u8 && data[0] != Tag::Uninitialized as u8 {
            return Err(MediaError::DataTypeMismatch.into());
        }
        let result = CentralState::deserialize(&mut data)?;
        Ok(result)
    }
}
