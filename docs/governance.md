# Governance Documentation

## Overview

This document outlines the future governance structure for ScrollGen. While governance features are planned for **Phase 3**, this documentation establishes the framework and principles that will guide community-driven decision making.

**Status:** Planning Phase
**Target Launch:** Q3 2024

---

## Governance Philosophy

### Core Principles

1. **Decentralization**: No single entity controls the protocol
2. **Transparency**: All decisions made publicly on-chain
3. **Inclusivity**: Every token holder has a voice
4. **Security**: Time-delays and safeguards prevent hasty decisions
5. **Flexibility**: Governance can evolve as needs change

### Token-Based Voting

ScrollGen will implement a **token-weighted governance** system where:
- 1 SGT = 1 vote
- Voting power is proportional to holdings
- Delegated voting is supported
- Participation is incentivized

---

## Governance Structure

### Three-Tier System

```
┌─────────────────────────────────────┐
│   Community (SGT Holders)           │
│   - Create proposals                │
│   - Vote on decisions               │
│   - Delegate voting power           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Governor Contract                 │
│   - Validates proposals             │
│   - Tallies votes                   │
│   - Enforces quorum                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Timelock Contract                 │
│   - Delays execution                │
│   - Allows for review               │
│   - Emergency cancellation          │
└─────────────────────────────────────┘
```

---

## Proposal Process

### 1. Proposal Creation

**Requirements:**
- Hold minimum 10,000 SGT (adjustable)
- Provide detailed proposal description
- Specify executable actions
- Include rationale and expected impact

**Proposal Format:**
```markdown
Title: [Clear, concise title]
Author: [Address or identifier]
Type: [Protocol Upgrade / Treasury / Parameter Change / Emergency]
Status: [Draft / Active / Passed / Failed / Executed]

## Summary
Brief overview of the proposal

## Motivation
Why this proposal is needed

## Specification
Technical details and implementation

## Impact Analysis
Expected outcomes and risks

## Voting Options
- For
- Against
- Abstain
```

### 2. Discussion Period

**Duration:** 3 days

- Proposal published to community
- Open forum for questions and feedback
- Author can make clarifications
- Community sentiment gauged

### 3. Voting Period

**Duration:** 7 days

- On-chain voting opens
- Votes weighted by SGT holdings
- Voting power calculated at proposal start
- Votes are final and cannot be changed

### 4. Timelock Period

**Duration:** 2 days

- Passed proposals enter timelock
- Community can review upcoming changes
- Emergency cancellation possible (requires 2/3 majority)
- Countdown to execution

### 5. Execution

**Automatic Execution:**
- Smart contract executes proposal actions
- Changes take effect immediately
- Transaction recorded on-chain
- Community notified of completion

---

## Voting Mechanics

### Voting Power

Your voting power is determined by:

```
Voting Power = SGT Balance at Proposal Snapshot
```

**Snapshot:** Taken when voting begins to prevent manipulation

### Delegation

Can't vote yourself? Delegate your voting power:

```javascript
// Delegate your votes to another address
await governorContract.delegate(delegateAddress);

// Delegate to yourself (default)
await governorContract.delegate(yourAddress);
```

**Benefits of Delegation:**
- Participate even when unavailable
- Support trusted community members
- Maintain protocol security
- Can be changed anytime

### Quorum Requirements

For a proposal to pass:

1. **Minimum Participation:** 4% of total supply must vote
2. **Simple Majority:** >50% of votes must be "For"
3. **Both conditions** must be met

**Example:**
```
Total Supply: 1,000,000 SGT
Quorum Requirement: 40,000 SGT must vote

Votes Cast:
- For: 30,000 SGT
- Against: 15,000 SGT
- Total: 45,000 SGT ✓ (exceeds quorum)

Result: PASSED (66.7% in favor)
```

---

## Governance Parameters

### Initial Settings

| Parameter | Value | Adjustable | Method |
|-----------|-------|-----------|---------|
| Proposal Threshold | 10,000 SGT | Yes | Governance vote |
| Discussion Period | 3 days | Yes | Governance vote |
| Voting Period | 7 days | Yes | Governance vote |
| Timelock Delay | 2 days | Yes | Governance vote |
| Quorum | 4% of supply | Yes | Governance vote |
| Vote Delegation | Enabled | No | Hardcoded |

### Parameter Changes

Governance can adjust its own parameters through proposals:

```solidity
// Example: Proposal to increase voting period
function updateVotingPeriod(uint256 newPeriod) external onlyGovernance {
    require(newPeriod >= 3 days && newPeriod <= 14 days);
    votingPeriod = newPeriod;
}
```

---

## Proposal Types

### 1. Protocol Upgrades

**Purpose:** Add new features or contracts

**Examples:**
- Deploy new staking contract
- Add NFT minting functionality
- Integrate with external protocol

**Requirements:**
- Detailed technical specification
- Security audit (for major changes)
- Testing results
- Migration plan (if needed)

### 2. Treasury Allocation

