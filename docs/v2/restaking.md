# Restaking Protocol

## Overview

The RestakeHub enables users to restake their SGT and sSGT tokens with professional validators/operators to earn additional yield from partner protocols while maintaining liquidity and security.

## Purpose & Motivation

Restaking unlocks additional utility for staked assets by:

- Earning compound rewards from multiple protocols
- Supporting validator infrastructure
- Maintaining decentralization through distributed operators
- Providing liquid restaking tokens for further DeFi use
- Creating sustainable validator business models

## Technical Architecture

### Smart Contract: RestakeHub.sol

**Core Components:**

1. **Operator Registry**: Validated node operators with reputation scores
2. **Restaking Positions**: User stakes delegated to operators
3. **Reward Distribution**: Automated yield distribution system
4. **Protocol Integrations**: Partner protocol connections
5. **Capacity Management**: Operator delegation limits

**Data Structures:**

```solidity
struct Operator {
    address operatorAddress;
    string name;
    uint256 commission;       // Basis points (500 = 5%)
    uint256 totalRestaked;
    uint256 maxCapacity;
    bool active;
    uint256 reputationScore;  // 0-100
    uint256 uptime;           // Percentage
}

struct Restaking {
    address user;
    address operator;
    uint256 amount;
    uint256 startTime;
    uint256 lastClaimTime;
    uint256 rewardsAccrued;
    bool active;
}

struct ProtocolIntegration {
    address protocolAddress;
    string name;
    uint256 baseAPY;
    bool active;
}
```

## Key Functions

### Operator Functions

**registerOperator(name, commission, maxCapacity)**
- Validator registers as an operator
- Set commission rate (max 20%)
- Define maximum restaking capacity
- Requirements:
  - Minimum capacity: 1,000 tokens
  - Commission ≤ 2000 basis points (20%)

**updateOperator(newCommission, newMaxCapacity, active)**
- Modify operator parameters
- Can pause operations by setting active=false
- Cannot modify while users have active stakes

### User Functions

**restake(operator, amount, useSGT)**
- Delegate tokens to a validator operator
- Choose between SGT or sSGT tokens
- Minimum: 100 tokens
- Checks:
  - Operator is active
  - Below operator capacity
  - Sufficient token balance

**unrestake(restakingIndex)**
- Withdraw restaked position
- Lock period: 7 days from initial stake
- Auto-claims pending rewards
- Returns original token type

**claimRewards(restakingIndex)**
- Claim accumulated rewards
- Operator commission deducted automatically
- Rewards paid in SGT tokens
- Can claim anytime while stake is active

### Admin Functions

**integrateProtocol(protocolAddress, name, baseAPY)**
- Add partner protocol for yield generation
- Set base APY for the protocol
- Enable cross-protocol restaking

**distributeYield(operator, amount)**
- Distribute rewards to operator's delegators
- Proportional to stake amount and duration
- Operator commission applied

**updateOperatorMetrics(operator, reputationScore, uptime)**
- Update operator performance metrics
- Reputation: 0-100 score based on behavior
- Uptime: Percentage of online time

### View Functions

**getOperatorInfo(operator)**
- Returns: name, commission, totalRestaked, maxCapacity, reputation, uptime, active

**getActiveRestaking(user, index)**
- Returns: operator, amount, startTime, pendingRewards, active

**getUserRestakings(user)**
- Returns array of all user's restaking positions

**getActiveOperators()**
- Returns array of all active operator addresses

## Reward Calculation

### Base Formula

```
rewards = (amount × baseAPY × timeStaked) / (365 days × 10000)
baseAPY = 1500 basis points (15%)
```

### Commission Deduction

```
operatorCommission = rewards × (operatorCommission / 10000)
userReward = rewards - operatorCommission
```

### Example

- User restakes: 1,000 SGT
- Operator commission: 5%
- Time staked: 30 days
- Base APY: 15%

```
rawRewards = (1000 × 1500 × 30 days) / (365 days × 10000)
rawRewards = 12.33 SGT

commission = 12.33 × 0.05 = 0.62 SGT
userReward = 12.33 - 0.62 = 11.71 SGT
```

## Events

```solidity
event OperatorRegistered(address indexed operator, string name, uint256 commission)
event Restaked(address indexed user, address indexed operator, uint256 amount, uint256 timestamp)
event Unrestaked(address indexed user, address indexed operator, uint256 amount, uint256 timestamp)
event RewardsClaimed(address indexed user, uint256 amount)
event YieldDistributed(address indexed operator, uint256 totalAmount, uint256 timestamp)
event ProtocolIntegrated(address indexed protocol, string name, uint256 baseAPY)
```

## Operator Selection Guide

### Key Metrics

