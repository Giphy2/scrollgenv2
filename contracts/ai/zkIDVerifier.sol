// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title zkIDVerifier
 * @notice Zero-knowledge identity verification with ScrollPower reputation system
 * @dev Issues non-transferable reputation tokens based on verified activities
 */
contract zkIDVerifier is ERC721, Ownable, ReentrancyGuard {
    struct Identity {
        address userAddress;
        uint256 scrollPower;
        uint256 verificationLevel;
        uint256 lastUpdate;
        bool verified;
        bytes32 zkProofHash;
    }

    struct Activity {
        string activityType;
        uint256 spReward;
        uint256 timestamp;
        bool claimed;
    }

    struct Reputation {
        uint256 totalActivities;
        uint256 consistencyScore;
        uint256 contributionScore;
        uint256 governanceScore;
        uint256 trustScore;
    }

    mapping(address => Identity) public identities;
    mapping(address => Activity[]) public userActivities;
    mapping(address => Reputation) public reputations;
    mapping(bytes32 => bool) public usedProofs;
    mapping(uint256 => address) public tokenToUser;

    address public zkVerifier;
    uint256 public nextTokenId = 1;
    uint256 public minVerificationLevel = 1;
    uint256 public maxScrollPower = 10000;

    uint256 public constant LEVEL_1_SP = 100;
    uint256 public constant LEVEL_2_SP = 500;
    uint256 public constant LEVEL_3_SP = 1000;
    uint256 public constant LEVEL_4_SP = 2500;
    uint256 public constant LEVEL_5_SP = 5000;

    event IdentityVerified(address indexed user, uint256 verificationLevel, bytes32 proofHash);
    event ScrollPowerMinted(address indexed user, uint256 amount, uint256 totalSP);
    event ActivityRecorded(address indexed user, string activityType, uint256 spReward);
    event ReputationUpdated(address indexed user, uint256 newScore, string scoreType);
    event ProofVerified(address indexed user, bytes32 proofHash, bool valid);

    constructor(address _zkVerifier) ERC721("ScrollPower", "SP") Ownable(msg.sender) {
        zkVerifier = _zkVerifier;
    }

    function verifyProof(
        bytes32 proofHash,
        uint256 verificationLevel,
        bytes calldata proof
    ) external nonReentrant returns (bool) {
        require(!usedProofs[proofHash], "Proof already used");
        require(verificationLevel >= minVerificationLevel && verificationLevel <= 5, "Invalid level");

        bool isValid = _validateZKProof(proofHash, proof);
        require(isValid, "Invalid proof");

        usedProofs[proofHash] = true;

        Identity storage identity = identities[msg.sender];
        if (!identity.verified) {
            identity.userAddress = msg.sender;
            identity.verified = true;
            _mintSoulboundToken(msg.sender);
        }

        identity.verificationLevel = verificationLevel;
        identity.lastUpdate = block.timestamp;
        identity.zkProofHash = proofHash;

        uint256 spReward = _calculateSPReward(verificationLevel);
        identity.scrollPower += spReward;

        emit IdentityVerified(msg.sender, verificationLevel, proofHash);
        emit ProofVerified(msg.sender, proofHash, true);
        emit ScrollPowerMinted(msg.sender, spReward, identity.scrollPower);

        return true;
    }

    function _validateZKProof(bytes32 proofHash, bytes calldata proof) internal view returns (bool) {
        // Mock validation - in production, call actual ZK verifier contract
        if (msg.sender == zkVerifier || msg.sender == owner()) {
            return true;
        }
        return proofHash != bytes32(0) && proof.length > 0;
    }

    function _calculateSPReward(uint256 level) internal pure returns (uint256) {
        if (level == 1) return LEVEL_1_SP;
        if (level == 2) return LEVEL_2_SP;
        if (level == 3) return LEVEL_3_SP;
        if (level == 4) return LEVEL_4_SP;
        if (level == 5) return LEVEL_5_SP;
        return 0;
    }

    function mintSP(address user, uint256 amount, string calldata reason) external {
        require(msg.sender == owner() || msg.sender == zkVerifier, "Unauthorized");
        require(identities[user].verified, "User not verified");

        Identity storage identity = identities[user];
        require(identity.scrollPower + amount <= maxScrollPower, "Exceeds max SP");

        identity.scrollPower += amount;
        identity.lastUpdate = block.timestamp;

        userActivities[user].push(Activity({
            activityType: reason,
            spReward: amount,
            timestamp: block.timestamp,
            claimed: true
        }));

        emit ScrollPowerMinted(user, amount, identity.scrollPower);
        emit ActivityRecorded(user, reason, amount);
    }

    function recordActivity(
        address user,
        string calldata activityType,
        uint256 spReward
    ) external {
        require(msg.sender == owner() || msg.sender == zkVerifier, "Unauthorized");
        require(identities[user].verified, "User not verified");

        userActivities[user].push(Activity({
            activityType: activityType,
            spReward: spReward,
            timestamp: block.timestamp,
            claimed: false
        }));

        emit ActivityRecorded(user, activityType, spReward);
    }

    function claimActivity(uint256 activityIndex) external nonReentrant {
        require(activityIndex < userActivities[msg.sender].length, "Invalid index");

        Activity storage activity = userActivities[msg.sender][activityIndex];
        require(!activity.claimed, "Already claimed");

        Identity storage identity = identities[msg.sender];
        require(identity.verified, "Not verified");
        require(identity.scrollPower + activity.spReward <= maxScrollPower, "Exceeds max SP");

        activity.claimed = true;
        identity.scrollPower += activity.spReward;
        identity.lastUpdate = block.timestamp;

        emit ScrollPowerMinted(msg.sender, activity.spReward, identity.scrollPower);
    }

    function updateReputation(
        address user,
        uint256 consistencyScore,
        uint256 contributionScore,
        uint256 governanceScore,
        uint256 trustScore
    ) external {
        require(msg.sender == owner() || msg.sender == zkVerifier, "Unauthorized");
        require(identities[user].verified, "User not verified");

        Reputation storage rep = reputations[user];
        rep.consistencyScore = consistencyScore;
        rep.contributionScore = contributionScore;
        rep.governanceScore = governanceScore;
        rep.trustScore = trustScore;
        rep.totalActivities = userActivities[user].length;

        emit ReputationUpdated(user, consistencyScore, "consistency");
        emit ReputationUpdated(user, contributionScore, "contribution");
        emit ReputationUpdated(user, governanceScore, "governance");
        emit ReputationUpdated(user, trustScore, "trust");
    }

    function _mintSoulboundToken(address user) internal {
        uint256 tokenId = nextTokenId++;
        _safeMint(user, tokenId);
        tokenToUser[tokenId] = user;
    }

    function getScore(address user) external view returns (uint256) {
        return identities[user].scrollPower;
    }

    function getIdentity(address user) external view returns (
        uint256 scrollPower,
        uint256 verificationLevel,
        uint256 lastUpdate,
        bool verified
    ) {
        Identity memory identity = identities[user];
        return (
            identity.scrollPower,
            identity.verificationLevel,
            identity.lastUpdate,
            identity.verified
        );
    }

    function getReputation(address user) external view returns (
        uint256 totalActivities,
        uint256 consistencyScore,
        uint256 contributionScore,
        uint256 governanceScore,
        uint256 trustScore
    ) {
        Reputation memory rep = reputations[user];
        return (
            rep.totalActivities,
            rep.consistencyScore,
            rep.contributionScore,
            rep.governanceScore,
            rep.trustScore
        );
    }

    function getUserActivities(address user) external view returns (Activity[] memory) {
        return userActivities[user];
    }

    function getPendingActivities(address user) external view returns (uint256 count, uint256 totalSP) {
        Activity[] memory activities = userActivities[user];
        uint256 pending = 0;
        uint256 sp = 0;

        for (uint256 i = 0; i < activities.length; i++) {
            if (!activities[i].claimed) {
                pending++;
                sp += activities[i].spReward;
            }
        }

        return (pending, sp);
    }

    function setZKVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid address");
        zkVerifier = newVerifier;
    }

    function setMaxScrollPower(uint256 newMax) external onlyOwner {
        maxScrollPower = newMax;
    }

    // Override transfer functions to make tokens soulbound (non-transferable)
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Transfer not allowed");
        }
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public virtual override {
        revert("Soulbound: Approval not allowed");
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert("Soulbound: Approval not allowed");
    }
}
