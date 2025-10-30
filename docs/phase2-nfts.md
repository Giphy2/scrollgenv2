# Genesis Badge NFTs

## Overview

Genesis Badges are the first NFT collection in the ScrollGen ecosystem. These ERC-721 tokens are earned by staking SGT tokens and represent commitment to the protocol.

## Badge Tiers

Genesis Badges come in 5 tiers, each with increasing requirements:

| Tier | Color | Min Stake | Min Duration | Supply Limit |
|------|-------|-----------|--------------|--------------|
| Bronze | #CD7F32 | 100 SGT | 1 day | Unlimited (max 10,000 total) |
| Silver | #C0C0C0 | 500 SGT | 7 days | Unlimited (max 10,000 total) |
| Gold | #FFD700 | 1,000 SGT | 30 days | Unlimited (max 10,000 total) |
| Platinum | #E5E4E2 | 5,000 SGT | 90 days | Unlimited (max 10,000 total) |
| Diamond | #B9F2FF | 10,000 SGT | 180 days | Unlimited (max 10,000 total) |

## How to Earn Badges

### 1. Stake SGT Tokens

```javascript
// Approve staking contract
await sgtToken.approve(stakingAddress, amount);

// Stake tokens
await stakingContract.stake(amount);
```

### 2. Wait for Eligibility

Your stake must meet both requirements:
- **Amount**: Sufficient SGT staked
- **Duration**: Enough time has passed

### 3. Claim Your Badge

```javascript
// Check eligibility
const { eligible, tier } = await stakingContract.canClaimBadge(account);

if (eligible) {
  // Claim badge NFT
  const tx = await stakingContract.claimBadge();
  await tx.wait();
}
```

## Badge Properties

### On-Chain Data
- **Token ID**: Unique identifier (0-9999)
- **Tier**: Badge level (0-4)
- **Owner**: Current holder address
- **Minted Timestamp**: When badge was created

### Metadata (IPFS)
Each badge has associated metadata:

```json
{
  "name": "ScrollGen Genesis Badge #123",
  "description": "A Gold tier Genesis Badge earned by staking 1,000 SGT for 30 days",
  "image": "ipfs://Qm.../gold-badge.png",
  "attributes": [
    {
      "trait_type": "Tier",
      "value": "Gold"
    },
    {
      "trait_type": "Stake Requirement",
      "value": "1000 SGT"
    },
    {
      "trait_type": "Duration Requirement",
      "value": "30 days"
    },
    {
      "trait_type": "Minted Date",
      "value": "2024-10-26"
    }
  ]
}
```

## Contract Functions

### View Functions

#### `balanceOf(address owner)`
Returns number of badges owned by an address.

#### `ownerOf(uint256 tokenId)`
Returns the owner of a specific badge.

#### `tokenURI(uint256 tokenId)`
Returns the metadata URI for a badge.

#### `getTier(uint256 tokenId)`
Returns the tier level (0-4) of a badge.

#### `tokensOfOwner(address owner)`
Returns array of all token IDs owned by an address.

#### `totalSupply()`
Returns total number of badges minted.

### Owner Functions

#### `setMinter(address minter)`
Set authorized minter address (staking contract).

#### `setBaseURI(string baseURI)`
Update base URI for metadata.

#### `batchMint(address[] recipients, uint8[] tiers, string[] uris)`
Mint multiple badges at once (for airdrops).

## Staking Contract

### Stake SGT

```solidity
function stake(uint256 amount) external
```

Stakes SGT tokens to earn a badge. User must have previously approved the staking contract.

**Requirements:**
- Amount > 0
- Not already staking
- SGT transfer succeeds

### Unstake SGT

```solidity
function unstake() external
```

Withdraws all staked SGT tokens.

**Note:** Can unstake anytime, even after claiming badge.

### Claim Badge

```solidity
function claimBadge() external returns (uint256)
```

Mints a Genesis Badge NFT based on stake duration and amount.

**Requirements:**
- Active stake
- Meets tier requirements
- Badge not already claimed

**Returns:** Token ID of minted badge

### Check Eligibility

```solidity
function canClaimBadge(address user) external view
  returns (bool eligible, uint8 tier)
```

Checks if user can claim a badge and which tier.

### Get Stake Info

```solidity
function getStakeInfo(address user) external view
  returns (
    uint256 amount,
    uint256 startTime,
    uint256 duration,
    uint8 tier,
    bool claimed
  )
```

Returns complete staking information for a user.

## Usage Examples

### Frontend Integration

```javascript
import { ethers } from 'ethers';

// Load contracts
const stakingContract = new ethers.Contract(
  STAKING_ADDRESS,
  STAKING_ABI,
  signer
);

const badgeContract = new ethers.Contract(
  BADGE_ADDRESS,
  BADGE_ABI,
  signer
);

// Check user's badges
const balance = await badgeContract.balanceOf(account);
const tokens = await badgeContract.tokensOfOwner(account);

// Display badges
for (const tokenId of tokens) {
  const tier = await badgeContract.getTier(tokenId);
  const uri = await badgeContract.tokenURI(tokenId);

  console.log(`Badge #${tokenId}: Tier ${tier}, URI: ${uri}`);
}

// Stake for badge
const stakeAmount = ethers.parseUnits("1000", 18); // 1000 SGT
await sgtToken.approve(STAKING_ADDRESS, stakeAmount);
await stakingContract.stake(stakeAmount);

// Check eligibility later
const { eligible, tier } = await stakingContract.canClaimBadge(account);

if (eligible) {
  console.log(`Eligible for tier ${tier}!`);
  await stakingContract.claimBadge();
}
```

## Marketplace Integration

Badges can be traded on the NFTMarketplace contract. See [Marketplace Documentation](./phase2-marketplace.md).

## Future Enhancements

### Phase 2.1
- Evolving badges (upgrade tiers)
- Special edition badges
- Badge staking for rewards

### Phase 2.2
- Badge utility in governance
- Tier-based access to features
- Badge customization

### Phase 3
- Cross-chain badge bridging
- Badge lending/renting
- Dynamic metadata updates

## Security

### Audits
- Internal security review: ✅ Complete
- External audit: Planned for Phase 3

### Best Practices
- OpenZeppelin ERC-721 base
- Reentrancy protection
- Access control on minting
- No admin freeze functions

## Contract Addresses

### Scroll Sepolia Testnet
- **GenesisBadge**: `[Deploy and update]`
- **NFTStaking**: `[Deploy and update]`

### Scroll Mainnet
- **GenesisBadge**: `[TBD]`
- **NFTStaking**: `[TBD]`

## Resources

- [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [NFT Metadata Standard](https://docs.opensea.io/docs/metadata-standards)

---

**Start earning your Genesis Badge today! 🏆**
