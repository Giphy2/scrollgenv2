# zkID Verifier & ScrollPower

## Overview

Zero-knowledge identity verification system that issues non-transferable ScrollPower (SP) reputation tokens based on verified on-chain activities while preserving user privacy.

## Purpose & Motivation

- **Privacy-Preserving Identity**: Prove credentials without revealing personal data
- **Sybil Resistance**: One person, one identity through ZK proofs
- **Reputation System**: Quantify contributions with ScrollPower scores
- **Governance Weight**: SP influences voting power in DAO
- **Access Control**: Gate features based on reputation levels

## Technical Architecture

### Smart Contract: zkIDVerifier.sol

**Core Components:**
1. Soulbound NFT (non-transferable identity token)
2. ScrollPower score tracking (0-10,000)
3. ZK proof verification
4. Activity recording and reward system
5. Multi-dimensional reputation scores

### Data Structures

```solidity
struct Identity {
    address userAddress;
    uint256 scrollPower;         // Total SP (0-10,000)
    uint256 verificationLevel;   // 1-5 tiers
    uint256 lastUpdate;
    bool verified;
    bytes32 zkProofHash;
}

struct Reputation {
    uint256 totalActivities;
    uint256 consistencyScore;    // Regular participation
    uint256 contributionScore;   // Value added
    uint256 governanceScore;     // DAO participation
    uint256 trustScore;          // Community standing
}

struct Activity {
    string activityType;         // "stake", "vote", "trade", etc.
    uint256 spReward;
    uint256 timestamp;
    bool claimed;
}
```

## Verification Levels

| Level | Name | SP Reward | Requirements |
|-------|------|-----------|--------------|
| 1 | Basic | 100 SP | Email/Social proof |
| 2 | Intermediate | 500 SP | On-chain history |
| 3 | Advanced | 1,000 SP | Multi-protocol activity |
| 4 | Expert | 2,500 SP | Significant contributions |
| 5 | Master | 5,000 SP | Community leadership |

## Key Functions

### User Functions

**verifyProof(proofHash, verificationLevel, proof)**
- Submit ZK proof for identity verification
- Mints soulbound NFT on first verification
- Awards ScrollPower based on level
- Proof cannot be reused

**claimActivity(activityIndex)**
- Claim ScrollPower from completed activities
- Adds to total SP score
- Cannot exceed maxScrollPower (10,000)

### Admin/Oracle Functions

**mintSP(user, amount, reason)**
- Award ScrollPower for specific actions
- Records activity with reason
- Emits ScrollPowerMinted event

**recordActivity(user, activityType, spReward)**
- Log user activity for future claiming
- User must claim to receive SP
- Enables batch reward distributions

**updateReputation(user, scores...)**
- Update multi-dimensional reputation
- Separate scores for consistency, contribution, governance, trust
- Used for advanced features and governance

### View Functions

**getScore(user)** - Returns total ScrollPower
**getIdentity(user)** - Returns full identity data
**getReputation(user)** - Returns reputation breakdown
**getUserActivities(user)** - Returns activity history
**getPendingActivities(user)** - Returns unclaimed activities

## Zero-Knowledge Proof System

### Current Implementation (Mock)

```solidity
function _validateZKProof(bytes32 proofHash, bytes calldata proof) internal view returns (bool) {
    // Production: Call actual ZK verifier contract
    // Currently: Trusted oracle validation
    return proofHash != bytes32(0) && proof.length > 0;
}
```

### Production Implementation

**Proof Generation (Off-Chain):**
1. User provides credential (email, Twitter, GitHub, etc.)
2. Client generates ZK proof: "I have credential X without revealing X"
3. Proof includes commitment to uniqueness (prevent multiple accounts)
4. Submit proof to smart contract

**Proof Verification (On-Chain):**
1. Smart contract calls ZK verifier
2. Verifier checks proof validity
3. If valid, mark proof hash as used
4. Issue ScrollPower and soulbound NFT

