// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTMarketplace - Trade Genesis Badges with SGT
/// @notice Decentralized marketplace for buying/selling NFTs using SGT tokens
contract NFTMarketplace is Ownable, ReentrancyGuard {

    IERC721 public immutable genesisBadge;
    IERC20 public immutable sgtToken;

    /// @notice Marketplace fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 public marketplaceFee = 250;

    /// @notice Listing information
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    /// @notice Mapping of token ID to listing info
    mapping(uint256 => Listing) public listings;

    /// @notice Mapping of seller to their active listings
    mapping(address => uint256[]) private sellerListings;

    /// @notice Array of all active listing token IDs for efficient querying
    uint256[] private activeListingIds;

    /// @notice Mapping from token ID to index in activeListingIds array
    mapping(uint256 => uint256) private activeListingIndex;

    /// @notice Total marketplace fees collected
    uint256 public feesCollected;

    /// @notice Emitted when an NFT is listed for sale
    event Listed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );

    /// @notice Emitted when an NFT is purchased
    event Sold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 fee,
        uint256 timestamp
    );

    /// @notice Emitted when a listing is cancelled
    event Cancelled(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 timestamp
    );

    /// @notice Emitted when marketplace fee is updated
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _genesisBadge, address _sgtToken) Ownable(msg.sender) {
        require(_genesisBadge != address(0), "Invalid NFT address");
        require(_sgtToken != address(0), "Invalid SGT address");

        genesisBadge = IERC721(_genesisBadge);
        sgtToken = IERC20(_sgtToken);
    }

    /// @notice List an NFT for sale
    /// @param tokenId Token ID to list
    /// @param price Sale price in SGT (with 18 decimals)
    function listNFT(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(genesisBadge.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!listings[tokenId].active, "Already listed");

        genesisBadge.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        sellerListings[msg.sender].push(tokenId);
        _addToActiveListings(tokenId);

        emit Listed(tokenId, msg.sender, price, block.timestamp);
    }

    /// @notice Buy a listed NFT
    /// @param tokenId Token ID to purchase
    function buyNFT(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed for sale");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        uint256 price = listing.price;
        uint256 fee = (price * marketplaceFee) / 10000;
        uint256 sellerAmount = price - fee;

        listing.active = false;
        address seller = listing.seller;

        require(
            sgtToken.transferFrom(msg.sender, seller, sellerAmount),
            "Payment to seller failed"
        );

        if (fee > 0) {
            require(
                sgtToken.transferFrom(msg.sender, address(this), fee),
                "Fee payment failed"
            );
            feesCollected += fee;
        }

        genesisBadge.transferFrom(address(this), msg.sender, tokenId);

        _removeSellerListing(seller, tokenId);
        _removeFromActiveListings(tokenId);

        emit Sold(tokenId, seller, msg.sender, price, fee, block.timestamp);
    }

    /// @notice Cancel a listing
    /// @param tokenId Token ID to cancel
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");

        listing.active = false;

        genesisBadge.transferFrom(address(this), msg.sender, tokenId);

        _removeSellerListing(msg.sender, tokenId);
        _removeFromActiveListings(tokenId);

        emit Cancelled(tokenId, msg.sender, block.timestamp);
    }

    /// @notice Update listing price
    /// @param tokenId Token ID
    /// @param newPrice New price in SGT
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");

        // uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit Listed(tokenId, msg.sender, newPrice, block.timestamp);
    }

    /// @notice Get listing details
    /// @param tokenId Token ID to query
    /// @return seller Seller address
    /// @return price Sale price
    /// @return active Whether listing is active
    function getListing(uint256 tokenId)
        external
        view
        returns (
            address seller,
            uint256 price,
            bool active
        )
    {
        Listing memory listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }

    /// @notice Get all active listings by a seller
    /// @param seller Address to query
    /// @return Array of token IDs
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        uint256[] memory allListings = sellerListings[seller];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].active) {
                activeCount++;
            }
        }

        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].active) {
                activeListings[index] = allListings[i];
                index++;
            }
        }

        return activeListings;
    }

    /// @notice Get all active listings (paginated)
    /// @param offset Starting index
    /// @param limit Number of items to return
    /// @return tokenIds Array of token IDs
    /// @return sellers Array of seller addresses
    /// @return prices Array of prices
    function getActiveListings(uint256 offset, uint256 limit)
        external
        view
        returns (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        )
    {
        uint256 totalActive = activeListingIds.length;

        if (offset >= totalActive) {
            return (new uint256[](0), new address[](0), new uint256[](0));
        }

        uint256 remaining = totalActive - offset;
        uint256 count = remaining < limit ? remaining : limit;

        tokenIds = new uint256[](count);
        sellers = new address[](count);
        prices = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = activeListingIds[offset + i];
            Listing memory listing = listings[tokenId];

            tokenIds[i] = tokenId;
            sellers[i] = listing.seller;
            prices[i] = listing.price;
        }

        return (tokenIds, sellers, prices);
    }

    /// @notice Get total number of active listings
    /// @return Total active listings count
    function getActiveListingsCount() external view returns (uint256) {
        return activeListingIds.length;
    }

    /// @notice Calculate fee for a given price
    /// @param price Sale price
    /// @return Fee amount
    function calculateFee(uint256 price) public view returns (uint256) {
        return (price * marketplaceFee) / 10000;
    }

    /// @notice Update marketplace fee (owner only)
    /// @param newFee New fee in basis points (max 1000 = 10%)
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high (max 10%)");
        uint256 oldFee = marketplaceFee;
        marketplaceFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /// @notice Withdraw collected fees (owner only)
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = feesCollected;
        require(amount > 0, "No fees to withdraw");

        feesCollected = 0;

        require(sgtToken.transfer(owner(), amount), "Withdrawal failed");
    }

    /// @notice Remove a listing from seller's array
    function _removeSellerListing(address seller, uint256 tokenId) private {
        uint256[] storage listings_array = sellerListings[seller];

        for (uint256 i = 0; i < listings_array.length; i++) {
            if (listings_array[i] == tokenId) {
                listings_array[i] = listings_array[listings_array.length - 1];
                listings_array.pop();
                break;
            }
        }
    }

    /// @notice Emergency function to rescue stuck NFTs (owner only)
    /// @param tokenId Token ID to rescue
    function rescueNFT(uint256 tokenId) external onlyOwner {
        require(!listings[tokenId].active, "Cannot rescue active listing");
        genesisBadge.transferFrom(address(this), owner(), tokenId);
    }

    /// @notice Add token ID to active listings array
    /// @param tokenId Token ID to add
    function _addToActiveListings(uint256 tokenId) private {
        activeListingIndex[tokenId] = activeListingIds.length;
        activeListingIds.push(tokenId);
    }

    /// @notice Remove token ID from active listings array
    /// @param tokenId Token ID to remove
    function _removeFromActiveListings(uint256 tokenId) private {
        uint256 index = activeListingIndex[tokenId];
        uint256 lastIndex = activeListingIds.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = activeListingIds[lastIndex];
            activeListingIds[index] = lastTokenId;
            activeListingIndex[lastTokenId] = index;
        }

        activeListingIds.pop();
        delete activeListingIndex[tokenId];
    }
}
