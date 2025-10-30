# Scroll Bridge Integration

## Overview

ScrollGen integrates with the official Scroll bridge to enable seamless cross-chain transfers between Ethereum (L1) and Scroll (L2).

**Status**: Phase 3 - In Development
**Bridge Type**: Native Scroll Bridge
**Supported Assets**: ETH, SGT (wrapped)

---

## How the Scroll Bridge Works

### Architecture

```
Ethereum (L1)          Scroll (L2)
     │                      │
     │                      │
┌────▼────┐          ┌─────▼────┐
│ L1 Bridge│◄────────►│ L2 Bridge│
│ Contract │          │ Contract │
└─────────┘          └──────────┘
     │                      │
     │   Message Relay      │
     │◄────────────────────►│
     │                      │
```

### Key Components

1. **L1 Bridge Contract**: Locks assets on Ethereum
2. **L2 Bridge Contract**: Mints corresponding assets on Scroll
3. **Message Relay**: Passes messages between chains
4. **Batch System**: Aggregates transactions for efficiency

---

## Depositing to Scroll (L1 → L2)

### Process

1. **User Initiates**: Send ETH/tokens to L1 bridge
2. **Asset Locked**: Funds locked in L1 contract
3. **Message Sent**: Cross-chain message created
4. **Batch Included**: Transaction added to batch
5. **Batch Finalized**: Batch committed to L2
6. **Assets Minted**: Equivalent assets minted on Scroll

### Timing

- **Confirmation**: 1-2 blocks on Ethereum (~15-30 seconds)
- **Batch Finalization**: 5-15 minutes (depends on batch schedule)
- **Total Time**: ~10-20 minutes

### Fees

```
Total Cost = L1 Gas Fee + L2 Gas Fee + Bridge Fee

Example:
- L1 Gas: ~$5 (100,000 gas @ 50 gwei)
- L2 Gas: ~$0.10 (prepaid)
- Bridge Fee: Free
Total: ~$5.10
```

### Code Example

```javascript
import { ScrollBridge } from '@scroll-tech/bridge-sdk';
import { ethers } from 'ethers';

// Initialize bridge
const bridge = new ScrollBridge({
  l1Provider: new ethers.providers.JsonRpcProvider(L1_RPC),
  l2Provider: new ethers.providers.JsonRpcProvider(L2_RPC),
  l1Signer: wallet,
});

// Deposit ETH
const depositTx = await bridge.depositETH(
  ethers.parseEther("1.0"), // 1 ETH
  {
    gasLimit: 200000,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
  }
);

await depositTx.wait();
console.log("Deposit initiated:", depositTx.hash);

// Track status
const status = await bridge.getDepositStatus(depositTx.hash);
console.log("Status:", status);
// Possible values: "pending", "confirmed", "finalized", "completed"
```

---

## Withdrawing to Ethereum (L2 → L1)

### Process

1. **User Initiates**: Send withdrawal request on Scroll
2. **Message Created**: Withdrawal message generated
3. **Challenge Period**: 7-day security delay
4. **Proof Generation**: Merkle proof created
5. **Claim on L1**: User claims assets on Ethereum

### Timing

- **L2 Confirmation**: Instant
- **Challenge Period**: 7 days (security measure)
- **L1 Claim**: User-initiated (after challenge period)
- **Total Time**: ~7 days + claim time

### Why 7 Days?

The challenge period allows validators to detect and prevent invalid withdrawals, ensuring security.

### Fees

```
Total Cost = L2 Gas Fee + L1 Claim Fee

Example:
- L2 Gas: ~$0.05 (withdrawal initiation)
- L1 Claim: ~$8 (150,000 gas @ 50 gwei)
Total: ~$8.05
```

### Code Example

```javascript
// Initiate withdrawal on Scroll (L2)
const withdrawTx = await bridge.withdrawETH(
  ethers.parseEther("1.0"), // 1 ETH
  {
    gasLimit: 100000,
  }
);

await withdrawTx.wait();
console.log("Withdrawal initiated:", withdrawTx.hash);

// Wait for challenge period (7 days)
await new Promise(resolve => setTimeout(resolve, 7 * 24 * 60 * 60 * 1000));

// Generate proof (after challenge period)
const proof = await bridge.getWithdrawalProof(withdrawTx.hash);

// Claim on Ethereum (L1)
const claimTx = await bridge.claimWithdrawal(proof, {
  gasLimit: 200000,
});

await claimTx.wait();
console.log("Withdrawal claimed:", claimTx.hash);
```

---

## Bridging SGT Tokens

### Process Overview

SGT is an L2-native token. To bridge SGT to Ethereum:

1. **Wrap on L2**: Convert SGT → wSGT (wrapped)
2. **Bridge wSGT**: Use standard bridge process
3. **Unwrap on L1**: Convert wSGT → SGT

### Code Example

