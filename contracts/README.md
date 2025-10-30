# ScrollGen Contracts

## Current Contracts

### ScrollGenToken.sol
The core ERC-20 token for the ScrollGen ecosystem.

**Features:**
- Standard ERC-20 functionality (transfer, approve, transferFrom)
- Mintable by owner
- Burnable by token holders
- Deployed on Scroll zkEVM (Sepolia testnet)

**Token Details:**
- Name: ScrollGen Token
- Symbol: SGT
- Decimals: 18
- Initial Supply: 1,000,000 SGT

## Future Modules

The `/future` directory is reserved for upcoming protocol expansions:

### Phase 2: NFT Layer
- ScrollGen NFT collection
- Dynamic metadata
- Staking mechanisms

### Phase 3: DAO Governance
- Governance contracts
- Proposal and voting system
- Treasury management

### Phase 4: DeFi Integration
- Liquidity pools
- Staking rewards
- Yield farming contracts

## Development

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Scroll Sepolia
```bash
npx hardhat run scripts/deploy.js --network scrollSepolia
```

## Security

All contracts use OpenZeppelin's audited libraries. Future contracts will undergo security audits before mainnet deployment.
