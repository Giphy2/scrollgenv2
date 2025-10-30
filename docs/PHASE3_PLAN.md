# ScrollGen Phase 3 - Advanced Layer Implementation Plan

## 🎯 Overview

Phase 3 transforms ScrollGen into a comprehensive DeFi protocol with cross-chain capabilities and privacy features.

**Status**: Planning
**Timeline**: Q3-Q4 2024
**Network**: Scroll Sepolia → Scroll Mainnet

---

## 📋 Phase 3 Components

### 1. Staking & Yield System
### 2. Mini Lending Market
### 3. Scroll Bridge Integration
### 4. ZK Privacy Layer
### 5. Unified Dashboard
### 6. Comprehensive Documentation

---

## 🏗️ Architecture Overview

```
Phase 3 Stack
├── Smart Contracts
│   ├── StakingRewards.sol         // Single-asset staking
│   ├── LiquidityPool.sol          // AMM for SGT/ETH
│   ├── LendingProtocol.sol        // Collateralized lending
│   ├── BridgeConnector.sol        // Scroll bridge integration
│   └── ZKVerifier.sol             // Privacy proofs
├── Frontend (Next.js)
│   ├── Dashboard                  // Unified interface
│   ├── Staking UI                 // Staking management
│   ├── Lending UI                 // Borrow/lend interface
│   ├── Bridge UI                  // Cross-chain transfers
│   └── Privacy UI                 // ZK proof generation
├── Backend Services
│   ├── The Graph                  // Analytics indexing
│   ├── Supabase                   // User data & preferences
│   └── IPFS                       // Metadata storage
└── ZK Layer
    ├── SnarkJS                    // Proof generation
    └── Circom Circuits            // Privacy logic
```

---

## 1️⃣ Staking & Yield System

### Objectives
- Allow users to stake SGT for rewards
- Implement time-locked staking pools
- Optional NFT rewards for long-term stakers
- Auto-compounding functionality

### Contract: `StakingRewards.sol`

#### Features

**Flexible Staking**
- Stake any amount of SGT
- No minimum lock period
- Withdraw anytime with rewards

**Time-Lock Pools**
- 30-day pool: 1.5x rewards
- 90-day pool: 2x rewards
- 180-day pool: 3x rewards
- 365-day pool: 5x rewards

**Reward Distribution**
- Per-block reward calculation
- Proportional to stake amount
- Bonus multipliers for lock duration
- Auto-compound option

#### Technical Specifications

```solidity
contract StakingRewards {
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration;
        uint256 rewardDebt;
        bool autoCompound;
    }

    mapping(address => Stake[]) public stakes;

    uint256 public rewardRate;        // Rewards per block
    uint256 public totalStaked;

    function stake(uint256 amount, uint256 lockDuration) external;
    function unstake(uint256 stakeIndex) external;
    function claimRewards(uint256 stakeIndex) external;
    function compound(uint256 stakeIndex) external;
    function calculateRewards(address user, uint256 stakeIndex) external view returns (uint256);
}
```

#### Reward Calculation

```
Base Reward = (stakeAmount × rewardRate × timeStaked) / totalStaked

Lock Multiplier:
- No lock: 1x
- 30 days: 1.5x
- 90 days: 2x
- 180 days: 3x
- 365 days: 5x

Final Reward = Base Reward × Lock Multiplier
```

#### NFT Rewards (Optional)

- Stake 10,000+ SGT for 365 days → Special Diamond Badge
- Stake 5,000+ SGT for 180 days → Platinum Badge upgrade
- Milestone achievements unlock rare NFTs

---

## 2️⃣ Mini Lending Market

### Objectives
- Allow users to supply SGT for interest
- Enable borrowing against SGT collateral
- Simple interest calculation
- Liquidation mechanism for underwater positions

### Contract: `LendingProtocol.sol`

#### Features

**Supply Side**
- Deposit SGT to earn interest
- Variable APY based on utilization
- Withdraw anytime (if liquidity available)
- Interest accrues per block

**Borrow Side**
- Collateralize SGT to borrow ETH/USDC
- Loan-to-Value (LTV): 66%
- Liquidation threshold: 75%
- Liquidation penalty: 10%

#### Technical Specifications

```solidity
contract LendingProtocol {
    struct Supply {
        uint256 amount;
        uint256 timestamp;
        uint256 interestEarned;
    }

    struct Borrow {
        uint256 collateral;
        uint256 borrowed;
        address asset;
        uint256 timestamp;
    }

    mapping(address => Supply) public supplies;
    mapping(address => Borrow[]) public borrows;

    uint256 public totalSupplied;
    uint256 public totalBorrowed;

    function supply(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function borrow(address asset, uint256 amount) external;
    function repay(uint256 borrowIndex, uint256 amount) external;
    function liquidate(address user, uint256 borrowIndex) external;

    function utilizationRate() external view returns (uint256);
    function supplyAPY() external view returns (uint256);
    function borrowAPY() external view returns (uint256);
    function healthFactor(address user, uint256 borrowIndex) external view returns (uint256);
}
```