```javascript
// 1. Wrap SGT on Scroll
await sgtContract.approve(wrapperAddress, amount);
await wrapperContract.wrap(amount);

// 2. Initiate bridge
await bridge.withdrawERC20(
  wSGTAddress,
  amount,
  { gasLimit: 150000 }
);

// 3. After 7 days, claim on L1
const proof = await bridge.getWithdrawalProof(txHash);
await bridge.claimWithdrawal(proof);

// 4. Unwrap on L1
await wSGTContractL1.unwrap(amount);
```

---

## Transaction Status Tracking

### Status States

| Status | Description | Action Required |
|--------|-------------|-----------------|
| `pending` | Transaction submitted | Wait for confirmation |
| `confirmed` | Confirmed on source chain | Wait for batch |
| `batched` | Included in batch | Wait for finalization |
| `finalized` | Batch finalized | (Deposits: Done) (Withdrawals: Wait 7 days) |
| `ready_to_claim` | Withdrawal ready | Claim on destination |
| `completed` | Fully complete | None |
| `failed` | Transaction failed | Check error & retry |

### Tracking Code

```javascript
function getStatusDisplay(status) {
  const statusConfig = {
    pending: { icon: '⏳', message: 'Transaction pending...' },
    confirmed: { icon: '✅', message: 'Confirmed on source chain' },
    batched: { icon: '📦', message: 'Included in batch' },
    finalized: { icon: '🔒', message: 'Batch finalized' },
    ready_to_claim: { icon: '🎁', message: 'Ready to claim!' },
    completed: { icon: '✅', message: 'Transfer complete' },
    failed: { icon: '❌', message: 'Transaction failed' },
  };

  return statusConfig[status] || { icon: '❓', message: 'Unknown status' };
}

// Poll for status updates
async function trackTransaction(txHash) {
  const interval = setInterval(async () => {
    const status = await bridge.getTransactionStatus(txHash);
    const { icon, message } = getStatusDisplay(status);

    console.log(`${icon} ${message}`);

    if (status === 'completed' || status === 'failed') {
      clearInterval(interval);
    }
  }, 10000); // Check every 10 seconds
}
```

---

## Frontend Integration

### Bridge UI Component

```jsx
import { useState } from 'react';
import { useScrollBridge } from '@/hooks/useScrollBridge';

export function BridgeInterface() {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('deposit'); // 'deposit' or 'withdraw'
  const { deposit, withdraw, status, pending } = useScrollBridge();

  const handleBridge = async () => {
    if (direction === 'deposit') {
      await deposit(amount);
    } else {
      await withdraw(amount);
    }
  };

  return (
    <div className="bridge-container">
      <h2>Bridge Assets</h2>

      {/* Direction Selector */}
      <div className="direction-selector">
        <button
          className={direction === 'deposit' ? 'active' : ''}
          onClick={() => setDirection('deposit')}
        >
          Deposit (L1 → L2)
        </button>
        <button
          className={direction === 'withdraw' ? 'active' : ''}
          onClick={() => setDirection('withdraw')}
        >
          Withdraw (L2 → L1)
        </button>
      </div>

      {/* Amount Input */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0 ETH"
      />

      {/* Bridge Button */}
      <button onClick={handleBridge} disabled={pending || !amount}>
        {pending ? 'Processing...' : `Bridge ${direction === 'deposit' ? 'to Scroll' : 'to Ethereum'}`}
      </button>

      {/* Status Display */}
      {status && (
        <div className="status-display">
          <StatusTracker status={status} />
        </div>
      )}

      {/* Timing Info */}
      <div className="info">
        <p>
          ⏱️ {direction === 'deposit' ? '~10-20 minutes' : '~7 days + claim'}
        </p>
        <p>
          💰 Estimated cost: {direction === 'deposit' ? '~$5' : '~$8'}
        </p>
      </div>
    </div>
  );
}
```

---

## Best Practices

### For Deposits (L1 → L2)

1. **Check Gas Prices**: Bridge during low gas periods
2. **Wait for Confirmation**: Ensure L1 transaction confirms
3. **Be Patient**: Batch finalization takes 10-20 minutes
4. **Keep Transaction Hash**: For status tracking

### For Withdrawals (L2 → L1)

1. **Plan Ahead**: Account for 7-day wait
2. **Save Proof**: Store withdrawal proof securely
3. **Claim Promptly**: After challenge period, claim ASAP
4. **Monitor Gas**: Claim during low gas periods

### Security Tips

1. **Verify Addresses**: Double-check contract addresses
2. **Use Official Bridge**: Only use Scroll's official bridge
3. **Small Test First**: Try with small amount initially
4. **Save Records**: Keep transaction hashes and proofs
5. **Check Status**: Monitor transaction progress

---

## Troubleshooting

### Common Issues

**Deposit Taking Too Long**

- **Cause**: Batch hasn't been submitted yet
- **Solution**: Wait for next batch (typically <15 min)
- **Check**: View batch schedule on Scroll explorer

**Withdrawal Not Claimable**

