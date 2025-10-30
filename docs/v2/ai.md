# AI Yield Manager

## Overview

The AI Yield Manager is an intelligent yield optimization system that uses on-chain metrics and AI-driven strategies to maximize returns while managing risk across multiple DeFi pools.

## Purpose & Motivation

Traditional yield farming requires constant manual monitoring and rebalancing. The AI Yield Manager automates this process by:

- Collecting real-time on-chain metrics (APY, liquidity, volatility)
- Analyzing risk factors across multiple pools
- Generating AI-powered rebalancing recommendations
- Executing automatic rebalancing based on user-defined strategies
- Providing risk alerts when pools exceed safety thresholds

## Technical Architecture

### Smart Contract: AIYieldManager.sol

**Core Components:**

1. **Pool Registry**: Tracks all registered DeFi pools with their metrics
2. **User Strategies**: Stores personalized risk/reward preferences
3. **AI Oracle Integration**: Receives off-chain AI predictions
4. **Rebalancing Engine**: Executes position movements between pools
5. **Risk Monitoring**: Continuous pool health assessment

**Data Structures:**

```solidity
struct Pool {
    address poolAddress;
    uint256 currentAPY;      // Basis points (1500 = 15%)
    uint256 liquidity;       // Total liquidity in pool
    uint256 volatility;      // Volatility metric (0-100)
    uint256 lastUpdate;
    bool active;
}

struct Strategy {
    uint256 targetAPY;       // Minimum acceptable APY
    uint256 maxVolatility;   // Maximum risk tolerance
    uint256 minLiquidity;    // Minimum required liquidity
    bool autoRebalance;      // Enable automatic execution
}

struct RebalanceProposal {
    address fromPool;
    address toPool;
    uint256 amount;
    uint256 expectedAPY;
    uint256 timestamp;
    bool executed;
    string aiReasoning;      // AI explanation for decision
}
```

## Key Functions

### User Functions

**setUserStrategy(targetAPY, maxVolatility, minLiquidity, autoRebalance)**
- Define your personal yield optimization strategy
- Set risk parameters (volatility, liquidity)
- Enable/disable automatic rebalancing

**executeRebalance(proposalId)**
- Manually execute an AI-generated rebalancing proposal
- Proposals expire after 1 hour for security

### Admin/Oracle Functions

**registerPool(poolAddress, initialAPY, initialLiquidity)**
- Add new DeFi pool to the registry
- Set initial metrics for tracking

**updatePoolMetrics(poolAddress, newAPY, newLiquidity, newVolatility)**
- Update pool metrics from oracle data
- Triggers risk alert checks automatically

**proposeRebalance(user, fromPool, toPool, amount, expectedAPY, aiReasoning)**
- AI oracle generates rebalancing recommendation
- Includes detailed reasoning for transparency
- Auto-executes if user has autoRebalance enabled

### View Functions

**getPoolMetrics(poolAddress)**
- Returns: APY, liquidity, volatility, lastUpdate, active status

**getUserStrategy(user)**
- Returns: targetAPY, maxVolatility, minLiquidity, autoRebalance

**getProposal(proposalId)**
- Returns full proposal details including AI reasoning

**getActivePools()**
- Returns array of all active pool addresses

## Events

```solidity
event YieldUpdated(address indexed pool, uint256 newAPY, uint256 liquidity, uint256 volatility)
event RiskAlert(address indexed user, address indexed pool, string reason)
event RebalanceTriggered(uint256 indexed proposalId, address fromPool, address toPool, uint256 amount)
event RebalanceExecuted(uint256 indexed proposalId, address indexed user, uint256 actualAPY)
event AIVerdictReceived(uint256 indexed proposalId, string reasoning)
```

## Off-Chain AI Oracle Integration

### Current Implementation (Mock)

The current implementation uses a simplified mock oracle that accepts updates from the contract owner. In production, this would integrate with:

