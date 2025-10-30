// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/// @title GenesisBadge - ScrollGen NFT Collection
/// @notice Genesis NFT badges earned through SGT token staking
/// @dev ERC-721 with IPFS metadata storage
contract GenesisBadge is ERC721, ERC721URIStorage, Ownable {

    uint256 private _tokenIdCounter;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Mapping of token ID to tier level
    mapping(uint256 => uint8) public tokenTier;

    /// @notice Mapping of address to total badges minted
    mapping(address => uint256) public badgesMinted;

    /// @notice Maximum supply of Genesis Badges
    uint256 public constant MAX_SUPPLY = 10000;

    /// @notice Authorized minter address (staking contract)
    address public minter;

    /// @notice Badge tier definitions
    enum Tier { Bronze, Silver, Gold, Platinum, Diamond }

    /// @notice Emitted when a new badge is minted
    event BadgeMinted(address indexed to, uint256 indexed tokenId, uint8 tier);

    /// @notice Emitted when the minter address is updated
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    /// @notice Emitted when base URI is updated
    event BaseURIUpdated(string newBaseURI);

    constructor() ERC721("ScrollGen Genesis Badge", "GENESIS") Ownable(msg.sender) {
        _baseTokenURI = "ipfs://";
    }

    /// @notice Set the authorized minter address
    /// @param _minter Address allowed to mint badges
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        address oldMinter = minter;
        minter = _minter;
        emit MinterUpdated(oldMinter, _minter);
    }

    /// @notice Set base URI for token metadata
    /// @param baseURI New base URI
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    /// @notice Mint a new Genesis Badge
    /// @param to Address to receive the badge
    /// @param tier Badge tier level (0-4)
    /// @param metadataURI IPFS hash for token metadata
    /// @return tokenId The newly minted token ID
    function mint(address to, uint8 tier, string memory metadataURI)
        external
        returns (uint256)
    {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized to mint");
        _mintBadge(to, tier, metadataURI);
        return _tokenIdCounter - 1;
    }

    /// @notice Batch mint badges (for airdrops or rewards)
    /// @param recipients Array of addresses to receive badges
    /// @param tiers Array of tier levels
    /// @param uris Array of token URIs
    function batchMint(
        address[] calldata recipients,
        uint8[] calldata tiers,
        string[] calldata uris
    ) external {
        require(msg.sender == owner(), "Only owner can batch mint");
        require(
            recipients.length == tiers.length && recipients.length == uris.length,
            "Array length mismatch"
        );
        require(_tokenIdCounter + recipients.length <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mintBadge(recipients[i], tiers[i], uris[i]);
        }
    }

    /// @dev Internal mint function
    function _mintBadge(address to, uint8 tier, string memory metadataURI) private {
        require(to != address(0), "Cannot mint to zero address");
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(tier <= uint8(Tier.Diamond), "Invalid tier");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        tokenTier[tokenId] = tier;
        badgesMinted[to]++;

        emit BadgeMinted(to, tokenId, tier);
    }

    /// @notice Get the tier of a token
    /// @param tokenId Token ID to query
    /// @return Tier level (0-4)
    function getTier(uint256 tokenId) external view returns (uint8) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenTier[tokenId];
    }

    /// @notice Get total badges owned by an address
    /// @param owner Address to query
    /// @return Number of badges owned
    function balanceOfOwner(address owner) external view returns (uint256) {
        return balanceOf(owner);
    }

    /// @notice Get all token IDs owned by an address
    /// @param owner Address to query
    /// @return Array of token IDs
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;

        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
                if (index == balance) break;
            }
        }

        return tokens;
    }

    /// @notice Get current total supply
    /// @return Total number of minted badges
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /// @notice Get tier name as string
    /// @param tier Tier level (0-4)
    /// @return Tier name
    function getTierName(uint8 tier) public pure returns (string memory) {
        if (tier == uint8(Tier.Bronze)) return "Bronze";
        if (tier == uint8(Tier.Silver)) return "Silver";
        if (tier == uint8(Tier.Gold)) return "Gold";
        if (tier == uint8(Tier.Platinum)) return "Platinum";
        if (tier == uint8(Tier.Diamond)) return "Diamond";
        return "Unknown";
    }

    /// @dev Override required by Solidity
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @dev Override required by Solidity
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @dev Override required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