#### Interest Rate Model

```
Utilization = totalBorrowed / totalSupplied

Supply APY:
- 0-80% utilization: 2% + (utilization × 10%)
- 80-100% utilization: 10% + ((utilization - 80%) × 200%)

Borrow APY = Supply APY × 1.2 (20% spread)

Health Factor = (collateral × LTV) / borrowed
- Health Factor < 1.0 → Liquidatable
```

#### Supported Assets

**As Collateral:**
- SGT (Phase 3.0)
- Genesis Badges (Phase 3.1)

**To Borrow:**
- ETH
- USDC (wrapped)
- USDT (wrapped)

---

## 3️⃣ Scroll Bridge Integration

### Objectives
- Enable deposits/withdrawals between Scroll and Ethereum
- Display transaction status and confirmations
- Handle wrapped tokens on Scroll
- Secure cross-chain messaging

### Contract: `BridgeConnector.sol`

#### Features

**Bridge Operations**
- Deposit ETH from Ethereum → Scroll
- Withdraw SGT from Scroll → Ethereum
- Track pending transactions
- Handle confirmation delays

**Transaction Tracking**
- Real-time status updates
- Estimated completion time
- Transaction history
- Failed transaction recovery

#### Technical Specifications

```solidity
contract BridgeConnector {
    struct BridgeTransaction {
        address user;
        uint256 amount;
        address token;
        uint256 timestamp;
        bytes32 txHash;
        BridgeStatus status;
    }

    enum BridgeStatus {
        Pending,
        Confirmed,
        Completed,
        Failed
    }

    mapping(bytes32 => BridgeTransaction) public transactions;

    function initiateDeposit(uint256 amount) external payable;
    function initiateWithdrawal(uint256 amount) external;
    function claimWithdrawal(bytes32 txHash) external;
    function getTransactionStatus(bytes32 txHash) external view returns (BridgeStatus);
}
```

#### Integration with Scroll Bridge

**Using Scroll Native Bridge:**
```javascript
import { ScrollBridge } from '@scroll-tech/bridge-sdk';

const bridge = new ScrollBridge({
  l1Provider: ethereumProvider,
  l2Provider: scrollProvider,
});

// Deposit from L1 to L2
await bridge.depositETH(amount, {
  gasLimit: 200000,
});

// Withdraw from L2 to L1
await bridge.withdrawETH(amount);
```

#### Frontend Status Display

```
Bridge Transaction Status:

┌─────────────────────────────────────┐
│ Depositing 1.5 ETH to Scroll        │
├─────────────────────────────────────┤
│ ✅ Confirmed on Ethereum (1/12)     │
│ ⏳ Waiting for batch finalization   │
│ ⏸️  Not yet available on Scroll      │
│                                     │
│ Estimated: ~10 minutes remaining    │
└─────────────────────────────────────┘
```

---

## 4️⃣ ZK Privacy Layer

### Objectives
- Prove staking activity without revealing amount
- Verify user eligibility privately
- Generate and verify zk-SNARKs on-chain
- Maintain privacy while ensuring security

### Contract: `ZKVerifier.sol`

#### Features

**Privacy Proofs**
- Prove "I staked > 1000 SGT" without revealing exact amount
- Prove "I hold a Gold badge" without revealing token ID
- Anonymous voting in governance
- Private transaction amounts

**Proof Types**
1. **Range Proof**: Prove value is within range
2. **Membership Proof**: Prove membership in set
3. **Equality Proof**: Prove two values are equal
4. **Inequality Proof**: Prove value comparison

#### Technical Specifications

```solidity
contract ZKVerifier {
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[] inputs;
    }

    function verifyStakeProof(
        Proof calldata proof,
        uint256 minAmount
    ) external view returns (bool);

    function verifyNFTOwnership(
        Proof calldata proof,
        uint8 minTier
    ) external view returns (bool);

    function verifyBalance(
        Proof calldata proof
    ) external view returns (bool);
}
```

#### ZK Circuit Example (Circom)

```circom
pragma circom 2.0.0;

// Prove stake amount > threshold without revealing exact amount
template StakeProof() {
    signal input stakeAmount;
    signal input threshold;
    signal input secret;

    signal output isValid;

    // Check stake amount > threshold
    component greaterThan = GreaterThan(252);
    greaterThan.in[0] <== stakeAmount;
    greaterThan.in[1] <== threshold;

    isValid <== greaterThan.out;

    // Hide actual amount with secret commitment
    signal commitment;
    commitment <== Poseidon([stakeAmount, secret]);
}
```

#### Frontend Integration (SnarkJS)

```javascript
import { groth16 } from 'snarkjs';

// Generate proof
const { proof, publicSignals } = await groth16.fullProve(
  {
    stakeAmount: userStakeAmount,
    threshold: 1000,
    secret: randomSecret,
  },
  wasmFile,
  zkeyFile
);

// Submit proof to contract
await zkVerifier.verifyStakeProof(proof, 1000);
```

#### Use Cases

