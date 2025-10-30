# ScrollGen Phase 2 - Deployment Record

## Scroll Sepolia Testnet Deployment

**Deployment Date**: October 27, 2024
**Network**: Scroll Sepolia Testnet
**Deployer**: 0x15fAb9050d9Debc6F4675C0cC203d48E6f4D9b15

---

## Deployed Contracts

### Phase 1 (Previously Deployed)
- **ScrollGenToken (SGT)**: `0x458beBB9b528De802341b6c689b7Db0f19a15625`
  - [View on Explorer](https://sepolia.scrollscan.com/address/0x458beBB9b528De802341b6c689b7Db0f19a15625)

### Phase 2 Core (Newly Deployed)

#### 1. GenesisBadge NFT
- **Address**: `0xB019337963991C59f6245A1d739fF190a9842E99`
- **Type**: ERC-721 NFT
- **Description**: Genesis Badge collection with 5 tiers
- **Explorer**: https://sepolia.scrollscan.com/address/0xB019337963991C59f6245A1d739fF190a9842E99
- **Features**:
  - Max supply: 10,000 badges
  - 5 tier system: Bronze, Silver, Gold, Platinum, Diamond
  - IPFS metadata storage
  - Authorized minter: NFTStaking contract

#### 2. NFTStaking
- **Address**: `0xC4106D4545e07503944c2eEB20C212d0c2F378Eb`
- **Type**: Staking Contract
- **Description**: Stake SGT tokens to earn Genesis Badges
- **Explorer**: https://sepolia.scrollscan.com/address/0xC4106D4545e07503944c2eEB20C212d0c2F378Eb
- **Features**:
  - Stake SGT to earn badges
  - 5 tier requirements based on amount and duration
  - Flexible staking/unstaking
  - Badge claiming mechanism

#### 3. NFTMarketplace
- **Address**: `0x2303db3293C97D21ae446E766f2b81DA09b42052`
- **Type**: Marketplace Contract
- **Description**: P2P trading platform for Genesis Badges
- **Explorer**: https://sepolia.scrollscan.com/address/0x2303db3293C97D21ae446E766f2b81DA09b42052
- **Features**:
  - Buy/sell badges using SGT tokens
  - 2.5% marketplace fee
  - Secure escrow system
  - Price updates and listing cancellation

---

## Configuration

### Tier Requirements (NFTStaking)

| Tier | Min Stake | Min Duration | Metadata URI |
|------|-----------|--------------|--------------|
| Bronze | 100 SGT | 1 day | QmBronzeBadgeMetadataHash |
| Silver | 500 SGT | 7 days | QmSilverBadgeMetadataHash |
| Gold | 1,000 SGT | 30 days | QmGoldBadgeMetadataHash |
| Platinum | 5,000 SGT | 90 days | QmPlatinumBadgeMetadataHash |
| Diamond | 10,000 SGT | 180 days | QmDiamondBadgeMetadataHash |

### Marketplace Settings

- **Fee**: 2.5% (250 basis points)
- **Max Fee**: 10% (1000 basis points)
- **Fee Collection**: Enabled
- **Owner**: Deployer address

---

## Deployment Steps Completed

1. ✅ Deployed GenesisBadge NFT contract
2. ✅ Deployed NFTStaking contract
3. ✅ Set NFTStaking as authorized minter
4. ✅ Configured tier metadata URIs
5. ✅ Deployed NFTMarketplace contract
6. ✅ Updated .env with contract addresses
7. ✅ Updated frontend configuration

---

## Pending Tasks

### Immediate
- [ ] Upload real NFT artwork to IPFS/Pinata
- [ ] Update metadata URIs with real IPFS hashes
- [ ] Test staking flow on testnet
- [ ] Test marketplace transactions
- [ ] Verify contracts on Scroll Sepolia explorer

### Phase 2.1 (Future)
- [ ] Deploy governance contracts (requires OpenZeppelin v5 updates)
  - ScrollGenVotesToken
  - TimelockController
  - GenesisGovernor
- [ ] Implement DAO governance UI
- [ ] Add proposal creation and voting

---

## How to Interact

### Stake SGT for Badges

```bash
# Check your SGT balance
npm run interact

# Stake tokens (via frontend or script)
# Navigate to frontend and connect wallet
# Approve SGT spending
# Stake desired amount
# Wait for eligibility period
# Claim badge
```

### Use the Marketplace

```bash
# List a badge for sale
# 1. Own a Genesis Badge
# 2. Approve marketplace contract
# 3. List with desired price in SGT

# Buy a badge
# 1. Browse listings
# 2. Approve SGT spending
# 3. Purchase badge
```

### Frontend Access

```bash
cd frontend
npm run dev
# Open http://localhost:5173
# Connect MetaMask to Scroll Sepolia
# Ensure you have testnet ETH and SGT
```

---

## Contract Verification

### Verify on Scroll Sepolia Explorer

```bash
# Install verification plugin (if not already)
npm install --save-dev @nomiclabs/hardhat-etherscan

# Verify GenesisBadge
npx hardhat verify --network scrollSepolia 0xB019337963991C59f6245A1d739fF190a9842E99

# Verify NFTStaking
npx hardhat verify --network scrollSepolia 0xC4106D4545e07503944c2eEB20C212d0c2F378Eb \
  "0x458beBB9b528De802341b6c689b7Db0f19a15625" \
  "0xB019337963991C59f6245A1d739fF190a9842E99"

# Verify NFTMarketplace
npx hardhat verify --network scrollSepolia 0x2303db3293C97D21ae446E766f2b81DA09b42052 \
  "0xB019337963991C59f6245A1d739fF190a9842E99" \
  "0x458beBB9b528De802341b6c689b7Db0f19a15625"
```

---

## Testing Checklist

### NFT Minting
- [ ] Stake 100 SGT
- [ ] Wait 1 day
- [ ] Claim Bronze badge
- [ ] Verify badge ownership
- [ ] Check badge tier and metadata

### Marketplace
- [ ] List Bronze badge for 50 SGT
- [ ] View listing in marketplace
- [ ] Cancel listing (test)
- [ ] Re-list badge
- [ ] Buy badge from another account
- [ ] Verify SGT transfer
- [ ] Verify fee collection

### Edge Cases
- [ ] Try to claim badge before eligibility
- [ ] Try to buy own listing
- [ ] Try to list non-owned badge
- [ ] Unstake after claiming badge
- [ ] Multiple stakes/claims

---

## Security Notes

### Audits
- Internal review: ✅ Complete
- External audit: ⏳ Planned for Phase 3

### Access Control
- GenesisBadge minter: Only NFTStaking contract
- Marketplace fee updates: Only owner
- Staking emergency withdraw: Only owner

### Best Practices
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Proper access control with Ownable
- ✅ Safe ERC20/ERC721 transfers
- ✅ Input validation on all parameters
- ✅ Event emissions for all state changes

---

## Resources

- [Scroll Sepolia Faucet](https://sepolia.scroll.io/faucet)
- [Scroll Sepolia Explorer](https://sepolia.scrollscan.com/)
- [ScrollGen Documentation](./docs/)
- [Phase 2 NFT Guide](./docs/phase2-nfts.md)
- [Phase 2 Marketplace Guide](./docs/phase2-marketplace.md)

---

## Support

- GitHub Issues: [Repository URL]
- Discord: [Community Discord]
- Twitter: [@ScrollGen]

---

**Deployment Status**: ✅ Phase 2 Core Complete
**Next Milestone**: Phase 2.1 - DAO Governance
**Network**: Scroll Sepolia Testnet

*Last Updated: October 27, 2024*
