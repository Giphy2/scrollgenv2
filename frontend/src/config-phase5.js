// Phase 5 Contract Addresses - ScrollGen v2.0 - Scroll Sepolia Testnet
export const AI_YIELD_MANAGER_ADDRESS = import.meta.env.VITE_AI_YIELD_MANAGER_ADDRESS || "";
export const RESTAKE_HUB_ADDRESS = import.meta.env.VITE_RESTAKE_HUB_ADDRESS || "";
export const ZKID_VERIFIER_ADDRESS = import.meta.env.VITE_ZKID_VERIFIER_ADDRESS || "";
export const QUEST_SYSTEM_ADDRESS = import.meta.env.VITE_QUEST_SYSTEM_ADDRESS || "";

export const AI_YIELD_MANAGER_ABI = [
  "function registerPool(address poolAddress, uint256 initialAPY, uint256 initialLiquidity)",
  "function updatePoolMetrics(address poolAddress, uint256 newAPY, uint256 newLiquidity, uint256 newVolatility)",
  "function setUserStrategy(uint256 targetAPY, uint256 maxVolatility, uint256 minLiquidity, bool autoRebalance)",
  "function proposeRebalance(address user, address fromPool, address toPool, uint256 amount, uint256 expectedAPY, string aiReasoning) returns (uint256)",
  "function executeRebalance(uint256 proposalId)",
  "function getPoolMetrics(address poolAddress) view returns (uint256 apy, uint256 liquidity, uint256 volatility, uint256 lastUpdate, bool active)",
  "function getUserStrategy(address user) view returns (uint256 targetAPY, uint256 maxVolatility, uint256 minLiquidity, bool autoRebalance)",
  "function getProposal(uint256 proposalId) view returns (address fromPool, address toPool, uint256 amount, uint256 expectedAPY, bool executed, string reasoning)",
  "function getActivePools() view returns (address[])",
  "event YieldUpdated(address indexed pool, uint256 newAPY, uint256 liquidity, uint256 volatility)",
  "event RiskAlert(address indexed user, address indexed pool, string reason)",
  "event RebalanceTriggered(uint256 indexed proposalId, address fromPool, address toPool, uint256 amount)",
  "event AIVerdictReceived(uint256 indexed proposalId, string reasoning)",
];

export const RESTAKE_HUB_ABI = [
  "function registerOperator(string name, uint256 commission, uint256 maxCapacity)",
  "function updateOperator(uint256 newCommission, uint256 newMaxCapacity, bool active)",
  "function restake(address operator, uint256 amount, bool useSGT)",
  "function unrestake(uint256 restakingIndex)",
  "function claimRewards(uint256 restakingIndex)",
  "function getOperatorInfo(address operator) view returns (string name, uint256 commission, uint256 totalRestaked, uint256 maxCapacity, uint256 reputationScore, uint256 uptime, bool active)",
  "function getActiveRestaking(address user, uint256 index) view returns (address operator, uint256 amount, uint256 startTime, uint256 pendingRewards, bool active)",
  "function getUserRestakings(address user) view returns (tuple(address user, address operator, uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 rewardsAccrued, bool active)[])",
  "function getActiveOperators() view returns (address[])",
  "function totalRestaked() view returns (uint256)",
  "event Restaked(address indexed user, address indexed operator, uint256 amount, uint256 timestamp)",
  "event Unrestaked(address indexed user, address indexed operator, uint256 amount, uint256 timestamp)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
  "event YieldDistributed(address indexed operator, uint256 totalAmount, uint256 timestamp)",
];

export const ZKID_VERIFIER_ABI = [
  "function verifyProof(bytes32 proofHash, uint256 verificationLevel, bytes proof) returns (bool)",
  "function mintSP(address user, uint256 amount, string reason)",
  "function recordActivity(address user, string activityType, uint256 spReward)",
  "function claimActivity(uint256 activityIndex)",
  "function updateReputation(address user, uint256 consistencyScore, uint256 contributionScore, uint256 governanceScore, uint256 trustScore)",
  "function getScore(address user) view returns (uint256)",
  "function getIdentity(address user) view returns (uint256 scrollPower, uint256 verificationLevel, uint256 lastUpdate, bool verified)",
  "function getReputation(address user) view returns (uint256 totalActivities, uint256 consistencyScore, uint256 contributionScore, uint256 governanceScore, uint256 trustScore)",
  "function getUserActivities(address user) view returns (tuple(string activityType, uint256 spReward, uint256 timestamp, bool claimed)[])",
  "function getPendingActivities(address user) view returns (uint256 count, uint256 totalSP)",
  "event IdentityVerified(address indexed user, uint256 verificationLevel, bytes32 proofHash)",
  "event ScrollPowerMinted(address indexed user, uint256 amount, uint256 totalSP)",
  "event ActivityRecorded(address indexed user, string activityType, uint256 spReward)",
  "event ReputationUpdated(address indexed user, uint256 newScore, string scoreType)",
];

export const QUEST_SYSTEM_ABI = [
  "function createQuest(string name, string description, uint256 requiredProgress, uint256 rewardType, uint256 rewardAmount) returns (uint256)",
  "function startQuest(uint256 questId)",
  "function completeQuest(uint256 questId)",
  "function claimBadge(uint256 questId)",
  "function getQuest(uint256 questId) view returns (string name, string description, uint256 requiredProgress, uint256 rewardAmount, bool active, uint256 participants, uint256 completions)",
  "function getUserQuestProgress(address user, uint256 questId) view returns (uint256 progress, uint256 requiredProgress, bool completed, bool claimed)",
  "function getUserCompletedQuests(address user) view returns (uint256[])",
  "function getUserBadges(address user) view returns (uint256[])",
  "function getBadge(uint256 badgeId) view returns (string name, uint256 tier, uint256 experience, uint256 level, uint256 mintTime, string metadataURI)",
  "function getActiveQuests() view returns (uint256[])",
  "function getUserStats(address user) view returns (uint256 completedQuests, uint256 totalBadges, uint256 highestTier, uint256 totalExperience)",
  "event QuestCreated(uint256 indexed questId, string name, uint256 requiredProgress)",
  "event QuestCompleted(address indexed user, uint256 indexed questId, uint256 timestamp)",
  "event BadgeClaimed(address indexed user, uint256 indexed badgeId, uint256 tier)",
  "event BadgeUpgraded(uint256 indexed badgeId, uint256 newLevel, uint256 newExperience)",
];

export const VERIFICATION_LEVELS = {
  1: { name: "Basic", sp: 100, color: "#808080" },
  2: { name: "Intermediate", sp: 500, color: "#1E90FF" },
  3: { name: "Advanced", sp: 1000, color: "#9370DB" },
  4: { name: "Expert", sp: 2500, color: "#FFD700" },
  5: { name: "Master", sp: 5000, color: "#FF1493" },
};

export const BADGE_TIERS = {
  1: { name: "Common", color: "#9E9E9E", glow: "#B0BEC5" },
  2: { name: "Uncommon", color: "#4CAF50", glow: "#81C784" },
  3: { name: "Rare", color: "#2196F3", glow: "#64B5F6" },
  4: { name: "Epic", color: "#9C27B0", glow: "#BA68C8" },
  5: { name: "Legendary", color: "#FF9800", glow: "#FFB74D" },
};

export const QUEST_TYPES = {
  STAKE: "Stake SGT tokens",
  TRADE: "Trade on marketplace",
  GOVERN: "Participate in governance",
  BRIDGE: "Use bridge functionality",
  LEND: "Provide liquidity",
  SOCIAL: "Social engagement",
};
