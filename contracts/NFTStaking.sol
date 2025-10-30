// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GenesisBadge.sol";

/// @title NFTStaking - Stake SGT to earn Genesis Badges
/// @notice Users stake SGT tokens to earn NFT badges based on staking duration and amount
contract NFTStaking is Ownable, ReentrancyGuard {

    IERC20 public immutable sgtToken;
    GenesisBadge public immutable genesisBadge;

    /// @notice Staking information for each user
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint8 tier;
        bool claimed;
    }

    /// @notice Mapping of user address to stake info
    mapping(address => Stake) public stakes;

    /// @notice Minimum staking requirements for each tier
    struct TierRequirement {
        uint256 minAmount;
        uint256 minDuration;
    }

    /// @notice Tier requirements mapping
    mapping(uint8 => TierRequirement) public tierRequirements;

    /// @notice Total SGT staked in contract
    uint256 public totalStaked;

    /// @notice Default metadata URIs for each tier
    mapping(uint8 => string) public defaultMetadataURIs;

    /// @notice Emitted when tokens are staked
    event Staked(address indexed user, uint256 amount, uint256 timestamp);

    /// @notice Emitted when tokens are unstaked
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);

    /// @notice Emitted when a badge is claimed
    event BadgeClaimed(address indexed user, uint256 tokenId, uint8 tier);

    constructor(address _sgtToken, address _genesisBadge) Ownable(msg.sender) {
        require(_sgtToken != address(0), "Invalid SGT token address");
        require(_genesisBadge != address(0), "Invalid Genesis Badge address");

        sgtToken = IERC20(_sgtToken);
        genesisBadge = GenesisBadge(_genesisBadge);

        _initializeTierRequirements();
    }

    /// @notice Initialize tier requirements
    function _initializeTierRequirements() private {
        // Bronze: 100 SGT for 1 day
        tierRequirements[0] = TierRequirement(100 * 10**18, 1 days);

        // Silver: 500 SGT for 7 days
        tierRequirements[1] = TierRequirement(500 * 10**18, 7 days);

        // Gold: 1000 SGT for 30 days
        tierRequirements[2] = TierRequirement(1000 * 10**18, 30 days);

        // Platinum: 5000 SGT for 90 days
        tierRequirements[3] = TierRequirement(5000 * 10**18, 90 days);

        // Diamond: 10000 SGT for 180 days
        tierRequirements[4] = TierRequirement(10000 * 10**18, 180 days);
    }

    /// @notice Set default metadata URI for a tier
    /// @param tier Tier level (0-4)
    /// @param uri IPFS hash for metadata
    function setDefaultMetadataURI(uint8 tier, string calldata uri) external onlyOwner {
        require(tier <= 4, "Invalid tier");
        defaultMetadataURIs[tier] = uri;
    }

    /// @notice Stake SGT tokens
    /// @param amount Amount of SGT to stake
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0 tokens");
        require(stakes[msg.sender].amount == 0, "Already staking");

        require(
            sgtToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        stakes[msg.sender] = Stake({
            amount: amount,
            startTime: block.timestamp,
            tier: 0,
            claimed: false
        });

        totalStaked += amount;

        emit Staked(msg.sender, amount, block.timestamp);
    }

    /// @notice Unstake SGT tokens
    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No active stake");

        uint256 amount = userStake.amount;

        delete stakes[msg.sender];
        totalStaked -= amount;

        require(sgtToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    /// @notice Claim Genesis Badge NFT
    /// @return tokenId The minted token ID
    function claimBadge() external nonReentrant returns (uint256) {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No active stake");
        require(!userStake.claimed, "Badge already claimed");

        uint8 eligibleTier = getEligibleTier(msg.sender);
        require(eligibleTier < 255, "Not eligible for any tier");

        userStake.claimed = true;
        userStake.tier = eligibleTier;

        string memory metadataURI = defaultMetadataURIs[eligibleTier];
        require(bytes(metadataURI).length > 0, "Metadata URI not set for tier");

        uint256 tokenId = genesisBadge.mint(msg.sender, eligibleTier, metadataURI);

        emit BadgeClaimed(msg.sender, tokenId, eligibleTier);

        return tokenId;
    }

    /// @notice Get the highest tier a user is eligible for
    /// @param user Address to check
    /// @return Tier level (0-4) or 255 if not eligible
    function getEligibleTier(address user) public view returns (uint8) {
        Stake memory userStake = stakes[user];

        if (userStake.amount == 0) {
            return 255;
        }

        uint256 stakingDuration = block.timestamp - userStake.startTime;

        for (uint8 tier = 4; tier >= 0; tier--) {
            TierRequirement memory req = tierRequirements[tier];

            if (userStake.amount >= req.minAmount && stakingDuration >= req.minDuration) {
                return tier;
            }

            if (tier == 0) break;
        }

        return 255;
    }

    /// @notice Check if user can claim a badge
    /// @param user Address to check
    /// @return eligible True if can claim
    /// @return tier Eligible tier level
    function canClaimBadge(address user) external view returns (bool eligible, uint8 tier) {
        Stake memory userStake = stakes[user];

        if (userStake.amount == 0 || userStake.claimed) {
            return (false, 255);
        }

        tier = getEligibleTier(user);
        eligible = tier < 255;
    }

    /// @notice Get staking info for a user
    /// @param user Address to query
    /// @return amount Staked amount
    /// @return startTime When staking started
    /// @return duration How long staked
    /// @return tier Claimed tier (if claimed)
    /// @return claimed Whether badge was claimed
    function getStakeInfo(address user)
        external
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 duration,
            uint8 tier,
            bool claimed
        )
    {
        Stake memory userStake = stakes[user];
        duration = userStake.amount > 0 ? block.timestamp - userStake.startTime : 0;

        return (
            userStake.amount,
            userStake.startTime,
            duration,
            userStake.tier,
            userStake.claimed
        );
    }

    /// @notice Get tier requirements
    /// @param tier Tier level (0-4)
    /// @return minAmount Minimum SGT required
    /// @return minDuration Minimum duration required
    function getTierRequirements(uint8 tier)
        external
        view
        returns (uint256 minAmount, uint256 minDuration)
    {
        require(tier <= 4, "Invalid tier");
        TierRequirement memory req = tierRequirements[tier];
        return (req.minAmount, req.minDuration);
    }

    /// @notice Emergency withdraw by owner (if needed)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = sgtToken.balanceOf(address(this));
        require(sgtToken.transfer(owner(), balance), "Transfer failed");
    }
}
