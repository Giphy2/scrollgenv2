# NFT Marketplace

## Overview

The ScrollGen NFT Marketplace enables peer-to-peer trading of Genesis Badges using SGT tokens. Built with secure escrow and transparent fee structure.

## Key Features

- **SGT-Based Trading**: Buy and sell badges using SGT tokens
- **Secure Escrow**: NFTs held safely in contract during listing
- **Low Fees**: 2.5% marketplace fee on sales
- **Flexible Listings**: Update prices or cancel anytime
- **No Custody**: Sellers retain ownership until sale

## How It Works

### 1. List a Badge for Sale

```javascript
// Approve marketplace to transfer NFT
await badgeContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);

// List badge for 1000 SGT
const price = ethers.parseUnits("1000", 18);
await marketplace.listNFT(tokenId, price);
```

**What Happens:**
- NFT transfers to marketplace contract (escrow)
- Listing becomes visible to all buyers
- You can cancel or update price anytime

### 2. Buy a Badge

```javascript
// Approve marketplace to spend SGT
await sgtToken.approve(MARKETPLACE_ADDRESS, totalPrice);

// Buy the badge
await marketplace.buyNFT(tokenId);
```

**What Happens:**
- Buyer pays listing price in SGT
- 2.5% fee goes to marketplace
- 97.5% goes to seller
- NFT transfers to buyer
- Listing is closed

### 3. Cancel Listing

```javascript
await marketplace.cancelListing(tokenId);
```

**What Happens:**
- NFT returns to your wallet
- Listing is removed
- No fees charged

### 4. Update Price

```javascript
const newPrice = ethers.parseUnits("1500", 18);
await marketplace.updatePrice(tokenId, newPrice);
```

**What Happens:**
- Listing price updated
- NFT remains in escrow
- No additional approvals needed

## Fee Structure

| Action | Fee | Recipient |
|--------|-----|-----------|
| List NFT | Free | - |
| Cancel Listing | Free | - |
| Update Price | Free | - |
| Buy NFT | 2.5% of price | Marketplace treasury |

### Fee Calculation

```javascript
// For a 1000 SGT sale:
const price = 1000 SGT;
const fee = 1000 * 0.025 = 25 SGT;
const sellerReceives = 1000 - 25 = 975 SGT;
```

The marketplace fee helps support:
- Protocol development
- Security audits
- Community grants
- Liquidity incentives

## Contract Functions

### Listing Functions

#### `listNFT(uint256 tokenId, uint256 price)`
List a badge for sale.

**Requirements:**
- You own the badge
- Badge not already listed
- Marketplace approved to transfer NFT
- Price > 0

#### `cancelListing(uint256 tokenId)`
Cancel an active listing.

**Requirements:**
- You are the seller
- Listing is active

#### `updatePrice(uint256 tokenId, uint256 newPrice)`
Change listing price.

**Requirements:**
- You are the seller
- Listing is active
- New price > 0

### Buying Functions

#### `buyNFT(uint256 tokenId)`
Purchase a listed badge.

**Requirements:**
- Listing is active
- You are not the seller
- Marketplace approved to spend SGT
- You have sufficient SGT balance

### Query Functions

#### `getListing(uint256 tokenId)`
Get listing details.

**Returns:**
```solidity
(
  address seller,
  uint256 price,
  bool active
)
```

#### `getSellerListings(address seller)`
Get all active listings by a seller.

**Returns:** Array of token IDs

#### `getActiveListings(uint256 offset, uint256 limit)`
Get paginated active listings.

**Returns:**
```solidity
(
  uint256[] tokenIds,
  address[] sellers,
  uint256[] prices
)
```

#### `calculateFee(uint256 price)`
Calculate marketplace fee for a price.

**Returns:** Fee amount in SGT

#### `marketplaceFee()`
Get current fee percentage in basis points (250 = 2.5%).

### Admin Functions

#### `setMarketplaceFee(uint256 newFee)`
Update marketplace fee (max 10%).

**Requirements:**
- Only owner
- Fee ≤ 1000 (10%)

#### `withdrawFees()`
Withdraw collected fees to owner.

**Requirements:**
- Only owner

## Usage Examples

### Complete Trading Flow

```javascript
// --- SELLER ---

// 1. Approve marketplace
await badgeContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);

// 2. List badge
const listPrice = ethers.parseUnits("1000", 18);
const listTx = await marketplace.listNFT(tokenId, listPrice);
await listTx.wait();

console.log(`Badge #${tokenId} listed for 1000 SGT`);

// 3. (Optional) Update price
const newPrice = ethers.parseUnits("900", 18);
await marketplace.updatePrice(tokenId, newPrice);

