import {
  changeInflationInstruction,
  changePoolMinimumInstruction,
  claimBondRewardsInstruction,
  claimBondInstruction,
  claimPoolRewardsInstruction,
  claimRewardsInstruction,
  closeStakeAccountInstruction,
  closeStakePoolInstruction,
  crankInstruction,
  createBondInstruction,
  createCentralStateInstruction,
  createStakeAccountInstruction,
  createStakePoolInstruction,
  signBondInstruction,
  stakeInstruction,
  unlockBondTokensInstruction,
  unstakeInstruction,
  adminMintInstruction,
} from "./raw_instructions";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { CentralState, StakePool, BondAccount, StakeAccount } from "./state";
import BN from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * This function can be used to update the inflation schedule of the central state
 * @param connection The Solana RPC connection
 * @param newInflation The new inflation amount (in raw token amounts per day)
 * @param programId The ACCESS program ID
 * @returns
 */
export const changeInflation = async (
  connection: Connection,
  newInflation: number,
  programId: PublicKey
) => {
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);

  const ix = new changeInflationInstruction({
    dailyInflation: new BN(newInflation),
  }).getInstruction(programId, centralKey, centralState.authority);

  return ix;
};

/**
 * This function can be used to update the minimum amount of tokens that give access to the content
 * @param connection The Solana RPC connection
 * @param stakePoolKey The key of the stake pool
 * @param newMinimum The new minimum amount of tokens to stake to get access
 * @param programId The ACCESS program ID
 * @returns
 */
export const changePoolMinimum = async (
  connection: Connection,
  stakePoolKey: PublicKey,
  newMinimum: number,
  programId: PublicKey
) => {
  const stakePool = await StakePool.retrieve(connection, stakePoolKey);

  const ix = new changePoolMinimumInstruction({
    newMinimum: new BN(newMinimum),
  }).getInstruction(programId, stakePoolKey, stakePool.owner);

  return ix;
};

/**
 * This function can be used by a bond owner to claim his staking rewards
 * @param connection The Solana RPC connection
 * @param bondAccount The key of the bond account
 * @param rewardsDestination The destination token account for the rewards being claimed
 * @param programId The ACCESS program ID
 * @returns
 */
export const claimBondRewards = async (
  connection: Connection,
  bondAccount: PublicKey,
  rewardsDestination: PublicKey,
  programId: PublicKey
) => {
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);

  const bond = await BondAccount.retrieve(connection, bondAccount);

  const ix = new claimBondRewardsInstruction().getInstruction(
    programId,
    bond.stakePool,
    bondAccount,
    bond.owner,
    rewardsDestination,
    centralKey,
    centralState.tokenMint,
    TOKEN_PROGRAM_ID
  );

  return ix;
};

/**
 * This function can be used by a bond buyer to claim his bond
 * @param connection The Solana RPC connection
 * @param bondAccount The key of the bond account
 * @param buyer The key of the bond buyer
 * @param quoteTokenSource The token account used to purchase the bond
 * @param programId The ACCESS program ID
 * @returns
 */
export const claimBond = async (
  connection: Connection,
  bondAccount: PublicKey,
  buyer: PublicKey,
  quoteTokenSource: PublicKey,
  programId: PublicKey
) => {
  const bond = await BondAccount.retrieve(connection, bondAccount);

  const ix = new claimBondInstruction().getInstruction(
    programId,
    bondAccount,
    buyer,
    quoteTokenSource,
    bond.sellerTokenAccount,
    TOKEN_PROGRAM_ID
  );

  return ix;
};

/**
 * This function can be used by a pool owner to claim his staking rewards
 * @param connection The Solana RPC connection
 * @param stakePoolAccount The key of the stake pool
 * @param rewardsDestination The destination token account for the rewards being claimed
 * @param programId The ACCESS program ID
 */
export const claimPoolRewards = async (
  connection: Connection,
  stakePoolAccount: PublicKey,
  rewardsDestination: PublicKey,
  programId: PublicKey
) => {
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);
  const stakePool = await StakePool.retrieve(connection, stakePoolAccount);

  const ix = new claimPoolRewardsInstruction().getInstruction(
    programId,
    stakePoolAccount,
    stakePool.owner,
    rewardsDestination,
    centralKey,
    centralState.tokenMint,
    TOKEN_PROGRAM_ID
  );
};

/**
 * This function can be used by a staker to claim his staking rewards
 * @param connection The Solana RPC connection
 * @param stakeAccount The key of the stake account
 * @param rewardsDestination The destination token account for the rewards being claimed
 * @param programId The ACCESS program ID
 * @returns
 */