1. **Commission Rate**: Lower = more rewards for you
2. **Reputation Score**: Higher = more reliable
3. **Uptime**: Higher = consistent rewards
4. **Capacity Utilization**: Lower = more room to grow
5. **Total Restaked**: Higher = trusted by others

### Risk Factors

- New operators (low history)
- High commission rates (>10%)
- Low uptime (<95%)
- Near capacity limit
- Poor reputation (<70)

## Frontend Integration

### RestakingPortal Component

**Features:**
- Operator marketplace with filters
- Restaking interface with amount input
- Active positions management
- Reward tracking and claims
- Operator performance charts

**Usage Example:**
```jsx
import RestakingPortal from './v2/RestakingPortal';

<RestakingPortal provider={provider} account={account} />
```

**User Flow:**
1. Browse active operators
2. Compare metrics (commission, uptime, reputation)
3. Select operator and enter amount
4. Approve token spending
5. Confirm restaking transaction
6. Monitor rewards and claim periodically
7. Unrestake after lock period expires

## Security Considerations

### Smart Contract Security

1. **ReentrancyGuard**: All withdrawal functions protected
2. **Lock Periods**: Prevent flash-loan attacks
3. **Capacity Limits**: Prevent operator over-leverage
4. **Commission Caps**: Maximum 20% to protect users

### Operator Security

1. **Registration Requirements**: Minimum capacity prevents Sybil attacks
2. **Reputation System**: Track operator behavior
3. **Uptime Monitoring**: Penalize unreliable operators
4. **Slashing Potential**: Future implementation for misbehavior

### User Protection

1. **Transparent Metrics**: All operator data on-chain
2. **Immediate Rewards**: No complex vesting
3. **Self-Custody**: Users control unrestaking
4. **Emergency Withdrawal**: Override lock in emergencies

### Protocol Risk

1. **Integration Audits**: Partner protocols must be secure
2. **Yield Sustainability**: Monitor APY sources
3. **Smart Contract Risk**: Restaking inherits protocol risks
4. **Oracle Dependency**: Accurate metric reporting

## Operator Best Practices

### Setup

1. Run reliable infrastructure (99%+ uptime)
2. Set competitive commission (5-10%)
3. Maintain sufficient capacity
4. Provide clear operator information

### Maintenance

1. Monitor restaking levels
2. Distribute rewards regularly
3. Respond to delegator questions
4. Keep infrastructure updated

### Growth

1. Build reputation through reliability
2. Offer competitive rates
3. Increase capacity as demand grows
4. Participate in governance

## Liquid Restaking Tokens (Future)

### sSGT Enhancement

Restaked positions could be tokenized as:
- **rSGT**: Liquid restaking token
- Tradeable on DEXs
- Composable in other DeFi protocols
- Auto-compounds rewards

## Testing Strategy

1. **Operator Tests**: Registration, updates, capacity
2. **Restaking Tests**: Deposit, withdraw, rewards
3. **Commission Tests**: Correct splits and transfers
4. **Time Tests**: Lock periods, reward accrual
5. **Edge Cases**: Capacity limits, inactive operators

## Deployment Checklist

- [ ] Deploy RestakeHub contract
- [ ] Register initial operators
- [ ] Integrate first partner protocol
- [ ] Set reasonable parameter limits
- [ ] Deploy frontend interface
- [ ] Document operator onboarding
- [ ] Monitor first restaking transactions

## Roadmap

- [ ] Liquid restaking tokens (rSGT)
- [ ] Automated operator selection (AI-powered)
- [ ] Multi-asset restaking (ETH, BTC)
- [ ] Cross-chain restaking bridges
- [ ] Slashing mechanism for bad actors
- [ ] Operator insurance pool
- [ ] Mobile app for monitoring

## Economic Model

### Revenue Streams

1. **Protocol Fees**: 0.1-0.5% of restaked amount (future)
2. **Partner Integrations**: Revenue sharing with protocols
3. **Premium Features**: Advanced analytics, priority support

### Sustainability

- Operator commissions create sustainable business model
- Partner protocols benefit from additional security
- Users earn compound yield without complexity
- Network grows through aligned incentives

## Comparison with Alternatives

### vs Traditional Staking
- ✅ Higher yields (compound rewards)
- ✅ Operator selection for optimization
- ❌ Additional smart contract risk
- ❌ Lock period required

### vs Liquid Staking
- ✅ Direct operator delegation
- ✅ Transparent reward distribution
- ❌ No liquid token (yet)
- ❌ Manual reward claims

### vs Direct Protocol Use
- ✅ Professional management
- ✅ Diversification across protocols
- ❌ Commission fees
- ❌ Additional contract layer

## Conclusion

The RestakeHub transforms staked assets into productive capital, enabling users to earn maximum yields while supporting network validators and maintaining security through decentralized operator selection.
