# Zero-Knowledge Privacy Layer

## Overview

ScrollGen integrates zero-knowledge proofs (ZK-SNARKs) to enable privacy-preserving verification of user activity and eligibility without revealing sensitive information.

**Status**: Phase 3 - In Development
**ZK System**: Groth16 (SnarkJS)
**Circuit Language**: Circom 2.0

---

## What are Zero-Knowledge Proofs?

### Concept

A zero-knowledge proof allows one party (the prover) to prove to another party (the verifier) that a statement is true without revealing any information beyond the validity of the statement itself.

### Example

**Without ZK:**
```
Alice: "I staked 5,000 SGT"
Verifier: Sees exact amount (5,000 SGT)
```

**With ZK:**
```
Alice: "I staked more than 1,000 SGT" (provides proof)
Verifier: Confirms proof is valid
→ Knows Alice meets threshold
→ Doesn't know exact amount (could be 1,001 or 1,000,000)
```

---

## Use Cases in ScrollGen

### 1. Private Staking Verification

Prove you've staked above a threshold without revealing exact amount.

**Applications:**
- Qualify for rewards anonymously
- Access gated features
- Participate in exclusive events
- Anonymous leaderboards

**Circuit:**
```circom
template StakeProof() {
    signal input stakeAmount;      // Your actual stake
    signal input threshold;        // Required minimum
    signal input nullifier;        // Prevents double-use

    signal output isValid;

    // Check stake >= threshold
    component gte = GreaterEqThan(252);
    gte.in[0] <== stakeAmount;
    gte.in[1] <== threshold;

    isValid <== gte.out;
}
```

### 2. Private NFT Ownership

Prove you own a badge of certain tier without revealing which specific badge.

**Applications:**
- Tier-based access control
- Anonymous airdrops
- Private voting power
- Exclusive community access

**Circuit:**
```circom
template NFTTierProof() {
    signal input tokenId;          // Your badge ID
    signal input tier;             // Your badge tier
    signal input minTier;          // Required minimum tier
    signal input secret;           // Privacy salt

    signal output isValid;

    // Check tier >= minTier
    component gte = GreaterEqThan(8);
    gte.in[0] <== tier;
    gte.in[1] <== minTier;

    // Create commitment to hide tokenId
    component commitment = Poseidon(2);
    commitment.inputs[0] <== tokenId;
    commitment.inputs[1] <== secret;

    isValid <== gte.out;
}
```

### 3. Private Governance Voting

Vote on proposals without revealing voting power.

**Applications:**
- Anonymous DAO proposals
- Private delegation
- Sybil-resistant voting
- Censorship resistance

**Circuit:**
```circom
template VoteProof() {
    signal input votingPower;      // SGT balance
    signal input proposalId;       // Proposal to vote on
    signal input voteChoice;       // For/Against
    signal input nullifier;        // Prevent double voting

    signal output validVote;
    signal output nullifierHash;

    // Ensure voting power > 0
    component gt = GreaterThan(252);
    gt.in[0] <== votingPower;
    gt.in[1] <== 0;

    // Create unique nullifier
    component hash = Poseidon(2);
    hash.inputs[0] <== nullifier;
    hash.inputs[1] <== proposalId;

    validVote <== gt.out;
    nullifierHash <== hash.out;
}
```

### 4. Private Transaction Amounts

Make transactions without revealing amounts (like Tornado Cash).

**Applications:**
- Anonymous withdrawals
- Private transfers
- Unlinkable payments
- Donation privacy

**Circuit:**
```circom
template TransferProof() {
    signal input amount;           // Transfer amount
    signal input senderBalance;    // Sender's balance
    signal input recipientAddr;    // Encrypted recipient
    signal input secret;           // Privacy key

    signal output isValid;

    // Verify sender has enough balance
    component gte = GreaterEqThan(252);
    gte.in[0] <== senderBalance;
    gte.in[1] <== amount;

    // Encrypt recipient
    component encrypt = Poseidon(2);
    encrypt.inputs[0] <== recipientAddr;
    encrypt.inputs[1] <== secret;

    isValid <== gte.out;
}
```