export const claimRewards = async (
  connection: Connection,
  stakeAccount: PublicKey,
  rewardsDestination: PublicKey,
  programId: PublicKey
) => {
  const stake = await StakeAccount.retrieve(connection, stakeAccount);
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);

  const ix = new claimRewardsInstruction().getInstruction(
    programId,
    stake.stakePool,
    stakeAccount,
    stake.owner,
    rewardsDestination,
    centralKey,
    centralState.tokenMint,
    TOKEN_PROGRAM_ID
  );

  return ix;
};

/**
 * This function can be used by a staker to close his stake account and collect its rent
 * @param connection The Solana RPC connection
 * @param stakeAccount The key of the stake account
 * @param programId The ACCESS program ID
 * @returns
 */
export const closeStakeAccount = async (
  connection: Connection,
  stakeAccount: PublicKey,
  programId: PublicKey
) => {
  const stake = await StakeAccount.retrieve(connection, stakeAccount);

  const ix = new closeStakeAccountInstruction().getInstruction(
    programId,
    stakeAccount,
    stake.owner
  );

  return ix;
};

/**
 * This function can be used by a stake pool owner to close the pool and collect its rent
 * @param connection The Solana RPC connection
 * @param stakePoolAccount The key of the stake pool
 * @param programId The ACCESS program ID
 * @returns
 */
export const closeStakePool = async (
  connection: Connection,
  stakePoolAccount: PublicKey,
  programId: PublicKey
) => {
  const stakePool = await StakePool.retrieve(connection, stakePoolAccount);

  const ix = new closeStakePoolInstruction().getInstruction(
    programId,
    stakePoolAccount,
    stakePool.owner
  );

  return ix;
};

/**
 * This function can be used to update the balances of the stake pool
 * @param stakePoolAccount The key fo the stake pool to crank
 * @param programId The ACCESS program ID
 * @returns
 */
export const crank = async (
  stakePoolAccount: PublicKey,
  programId: PublicKey
) => {
  const [centralKey] = await CentralState.getKey(programId);
  const ix = new crankInstruction().getInstruction(
    programId,
    stakePoolAccount,
    centralKey
  );

  return ix;
};

/**
 * This function can be used to issue ACCESS locked tokens (bonds)
 * @param seller The initial bond seller
 * @param buyer The bond buyer
 * @param totalAmountSold The total amount of ACCESS tokens being sold
 * @param totalQuoteAmount The total amount of quote tokens used to buy the bond
 * @param quoteMint The mint of the token used to buy the bond
 * @param sellerTokenAccount The seller token account (used to collect proceeds of the sale)
 * @param unlockStartDate The unix timestamp (in s) at which the tokens start unlock
 * @param unlockPeriod The time interval at which the tokens unlock
 * @param unlockAmount The amount that unlocks at each period
 * @param lastUnlockTime The unix timestamp at which the unlock stops
 * @param stakePool The stake pool key
 * @param sellerIndex The seller index in the array of authorized sellers
 * @param programId The ACCESS program ID
 * @returns
 */
export const createBond = async (
  seller: PublicKey,
  buyer: PublicKey,
  totalAmountSold: number,
  totalQuoteAmount: number,
  quoteMint: PublicKey,
  sellerTokenAccount: PublicKey,
  unlockStartDate: number,
  unlockPeriod: number,
  unlockAmount: number,
  lastUnlockTime: number,
  stakePool: PublicKey,
  sellerIndex: number,
  programId: PublicKey
) => {
  const [bondAccount] = await BondAccount.getKey(
    programId,
    buyer,
    totalAmountSold
  );

  const ix = new createBondInstruction({
    buyer: buyer.toBuffer(),
    totalAmountSold: new BN(totalAmountSold),
    totalQuoteAmount: new BN(totalQuoteAmount),
    quoteMint: quoteMint.toBuffer(),
    sellerTokenAccount: sellerTokenAccount.toBuffer(),
    unlockStartDate: new BN(unlockStartDate),
    unlockPeriod: new BN(unlockPeriod),
    unlockAmount: new BN(unlockAmount),
    lastUnlockTime: new BN(lastUnlockTime),
    sellerIndex: new BN(sellerIndex),
  }).getInstruction(
    programId,
    seller,
    bondAccount,
    stakePool,
    SystemProgram.programId,
    seller
  );

  return ix;
};