**Purpose:** Spend community funds

**Examples:**
- Fund development grant
- Marketing campaign budget
- Security audit payment
- Community rewards

**Requirements:**
- Clear budget breakdown
- Expected outcomes
- Progress milestones
- Accountability measures

### 3. Parameter Changes

**Purpose:** Adjust protocol settings

**Examples:**
- Change staking APY
- Modify fee structure
- Update governance parameters
- Adjust minting caps

**Requirements:**
- Impact analysis
- Data supporting change
- Comparison to current state
- Rollback plan if needed

### 4. Emergency Actions

**Purpose:** Respond to security threats

**Examples:**
- Pause vulnerable contract
- Emergency fund rescue
- Address critical bug
- Implement security patch

**Requirements:**
- Immediate threat documentation
- Emergency multisig approval
- Expedited voting (24 hours)
- Post-mortem report required

---

## Treasury Management

### Multi-Sig Treasury

**Configuration:**
- 5 trusted community members
- 3 of 5 signatures required
- Signers elected by governance
- 6-month terms with rotation

**Responsibilities:**
- Execute passed proposals
- Manage community funds
- Report monthly to community
- Emergency response coordination

### Fund Allocation

**Treasury Sources:**
- Protocol fees
- Token sale proceeds
- Grants and donations
- DeFi yield generation

**Spending Categories:**
```
Development:     40%
Security:        20%
Marketing:       15%
Operations:      15%
Reserve:         10%
```

*Allocations adjustable by governance*

---

## Security Measures

### Timelock Protection

All governance actions pass through a timelock:

- **Prevents:** Surprise malicious changes
- **Allows:** Community review before execution
- **Enables:** Emergency cancellation if needed

### Emergency Pause

In critical situations, emergency multisig can:

- Pause specific contracts
- Cancel pending proposals
- Trigger emergency procedures

**Limitations:**
- Cannot access user funds
- Cannot execute arbitrary code
- Must report to community
- Subject to governance review

### Veto Rights (Early Phase)

During initial governance launch:

- Development team retains temporary veto
- Only for security-critical issues
- Expires after 6 months
- Requires public justification

---

## Participation Incentives

### Vote Rewards (Planned)

**Participation NFT:**
- Mint NFT for voting in 10 proposals
- Evolves with continued participation
- Grants special community privileges

**Vote-to-Earn:**
- Small SGT rewards for voting
- Bonus for consistent participation
- Rewards distributed quarterly

### Delegation Benefits

**For Delegates:**
- Recognition as community leader
- Access to delegate-only channels
- Early preview of proposals
- Increased visibility

**For Delegators:**
- Earn participation rewards
- Support trusted members
- Maintain voting power
- Change delegation anytime

---

## Governance Tools

### Planned Infrastructure

#### On-Chain
- Governor smart contract (OpenZeppelin)
- Timelock controller
- Token voting power tracking
- Proposal storage

#### Off-Chain
- Discussion forum (Discourse)
- Snapshot voting (off-chain signaling)
- Governance dashboard
- Analytics and reporting

#### Integrations
- Tally (governance frontend)
- Snapshot (gasless voting)
- Discord notifications
- Email alerts

---

## Best Practices

### For Proposers

1. **Research thoroughly** before proposing
2. **Engage with community** during discussion
3. **Provide clear rationale** and data
4. **Be responsive** to feedback
5. **Follow proposal template** exactly

### For Voters

1. **Read full proposal** before voting
2. **Participate in discussions** when possible
3. **Vote on every proposal** you can
4. **Delegate wisely** if unable to participate
5. **Hold proposers accountable** post-execution

### For Delegates

1. **Explain your votes** publicly
2. **Represent delegators** fairly
3. **Stay active** and engaged
4. **Be transparent** about conflicts
5. **Report regularly** to supporters

---

## Future Enhancements

### Phase 3 Launch
- Basic governor contract
- Simple proposal system
- Token-weighted voting
- Timelock protection

### Post-Launch
- Quadratic voting exploration
- Reputation-weighted voting
- Conviction voting for funding
- Multi-DAO federation

### Long-Term Vision
- Cross-chain governance
- AI-assisted proposal analysis
- Automated impact tracking
- Governance v2 improvements

---

## Getting Involved

### Current Phase (Phase 1)

While governance is not yet active, you can:

- Join community discussions
- Provide feedback on governance design
- Participate in off-chain signaling
- Build reputation as contributor

### Pre-Governance Testing

- Testnet governance trials
- Mock proposal exercises
- Voting simulations
- Process refinement

---

## Resources

### Documentation
- [Governor Contract Spec](./future-specs/governor.md)
- [Timelock Documentation](./future-specs/timelock.md)
- [Proposal Templates](./future-specs/templates.md)

### External Resources
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/4.x/governance)
- [Compound Governance](https://compound.finance/governance)
- [Tally Documentation](https://docs.tally.xyz/)

---

**Governance is coming. Start preparing now! 🏛️**

*Last Updated: January 2024*
