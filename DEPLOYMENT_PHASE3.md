# ScrollGen Phase 3 - Deployment Guide

## 🚀 Quick Start Deployment

This guide covers deploying all Phase 3 contracts to Scroll Sepolia testnet.

---

## Prerequisites

### 1. Environment Setup

Ensure your `.env` file contains:

```env
# Existing Phase 1 & 2
VITE_CONTRACT_ADDRESS=0x458beBB9b528De802341b6c689b7Db0f19a15625
VITE_GENESIS_BADGE_ADDRESS=0xB019337963991C59f6245A1d739fF190a9842E99
VITE_NFT_STAKING_ADDRESS=0xC4106D4545e07503944c2eEB20C212d0c2F378Eb
VITE_NFT_MARKETPLACE_ADDRESS=0x2303db3293C97D21ae446E766f2b81DA09b42052

# Scroll Network
VITE_SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
VITE_CHAIN_ID=534351

# Deployment Account (add your private key)
PRIVATE_KEY=your_private_key_here

# Phase 3 (will be populated after deployment)
VITE_STAKING_REWARDS_ADDRESS=
VITE_LENDING_PROTOCOL_ADDRESS=
VITE_BRIDGE_CONNECTOR_ADDRESS=
VITE_ZK_VERIFIER_ADDRESS=
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npm run compile
```

---

## Deployment Steps

### Step 1: Deploy Phase 3 Contracts

```bash
npm run deploy:phase3
```

**Expected Output:**
```
🚀 Deploying ScrollGen Phase 3 Contracts to Scroll Sepolia...

Deploying with account: 0x...
Account balance: X.XX ETH

📋 Phase 1 SGT Token: 0x458beBB9b528De802341b6c689b7Db0f19a15625

============================================================

1️⃣  Deploying StakingRewards...
✅ StakingRewards deployed: 0x...

2️⃣  Deploying LendingProtocol...
✅ LendingProtocol deployed: 0x...

3️⃣  Configuring LendingProtocol assets...
✅ Added WETH as supported asset

4️⃣  Deploying BridgeConnector...
✅ BridgeConnector deployed: 0x...

5️⃣  Deploying ZKVerifier...
✅ ZKVerifier deployed: 0x...

============================================================

🎉 Phase 3 Deployment Complete!

📝 Contract Addresses:
────────────────────────────────────────────────────────────
StakingRewards:         0x...
LendingProtocol:        0x...
BridgeConnector:        0x...
ZKVerifier:             0x...
────────────────────────────────────────────────────────────
```

### Step 2: Update Environment Variables

Add the deployed addresses to your `.env` file:

```env
VITE_STAKING_REWARDS_ADDRESS=0x...
VITE_LENDING_PROTOCOL_ADDRESS=0x...
VITE_BRIDGE_CONNECTOR_ADDRESS=0x...
VITE_ZK_VERIFIER_ADDRESS=0x...
```

### Step 3: Update Frontend Configuration

Edit `frontend/src/config-phase3.js` with the deployed addresses.

### Step 4: Verify Contracts (Optional)

Verify on Scroll Sepolia Explorer:

```bash
npx hardhat verify --network scrollSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

**Example for StakingRewards:**
```bash
npx hardhat verify --network scrollSepolia \
  0xYOUR_STAKING_ADDRESS \
  0x458beBB9b528De802341b6c689b7Db0f19a15625 \
  0x458beBB9b528De802341b6c689b7Db0f19a15625 \
  "100000000000000000"
```

---

## Contract Details

### 1. StakingRewards

**Constructor Parameters:**
- `stakingToken`: 0x458beBB9b528De802341b6c689b7Db0f19a15625 (SGT)
- `rewardToken`: 0x458beBB9b528De802341b6c689b7Db0f19a15625 (SGT)
- `initialRewardRate`: 0.1 SGT per block (100000000000000000 wei)

**Initial Configuration:**
- Reward rate: 0.1 SGT/block
- Minimum stake: 100 SGT
- Lock durations: 0, 30, 90, 180, 365 days
- Multipliers: 1x, 1.5x, 2x, 3x, 5x

**Post-Deployment Actions:**
1. Transfer reward tokens to contract (e.g., 100,000 SGT)
   ```bash
   # Using interact script or directly:
   await sgtToken.transfer(stakingRewardsAddress, ethers.parseUnits("100000", 18));
   ```

### 2. LendingProtocol

**Constructor Parameters:**
- `collateralToken`: 0x458beBB9b528De802341b6c689b7Db0f19a15625 (SGT)

**Initial Configuration:**
- LTV Ratio: 66%
- Liquidation Threshold: 75%
- Liquidation Penalty: 10%
- Base Rate: 2%
- Optimal Utilization: 80%

**Supported Assets (configured during deployment):**
- WETH (Scroll Sepolia): 0x5300000000000000000000000000000000000004

**Post-Deployment Actions:**
1. Add more supported assets if needed:
   ```bash
   await lendingProtocol.addSupportedAsset(tokenAddress);
   ```

### 3. BridgeConnector

**Constructor Parameters:**
- `scrollMessenger`: 0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A

**Initial Configuration:**
- Deposit fee: 0 ETH
- Withdrawal fee: 0 ETH
- Withdrawal delay: 7 days

**Post-Deployment Actions:**
- No immediate actions required
- Monitor bridge transactions
- Adjust fees if needed

### 4. ZKVerifier

**Constructor Parameters:**
- None

**Initial Configuration:**
- No verifier contracts set initially

**Post-Deployment Actions:**
1. Compile ZK circuits (see ZK Setup section)
2. Deploy verifier contracts
3. Register verifiers:
   ```bash
   await zkVerifier.setVerifier(0, stakeProofVerifierAddress); // ProofType.StakeProof
   await zkVerifier.setVerifier(1, nftProofVerifierAddress);   // ProofType.NFTOwnership
   ```

---

## ZK Circuit Setup

### Prerequisites

```bash
# Install Circom
npm install -g circom