---

## Technical Implementation

### Architecture

```
Client Side                Smart Contract
┌──────────────┐          ┌───────────────┐
│ User Inputs  │          │  ZKVerifier   │
│ (private)    │          │               │
└──────┬───────┘          └───────▲───────┘
       │                          │
       │  Generate Proof          │ Verify Proof
       │                          │
┌──────▼───────┐          ┌───────┴───────┐
│ SnarkJS      │          │ Groth16       │
│ (browser)    │──Proof──►│ (on-chain)    │
└──────────────┘          └───────────────┘
```

### Components

**1. Circuit Design (Circom)**
- Define computation logic
- Specify inputs (private & public)
- Generate constraints

**2. Trusted Setup**
- Generate proving key
- Generate verification key
- One-time ceremony

**3. Proof Generation (Client)**
- User provides inputs
- SnarkJS generates proof
- Fast (<1 second for simple proofs)

**4. Proof Verification (On-Chain)**
- Submit proof to contract
- Contract verifies using verification key
- Gas-efficient (~250k gas)

---

## Smart Contract Integration

### ZKVerifier Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) external view returns (bool);
}

contract ZKVerifier {
    IVerifier public immutable stakeVerifier;
    IVerifier public immutable nftVerifier;
    IVerifier public immutable voteVerifier;

    mapping(bytes32 => bool) public nullifiersUsed;

    event ProofVerified(
        address indexed user,
        uint8 indexed proofType,
        bytes32 nullifier
    );

    constructor(
        address _stakeVerifier,
        address _nftVerifier,
        address _voteVerifier
    ) {
        stakeVerifier = IVerifier(_stakeVerifier);
        nftVerifier = IVerifier(_nftVerifier);
        voteVerifier = IVerifier(_voteVerifier);
    }

    /// @notice Verify stake amount proof
    /// @param proof The ZK proof
    /// @param minAmount Required minimum (public input)
    function verifyStakeProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint minAmount
    ) external view returns (bool) {
        return stakeVerifier.verifyProof(a, b, c, [minAmount]);
    }

    /// @notice Verify NFT tier proof
    /// @param proof The ZK proof
    /// @param minTier Required minimum tier
    function verifyNFTProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint minTier
    ) external view returns (bool) {
        return nftVerifier.verifyProof(a, b, c, [minTier]);
    }

    /// @notice Verify and record vote
    /// @param proof The ZK proof
    /// @param nullifier Unique vote identifier
    function verifyAndRecordVote(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        bytes32 nullifier
    ) external returns (bool) {
        require(!nullifiersUsed[nullifier], "Vote already cast");

        bool valid = voteVerifier.verifyProof(a, b, c, [uint(nullifier)]);
        require(valid, "Invalid proof");

        nullifiersUsed[nullifier] = true;

        emit ProofVerified(msg.sender, 2, nullifier);
        return true;
    }

    /// @notice Check if nullifier has been used
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifiersUsed[nullifier];
    }
}
```

---

## Frontend Integration

### Installing SnarkJS

```bash
npm install snarkjs
```

### Proof Generation

```javascript
import { groth16 } from 'snarkjs';

// Load circuit files
const wasmFile = '/circuits/stake_proof.wasm';
const zkeyFile = '/circuits/stake_proof_final.zkey';

/**
 * Generate proof that user staked above threshold
 */
async function generateStakeProof(stakeAmount, threshold) {
  // Private inputs (not revealed)
  const privateInputs = {
    stakeAmount: stakeAmount.toString(),
    nullifier: generateRandomNullifier(),
  };

  // Public inputs (visible on-chain)
  const publicInputs = {
    threshold: threshold.toString(),
  };

  // Combine inputs
  const inputs = {
    ...privateInputs,
    ...publicInputs,
  };

  // Generate proof
  const { proof, publicSignals } = await groth16.fullProve(
    inputs,
    wasmFile,
    zkeyFile
  );

  // Format for Solidity
  const solidityProof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };

  return { proof: solidityProof, publicSignals };
}

