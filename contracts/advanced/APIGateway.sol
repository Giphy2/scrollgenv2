// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IStakingRewards {
    function totalStaked() external view returns (uint256);
    function rewardRate() external view returns (uint256);
}

interface ILendingProtocol {
    function totalSupplied() external view returns (uint256);
    function utilizationRate() external view returns (uint256);
    function supplyAPY() external view returns (uint256);
    function borrowAPY() external view returns (uint256);
}

interface IBridgeConnector {
    function totalBridged() external view returns (uint256);
}

interface ILRT {
    function totalStakedSGT() external view returns (uint256);
    function getExchangeRate() external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title APIGateway
 * @notice On-chain data provider for analytics and monitoring
 * @dev Gas-optimized read-only functions for protocol metrics
 */
contract APIGateway is Ownable {
    struct StakingMetrics {
        uint256 totalStaked;
        uint256 totalRewards;
        uint256 averageAPY;
        uint256 activeStakers;
        uint256 rewardRate;
    }

    struct LendingMetrics {
        uint256 totalSupplied;
        uint256 totalBorrowed;
        uint256 utilizationRate;
        uint256 supplyAPY;
        uint256 borrowAPY;
    }

    struct BridgeMetrics {
        uint256 totalVolume;
        uint256 totalTransactions;
        uint256 averageBridgeTime;
    }

    struct LRTMetrics {
        uint256 totalStaked;
        uint256 exchangeRate;
        uint256 totalsSGT;
        uint256 estimatedAPY;
    }

    struct ProtocolMetrics {
        uint256 totalTVL;
        uint256 totalUsers;
        uint256 daoTreasury;
        uint256 totalTransactions;
        uint256 totalFees;
    }

    address public sgtToken;
    address public stakingRewards;
    address public lendingProtocol;
    address public bridgeConnector;
    address public lrt;
    address public daoTreasury;

    mapping(address => bool) public registeredUsers;
    uint256 public totalUsers;
    uint256 public totalTransactions;
    uint256 public totalFeesCollected;

    event ContractRegistered(string indexed contractType, address indexed contractAddress);
    event UserRegistered(address indexed user);
    event TransactionRecorded(uint256 indexed transactionId);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register contract addresses
     * @param _sgtToken SGT token address
     * @param _stakingRewards Staking rewards address
     * @param _lendingProtocol Lending protocol address
     * @param _bridgeConnector Bridge connector address
     * @param _lrt LRT address
     * @param _daoTreasury DAO treasury address
     */
    function registerContracts(
        address _sgtToken,
        address _stakingRewards,
        address _lendingProtocol,
        address _bridgeConnector,
        address _lrt,
        address _daoTreasury
    ) external onlyOwner {
        sgtToken = _sgtToken;
        stakingRewards = _stakingRewards;
        lendingProtocol = _lendingProtocol;
        bridgeConnector = _bridgeConnector;
        lrt = _lrt;
        daoTreasury = _daoTreasury;

        emit ContractRegistered("SGT", _sgtToken);
        emit ContractRegistered("Staking", _stakingRewards);
        emit ContractRegistered("Lending", _lendingProtocol);
        emit ContractRegistered("Bridge", _bridgeConnector);
        emit ContractRegistered("LRT", _lrt);
    }

    /**
     * @notice Get total value locked across protocol
     */
    function getTotalTVL() external view returns (uint256) {
        uint256 tvl = 0;

        if (stakingRewards != address(0)) {
            tvl += IStakingRewards(stakingRewards).totalStaked();
        }

        if (lendingProtocol != address(0)) {
            tvl += ILendingProtocol(lendingProtocol).totalSupplied();
        }

        if (lrt != address(0)) {
            tvl += ILRT(lrt).totalStakedSGT();
        }

        return tvl;
    }

    /**
     * @notice Get staking metrics
     */
    function getStakingMetrics() external view returns (StakingMetrics memory) {
        if (stakingRewards == address(0)) {
            return StakingMetrics(0, 0, 0, 0, 0);
        }

        IStakingRewards staking = IStakingRewards(stakingRewards);

        return StakingMetrics({
            totalStaked: staking.totalStaked(),
            totalRewards: 0,
            averageAPY: 0,
            activeStakers: 0,
            rewardRate: staking.rewardRate()
        });
    }

    /**
     * @notice Get lending metrics
     */
    function getLendingMetrics() external view returns (LendingMetrics memory) {
        if (lendingProtocol == address(0)) {
            return LendingMetrics(0, 0, 0, 0, 0);
        }

        ILendingProtocol lending = ILendingProtocol(lendingProtocol);

        return LendingMetrics({
            totalSupplied: lending.totalSupplied(),
            totalBorrowed: 0,
            utilizationRate: lending.utilizationRate(),
            supplyAPY: lending.supplyAPY(),
            borrowAPY: lending.borrowAPY()
        });
    }

    /**
     * @notice Get bridge metrics
     */
    function getBridgeMetrics() external view returns (BridgeMetrics memory) {
        if (bridgeConnector == address(0)) {
            return BridgeMetrics(0, 0, 0);
        }

        IBridgeConnector bridge = IBridgeConnector(bridgeConnector);

        return BridgeMetrics({
            totalVolume: bridge.totalBridged(),
            totalTransactions: 0,
            averageBridgeTime: 15 minutes
        });
    }

    /**
     * @notice Get LRT metrics
     */
    function getLRTMetrics() external view returns (LRTMetrics memory) {
        if (lrt == address(0)) {
            return LRTMetrics(0, 0, 0, 0);
        }

        ILRT lrtContract = ILRT(lrt);

        return LRTMetrics({
            totalStaked: lrtContract.totalStakedSGT(),
            exchangeRate: lrtContract.getExchangeRate(),
            totalsSGT: lrtContract.totalSupply(),
            estimatedAPY: 0
        });
    }

    /**
     * @notice Get protocol-wide metrics
     */
    function getProtocolMetrics() external view returns (ProtocolMetrics memory) {
        uint256 tvl = 0;

        if (stakingRewards != address(0)) {
            tvl += IStakingRewards(stakingRewards).totalStaked();
        }

        if (lendingProtocol != address(0)) {
            tvl += ILendingProtocol(lendingProtocol).totalSupplied();
        }

        if (lrt != address(0)) {
            tvl += ILRT(lrt).totalStakedSGT();
        }

        uint256 treasury = 0;
        if (daoTreasury != address(0) && sgtToken != address(0)) {
            treasury = IERC20(sgtToken).balanceOf(daoTreasury);
        }

        return ProtocolMetrics({
            totalTVL: tvl,
            totalUsers: totalUsers,
            daoTreasury: treasury,
            totalTransactions: totalTransactions,
            totalFees: totalFeesCollected
        });
    }

    /**
     * @notice Get bridge volume
     */
    function getBridgeVolume() external view returns (uint256) {
        if (bridgeConnector == address(0)) return 0;
        return IBridgeConnector(bridgeConnector).totalBridged();
    }

    /**
     * @notice Get DAO treasury balance
     */
    function getDAOTreasury() external view returns (uint256) {
        if (daoTreasury == address(0) || sgtToken == address(0)) return 0;
        return IERC20(sgtToken).balanceOf(daoTreasury);
    }

    /**
     * @notice Get active users count
     */
    function getActiveUsers() external view returns (uint256) {
        return totalUsers;
    }

    /**
     * @notice Get SGT token supply
     */
    function getSGTSupply() external view returns (uint256) {
        if (sgtToken == address(0)) return 0;
        return IERC20(sgtToken).totalSupply();
    }

    /**
     * @notice Record user activity
     * @param user User address
     */
    function recordUser(address user) external {
        if (!registeredUsers[user]) {
            registeredUsers[user] = true;
            totalUsers++;
            emit UserRegistered(user);
        }
    }

    /**
     * @notice Record transaction
     */
    function recordTransaction() external {
        totalTransactions++;
        emit TransactionRecorded(totalTransactions);
    }

    /**
     * @notice Record fees
     * @param amount Fee amount
     */
    function recordFees(uint256 amount) external onlyOwner {
        totalFeesCollected += amount;
    }

    /**
     * @notice Get all metrics in one call (gas efficient)
     */
    function getAllMetrics() external view returns (
        uint256 tvl,
        uint256 users,
        uint256 transactions,
        uint256 fees,
        uint256 treasury
    ) {
        tvl = 0;

        if (stakingRewards != address(0)) {
            tvl += IStakingRewards(stakingRewards).totalStaked();
        }

        if (lendingProtocol != address(0)) {
            tvl += ILendingProtocol(lendingProtocol).totalSupplied();
        }

        if (lrt != address(0)) {
            tvl += ILRT(lrt).totalStakedSGT();
        }

        if (daoTreasury != address(0) && sgtToken != address(0)) {
            treasury = IERC20(sgtToken).balanceOf(daoTreasury);
        }

        return (tvl, totalUsers, totalTransactions, totalFeesCollected, treasury);
    }
}
