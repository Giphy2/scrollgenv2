# ScrollGen Token (SGT)

## Overview

The ScrollGen Token (SGT) is an ERC-20 compliant token that serves as the foundation of the ScrollGen ecosystem. It's deployed on the Scroll zkEVM network and includes additional features beyond the standard ERC-20 specification.

## Token Details

| Property | Value |
|----------|-------|
| Name | ScrollGen Token |
| Symbol | SGT |
| Decimals | 18 |
| Initial Supply | 1,000,000 SGT |
| Standard | ERC-20 |
| Network | Scroll Sepolia / Mainnet |

## Contract Features

### Standard ERC-20 Functions

#### `balanceOf(address account)`
Returns the token balance of a specific address.

**Parameters:**
- `account`: Address to query

**Returns:**
- Token balance (uint256)

#### `transfer(address to, uint256 amount)`
Transfer tokens to another address.

**Parameters:**
- `to`: Recipient address
- `amount`: Number of tokens to transfer

**Returns:**
- Success boolean

**Events:**
- `Transfer(from, to, amount)`

#### `approve(address spender, uint256 amount)`
Approve another address to spend tokens on your behalf.

**Parameters:**
- `spender`: Address authorized to spend
- `amount`: Maximum amount they can spend

**Returns:**
- Success boolean

#### `transferFrom(address from, address to, uint256 amount)`
Transfer tokens on behalf of another address (requires prior approval).

**Parameters:**
- `from`: Address to transfer from
- `to`: Recipient address
- `amount`: Number of tokens to transfer

**Returns:**
- Success boolean

### Extended Functions

#### `mint(address to, uint256 amount)`
**Access:** Owner only

Mint new tokens to a specific address.

**Parameters:**
- `to`: Address to receive tokens
- `amount`: Number of tokens to mint (in whole tokens, not wei)

**Events:**
- `TokensMinted(to, amount)`
- `Transfer(0x0, to, amount)`

**Example:**
```javascript
// Mint 1000 tokens to address
await contract.mint("0x123...", 1000);
```

#### `burn(uint256 amount)`
**Access:** Public (burns caller's tokens)

Burn tokens from your own balance.

**Parameters:**
- `amount`: Number of tokens to burn (in whole tokens)

**Events:**
- `TokensBurned(from, amount)`
- `Transfer(from, 0x0, amount)`

**Example:**
```javascript
// Burn 100 of your own tokens
await contract.burn(100);
```

#### `getTokenInfo()`
Returns comprehensive token information.

**Returns:**
- `name`: Token name (string)
- `symbol`: Token symbol (string)
- `decimals`: Number of decimals (uint8)
- `totalSupply`: Total supply in circulation (uint256)

## Token Economics

### Initial Distribution

The initial 1,000,000 SGT tokens are distributed as follows (example):

| Allocation | Percentage | Amount | Purpose |
|------------|-----------|---------|---------|
| Development | 20% | 200,000 | Team and development |
| Community | 30% | 300,000 | Airdrops and rewards |
| Liquidity | 25% | 250,000 | DEX liquidity pools |
| Treasury | 15% | 150,000 | DAO treasury |
| Public Sale | 10% | 100,000 | Initial offering |

*Note: Actual distribution determined by governance*

### Supply Mechanics

- **Mintable**: Owner can mint additional tokens
- **Burnable**: Users can burn their own tokens
- **No Max Supply**: Supply can increase through minting
- **Deflationary Option**: Burning reduces total supply

## Use Cases

### Current (Phase 1)

1. **Governance Token**: Used for voting in future DAO
2. **Ecosystem Currency**: Medium of exchange within ScrollGen
3. **Staking**: Earn rewards by staking tokens (future)

### Future Phases

1. **NFT Minting**: Required to mint ScrollGen NFTs
2. **DAO Voting**: Vote on protocol proposals
3. **DeFi Collateral**: Use as collateral in lending protocols
4. **Liquidity Mining**: Earn tokens by providing liquidity
5. **Fee Discounts**: Reduced fees for protocol services

## Security Features

### Access Control

- **Ownable**: Critical functions restricted to owner
- **No Blacklist**: No ability to freeze user tokens
- **No Pause**: Transfers cannot be paused
- **Transparent**: All code is open source

### Audited Libraries

Built using OpenZeppelin's audited contracts:
- `ERC20.sol`: Standard token implementation
- `Ownable.sol`: Access control

### Best Practices

- Uses SafeMath operations (built into Solidity 0.8+)
- Event emissions for all state changes
- Input validation on all functions
- Clear error messages

## Integration Guide

### Web3 / Ethers.js

```javascript
import { ethers } from 'ethers';

const contractAddress = "0x...";
const abi = [...]; // Token ABI

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(contractAddress, abi, signer);

// Get balance
const balance = await contract.balanceOf(address);
console.log(ethers.formatUnits(balance, 18));

// Transfer tokens
const tx = await contract.transfer(recipientAddress, ethers.parseUnits("100", 18));
await tx.wait();
```

### Hardhat Scripts

```javascript
const { ethers } = require("hardhat");

const contract = await ethers.getContractAt(
  "ScrollGenToken",
  contractAddress
);

// Mint tokens (owner only)
await contract.mint(recipientAddress, 1000);

// Burn tokens
await contract.burn(100);
```

## Contract Addresses

### Testnet
- **Scroll Sepolia**: `[Deploy and add address here]`

### Mainnet
- **Scroll Mainnet**: `[To be deployed]`

## Events

### Transfer
```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```

Emitted when tokens are transferred, minted, or burned.

### Approval
```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```

Emitted when allowance is set via `approve()`.

### TokensMinted
```solidity
event TokensMinted(address indexed to, uint256 amount)
```

Emitted when new tokens are minted.

### TokensBurned
```solidity
event TokensBurned(address indexed from, uint256 amount)
```

Emitted when tokens are burned.

## FAQ

### Can the owner freeze my tokens?

No. The contract has no freeze or pause functionality. Once deployed, token transfers cannot be stopped.

### Is there a maximum supply?

No. The owner can mint new tokens as needed. Future governance will control minting rights.

### Can I get my tokens back after burning?

No. Burning is permanent and irreversible.

### Are there any transfer fees?

No. Standard ERC-20 transfers have no built-in fees, only gas costs.

### How do I add SGT to MetaMask?

1. Click "Import tokens" in MetaMask
2. Enter contract address
3. Token symbol and decimals auto-fill
4. Click "Add Custom Token"

## Future Upgrades

### Planned Features (Phase 2+)

- **Staking Contract**: Earn rewards by locking tokens
- **Vesting Contract**: Time-locked token releases
- **Governance Module**: On-chain voting with SGT
- **Bridge Support**: Cross-chain token transfers

### Non-Upgradeable

The current token contract is **not upgradeable**. This ensures:
- Complete transparency
- No hidden changes
- Immutable token logic

Future features will be added via separate, interoperable contracts.

## Resources

- **Contract Source**: `contracts/ScrollGenToken.sol`
- **Deployment Script**: `scripts/deploy.js`
- **Interaction Script**: `scripts/interactions.js`
- **Frontend Integration**: `frontend/src/App.jsx`

---

**Need Help?** Check the [Setup Guide](./setup.md) or join our Discord.

## Deployment Details
- Network: Scroll Sepolia
- Contract Address: 0x...
- Deployer: 0x...
- Transaction Hash: 0x...
- Verified on: ScrollScan