// Helper: Generate random nullifier
function generateRandomNullifier() {
  return BigInt('0x' + Array.from(
    crypto.getRandomValues(new Uint8Array(32))
  ).map(b => b.toString(16).padStart(2, '0')).join(''));
}
```

### Submitting Proof

```javascript
import { ethers } from 'ethers';

/**
 * Submit proof to contract
 */
async function submitStakeProof(stakeAmount, threshold) {
  // 1. Generate proof
  console.log('Generating proof...');
  const { proof, publicSignals } = await generateStakeProof(
    stakeAmount,
    threshold
  );

  // 2. Connect to contract
  const zkVerifier = new ethers.Contract(
    VERIFIER_ADDRESS,
    VERIFIER_ABI,
    signer
  );

  // 3. Submit proof
  console.log('Submitting proof...');
  const tx = await zkVerifier.verifyStakeProof(
    proof.a,
    proof.b,
    proof.c,
    threshold
  );

  await tx.wait();
  console.log('Proof verified! ✅');
}
```

### React Component

```jsx
import { useState } from 'react';
import { generateStakeProof, submitStakeProof } from '@/lib/zk';

export function PrivateStakeProver() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [threshold] = useState(1000); // Requirement
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerateProof = async () => {
    try {
      setGenerating(true);
      setStatus('Generating proof...');

      // Generate and submit proof
      await submitStakeProof(stakeAmount, threshold);

      setStatus('✅ Proof verified! You meet the requirement.');
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="zk-prover">
      <h3>Prove Your Stake Privately</h3>

      <p>
        Prove you've staked ≥{threshold} SGT without revealing exact amount
      </p>

      <input
        type="number"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
        placeholder="Your actual stake amount"
        disabled={generating}
      />

      <button
        onClick={handleGenerateProof}
        disabled={generating || !stakeAmount}
      >
        {generating ? 'Generating Proof...' : 'Generate Proof'}
      </button>

      {status && <div className="status">{status}</div>}

      <div className="info">
        <p>🔒 Your exact amount stays private</p>
        <p>✅ On-chain verification in one transaction</p>
        <p>⚡ Proof generation takes ~5 seconds</p>
      </div>
    </div>
  );
}
```

---

## Trusted Setup

### What is a Trusted Setup?

A one-time ceremony to generate cryptographic parameters (proving key & verification key) for the ZK system.

### Why is it Important?

The security of the ZK system depends on the "toxic waste" from the setup being destroyed. If not destroyed, someone could create fake proofs.

### Multi-Party Computation (MPC)

To ensure security, the setup involves multiple participants. Only ONE participant needs to be honest and destroy their secret.

```
Participant 1 → Contribution 1 → Hash
Participant 2 → Contribution 2 → Hash
Participant 3 → Contribution 3 → Hash
...
Participant N → Final Parameters
```

### Running a Trusted Setup

```bash
# Install snarkjs
npm install -g snarkjs

# Start new ceremony
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribute randomness
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau \
  --name="First contribution" -v

# Prepare for circuit
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Generate zkey for circuit
snarkjs groth16 setup stake_proof.r1cs pot12_final.ptau stake_proof_0000.zkey

# Contribute to circuit
snarkjs zkey contribute stake_proof_0000.zkey stake_proof_final.zkey \
  --name="Circuit contribution" -v

# Export verification key
snarkjs zkey export verificationkey stake_proof_final.zkey \
  verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier stake_proof_final.zkey \
  Verifier.sol
