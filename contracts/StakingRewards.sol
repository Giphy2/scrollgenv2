// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakingRewards
 * @notice Time-locked staking with reward multipliers for SGT token
 * @dev Implements flexible and time-locked staking pools with auto-compound
 */
contract StakingRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration;
        uint256 rewardDebt;
        bool autoCompound;
        uint8 multiplier;
    }

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRate;
    uint256 public totalStaked;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_STAKE = 100 * 1e18;

    event Staked(address indexed user, uint256 amount, uint256 lockDuration, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 amount, uint256 stakeIndex);
    event RewardsClaimed(address indexed user, uint256 amount);
    event Compounded(address indexed user, uint256 amount, uint256 stakeIndex);
    event RewardRateUpdated(uint256 newRate);

    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _initialRewardRate
    ) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _initialRewardRate;
        lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Stake tokens with optional lock duration
     * @param amount Amount to stake
     * @param lockDuration Lock duration in seconds (0 for flexible)
     * @param autoCompound Enable auto-compounding
     */
    function stake(
        uint256 amount,
        uint256 lockDuration,
        bool autoCompound
    ) external nonReentrant updateReward(msg.sender) {
        require(amount >= MIN_STAKE, "Amount below minimum");
        require(
            lockDuration == 0 ||
            lockDuration == 30 days ||
            lockDuration == 90 days ||
            lockDuration == 180 days ||
            lockDuration == 365 days,
            "Invalid lock duration"
        );

        uint8 multiplier = getMultiplier(lockDuration);

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender].push(Stake({
            amount: amount,
            startTime: block.timestamp,
            lockDuration: lockDuration,
            rewardDebt: 0,
            autoCompound: autoCompound,
            multiplier: multiplier
        }));

        totalStaked += amount;

        emit Staked(msg.sender, amount, lockDuration, stakes[msg.sender].length - 1);
    }

    /**
     * @notice Unstake tokens from a specific stake
     * @param stakeIndex Index of the stake to unstake
     */
    function unstake(uint256 stakeIndex) external nonReentrant updateReward(msg.sender) {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");

        Stake storage userStake = stakes[msg.sender][stakeIndex];
        require(userStake.amount > 0, "Stake already withdrawn");
        require(
            block.timestamp >= userStake.startTime + userStake.lockDuration,
            "Stake still locked"
        );

        uint256 amount = userStake.amount;
        uint256 reward = calculateStakeReward(msg.sender, stakeIndex);

        userStake.amount = 0;
        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);

        if (reward > 0) {
            rewards[msg.sender] += reward;
        }

        emit Unstaked(msg.sender, amount, stakeIndex);
    }

    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    /**
     * @notice Compound rewards into a specific stake
     * @param stakeIndex Index of the stake to compound into
     */
    function compound(uint256 stakeIndex) external nonReentrant updateReward(msg.sender) {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");

        Stake storage userStake = stakes[msg.sender][stakeIndex];
        require(userStake.amount > 0, "Stake withdrawn");
        require(userStake.autoCompound, "Auto-compound not enabled");

        uint256 reward = calculateStakeReward(msg.sender, stakeIndex);
        require(reward > 0, "No rewards to compound");

        userStake.amount += reward;
        totalStaked += reward;

        emit Compounded(msg.sender, reward, stakeIndex);
    }

    /**
     * @notice Calculate rewards for a specific stake
     */
    function calculateStakeReward(address user, uint256 stakeIndex) public view returns (uint256) {
        if (stakeIndex >= stakes[user].length) return 0;

        Stake memory userStake = stakes[user][stakeIndex];
        if (userStake.amount == 0) return 0;

        uint256 timeStaked = block.timestamp - userStake.startTime;
        uint256 baseReward = (userStake.amount * rewardRate * timeStaked) / (365 days * PRECISION);
        uint256 multipliedReward = (baseReward * userStake.multiplier) / 10;

        return multipliedReward;
    }

    /**
     * @notice Calculate total earned rewards for a user
     */
    function earned(address user) public view returns (uint256) {
        uint256 total = rewards[user];

        for (uint256 i = 0; i < stakes[user].length; i++) {
            total += calculateStakeReward(user, i);
        }

        return total;
    }

    /**
     * @notice Get multiplier based on lock duration
     */
    function getMultiplier(uint256 lockDuration) public pure returns (uint8) {
        if (lockDuration == 0) return 10;        // 1x
        if (lockDuration == 30 days) return 15;  // 1.5x
        if (lockDuration == 90 days) return 20;  // 2x
        if (lockDuration == 180 days) return 30; // 3x
        if (lockDuration == 365 days) return 50; // 5x
        return 10;
    }

    /**
     * @notice Get all stakes for a user
     */
    function getUserStakes(address user) external view returns (Stake[] memory) {
        return stakes[user];
    }

    /**
     * @notice Get total user staked amount
     */
    function getUserTotalStaked(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < stakes[user].length; i++) {
            total += stakes[user][i].amount;
        }
        return total;
    }

    /**
     * @notice Update reward rate (owner only)
     */
    function setRewardRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @notice Emergency withdraw rewards (owner only)
     */
    function emergencyWithdrawRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransfer(owner(), amount);
    }

    /**
     * @notice Update rewards modifier
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /**
     * @notice Calculate reward per token
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * PRECISION) / totalStaked);
    }
}
