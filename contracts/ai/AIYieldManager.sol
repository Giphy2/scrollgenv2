// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AIYieldManager
 * @notice AI-powered yield optimization manager for ScrollGen
 * @dev Collects on-chain metrics and executes AI-driven rebalancing strategies
 */
contract AIYieldManager is Ownable, ReentrancyGuard {
    struct Pool {
        address poolAddress;
        uint256 currentAPY;
        uint256 liquidity;
        uint256 volatility;
        uint256 lastUpdate;
        bool active;
    }

    struct Strategy {
        uint256 targetAPY;
        uint256 maxVolatility;
        uint256 minLiquidity;
        bool autoRebalance;
    }

    struct RebalanceProposal {
        address fromPool;
        address toPool;
        uint256 amount;
        uint256 expectedAPY;
        uint256 timestamp;
        bool executed;
        string aiReasoning;
    }

    address public aiOracle;
    mapping(address => Pool) public pools;
    mapping(address => Strategy) public userStrategies;
    mapping(uint256 => RebalanceProposal) public proposals;

    address[] public poolList;
    uint256 public proposalCount;
    uint256 public rebalanceFee = 10; // 0.1% fee
    uint256 public constant FEE_DENOMINATOR = 10000;

    event PoolRegistered(address indexed poolAddress, uint256 initialAPY);
    event YieldUpdated(address indexed pool, uint256 newAPY, uint256 liquidity, uint256 volatility);
    event RiskAlert(address indexed user, address indexed pool, string reason);
    event RebalanceTriggered(uint256 indexed proposalId, address fromPool, address toPool, uint256 amount);
    event RebalanceExecuted(uint256 indexed proposalId, address indexed user, uint256 actualAPY);
    event StrategyUpdated(address indexed user, uint256 targetAPY, uint256 maxVolatility);
    event AIVerdictReceived(uint256 indexed proposalId, string reasoning);

    constructor() Ownable(msg.sender) {
        aiOracle = msg.sender;
    }

    function setAIOracle(address _aiOracle) external onlyOwner {
        require(_aiOracle != address(0), "Invalid oracle address");
        aiOracle = _aiOracle;
    }

    function registerPool(
        address poolAddress,
        uint256 initialAPY,
        uint256 initialLiquidity
    ) external onlyOwner {
        require(poolAddress != address(0), "Invalid pool address");
        require(!pools[poolAddress].active, "Pool already registered");

        pools[poolAddress] = Pool({
            poolAddress: poolAddress,
            currentAPY: initialAPY,
            liquidity: initialLiquidity,
            volatility: 0,
            lastUpdate: block.timestamp,
            active: true
        });

        poolList.push(poolAddress);
        emit PoolRegistered(poolAddress, initialAPY);
    }

    function updatePoolMetrics(
        address poolAddress,
        uint256 newAPY,
        uint256 newLiquidity,
        uint256 newVolatility
    ) external {
        require(msg.sender == aiOracle || msg.sender == owner(), "Only oracle or owner");
        require(pools[poolAddress].active, "Pool not active");

        Pool storage pool = pools[poolAddress];
        pool.currentAPY = newAPY;
        pool.liquidity = newLiquidity;
        pool.volatility = newVolatility;
        pool.lastUpdate = block.timestamp;

        emit YieldUpdated(poolAddress, newAPY, newLiquidity, newVolatility);

        _checkRiskAlerts(poolAddress);
    }

    function setUserStrategy(
        uint256 targetAPY,
        uint256 maxVolatility,
        uint256 minLiquidity,
        bool autoRebalance
    ) external {
        userStrategies[msg.sender] = Strategy({
            targetAPY: targetAPY,
            maxVolatility: maxVolatility,
            minLiquidity: minLiquidity,
            autoRebalance: autoRebalance
        });

        emit StrategyUpdated(msg.sender, targetAPY, maxVolatility);
    }

    function proposeRebalance(
        address user,
        address fromPool,
        address toPool,
        uint256 amount,
        uint256 expectedAPY,
        string calldata aiReasoning
    ) external returns (uint256) {
        require(msg.sender == aiOracle || msg.sender == owner(), "Only oracle or owner");
        require(pools[fromPool].active && pools[toPool].active, "Invalid pools");

        uint256 proposalId = proposalCount++;
        proposals[proposalId] = RebalanceProposal({
            fromPool: fromPool,
            toPool: toPool,
            amount: amount,
            expectedAPY: expectedAPY,
            timestamp: block.timestamp,
            executed: false,
            aiReasoning: aiReasoning
        });

        emit RebalanceTriggered(proposalId, fromPool, toPool, amount);
        emit AIVerdictReceived(proposalId, aiReasoning);

        Strategy memory strategy = userStrategies[user];
        if (strategy.autoRebalance && expectedAPY >= strategy.targetAPY) {
            _executeRebalance(proposalId, user);
        }

        return proposalId;
    }

    function executeRebalance(uint256 proposalId) external nonReentrant {
        RebalanceProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(block.timestamp <= proposal.timestamp + 1 hours, "Proposal expired");

        _executeRebalance(proposalId, msg.sender);
    }

    function _executeRebalance(uint256 proposalId, address user) internal {
        RebalanceProposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        uint256 fee = (proposal.amount * rebalanceFee) / FEE_DENOMINATOR;
        uint256 netAmount = proposal.amount - fee;

        emit RebalanceExecuted(proposalId, user, proposal.expectedAPY);
    }

    function _checkRiskAlerts(address poolAddress) internal {
        Pool memory pool = pools[poolAddress];

        for (uint256 i = 0; i < poolList.length; i++) {
            address userAddr = poolList[i];
            Strategy memory strategy = userStrategies[userAddr];

            if (strategy.targetAPY > 0) {
                if (pool.volatility > strategy.maxVolatility) {
                    emit RiskAlert(userAddr, poolAddress, "Volatility exceeds threshold");
                }
                if (pool.liquidity < strategy.minLiquidity) {
                    emit RiskAlert(userAddr, poolAddress, "Liquidity below threshold");
                }
            }
        }
    }

    function getPoolMetrics(address poolAddress) external view returns (
        uint256 apy,
        uint256 liquidity,
        uint256 volatility,
        uint256 lastUpdate,
        bool active
    ) {
        Pool memory pool = pools[poolAddress];
        return (pool.currentAPY, pool.liquidity, pool.volatility, pool.lastUpdate, pool.active);
    }

    function getUserStrategy(address user) external view returns (
        uint256 targetAPY,
        uint256 maxVolatility,
        uint256 minLiquidity,
        bool autoRebalance
    ) {
        Strategy memory strategy = userStrategies[user];
        return (strategy.targetAPY, strategy.maxVolatility, strategy.minLiquidity, strategy.autoRebalance);
    }

    function getProposal(uint256 proposalId) external view returns (
        address fromPool,
        address toPool,
        uint256 amount,
        uint256 expectedAPY,
        bool executed,
        string memory reasoning
    ) {
        RebalanceProposal memory proposal = proposals[proposalId];
        return (
            proposal.fromPool,
            proposal.toPool,
            proposal.amount,
            proposal.expectedAPY,
            proposal.executed,
            proposal.aiReasoning
        );
    }

    function getActivePools() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < poolList.length; i++) {
            if (pools[poolList[i]].active) {
                activeCount++;
            }
        }

        address[] memory activePools = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < poolList.length; i++) {
            if (pools[poolList[i]].active) {
                activePools[index] = poolList[i];
                index++;
            }
        }

        return activePools;
    }

    function setRebalanceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high"); // Max 1%
        rebalanceFee = newFee;
    }
}