# Install SnarkJS
npm install -g snarkjs
```

### Step 1: Compile Circuits

```bash
# Create build directory
mkdir -p build/circuits

# Compile stakeProof circuit
circom circuits/stakeProof.circom --r1cs --wasm --sym -o build/circuits

# Compile nftOwnership circuit
circom circuits/nftOwnership.circom --r1cs --wasm --sym -o build/circuits
```

### Step 2: Powers of Tau Ceremony

```bash
# Start ceremony (do once for all circuits)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribute randomness
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau \
  --name="First contribution" -v

# Prepare for phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

### Step 3: Generate Proving & Verification Keys

**For stakeProof:**
```bash
# Setup
snarkjs groth16 setup build/circuits/stakeProof.r1cs pot12_final.ptau \
  stakeProof_0000.zkey

# Contribute
snarkjs zkey contribute stakeProof_0000.zkey stakeProof_final.zkey \
  --name="Circuit contribution" -v

# Export verification key
snarkjs zkey export verificationkey stakeProof_final.zkey \
  stakeProof_verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier stakeProof_final.zkey \
  contracts/StakeProofVerifier.sol
```

**For nftOwnership:**
```bash
# Setup
snarkjs groth16 setup build/circuits/nftOwnership.r1cs pot12_final.ptau \
  nftOwnership_0000.zkey

# Contribute
snarkjs zkey contribute nftOwnership_0000.zkey nftOwnership_final.zkey \
  --name="Circuit contribution" -v

# Export verification key
snarkjs zkey export verificationkey nftOwnership_final.zkey \
  nftOwnership_verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier nftOwnership_final.zkey \
  contracts/NFTOwnershipVerifier.sol
```

### Step 4: Deploy Verifier Contracts

```bash
# Deploy verifiers
npx hardhat run scripts/deploy-verifiers.js --network scrollSepolia

# Register with ZKVerifier
npx hardhat run scripts/register-verifiers.js --network scrollSepolia
```

---

## Testing Deployment

### Step 1: Test Staking

```bash
npm run interact:phase3

# Or manually:
node scripts/interact-phase3.cjs
```

### Step 2: Test Lending

```javascript
// Supply collateral
const supplyAmount = ethers.parseUnits("1000", 18);
await sgtToken.approve(lendingProtocolAddress, supplyAmount);
await lendingProtocol.supply(supplyAmount);

// Check supply
const supply = await lendingProtocol.supplies(userAddress);
console.log("Supplied:", ethers.formatUnits(supply.amount, 18));
```

### Step 3: Test Bridge Tracking

```javascript
// Initiate deposit tracking
const txHash = "0x..."; // Your L1 transaction hash
await bridgeConnector.initiateDeposit(
  ethers.parseUnits("1", 18),
  tokenAddress,
  txHash
);

// Check status
const status = await bridgeConnector.getTransactionStatus(txHash);
console.log("Status:", status);
```

---

## Frontend Setup

### Step 1: Update Configuration

Ensure all addresses are in `frontend/src/config-phase3.js`.

### Step 2: Build Frontend

```bash
npm run build
```

### Step 3: Test Locally

```bash
npm run dev
```

Navigate to `http://localhost:5173` and test:
- ✅ Dashboard displays portfolio
- ✅ Staking interface works
- ✅ Lending interface works
- ✅ Bridge interface displays transactions

---

## Contract Addresses (DEPLOYED)

### Scroll Sepolia Testnet

**Phase 1:**
- ScrollGenToken (SGT): `0x458beBB9b528De802341b6c689b7Db0f19a15625`

**Phase 2:**
- GenesisBadge (NFT): `0xB019337963991C59f6245A1d739fF190a9842E99`
- NFTStaking: `0xC4106D4545e07503944c2eEB20C212d0c2F378Eb`
- NFTMarketplace: `0x2303db3293C97D21ae446E766f2b81DA09b42052`