**Privacy Properties:**
- Nobody learns user's credentials
- Cannot link on-chain identity to real identity
- Proves uniqueness without revealing identity
- Resistant to Sybil attacks

### Supported Proof Types

- Email verification (Level 1)
- Social media accounts (Level 2)
- On-chain transaction history (Level 3)
- Smart contract interactions (Level 4)
- DAO participation records (Level 5)

## ScrollPower Earning Activities

| Activity | SP Reward | Frequency |
|----------|-----------|-----------|
| First Stake | 50 SP | Once |
| Daily Login | 5 SP | Daily |
| Create Proposal | 100 SP | Per proposal |
| Vote on Proposal | 25 SP | Per vote |
| Trade on Marketplace | 10 SP | Per trade |
| Bridge Assets | 50 SP | Per bridge |
| Provide Liquidity | 75 SP | Per LP position |
| Complete Quest | Variable | Per quest |
| Referral | 200 SP | Per referral |

## Reputation Scoring

### Consistency Score (0-100)
- Measures regular participation
- Daily logins, weekly activities
- Penalized by long absences

### Contribution Score (0-100)
- Value added to ecosystem
- Liquidity provided, proposals created
- Quality over quantity

### Governance Score (0-100)
- DAO participation
- Voting frequency, proposal creation
- Delegation activity

### Trust Score (0-100)
- Community standing
- No slashing events, positive interactions
- Peer endorsements

## Soulbound Token Properties

**Non-Transferable:**
```solidity
function _update(address to, uint256 tokenId, address auth) internal override {
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0)) {
        revert("Soulbound: Transfer not allowed");
    }
    return super._update(to, tokenId, auth);
}
```

**Benefits:**
- Cannot be sold or traded
- Permanent link to identity
- Resistant to market speculation
- Prevents reputation farming

## Frontend Integration

### zkIDProfile Component

**Features:**
- ScrollPower dashboard
- Verification level display
- Reputation breakdown
- Activity feed
- Pending rewards

**User Flow:**
1. Connect wallet
2. Submit verification proof
3. Receive soulbound NFT
4. Complete activities to earn SP
5. Claim pending rewards
6. View reputation scores
7. Track progress to next level

## Security Considerations

### ZK Proof Security
- Proof uniqueness prevents double-claiming
- Trusted setup verification
- Proof expiry to prevent replay
- Rate limiting on submissions

### Soulbound Security
- Cannot transfer prevents selling identities
- Cannot approve prevents phishing
- Immutable once minted
- Owner can burn (future feature)

### Oracle Security
- Only authorized addresses can mint SP
- Activity rewards validated off-chain
- Reputation updates controlled
- Emergency pause mechanism

### User Protection
- Transparent SP calculation
- Clear verification requirements
- Privacy preserved with ZK proofs
- No personal data stored on-chain

## Use Cases

### Protocol Access
```solidity
require(zkIDVerifier.getScore(msg.sender) >= 1000, "Insufficient ScrollPower");
```

### Governance Weight
```solidity
votingPower = tokenBalance + (scrollPower / 10);
```

### Fee Discounts
```solidity
uint256 discount = (scrollPower / 100); // 1% per 100 SP
fee = baseFee - (baseFee * discount / 100);
```

### Exclusive Features
```solidity
if (scrollPower >= 5000) {
    // Unlock premium features
}
```

## Testing Strategy

1. ZK proof generation and verification
2. Soulbound token minting and transfer prevention
3. ScrollPower accrual and limits
4. Activity recording and claiming
5. Reputation score updates

## Roadmap

- [ ] Production ZK verifier integration
- [ ] Mobile app for proof generation
- [ ] Cross-chain identity verification
- [ ] Decentralized identity aggregation
- [ ] Privacy-preserving credit scoring
- [ ] Biometric proofs (face, fingerprint)
- [ ] Social graph analysis

## Conclusion

zkID combines the power of zero-knowledge proofs with soulbound tokens to create a privacy-preserving reputation system that enables trust without sacrificing anonymity.