**Private Staking Verification**
- Prove eligibility for rewards without revealing stake
- Anonymous leaderboards
- Private whale detection

**Private NFT Ownership**
- Prove badge ownership without revealing which one
- Access control based on tier
- Anonymous airdrops

**Private Governance**
- Vote without revealing voting power
- Proposal creation with threshold
- Anonymous delegation

---

## 5️⃣ Unified Dashboard

### Objectives
- Single interface for all Protocol features
- Real-time data updates
- Beautiful, responsive design
- Seamless wallet integration

### Pages & Components

#### Dashboard Home
```
┌─────────────────────────────────────────────────┐
│  ScrollGen Dashboard                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Portfolio Overview                             │
│  ├── Total Value: $12,450.23                    │
│  ├── SGT Balance: 5,000 SGT                     │
│  ├── Staked: 3,000 SGT                          │
│  └── NFTs: 3 badges                             │
│                                                 │
│  Quick Actions                                  │
│  [Stake] [Borrow] [Bridge] [Trade]              │
│                                                 │
│  Active Positions                               │
│  ├── Staking: 3,000 SGT @ 45% APY              │
│  ├── Lending: 1,000 SGT supplied                │
│  └── Borrowed: 0.5 ETH                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Staking Interface
- View all staking pools
- Stake/unstake functionality
- Rewards calculator
- Lock duration selector
- Auto-compound toggle

#### Lending Interface
- Supply/withdraw SGT
- Borrow against collateral
- Health factor monitor
- Interest rate display
- Position management

#### Bridge Interface
- Deposit/withdraw forms
- Transaction status tracker
- Gas cost estimator
- Bridge history

#### Privacy Tools
- Proof generator UI
- Verification status
- Private transactions
- Anonymous features

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui components
- Wagmi v2 + Viem
- RainbowKit

**State Management:**
- React Query (TanStack Query)
- Zustand (global state)
- Web3 hooks

**Data Fetching:**
- The Graph (subgraph)
- Supabase (user data)
- Real-time subscriptions

---

## 6️⃣ Documentation

### Required Documentation

#### `/docs/defi.md` (UPDATE)
- Staking mechanics
- Lending protocol details
- Interest rate models
- Risk management

#### `/docs/bridge.md` (NEW)
- How to use Scroll bridge
- Transaction lifecycle
- Fees and timing
- Troubleshooting

#### `/docs/zk.md` (NEW)
- ZK proof concepts
- Privacy features
- How to generate proofs
- Security considerations

#### `/docs/api.md` (NEW)
- Contract ABIs
- Frontend integration
- Subgraph queries
- Code examples

---

## 📊 Implementation Timeline

### Phase 3.0 - Foundation (Weeks 1-4)
- [ ] Deploy StakingRewards contract
- [ ] Deploy LendingProtocol contract
- [ ] Basic staking UI
- [ ] Basic lending UI
- [ ] Documentation updates

### Phase 3.1 - Bridge (Weeks 5-8)
- [ ] Integrate Scroll bridge SDK
- [ ] Deploy BridgeConnector contract
- [ ] Bridge UI with status tracking
- [ ] Transaction history
- [ ] Bridge documentation

### Phase 3.2 - Privacy (Weeks 9-12)
- [ ] Design ZK circuits
- [ ] Deploy ZKVerifier contract
- [ ] Proof generation UI
- [ ] Privacy features integration
- [ ] ZK documentation

### Phase 3.3 - Dashboard (Weeks 13-16)
- [ ] Unified dashboard design
- [ ] Portfolio aggregation
- [ ] Real-time data updates
- [ ] The Graph subgraph
- [ ] Analytics dashboard

### Phase 3.4 - Testing & Launch (Weeks 17-20)
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Bug bounty program
- [ ] Testnet deployment
- [ ] Mainnet migration

---

## 🔒 Security Considerations

### Smart Contract Security
- Comprehensive test coverage (>95%)
- Formal verification for critical functions
- External security audit (Trail of Bits / OpenZeppelin)
- Time-locked upgrades
- Emergency pause mechanism

### Bridge Security
- Use official Scroll bridge
- Transaction validation
- Withdrawal proof verification
- Rate limiting
- Monitoring & alerts

### ZK Security
- Trusted setup ceremony
- Circuit audits
- Proof verification on-chain
- No private key exposure
- Secure randomness

---

## 📈 Success Metrics

### Adoption Targets (3 months)
- 500+ active stakers
- $500K+ TVL in staking
- $250K+ supplied in lending
- 1,000+ bridge transactions
- 100+ privacy proofs generated

### Performance Targets
- Staking APY: 25-50%
- Lending APY: 10-20%
- Bridge time: <15 minutes
- Proof generation: <30 seconds
- UI load time: <2 seconds

---

## 🚀 Next Steps

1. **Review and approve this plan**
2. **Begin smart contract development**
3. **Set up development environment**
4. **Create contract specifications**
5. **Start frontend architecture**

---

**Phase 3 will establish ScrollGen as a comprehensive DeFi protocol! 💎**

*Created: October 27, 2024*
