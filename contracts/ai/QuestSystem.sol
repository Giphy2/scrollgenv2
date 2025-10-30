// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title QuestSystem
 * @notice Gamified quest and achievement system for ScrollGen
 * @dev Issues evolving NFT badges based on user participation metrics
 */
contract QuestSystem is ERC721URIStorage, Ownable, ReentrancyGuard {
    struct Quest {
        uint256 questId;
        string name;
        string description;
        uint256 requiredProgress;
        uint256 rewardType;
        uint256 rewardAmount;
        bool active;
        uint256 participants;
        uint256 completions;
    }

    struct UserQuest {
        uint256 questId;
        uint256 progress;
        uint256 startTime;
        uint256 completionTime;
        bool completed;
        bool claimed;
    }

    struct Badge {
        uint256 badgeId;
        string name;
        uint256 tier;
        uint256 experience;
        uint256 level;
        uint256 mintTime;
        string metadataURI;
    }

    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => UserQuest)) public userQuests;
    mapping(address => uint256[]) public userCompletedQuests;
    mapping(uint256 => Badge) public badges;
    mapping(address => uint256[]) public userBadges;

    uint256 public nextQuestId = 1;
    uint256 public nextBadgeId = 1;
    uint256 public constant MAX_LEVEL = 100;
    uint256 public constant EXP_PER_LEVEL = 1000;

    event QuestCreated(uint256 indexed questId, string name, uint256 requiredProgress);
    event QuestStarted(address indexed user, uint256 indexed questId, uint256 timestamp);
    event QuestProgressUpdated(address indexed user, uint256 indexed questId, uint256 progress);
    event QuestCompleted(address indexed user, uint256 indexed questId, uint256 timestamp);
    event BadgeClaimed(address indexed user, uint256 indexed badgeId, uint256 tier);
    event BadgeUpgraded(uint256 indexed badgeId, uint256 newLevel, uint256 newExperience);
    event RewardDistributed(address indexed user, uint256 rewardType, uint256 amount);

    constructor() ERC721("ScrollGen Quest Badge", "SQB") Ownable(msg.sender) {}

    function createQuest(
        string calldata name,
        string calldata description,
        uint256 requiredProgress,
        uint256 rewardType,
        uint256 rewardAmount
    ) external onlyOwner returns (uint256) {
        uint256 questId = nextQuestId++;

        quests[questId] = Quest({
            questId: questId,
            name: name,
            description: description,
            requiredProgress: requiredProgress,
            rewardType: rewardType,
            rewardAmount: rewardAmount,
            active: true,
            participants: 0,
            completions: 0
        });

        emit QuestCreated(questId, name, requiredProgress);
        return questId;
    }

    function startQuest(uint256 questId) external {
        require(quests[questId].active, "Quest not active");
        require(!userQuests[msg.sender][questId].completed, "Already completed");
        require(userQuests[msg.sender][questId].progress == 0, "Already started");

        userQuests[msg.sender][questId] = UserQuest({
            questId: questId,
            progress: 0,
            startTime: block.timestamp,
            completionTime: 0,
            completed: false,
            claimed: false
        });

        quests[questId].participants++;
        emit QuestStarted(msg.sender, questId, block.timestamp);
    }

    function updateProgress(address user, uint256 questId, uint256 amount) external onlyOwner {
        require(quests[questId].active, "Quest not active");

        UserQuest storage userQuest = userQuests[user][questId];
        require(!userQuest.completed, "Already completed");

        userQuest.progress += amount;

        emit QuestProgressUpdated(user, questId, userQuest.progress);

        if (userQuest.progress >= quests[questId].requiredProgress) {
            _completeQuest(user, questId);
        }
    }

    function _completeQuest(address user, uint256 questId) internal {
        UserQuest storage userQuest = userQuests[user][questId];
        userQuest.completed = true;
        userQuest.completionTime = block.timestamp;

        quests[questId].completions++;
        userCompletedQuests[user].push(questId);

        emit QuestCompleted(user, questId, block.timestamp);
    }

    function completeQuest(uint256 questId) external nonReentrant {
        UserQuest storage userQuest = userQuests[msg.sender][questId];
        require(!userQuest.completed, "Already completed");
        require(
            userQuest.progress >= quests[questId].requiredProgress,
            "Insufficient progress"
        );

        _completeQuest(msg.sender, questId);
    }

    function claimBadge(uint256 questId) external nonReentrant {
        UserQuest storage userQuest = userQuests[msg.sender][questId];
        require(userQuest.completed, "Quest not completed");
        require(!userQuest.claimed, "Already claimed");

        userQuest.claimed = true;

        uint256 badgeId = nextBadgeId++;
        uint256 tier = _calculateBadgeTier(questId, msg.sender);

        badges[badgeId] = Badge({
            badgeId: badgeId,
            name: quests[questId].name,
            tier: tier,
            experience: 0,
            level: 1,
            mintTime: block.timestamp,
            metadataURI: ""
        });

        userBadges[msg.sender].push(badgeId);
        _safeMint(msg.sender, badgeId);

        Quest memory quest = quests[questId];
        if (quest.rewardAmount > 0) {
            emit RewardDistributed(msg.sender, quest.rewardType, quest.rewardAmount);
        }

        emit BadgeClaimed(msg.sender, badgeId, tier);
    }

    function _calculateBadgeTier(uint256 questId, address user) internal view returns (uint256) {
        Quest memory quest = quests[questId];
        UserQuest memory userQuest = userQuests[user][questId];

        uint256 completionTime = userQuest.completionTime - userQuest.startTime;
        uint256 completedQuests = userCompletedQuests[user].length;

        if (completedQuests >= 50) return 5; // Legendary
        if (completedQuests >= 30) return 4; // Epic
        if (completedQuests >= 15) return 3; // Rare
        if (completedQuests >= 5) return 2;  // Uncommon
        return 1; // Common
    }

    function addBadgeExperience(uint256 badgeId, uint256 exp) external onlyOwner {
        require(_ownerOf(badgeId) != address(0), "Badge doesn't exist");

        Badge storage badge = badges[badgeId];
        badge.experience += exp;

        while (badge.experience >= EXP_PER_LEVEL && badge.level < MAX_LEVEL) {
            badge.experience -= EXP_PER_LEVEL;
            badge.level++;
        }

        emit BadgeUpgraded(badgeId, badge.level, badge.experience);
    }

    function setBadgeMetadata(uint256 badgeId, string calldata uri) external onlyOwner {
        require(_ownerOf(badgeId) != address(0), "Badge doesn't exist");
        badges[badgeId].metadataURI = uri;
        _setTokenURI(badgeId, uri);
    }

    function getQuest(uint256 questId) external view returns (
        string memory name,
        string memory description,
        uint256 requiredProgress,
        uint256 rewardAmount,
        bool active,
        uint256 participants,
        uint256 completions
    ) {
        Quest memory quest = quests[questId];
        return (
            quest.name,
            quest.description,
            quest.requiredProgress,
            quest.rewardAmount,
            quest.active,
            quest.participants,
            quest.completions
        );
    }

    function getUserQuestProgress(address user, uint256 questId) external view returns (
        uint256 progress,
        uint256 requiredProgress,
        bool completed,
        bool claimed
    ) {
        UserQuest memory userQuest = userQuests[user][questId];
        Quest memory quest = quests[questId];

        return (
            userQuest.progress,
            quest.requiredProgress,
            userQuest.completed,
            userQuest.claimed
        );
    }

    function getUserCompletedQuests(address user) external view returns (uint256[] memory) {
        return userCompletedQuests[user];
    }

    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }

    function getBadge(uint256 badgeId) external view returns (
        string memory name,
        uint256 tier,
        uint256 experience,
        uint256 level,
        uint256 mintTime,
        string memory metadataURI
    ) {
        Badge memory badge = badges[badgeId];
        return (
            badge.name,
            badge.tier,
            badge.experience,
            badge.level,
            badge.mintTime,
            badge.metadataURI
        );
    }

    function getActiveQuests() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextQuestId; i++) {
            if (quests[i].active) {
                count++;
            }
        }

        uint256[] memory activeQuests = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextQuestId; i++) {
            if (quests[i].active) {
                activeQuests[index] = i;
                index++;
            }
        }

        return activeQuests;
    }

    function getUserStats(address user) external view returns (
        uint256 completedQuests,
        uint256 totalBadges,
        uint256 highestTier,
        uint256 totalExperience
    ) {
        completedQuests = userCompletedQuests[user].length;
        totalBadges = userBadges[user].length;
        highestTier = 0;
        totalExperience = 0;

        for (uint256 i = 0; i < userBadges[user].length; i++) {
            Badge memory badge = badges[userBadges[user][i]];
            if (badge.tier > highestTier) {
                highestTier = badge.tier;
            }
            totalExperience += (badge.level - 1) * EXP_PER_LEVEL + badge.experience;
        }

        return (completedQuests, totalBadges, highestTier, totalExperience);
    }

    function setQuestActive(uint256 questId, bool active) external onlyOwner {
        require(quests[questId].questId != 0, "Quest doesn't exist");
        quests[questId].active = active;
    }
}
