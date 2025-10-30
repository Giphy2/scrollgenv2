// Phase 3 Contract Addresses - Scroll Sepolia Testnet (Deployed Oct 28, 2024)
export const STAKING_REWARDS_ADDRESS = import.meta.env.VITE_STAKING_REWARDS_ADDRESS || "0xc295A7D3F75017846bF14e5F8a4De8ebB77C2748";
export const LENDING_PROTOCOL_ADDRESS = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS || "0x659243b57dda982070034e1E7e0C0DbE81CE880F";
export const BRIDGE_CONNECTOR_ADDRESS = import.meta.env.VITE_BRIDGE_CONNECTOR_ADDRESS || "0x56C03527EEF00dCFefefEa71a96227bbA20231dd";
export const ZK_VERIFIER_ADDRESS = import.meta.env.VITE_ZK_VERIFIER_ADDRESS || "0xeCCa6A5F020FA33fe18367C412981BF75036b578";

// Lock duration options (in seconds)
export const LOCK_DURATIONS = {
  FLEXIBLE: 0,
  DAYS_30: 30 * 24 * 60 * 60,
  DAYS_90: 90 * 24 * 60 * 60,
  DAYS_180: 180 * 24 * 60 * 60,
  DAYS_365: 365 * 24 * 60 * 60,
};

// Reward multipliers
export const MULTIPLIERS = {
  [LOCK_DURATIONS.FLEXIBLE]: 1.0,
  [LOCK_DURATIONS.DAYS_30]: 1.5,
  [LOCK_DURATIONS.DAYS_90]: 2.0,
  [LOCK_DURATIONS.DAYS_180]: 3.0,
  [LOCK_DURATIONS.DAYS_365]: 5.0,
};

// Lending parameters
export const LENDING_PARAMS = {
  LTV_RATIO: 66,
  LIQUIDATION_THRESHOLD: 75,
  LIQUIDATION_PENALTY: 10,
  MIN_HEALTH_FACTOR: 1.0,
};

// Bridge parameters
export const BRIDGE_PARAMS = {
  WITHDRAWAL_DELAY: 7 * 24 * 60 * 60, // 7 days in seconds
  DEPOSIT_TIME_ESTIMATE: 15 * 60, // 15 minutes
  SCROLL_MESSENGER: "0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A",
};

// ABIs
export const STAKING_REWARDS_ABI = [
  "function stake(uint256 amount, uint256 lockDuration, bool autoCompound) external",
  "function unstake(uint256 stakeIndex) external",
  "function claimRewards() external",
  "function compound(uint256 stakeIndex) external",
  "function getUserStakes(address user) external view returns (tuple(uint256 amount, uint256 startTime, uint256 lockDuration, uint256 rewardDebt, bool autoCompound, uint8 multiplier)[])",
  "function earned(address user) external view returns (uint256)",
  "function totalStaked() external view returns (uint256)",
  "function rewardRate() external view returns (uint256)",
  "function getUserTotalStaked(address user) external view returns (uint256)",
];

export const LENDING_PROTOCOL_ABI = [
  "function supply(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function borrow(address asset, uint256 amount) external",
  "function repay(uint256 borrowIndex, uint256 amount) external",
  "function liquidate(address user, uint256 borrowIndex) external",
  "function getUserBorrows(address user) external view returns (tuple(uint256 collateral, uint256 borrowed, address asset, uint256 timestamp, uint256 interestAccrued, uint256 lastUpdateTime)[])",
  "function supplies(address user) external view returns (tuple(uint256 amount, uint256 timestamp, uint256 interestEarned, uint256 lastUpdateTime))",
  "function calculateHealthFactor(address user, uint256 borrowIndex) external view returns (uint256)",
  "function utilizationRate() external view returns (uint256)",
  "function supplyAPY() external view returns (uint256)",
  "function borrowAPY() external view returns (uint256)",
  "function totalSupplied() external view returns (uint256)",
];

export const BRIDGE_CONNECTOR_ABI = [
  "function initiateDeposit(uint256 amount, address token, bytes32 l1TxHash) external payable",
  "function initiateWithdrawal(uint256 amount, address token, bytes32 l2TxHash) external payable",
  "function claimWithdrawal(bytes32 txHash) external",
  "function getTransaction(bytes32 txHash) external view returns (tuple(address user, uint256 amount, address token, uint256 timestamp, bytes32 l1TxHash, bytes32 l2TxHash, uint8 direction, uint8 status, uint256 claimableAt))",
  "function getUserTransactions(address user) external view returns (bytes32[])",
  "function getTransactionStatus(bytes32 txHash) external view returns (uint8)",
  "function isClaimable(bytes32 txHash) external view returns (bool)",
  "function getTimeUntilClaimable(bytes32 txHash) external view returns (uint256)",
];

export const ZK_VERIFIER_ABI = [
  "function verifyStakeProof(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicInputs, bytes32 nullifier) external returns (bool)",
  "function verifyNFTOwnership(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicInputs, bytes32 nullifier) external returns (bool)",
  "function verifyVoteProof(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicInputs, bytes32 nullifier) external returns (bool)",
  "function isNullifierUsed(bytes32 nullifier) external view returns (bool)",
  "function getUserProofCount(address user) external view returns (uint256)",
];

// Bridge status enum
export const BRIDGE_STATUS = {
  0: "Pending",
  1: "Confirmed",
  2: "Batched",
  3: "Finalized",
  4: "Ready to Claim",
  5: "Completed",
  6: "Failed",
};

// Bridge direction enum
export const BRIDGE_DIRECTION = {
  0: "Deposit (L1 → L2)",
  1: "Withdrawal (L2 → L1)",
};

// Helper functions
export const formatLockDuration = (seconds) => {
  if (seconds === 0) return "Flexible";
  const days = seconds / (24 * 60 * 60);
  return `${days} days`;
};

export const formatMultiplier = (multiplier) => {
  return `${(multiplier / 10).toFixed(1)}x`;
};

export const calculateAPY = (rewardRate, totalStaked, multiplier = 10) => {
  if (totalStaked === 0) return 0;
  const baseAPY = (rewardRate * 365 * 24 * 60 * 60 * 100) / totalStaked;
  return (baseAPY * multiplier) / 10;
};