- **Cause**: Challenge period not complete
- **Solution**: Wait full 7 days
- **Check**: Verify exact timestamp on Scroll explorer

**Transaction Failed**

- **Cause**: Insufficient gas, network congestion
- **Solution**: Retry with higher gas limit
- **Check**: Review error message in explorer

**Can't Find Transaction**

- **Cause**: Transaction hash from wrong chain
- **Solution**: Check correct explorer (L1 vs L2)
- **Check**: Verify transaction exists

### Getting Help

- **Documentation**: https://docs.scroll.io/bridge
- **Discord**: Scroll community Discord
- **Explorer**: https://scrollscan.com
- **Support**: support@scroll.io

---

## Contract Addresses

### Scroll Mainnet

- **L1 Bridge**: `0x[TBD]`
- **L2 Bridge**: `0x[TBD]`
- **L1 Messenger**: `0x[TBD]`
- **L2 Messenger**: `0x[TBD]`

### Scroll Sepolia Testnet

- **L1 Bridge**: `0x[TBD]`
- **L2 Bridge**: `0x[TBD]`
- **L1 Messenger**: `0x[TBD]`
- **L2 Messenger**: `0x[TBD]`

*Check official Scroll docs for latest addresses*

---

## API Reference

### ScrollBridge SDK

```typescript
interface ScrollBridge {
  // Deposits (L1 → L2)
  depositETH(amount: BigNumber, options?: TxOptions): Promise<TransactionResponse>;
  depositERC20(token: string, amount: BigNumber, options?: TxOptions): Promise<TransactionResponse>;

  // Withdrawals (L2 → L1)
  withdrawETH(amount: BigNumber, options?: TxOptions): Promise<TransactionResponse>;
  withdrawERC20(token: string, amount: BigNumber, options?: TxOptions): Promise<TransactionResponse>;

  // Status & Proofs
  getTransactionStatus(txHash: string): Promise<BridgeStatus>;
  getWithdrawalProof(txHash: string): Promise<WithdrawalProof>;
  claimWithdrawal(proof: WithdrawalProof, options?: TxOptions): Promise<TransactionResponse>;

  // Utilities
  estimateDepositGas(amount: BigNumber): Promise<BigNumber>;
  estimateWithdrawalGas(amount: BigNumber): Promise<BigNumber>;
  getDepositHistory(address: string): Promise<BridgeTransaction[]>;
  getWithdrawalHistory(address: string): Promise<BridgeTransaction[]>;
}
```

---

## Examples & Recipes

### Complete Deposit Flow

```javascript
async function completeDeposit() {
  // 1. Connect wallet
  const signer = await provider.getSigner();

  // 2. Initialize bridge
  const bridge = new ScrollBridge({ l1Signer: signer });

  // 3. Estimate costs
  const gasEstimate = await bridge.estimateDepositGas(amount);
  console.log("Estimated gas:", gasEstimate.toString());

  // 4. Execute deposit
  const tx = await bridge.depositETH(amount);
  console.log("Deposit tx:", tx.hash);

  // 5. Wait for confirmation
  await tx.wait();
  console.log("Confirmed on L1!");

  // 6. Track finalization
  await trackUntilFinalized(tx.hash);
  console.log("Available on L2!");
}

async function trackUntilFinalized(txHash) {
  while (true) {
    const status = await bridge.getTransactionStatus(txHash);
    if (status === 'completed') break;
    await new Promise(r => setTimeout(r, 10000)); // Wait 10s
  }
}
```

### Complete Withdrawal Flow

```javascript
async function completeWithdrawal() {
  // 1. Initiate on L2
  const tx = await bridge.withdrawETH(amount);
  console.log("Withdrawal initiated:", tx.hash);

  // 2. Wait for challenge period
  console.log("Waiting 7 days for challenge period...");
  await waitForChallengePeriod(tx.hash);

  // 3. Generate proof
  console.log("Generating proof...");
  const proof = await bridge.getWithdrawalProof(tx.hash);

  // 4. Claim on L1
  console.log("Claiming on L1...");
  const claimTx = await bridge.claimWithdrawal(proof);
  await claimTx.wait();

  console.log("Withdrawal complete!");
}

async function waitForChallengePeriod(txHash) {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < SEVEN_DAYS) {
    const remaining = SEVEN_DAYS - (Date.now() - startTime);
    console.log(`${Math.floor(remaining / 1000 / 60 / 60)} hours remaining...`);
    await new Promise(r => setTimeout(r, 60 * 60 * 1000)); // Check hourly
  }
}
```

---

## Resources

- [Official Scroll Bridge](https://scroll.io/bridge)
- [Scroll Documentation](https://docs.scroll.io)
- [Bridge SDK GitHub](https://github.com/scroll-tech/scroll-bridge-sdk)
- [Scroll Explorer](https://scrollscan.com)

---

**Bridge securely between Ethereum and Scroll! 🌉**

*Last Updated: October 27, 2024*