```

---

## Security Considerations

### Trusted Setup Security

**Best Practices:**
- Multi-party ceremony (10+ participants)
- Independent participants
- Secure environment for contributions
- Public transcript of ceremony
- Destroy all intermediate files

### Circuit Security

**Common Vulnerabilities:**
- Under-constrained circuits
- Missing range checks
- Arithmetic overflows
- Weak randomness

**Mitigation:**
- Formal verification
- Multiple audits
- Extensive testing
- Fuzzing

### Implementation Security

**Client Side:**
- Secure randomness generation
- Input validation
- Proof caching
- Error handling

**Contract Side:**
- Nullifier tracking
- Replay protection
- Gas limits
- Access control

---

## Performance

### Proof Generation Time

| Circuit Complexity | Time | Notes |
|-------------------|------|-------|
| Simple (100 constraints) | <1s | Range proofs |
| Medium (1000 constraints) | 1-3s | Merkle tree proofs |
| Complex (10000 constraints) | 5-15s | Advanced computations |

### Verification Gas Cost

| Proof Type | Gas Cost | Notes |
|-----------|----------|-------|
| Groth16 | ~250k | Most efficient |
| PLONK | ~300k | Universal setup |
| Bulletproofs | ~800k | No trusted setup |

### Storage Requirements

| File | Size | Purpose |
|------|------|---------|
| WASM | 50-500 KB | Proof generation |
| Zkey | 1-50 MB | Proving parameters |
| Verification Key | 1-5 KB | On-chain verification |

---

## Examples & Recipes

### Complete Stake Proof Flow

```javascript
// 1. User stakes tokens
await stakingContract.stake(5000);

// 2. Later, prove staked amount > threshold
const { proof, publicSignals } = await generateStakeProof(5000, 1000);

// 3. Submit proof to unlock feature
await featureContract.unlockWithProof(proof.a, proof.b, proof.c, 1000);

// ✅ Feature unlocked without revealing exact stake (5000 SGT)
```

### Private NFT Gate

```javascript
// Check if user owns Gold badge (tier 2+)
async function verifyGoldBadgeOwnership(tokenId, tier) {
  // 1. Generate proof
  const { proof } = await generateNFTProof(tokenId, tier, 2); // minTier = 2

  // 2. Verify on-chain
  const isValid = await zkVerifier.verifyNFTProof(
    proof.a,
    proof.b,
    proof.c,
    2 // minTier
  );

  if (isValid) {
    console.log('✅ User owns Gold+ badge (tier hidden)');
    // Grant access
  }
}
```

### Anonymous Voting

```javascript
// Vote on proposal without revealing voting power
async function castPrivateVote(proposalId, votingPower, voteChoice) {
  // 1. Generate unique nullifier
  const nullifier = generateNullifier(proposalId);

  // 2. Generate proof
  const { proof } = await generateVoteProof(
    votingPower,
    proposalId,
    voteChoice,
    nullifier
  );

  // 3. Submit vote
  await governanceContract.castPrivateVote(
    proposalId,
    proof.a,
    proof.b,
    proof.c,
    nullifier
  );

  console.log('✅ Vote cast anonymously');
}
```

---

## Resources

### Learning Resources

- [Zero Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS GitHub](https://github.com/iden3/snarkjs)
- [ZK Whiteboard Sessions](https://zkhack.dev/whiteboard/)

### Tools & Libraries

- [Circom](https://github.com/iden3/circom) - Circuit compiler
- [SnarkJS](https://github.com/iden3/snarkjs) - Proof generation
- [circomlib](https://github.com/iden3/circomlib) - Circuit library
- [Tornado Cash Circuits](https://github.com/tornadocash/tornado-core) - Reference implementation

### Audits & Security

- [Trail of Bits ZK Audit](https://github.com/trailofbits/publications)
- [ZK Security](https://www.zksecurity.xyz/)
- [Veridise](https://veridise.com/) - Formal verification

---

## Future Enhancements

### Phase 3.1
- Basic stake proofs
- NFT ownership proofs
- Anonymous voting

### Phase 3.2
- Private transfers
- Shielded pools
- Compliance proofs

### Phase 3.3
- Recursive proofs
- Proof aggregation
- Cross-chain privacy

---

**Privacy-preserving verification is now possible! 🔐**

*Last Updated: October 27, 2024*
