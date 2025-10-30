// Phase 2 Contract Addresses - Scroll Sepolia Testnet
export const GENESIS_BADGE_ADDRESS = import.meta.env.VITE_GENESIS_BADGE_ADDRESS || "0xB019337963991C59f6245A1d739fF190a9842E99";
export const NFT_STAKING_ADDRESS = import.meta.env.VITE_NFT_STAKING_ADDRESS || "0xC4106D4545e07503944c2eEB20C212d0c2F378Eb";
export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || "0x2303db3293C97D21ae446E766f2b81DA09b42052";

// Phase 2.1 - Governance (To be deployed)
export const VOTES_TOKEN_ADDRESS = import.meta.env.VITE_VOTES_TOKEN_ADDRESS || "";
export const GOVERNOR_ADDRESS = import.meta.env.VITE_GOVERNOR_ADDRESS || "";
export const TIMELOCK_ADDRESS = import.meta.env.VITE_TIMELOCK_ADDRESS || "";

export const GENESIS_BADGE_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tokensOfOwner(address owner) view returns (uint256[])",
  "function getTier(uint256 tokenId) view returns (uint8)",
  "function getTierName(uint8 tier) pure returns (string)",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

export const NFT_STAKING_ABI = [
  "function stake(uint256 amount)",
  "function unstake()",
  "function claimBadge() returns (uint256)",
  "function getStakeInfo(address user) view returns (uint256 amount, uint256 startTime, uint256 duration, uint8 tier, bool claimed)",
  "function canClaimBadge(address user) view returns (bool eligible, uint8 tier)",
  "function getEligibleTier(address user) view returns (uint8)",
  "function getTierRequirements(uint8 tier) view returns (uint256 minAmount, uint256 minDuration)",
  "function totalStaked() view returns (uint256)",
  "event Staked(address indexed user, uint256 amount, uint256 timestamp)",
  "event Unstaked(address indexed user, uint256 amount, uint256 timestamp)",
  "event BadgeClaimed(address indexed user, uint256 tokenId, uint8 tier)",
];

export const MARKETPLACE_ABI = [
  "function listNFT(uint256 tokenId, uint256 price)",
  "function buyNFT(uint256 tokenId)",
  "function cancelListing(uint256 tokenId)",
  "function updatePrice(uint256 tokenId, uint256 newPrice)",
  "function getListing(uint256 tokenId) view returns (address seller, uint256 price, bool active)",
  "function getSellerListings(address seller) view returns (uint256[])",
  "function getActiveListings(uint256 offset, uint256 limit) view returns (uint256[] tokenIds, address[] sellers, uint256[] prices)",
  "function getActiveListingsCount() view returns (uint256)",
  "function marketplaceFee() view returns (uint256)",
  "function calculateFee(uint256 price) view returns (uint256)",
  "event Listed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 timestamp)",
  "event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 fee, uint256 timestamp)",
  "event Cancelled(uint256 indexed tokenId, address indexed seller, uint256 timestamp)",
];

export const GOVERNOR_ABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function quorum(uint256 blockNumber) view returns (uint256)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
];

export const VOTES_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function delegate(address delegatee)",
  "function delegates(address account) view returns (address)",
  "function getVotes(address account) view returns (uint256)",
  "function getPastVotes(address account, uint256 blockNumber) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
];

export const TIER_INFO = {
  0: { name: "Bronze", color: "#CD7F32", minAmount: 100, minDays: 1 },
  1: { name: "Silver", color: "#C0C0C0", minAmount: 500, minDays: 7 },
  2: { name: "Gold", color: "#FFD700", minAmount: 1000, minDays: 30 },
  3: { name: "Platinum", color: "#E5E4E2", minAmount: 5000, minDays: 90 },
  4: { name: "Diamond", color: "#B9F2FF", minAmount: 10000, minDays: 180 },
};

export const PROPOSAL_STATES = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed",
};
