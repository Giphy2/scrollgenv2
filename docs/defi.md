# DeFi Integration Documentation

## Overview

This document outlines ScrollGen's DeFi (Decentralized Finance) strategy planned for **Phase 4**. These features will transform SGT from a simple token into a comprehensive financial primitive within the Scroll ecosystem.

**Status:** Planning Phase
**Target Launch:** Q4 2024

---

## DeFi Vision

### Core Objectives

1. **Liquidity**: Deep, accessible markets for SGT
2. **Yield**: Competitive returns for token holders
3. **Utility**: Real financial use cases for SGT
4. **Composability**: Integration with broader DeFi ecosystem
5. **Security**: Robust, audited protocols

### Design Principles

- **Capital Efficiency**: Maximize value per unit of capital
- **User Experience**: Simple, intuitive interfaces
- **Gas Optimization**: Leverage Scroll's low fees
- **Risk Management**: Transparent, manageable risks
- **Fair Launch**: No special privileges for insiders

---

## Liquidity Provision

### Automated Market Maker (AMM)

#### Pool Structure

**Primary Pair: SGT/ETH**

```
Liquidity Pool
├── SGT Reserves
├── ETH Reserves
├── LP Token (SGT-ETH)
└── Fee Accumulator
```

**Features:**
- Constant product formula (x * y = k)
- 0.3% trading fee
- Fees distributed to LP token holders
- No impermanent loss protection (initial version)

#### Adding Liquidity

```javascript
// Add liquidity to SGT/ETH pool
await liquidityPool.addLiquidity(
  sgtAmount,      // Amount of SGT
  { value: ethAmount }  // Amount of ETH
);

// Receive LP tokens representing your share
```

**Benefits:**
- Earn trading fees proportional to share
- Compound rewards automatically
- Withdraw anytime (subject to available liquidity)

#### Removing Liquidity

```javascript
// Remove liquidity from pool
await liquidityPool.removeLiquidity(
  lpTokenAmount   // Amount of LP tokens to burn
);

// Receive proportional SGT and ETH
```

### Secondary Pairs (Future)

- **SGT/USDC**: Stablecoin pair for predictable pricing
- **SGT/WBTC**: Bitcoin exposure
- **SGT/Other tokens**: Community-voted pairs

---

## Staking & Yield

### Single-Asset Staking

#### SGT Staking Pool

**Stake SGT, Earn SGT**

```solidity
Contract: StakingRewards
Reward Token: SGT
Staking Token: SGT
Lock Period: None (flexible)
```

**APY Calculation:**
```
APY = (Reward Rate × 365 days) / Total Staked × 100%
```

**Features:**
- Flexible staking (unstake anytime)
- Rewards distributed per block
- Auto-compounding option
- No withdrawal penalties

#### Vesting Tiers

Lock your tokens for higher rewards:

| Lock Period | APY Multiplier | Early Withdrawal Penalty |
|-------------|----------------|-------------------------|
| None | 1x | 0% |
| 30 days | 1.5x | 5% |
| 90 days | 2x | 10% |
| 180 days | 3x | 15% |
| 365 days | 5x | 25% |

### LP Token Staking

**Stake LP Tokens, Earn Bonus SGT**

```solidity
Contract: LPRewards
Reward Token: SGT (bonus rewards)
Staking Token: SGT-ETH LP
Lock Period: None
```

**Benefits:**
- Earn trading fees from AMM
- PLUS earn bonus SGT rewards
- Higher APY than single staking
- Double incentive for liquidity provision

### Yield Farming

**Multi-Pool Farming Strategy**

```
Farm Allocation
├── SGT-ETH LP:     50% of rewards
├── SGT-USDC LP:    30% of rewards
├── SGT Single:     15% of rewards
└── NFT Staking:     5% of rewards
```

*Allocations adjustable by governance*

---

## Lending Protocol

### Collateralized Lending

#### Overview

Use SGT as collateral to borrow other assets:

```
Borrow Capacity = SGT Collateral × LTV Ratio
```

