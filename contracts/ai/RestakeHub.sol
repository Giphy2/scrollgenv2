// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RestakeHub
 * @notice Restaking protocol for SGT and sSGT tokens with validator operations
 * @dev Allows users to restake for partner protocols and earn additional rewards
 */
contract RestakeHub is Ownable, ReentrancyGuard {
    struct Operator {
        address operatorAddress;
        string name;
        uint256 commission; // Basis points (100 = 1%)
        uint256 totalRestaked;
        uint256 maxCapacity;
        bool active;
        uint256 reputationScore;
        uint256 uptime; // Percentage
    }

    struct Restaking {
        address user;
        address operator;
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 rewardsAccrued;
        bool active;
    }

    struct ProtocolIntegration {
        address protocolAddress;
        string name;
        uint256 baseAPY;
        bool active;
    }

    IERC20 public sgtToken;
    IERC20 public sSGTToken;

    mapping(address => Operator) public operators;
    mapping(address => Restaking[]) public userRestakings;
    mapping(address => ProtocolIntegration) public protocols;
    mapping(address => uint256) public operatorRewards;

    address[] public operatorList;
    address[] public protocolList;

    uint256 public totalRestaked;
    uint256 public minRestakeAmount = 100 * 10**18; // 100 tokens
    uint256 public unstakeLockPeriod = 7 days;
    uint256 public constant BASIS_POINTS = 10000;

    event OperatorRegistered(address indexed operator, string name, uint256 commission);
    event OperatorUpdated(address indexed operator, uint256 commission, bool active);
    event Restaked(address indexed user, address indexed operator, uint256 amount, uint256 timestamp);
    event Unrestaked(address indexed user, address indexed operator, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ProtocolIntegrated(address indexed protocol, string name, uint256 baseAPY);
    event YieldDistributed(address indexed operator, uint256 totalAmount, uint256 timestamp);

    constructor(address _sgtToken, address _sSGTToken) Ownable(msg.sender) {
        require(_sgtToken != address(0) && _sSGTToken != address(0), "Invalid token addresses");
        sgtToken = IERC20(_sgtToken);
        sSGTToken = IERC20(_sSGTToken);
    }

    function registerOperator(
        string calldata name,
        uint256 commission,
        uint256 maxCapacity
    ) external {
        require(!operators[msg.sender].active, "Already registered");
        require(commission <= 2000, "Commission too high"); // Max 20%
        require(maxCapacity >= 1000 * 10**18, "Capacity too low");

        operators[msg.sender] = Operator({
            operatorAddress: msg.sender,
            name: name,
            commission: commission,
            totalRestaked: 0,
            maxCapacity: maxCapacity,
            active: true,
            reputationScore: 100,
            uptime: 100
        });

        operatorList.push(msg.sender);
        emit OperatorRegistered(msg.sender, name, commission);
    }

    function updateOperator(
        uint256 newCommission,
        uint256 newMaxCapacity,
        bool active
    ) external {
        require(operators[msg.sender].active || !active, "Not registered");
        require(newCommission <= 2000, "Commission too high");

        Operator storage op = operators[msg.sender];
        op.commission = newCommission;
        op.maxCapacity = newMaxCapacity;
        op.active = active;

        emit OperatorUpdated(msg.sender, newCommission, active);
    }

    function restake(address operator, uint256 amount, bool useSGT) external nonReentrant {
        require(operators[operator].active, "Operator not active");
        require(amount >= minRestakeAmount, "Amount too low");

        Operator storage op = operators[operator];
        require(op.totalRestaked + amount <= op.maxCapacity, "Operator at capacity");

        IERC20 token = useSGT ? sgtToken : sSGTToken;
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        userRestakings[msg.sender].push(Restaking({
            user: msg.sender,
            operator: operator,
            amount: amount,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            rewardsAccrued: 0,
            active: true
        }));

        op.totalRestaked += amount;
        totalRestaked += amount;

        emit Restaked(msg.sender, operator, amount, block.timestamp);
    }

    function unrestake(uint256 restakingIndex) external nonReentrant {
        require(restakingIndex < userRestakings[msg.sender].length, "Invalid index");

        Restaking storage restaking = userRestakings[msg.sender][restakingIndex];
        require(restaking.active, "Not active");
        require(
            block.timestamp >= restaking.startTime + unstakeLockPeriod,
            "Still locked"
        );

        uint256 amount = restaking.amount;
        address operator = restaking.operator;

        _claimRewards(msg.sender, restakingIndex);

        restaking.active = false;
        operators[operator].totalRestaked -= amount;
        totalRestaked -= amount;

        require(sgtToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unrestaked(msg.sender, operator, amount, block.timestamp);
    }

    function claimRewards(uint256 restakingIndex) external nonReentrant {
        require(restakingIndex < userRestakings[msg.sender].length, "Invalid index");
        _claimRewards(msg.sender, restakingIndex);
    }

    function _claimRewards(address user, uint256 restakingIndex) internal {
        Restaking storage restaking = userRestakings[user][restakingIndex];
        require(restaking.active, "Not active");

        uint256 rewards = _calculateRewards(user, restakingIndex);

        if (rewards > 0) {
            restaking.rewardsAccrued += rewards;
            restaking.lastClaimTime = block.timestamp;

            Operator storage op = operators[restaking.operator];
            uint256 commission = (rewards * op.commission) / BASIS_POINTS;
            uint256 userReward = rewards - commission;

            operatorRewards[restaking.operator] += commission;

            require(sgtToken.transfer(user, userReward), "Transfer failed");
            emit RewardsClaimed(user, userReward);
        }
    }

    function _calculateRewards(address user, uint256 restakingIndex) internal view returns (uint256) {
        Restaking memory restaking = userRestakings[user][restakingIndex];
        if (!restaking.active) return 0;

        uint256 timeStaked = block.timestamp - restaking.lastClaimTime;
        uint256 baseAPY = 1500; // 15% base APY in basis points

        uint256 rewards = (restaking.amount * baseAPY * timeStaked) / (365 days * BASIS_POINTS);
        return rewards;
    }

    function integrateProtocol(
        address protocolAddress,
        string calldata name,
        uint256 baseAPY
    ) external onlyOwner {
        require(protocolAddress != address(0), "Invalid address");
        require(!protocols[protocolAddress].active, "Already integrated");

        protocols[protocolAddress] = ProtocolIntegration({
            protocolAddress: protocolAddress,
            name: name,
            baseAPY: baseAPY,
            active: true
        });

        protocolList.push(protocolAddress);
        emit ProtocolIntegrated(protocolAddress, name, baseAPY);
    }

    function distributeYield(address operator, uint256 amount) external onlyOwner {
        require(operators[operator].active, "Operator not active");
        require(sgtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        operatorRewards[operator] += amount;
        emit YieldDistributed(operator, amount, block.timestamp);
    }

    function updateOperatorMetrics(
        address operator,
        uint256 reputationScore,
        uint256 uptime
    ) external onlyOwner {
        require(operators[operator].active, "Operator not active");
        require(reputationScore <= 100 && uptime <= 100, "Invalid metrics");

        operators[operator].reputationScore = reputationScore;
        operators[operator].uptime = uptime;
    }

    function getUserRestakings(address user) external view returns (Restaking[] memory) {
        return userRestakings[user];
    }

    function getActiveRestaking(address user, uint256 index) external view returns (
        address operator,
        uint256 amount,
        uint256 startTime,
        uint256 pendingRewards,
        bool active
    ) {
        require(index < userRestakings[user].length, "Invalid index");
        Restaking memory restaking = userRestakings[user][index];
        uint256 pending = _calculateRewards(user, index);

        return (
            restaking.operator,
            restaking.amount,
            restaking.startTime,
            pending,
            restaking.active
        );
    }

    function getOperatorInfo(address operator) external view returns (
        string memory name,
        uint256 commission,
        uint256 totalRestaked,
        uint256 maxCapacity,
        uint256 reputationScore,
        uint256 uptime,
        bool active
    ) {
        Operator memory op = operators[operator];
        return (
            op.name,
            op.commission,
            op.totalRestaked,
            op.maxCapacity,
            op.reputationScore,
            op.uptime,
            op.active
        );
    }

    function getActiveOperators() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < operatorList.length; i++) {
            if (operators[operatorList[i]].active) {
                count++;
            }
        }

        address[] memory active = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < operatorList.length; i++) {
            if (operators[operatorList[i]].active) {
                active[index] = operatorList[i];
                index++;
            }
        }

        return active;
    }

    function setMinRestakeAmount(uint256 newMin) external onlyOwner {
        minRestakeAmount = newMin;
    }

    function setUnstakeLockPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod <= 30 days, "Period too long");
        unstakeLockPeriod = newPeriod;
    }
}