// 4. (Optional) Cancel if not sold
// await marketplace.cancelListing(tokenId);


// --- BUYER ---

// 1. Check listing
const listing = await marketplace.getListing(tokenId);
console.log(`Price: ${ethers.formatUnits(listing.price, 18)} SGT`);

// 2. Calculate total with fee
const fee = await marketplace.calculateFee(listing.price);
const total = listing.price + fee;

// 3. Approve SGT
await sgtToken.approve(MARKETPLACE_ADDRESS, listing.price);

// 4. Buy badge
const buyTx = await marketplace.buyNFT(tokenId);
await buyTx.wait();

console.log(`Bought badge #${tokenId}!`);

// 5. Verify ownership
const newOwner = await badgeContract.ownerOf(tokenId);
console.log(`New owner: ${newOwner}`);
```

### Browse Marketplace

```javascript
// Get first 10 active listings
const { tokenIds, sellers, prices } = await marketplace.getActiveListings(0, 10);

// Display listings
for (let i = 0; i < tokenIds.length; i++) {
  const tokenId = tokenIds[i];
  const seller = sellers[i];
  const price = ethers.formatUnits(prices[i], 18);

  // Get badge tier
  const tier = await badgeContract.getTier(tokenId);
  const tierName = await badgeContract.getTierName(tier);

  console.log(`#${tokenId} - ${tierName} - ${price} SGT - Seller: ${seller}`);
}

// Get next 10
const { tokenIds: nextBatch } = await marketplace.getActiveListings(10, 10);
```

### Check Your Listings

```javascript
const myListings = await marketplace.getSellerListings(account);

console.log(`You have ${myListings.length} active listings`);

for (const tokenId of myListings) {
  const listing = await marketplace.getListing(tokenId);
  console.log(`Badge #${tokenId}: ${ethers.formatUnits(listing.price, 18)} SGT`);
}
```

## Events

### Listed
```solidity
event Listed(
  uint256 indexed tokenId,
  address indexed seller,
  uint256 price,
  uint256 timestamp
)
```

Emitted when a badge is listed for sale.

### Sold
```solidity
event Sold(
  uint256 indexed tokenId,
  address indexed seller,
  address indexed buyer,
  uint256 price,
  uint256 fee,
  uint256 timestamp
)
```

Emitted when a badge is purchased.

### Cancelled
```solidity
event Cancelled(
  uint256 indexed tokenId,
  address indexed seller,
  uint256 timestamp
)
```

Emitted when a listing is cancelled.

## Best Practices

### For Sellers

1. **Research Prices**: Check similar tier listings before pricing
2. **Be Patient**: Don't panic-list at low prices
3. **Update Prices**: Adjust based on market conditions
4. **Cancel if Needed**: Remove listings if you change your mind

### For Buyers

1. **Check Tier**: Verify badge tier before buying
2. **Compare Prices**: Look at multiple listings
3. **Consider Rarity**: Higher tiers may appreciate more
4. **Verify Authenticity**: Ensure it's from the official contract

### Security Tips

1. **Approve Carefully**: Only approve official marketplace contract
2. **Check Contract**: Verify you're interacting with the right address
3. **Test Small First**: Try with lower-value badges first
4. **Revoke Approvals**: Remove approvals when done trading

## Analytics

### Track Marketplace Stats

```javascript
// Total fees collected
const fees = await marketplace.feesCollected();
console.log(`Total fees: ${ethers.formatUnits(fees, 18)} SGT`);

// Get all your past sales (from events)
const filter = marketplace.filters.Sold(null, account);
const events = await marketplace.queryFilter(filter);

let totalRevenue = 0n;
for (const event of events) {
  totalRevenue += event.args.price - event.args.fee;
}

console.log(`Total revenue: ${ethers.formatUnits(totalRevenue, 18)} SGT`);
```

## Future Enhancements

### Phase 2.1
- Offers and bidding system
- Auction functionality
- Bundle sales (multiple badges)

### Phase 2.2
- Price history charts
- Rarity-based sorting
- Collection statistics

### Phase 3
- Royalties for original stakers
- Cross-marketplace aggregation
- Advanced trading features

## Security

### Safety Features
- Secure escrow system
- No admin NFT control
- Transparent fee structure
- Emergency rescue function (inactive listings only)

### Audits
- Internal review: ✅ Complete
- External audit: Planned

## Contract Addresses

### Scroll Sepolia Testnet
- **NFTMarketplace**: `[Deploy and update]`

### Scroll Mainnet
- **NFTMarketplace**: `[TBD]`

## Support

- Issues: GitHub Issues
- Discord: [Community Discord]
- Email: support@scrollgen.io (placeholder)

---

**Start trading Genesis Badges today! 🛒**