**Initial Parameters:**
- Loan-to-Value (LTV): 66%
- Liquidation Threshold: 75%
- Liquidation Penalty: 10%

#### Example

```
Deposit: 1,000 SGT ($1,000 value)
LTV: 66%
Max Borrow: $660 in stablecoins

If SGT price drops and health factor < 1.0:
→ Position liquidated
→ 10% penalty applied
→ Remaining collateral returned
```

### Interest Rates

**Variable Rate Model:**

```
Utilization Rate = Borrowed / Total Supplied

Interest Rate:
- 0-80% utilization: Linear from 2% to 10%
- 80-100% utilization: Exponential to 50%
```

**Why Variable?**
- Encourages lending when rates are high
- Incentivizes repayment at high utilization
- Market-driven equilibrium

### Supported Assets

#### As Collateral
- SGT (initial launch)
- NFTs (future)
- LP tokens (future)

#### To Borrow
- ETH
- USDC
- USDT
- DAI

---

## Advanced Features

### Flash Loans

**Zero-Collateral Instant Loans**

```solidity
// Borrow any amount within a single transaction
// Must be repaid in same transaction + fee
function flashLoan(
  address token,
  uint256 amount,
  bytes calldata data
) external;
```

**Use Cases:**
- Arbitrage opportunities
- Collateral swapping
- Liquidation execution
- Complex DeFi strategies

**Fee:** 0.09% of borrowed amount

### Leverage Trading (Future)

**Amplify Your Position**

```
Your Capital: 1 ETH
Leverage: 3x
Total Position: 3 ETH
Borrowed: 2 ETH
```

**Features:**
- Up to 5x leverage on select pairs
- Automatic liquidation protection
- Stop-loss orders
- Take-profit orders

### Options Protocol (Future)

**Covered Calls & Puts**

```
Write Option:
- Deposit SGT as collateral
- Receive premium payment
- Buyer gets right to purchase at strike price

Buy Option:
- Pay premium to writer
- Right (not obligation) to buy/sell
- Exercise before expiration
```

---

## Price Oracles

### Reliable Price Feeds

**Sources:**
1. **Primary:** On-chain TWAP (Time-Weighted Average Price)
2. **Secondary:** Chainlink oracles (when available)
3. **Fallback:** Multiple DEX aggregation

**TWAP Implementation:**
```solidity
// 30-minute time-weighted average
// Prevents price manipulation
// Updates every block
```

**Security Measures:**
- Multiple price sources
- Deviation checks
- Circuit breakers for extreme movements
- Governance-adjustable parameters

---

## Fee Structure

### Trading Fees

| Action | Fee | Recipient |
|--------|-----|-----------|
| AMM Swap | 0.3% | LP token holders |
| Lending/Borrowing | Variable | Protocol + Lenders |
| Flash Loan | 0.09% | Protocol treasury |
| Liquidation | 10% | Liquidator (5%) + Protocol (5%) |

### Fee Distribution

```
Protocol Fees Distribution:
├── 50%: SGT buyback & burn (deflationary)
├── 30%: Treasury (governance-controlled)
├── 15%: Development fund
└── 5%: Security fund
```

---

## Risk Management

### Smart Contract Risks

**Mitigation:**
- Comprehensive testing
- Multiple security audits
- Bug bounty program ($500K+)
- Gradual rollout with caps
- Emergency pause mechanism

### Economic Risks

**Impermanent Loss:**
- Risk when providing liquidity
- Price divergence between assets
- Partially offset by trading fees

**Liquidation Risk:**
- Monitor health factor
- Set conservative LTV
- Use stop-loss protection

**Smart Contract Risk:**
- Never invest more than you can afford to lose
- Understand protocol mechanics
- Diversify across protocols

### Systemic Risks

**Market Volatility:**
- Sudden price movements
- Cascading liquidations
- Extreme market conditions

**Protection Measures:**
- Conservative collateral ratios
- Gradual liquidation process
- Circuit breakers
- Insurance fund

---

## Integration Examples

### Adding Liquidity (Frontend)