**Phase 3:** ✅ **DEPLOYED October 28, 2024**
- StakingRewards: `0xc295A7D3F75017846bF14e5F8a4De8ebB77C2748`
- LendingProtocol: `0x659243b57dda982070034e1E7e0C0DbE81CE880F`
- BridgeConnector: `0x56C03527EEF00dCFefefEa71a96227bbA20231dd`
- ZKVerifier: `0xeCCa6A5F020FA33fe18367C412981BF75036b578`

**ZK Verifiers:**
- StakeProofVerifier: `[PENDING - Circuit compilation required]`
- NFTOwnershipVerifier: `[PENDING - Circuit compilation required]`

### Deployment Verification

**View on Scroll Sepolia Explorer:**
- [StakingRewards](https://sepolia.scrollscan.com/address/0xc295A7D3F75017846bF14e5F8a4De8ebB77C2748)
- [LendingProtocol](https://sepolia.scrollscan.com/address/0x659243b57dda982070034e1E7e0C0DbE81CE880F)
- [BridgeConnector](https://sepolia.scrollscan.com/address/0x56C03527EEF00dCFefefEa71a96227bbA20231dd)
- [ZKVerifier](https://sepolia.scrollscan.com/address/0xeCCa6A5F020FA33fe18367C412981BF75036b578)

### Live Test Results ✅

**Deployment Account:** `0x15fAb9050d9Debc6F4675C0cC203d48E6f4D9b15`

**Test Transactions (October 28, 2024):**
1. **Staking Test**
   - Approve: `0x979a21fae187045112cf2223ba387ed2a0a118bcd58c9cf5ed1ccd9143af3a6c`
   - Stake 1000 SGT (90 days, 2x multiplier): `0x92d91b4c4a86505f5d82927430178af1d54e0a99ccc0e1cdfd4d15beee590a41`
   - Status: ✅ SUCCESS

2. **Lending Test**
   - Approve: `0xa2c405f3cd14aab6471ed2d4ae80aa8c27af0520868c6c653e31af84bb346c01`
   - Supply 500 SGT: `0x6e2a39319b97865d30f2f66a4b8a3d1c5ca4f974d1991035e588f7b8af693328`
   - Status: ✅ SUCCESS

3. **Bridge Test**
   - Initiate Deposit: `0x932887d27b9a9bf164d8a997ab44503fca3c588a954e2101c5d7bf17156ac14c`
   - Status: ✅ SUCCESS

**All contracts operational and tested on Scroll Sepolia!**

---

## Troubleshooting

### Deployment Fails

**Error: Insufficient funds**
- Solution: Add ETH to your deployment account
- Get testnet ETH from: https://scroll.io/bridge

**Error: Contract already deployed**
- Solution: Check if contracts already exist at expected addresses
- Remove old deployments if necessary

### Verification Fails

**Error: Contract not found**
- Solution: Wait a few blocks after deployment
- Ensure you're using the correct network

**Error: Constructor arguments don't match**
- Solution: Double-check constructor parameters
- Use exact values from deployment transaction

### ZK Circuit Compilation Fails

**Error: Circom not found**
- Solution: Install circom globally: `npm install -g circom`

**Error: R1CS compilation error**
- Solution: Check circuit syntax
- Ensure all libraries are available

---

## Security Checklist

Before mainnet deployment:

- [ ] All tests passing
- [ ] External security audit completed
- [ ] Bug bounty program launched
- [ ] ZK trusted setup ceremony completed
- [ ] Emergency pause mechanism tested
- [ ] Access control verified
- [ ] Reentrancy guards in place
- [ ] Integer overflow checks
- [ ] Gas optimization completed
- [ ] Documentation reviewed

---

## Post-Deployment Actions

### Immediate (Day 1)
1. ✅ Verify all contracts on explorer
2. ✅ Fund StakingRewards with reward tokens
3. ✅ Test all contract interactions
4. ✅ Update documentation with addresses
5. ✅ Announce deployment to community

### Short Term (Week 1)
1. Monitor contract activity
2. Watch for any errors or issues
3. Collect user feedback
4. Optimize gas costs if needed
5. Begin ZK circuit setup

### Medium Term (Month 1)
1. Complete ZK verifier deployment
2. Test privacy features
3. Gather TVL metrics
4. Plan Phase 4 features
5. Prepare for mainnet

---

## Support & Resources

- **Documentation**: `/docs` directory
- **Deployment Scripts**: `/scripts/deploy-phase3.cjs`
- **Interaction Scripts**: `/scripts/interact-phase3.cjs`
- **Test Suites**: `/test` directory
- **Frontend**: `/frontend/src`

---

**Deployment prepared on:** October 28, 2024
**Network**: Scroll Sepolia Testnet
**Status**: Ready for deployment

**🚀 Ready to deploy ScrollGen Phase 3!**