/**
 * This function can be used to create the central when deploying the program
 * @param dailyInflation The daily inflation (i.e raw token amounts being emitted per day)
 * @param authority The central state authority (only key that will be able to upgrade the central state)
 * @param feePayer The fee payer of the tx
 * @param mint The ACCESS token mint
 * @param programId The ACCESS program ID
 * @returns
 */
export const createCentralState = async (
  dailyInflation: number,
  authority: PublicKey,
  feePayer: PublicKey,
  mint: PublicKey,
  programId: PublicKey
) => {
  const [centralKey] = await CentralState.getKey(programId);

  const ix = new createCentralStateInstruction({
    dailyInflation: new BN(dailyInflation),
    authority: authority.toBuffer(),
  }).getInstruction(
    programId,
    centralKey,
    SystemProgram.programId,
    feePayer,
    mint
  );

  return ix;
};

export const createStakeAccount = async (
  stakePool: PublicKey,
  owner: PublicKey,
  feePayer: PublicKey,
  programId: PublicKey
) => {
  const [stakeAccount, nonce] = await StakeAccount.getKey(
    programId,
    owner,
    stakePool
  );

  const ix = new createStakeAccountInstruction({
    nonce,
    owner: owner.toBuffer(),
  }).getInstruction(
    programId,
    stakeAccount,
    SystemProgram.programId,
    stakePool,
    feePayer
  );

  return ix;
};

export const createStakePool = async (
  connection: Connection,
  name: string,
  owner: PublicKey,
  destination: PublicKey,
  minimumStakeAmount: number,
  feePayer: PublicKey,
  programId: PublicKey
) => {
  const [stakePool, nonce] = await StakePool.getKey(
    programId,
    owner,
    destination
  );
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);

  const vault = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    centralState.tokenMint,
    stakePool
  );

  const createVaultIx = Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    centralState.tokenMint,
    vault,
    stakePool,
    feePayer
  );

  const ix = new createStakePoolInstruction({
    nonce,
    name,
    owner: owner.toBuffer(),
    minimumStakeAmount: new BN(minimumStakeAmount),
    destination: destination.toBuffer(),
  }).getInstruction(
    programId,
    stakePool,
    SystemProgram.programId,
    feePayer,
    vault
  );

  return [createVaultIx, ix];
};

export const signBond = async (
  sellerIndex: number,
  seller: PublicKey,
  bondAccount: PublicKey,
  programId: PublicKey
) => {
  const ix = new signBondInstruction({
    sellerIndex: new BN(sellerIndex),
  }).getInstruction(programId, seller, bondAccount);

  return ix;
};

export const stake = async (
  connection: Connection,
  stakeAccount: PublicKey,
  sourceToken: PublicKey,
  amount: number,
  programId: PublicKey
) => {
  const stake = await StakeAccount.retrieve(connection, stakeAccount);
  const stakePool = await StakePool.retrieve(connection, stake.stakePool);

  const ix = new stakeInstruction({ amount: new BN(amount) }).getInstruction(
    programId,
    stakeAccount,
    stake.stakePool,
    stake.owner,
    sourceToken,
    TOKEN_PROGRAM_ID,
    stakePool.vault
  );

  return ix;
};

export const unlockBondTokens = async (
  connection: Connection,
  bondAccount: PublicKey,
  destinationToken: PublicKey,
  programId: PublicKey
) => {
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);
  const bond = await BondAccount.retrieve(connection, bondAccount);

  const ix = new unlockBondTokensInstruction().getInstruction(
    programId,
    bondAccount,
    bond.owner,
    centralState.tokenMint,
    destinationToken,
    centralKey,
    TOKEN_PROGRAM_ID
  );

  return ix;
};

export const unstake = async (
  connection: Connection,
  stakeAccount: PublicKey,
  destinationToken: PublicKey,
  amount: number,
  programId: PublicKey
) => {
  const stake = await StakeAccount.retrieve(connection, stakeAccount);
  const stakePool = await StakePool.retrieve(connection, stake.stakePool);

  const ix = new unstakeInstruction({
    amount: new BN(amount),
  }).getInstruction(
    programId,
    stakeAccount,
    stake.stakePool,
    stake.owner,
    destinationToken,
    TOKEN_PROGRAM_ID,
    stakePool.vault
  );

  return ix;
};

export const adminMint = async (
  connection: Connection,
  amount: number,
  destinationToken: PublicKey,
  programId: PublicKey
) => {
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);

  const ix = new adminMintInstruction({
    amount: new BN(amount),
  }).getInstruction(
    programId,
    centralState.authority,
    centralState.tokenMint,
    destinationToken,
    centralKey,
    TOKEN_PROGRAM_ID
  );

  return ix;
};