```javascript
import { ethers } from 'ethers';

const sgtAmount = ethers.parseUnits("1000", 18);
const ethAmount = ethers.parseUnits("0.5", 18);

// Approve SGT spending
await sgtContract.approve(poolAddress, sgtAmount);

// Add liquidity
const tx = await pool.addLiquidity(
  sgtAmount,
  { value: ethAmount }
);

await tx.wait();
console.log("Liquidity added! LP tokens received.");
```

### Staking Tokens

```javascript
// Approve staking contract
await sgtContract.approve(stakingAddress, amount);

// Stake tokens
await stakingContract.stake(amount, lockPeriod);

// View rewards
const earned = await stakingContract.earned(userAddress);
console.log("Rewards earned:", ethers.formatUnits(earned, 18));

// Claim rewards
await stakingContract.claim();
```

### Borrowing

```javascript
// Deposit collateral
await lendingContract.deposit(sgtAmount);

// Check borrow capacity
const capacity = await lendingContract.getBorrowCapacity(userAddress);

// Borrow stablecoins
await lendingContract.borrow(usdcAddress, borrowAmount);

// Repay loan
await usdcContract.approve(lendingAddress, repayAmount);
await lendingContract.repay(usdcAddress, repayAmount);
```

---

## Performance Metrics

### Target KPIs (Post-Launch)

| Metric | 1 Month | 3 Months | 6 Months |
|--------|---------|----------|----------|
| TVL | $100K | $500K | $2M |
| Daily Volume | $10K | $50K | $200K |
| Active Users | 100 | 500 | 2,000 |
| LP Providers | 50 | 200 | 800 |

### APY Targets

| Pool Type | Conservative | Target | Optimistic |
|-----------|--------------|---------|------------|
| Single Staking | 15% | 25% | 40% |
| LP Staking | 30% | 50% | 80% |
| Lending | 5% | 10% | 20% |

*APYs are dynamic and market-dependent*

---

## Roadmap

### Phase 4.1: Core DeFi (Launch)
- ✓ SGT/ETH liquidity pool
- ✓ Single-asset staking
- ✓ LP token staking
- ✓ Basic lending

### Phase 4.2: Enhanced Features
- Flash loans
- Additional trading pairs
- Improved price oracles
- Advanced analytics dashboard

### Phase 4.3: Advanced Protocols
- Leverage trading
- Options protocol
- Synthetic assets
- Cross-chain bridges

---

## Security Audits

### Pre-Launch Requirements

1. **Internal Security Review**
   - Code walkthrough
   - Test coverage >95%
   - Fuzz testing

2. **External Audit**
   - Tier-1 audit firm (e.g., Trail of Bits, OpenZeppelin)
   - Comprehensive report
   - All criticals resolved

3. **Bug Bounty**
   - Immunefi platform
   - Up to $500K rewards
   - Ongoing program

4. **Economic Audit**
   - Tokenomics review
   - Game theory analysis
   - Simulation testing

---

## Resources

### Documentation
- [AMM Technical Spec](./future-specs/amm.md)
- [Staking Implementation](./future-specs/staking.md)
- [Lending Protocol Design](./future-specs/lending.md)

### External References
- [Uniswap V2 Docs](https://docs.uniswap.org/protocol/V2/introduction)
- [Compound Protocol](https://compound.finance/docs)
- [Aave Documentation](https://docs.aave.com/)

### Tools
- [DeFi Pulse](https://defipulse.com/)
- [Dune Analytics](https://dune.com/)
- [DeBank Portfolio](https://debank.com/)

---

## Disclaimer

**DeFi involves significant risks including:**
- Smart contract vulnerabilities
- Market volatility
- Impermanent loss
- Liquidation risk
- Regulatory uncertainty

**Always:**
- Do your own research (DYOR)
- Never invest more than you can afford to lose
- Understand the protocols you use
- Monitor your positions
- Use risk management tools

---

**DeFi opportunities are coming to ScrollGen! 💎**

*Last Updated: January 2024*