1. **Off-Chain AI Engine**: Machine learning models analyzing:
   - Historical APY trends
   - Liquidity flow patterns
   - Market volatility indicators
   - Cross-protocol risk correlations

2. **Data Sources**:
   - On-chain price feeds (Chainlink, etc.)
   - DEX liquidity pools
   - Lending protocol utilization rates
   - Historical transaction data

3. **Prediction Models**:
   - Time-series forecasting for APY
   - Risk assessment models
   - Optimal rebalancing timing
   - Gas cost optimization

### Future Integration Path

```
[On-Chain Metrics] → [AI Engine (Off-Chain)] → [Oracle] → [AIYieldManager]
                                ↓
                        [User Strategy]
                                ↓
                    [Rebalancing Proposal]
                                ↓
                    [Execution (On-Chain)]
```

## Frontend Integration

### AIDashboard Component

**Features:**
- Real-time pool metrics visualization
- Strategy configuration interface
- AI proposal review and approval
- Historical performance tracking

**Usage Example:**
```jsx
import AIDashboard from './v2/AIDashboard';

<AIDashboard provider={provider} account={account} />
```

**User Flow:**
1. Connect wallet
2. Set yield strategy (target APY, max volatility)
3. View available pools with live metrics
4. Review AI-generated rebalancing proposals
5. Approve or execute rebalances
6. Monitor performance and receive risk alerts

## Security Considerations

### Smart Contract Security

1. **ReentrancyGuard**: All state-changing functions protected
2. **Access Control**: Oracle operations restricted to authorized addresses
3. **Time-based Expiry**: Proposals expire to prevent stale executions
4. **Fee Limits**: Maximum rebalancing fee capped at 1%

### Oracle Security

1. **Trusted Oracle**: Only designated oracle can update metrics
2. **Rate Limiting**: Prevent oracle spam attacks
3. **Sanity Checks**: Validate metric ranges (APY, volatility)

### User Protection

1. **Strategy Validation**: Ensure sensible parameter ranges
2. **Proposal Preview**: Users can review before execution
3. **Manual Override**: Disable autoRebalance anytime
4. **Emergency Pause**: Owner can deactivate pools

### Risk Mitigation

1. **Diversification**: Never move 100% of funds
2. **Slippage Protection**: Account for execution costs
3. **Liquidity Checks**: Ensure sufficient pool liquidity
4. **Volatility Monitoring**: Alert users to high-risk conditions

## Gas Optimization

- Batch metric updates for multiple pools
- Efficient storage patterns (packed structs)
- Minimal on-chain computation
- Off-chain AI processing

## Testing Strategy

1. **Unit Tests**: Individual function validation
2. **Integration Tests**: Oracle interaction flows
3. **Simulation Tests**: Historical data backtesting
4. **Load Tests**: Multiple concurrent users
5. **Security Audits**: Third-party review recommended

## Roadmap

- [ ] Production AI oracle integration
- [ ] Multi-chain support
- [ ] Advanced ML models (LSTM, Transformers)
- [ ] Social trading (copy strategies)
- [ ] Mobile notifications for alerts
- [ ] DAO governance for oracle selection

## Example Usage Scenario

**Alice the Yield Farmer:**

1. Alice deposits 10,000 SGT into Pool A (15% APY)
2. Sets strategy: targetAPY=12%, maxVolatility=30%, autoRebalance=true
3. AI detects Pool B now offers 20% APY with lower volatility
4. Oracle proposes: Move 5,000 SGT from Pool A → Pool B
5. Reasoning: "Pool B has 30% more liquidity and stable APY trend"
6. Auto-execution moves funds, earning Alice 5% more yield
7. Risk alert: Pool A volatility spikes to 45%, exceeds threshold
8. Alice adjusts strategy or moves remaining funds

## Conclusion

The AI Yield Manager represents the next evolution in DeFi automation, combining on-chain transparency with off-chain intelligence to maximize yields while protecting users from excessive risk.
