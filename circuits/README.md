# ScrollGen ZK Circuits

This directory contains Circom circuits for zero-knowledge proofs in ScrollGen Phase 3.

## Circuits

### 1. stakeProof.circom
Proves that a user has staked at least a certain amount without revealing the exact stake.

**Private Inputs:**
- `stakeAmount`: Actual amount staked
- `nullifier`: Unique identifier to prevent proof reuse
- `secret`: Random secret for commitment

**Public Inputs:**
- `threshold`: Minimum required stake amount

**Outputs:**
- `commitment`: Poseidon hash commitment
- `isValid`: Boolean indicating if stake >= threshold

### 2. nftOwnership.circom
Proves ownership of an NFT with a specific tier without revealing the token ID.

**Private Inputs:**
- `tokenId`: The NFT token ID
- `tier`: The NFT tier (0-4)
- `secret`: Random secret for commitment
- `nullifier`: Unique identifier

**Public Inputs:**
- `minTier`: Minimum required tier

**Outputs:**
- `commitment`: Poseidon hash commitment
- `isValid`: Boolean indicating if tier >= minTier

## Setup Instructions

### Prerequisites

```bash
npm install -g snarkjs
npm install -g circom
```

### Compile Circuits

```bash
# Compile stakeProof circuit
circom circuits/stakeProof.circom --r1cs --wasm --sym -o build/circuits

# Compile nftOwnership circuit
circom circuits/nftOwnership.circom --r1cs --wasm --sym -o build/circuits
```

### Generate Proving and Verification Keys

```bash
# Start Powers of Tau ceremony (do once)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Generate keys for stakeProof
snarkjs groth16 setup build/circuits/stakeProof.r1cs pot12_final.ptau stakeProof_0000.zkey
snarkjs zkey contribute stakeProof_0000.zkey stakeProof_final.zkey --name="Circuit contribution" -v
snarkjs zkey export verificationkey stakeProof_final.zkey stakeProof_verification_key.json

# Generate keys for nftOwnership
snarkjs groth16 setup build/circuits/nftOwnership.r1cs pot12_final.ptau nftOwnership_0000.zkey
snarkjs zkey contribute nftOwnership_0000.zkey nftOwnership_final.zkey --name="Circuit contribution" -v
snarkjs zkey export verificationkey nftOwnership_final.zkey nftOwnership_verification_key.json
```

### Generate Solidity Verifiers

```bash
# Generate verifier contracts
snarkjs zkey export solidityverifier stakeProof_final.zkey contracts/StakeProofVerifier.sol
snarkjs zkey export solidityverifier nftOwnership_final.zkey contracts/NFTOwnershipVerifier.sol
```

## Usage Example

### JavaScript (Frontend)

```javascript
import { groth16 } from 'snarkjs';

// Generate proof
const input = {
  stakeAmount: "5000",
  nullifier: "12345",
  secret: "67890",
  threshold: "1000"
};

const { proof, publicSignals } = await groth16.fullProve(
  input,
  "stakeProof.wasm",
  "stakeProof_final.zkey"
);

// Submit to contract
await zkVerifier.verifyStakeProof(
  [proof.pi_a[0], proof.pi_a[1]],
  [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
  [proof.pi_c[0], proof.pi_c[1]],
  publicSignals,
  nullifier
);
```

## Security Considerations

1. **Trusted Setup**: The Powers of Tau ceremony must be performed securely
2. **Nullifiers**: Always use unique nullifiers to prevent proof reuse
3. **Secret**: Generate secrets using cryptographically secure random number generators
4. **Circuit Audits**: Have circuits audited before mainnet deployment

## Resources

- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS](https://github.com/iden3/snarkjs)
- [circomlib](https://github.com/iden3/circomlib)
- [ZK Security](https://www.zksecurity.xyz/)
