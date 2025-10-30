// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LendingProtocol
 * @notice Simple lending market for supplying and borrowing assets
 * @dev Implements collateralized lending with variable interest rates
 */
contract LendingProtocol is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Supply {
        uint256 amount;
        uint256 timestamp;
        uint256 interestEarned;
        uint256 lastUpdateTime;
    }

    struct Borrow {
        uint256 collateral;
        uint256 borrowed;
        address asset;
        uint256 timestamp;
        uint256 interestAccrued;
        uint256 lastUpdateTime;
    }

    IERC20 public immutable collateralToken;

    mapping(address => Supply) public supplies;
    mapping(address => Borrow[]) public borrows;
    mapping(address => bool) public supportedAssets;
    mapping(address => uint256) public totalBorrowedByAsset;

    uint256 public totalSupplied;
    uint256 public totalCollateral;

    uint256 public constant LTV_RATIO = 66;
    uint256 public constant LIQUIDATION_THRESHOLD = 75;
    uint256 public constant LIQUIDATION_PENALTY = 10;
    uint256 public constant PRECISION = 100;

    uint256 public constant BASE_RATE = 2e16;
    uint256 public constant OPTIMAL_UTILIZATION = 80;
    uint256 public constant RATE_SLOPE_1 = 8e16;
    uint256 public constant RATE_SLOPE_2 = 40e16;

    event Supplied(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, address indexed asset, uint256 amount, uint256 borrowIndex);
    event Repaid(address indexed user, uint256 borrowIndex, uint256 amount);
    event Liquidated(address indexed user, uint256 borrowIndex, address indexed liquidator);
    event AssetAdded(address indexed asset);
    event AssetRemoved(address indexed asset);

    constructor(address _collateralToken) Ownable(msg.sender) {
        require(_collateralToken != address(0), "Invalid collateral token");
        collateralToken = IERC20(_collateralToken);
    }

    /**
     * @notice Supply collateral tokens to earn interest
     * @param amount Amount to supply
     */
    function supply(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        updateSupplyInterest(msg.sender);

        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        Supply storage userSupply = supplies[msg.sender];
        userSupply.amount += amount;
        userSupply.timestamp = block.timestamp;
        userSupply.lastUpdateTime = block.timestamp;

        totalSupplied += amount;

        emit Supplied(msg.sender, amount);
    }

    /**
     * @notice Withdraw supplied tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        Supply storage userSupply = supplies[msg.sender];
        require(userSupply.amount >= amount, "Insufficient supply");

        updateSupplyInterest(msg.sender);

        uint256 availableLiquidity = collateralToken.balanceOf(address(this)) - totalCollateral;
        require(availableLiquidity >= amount, "Insufficient liquidity");

        userSupply.amount -= amount;
        totalSupplied -= amount;

        collateralToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Borrow assets against collateral
     * @param asset Asset to borrow
     * @param amount Amount to borrow
     */
    function borrow(address asset, uint256 amount) external nonReentrant {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be > 0");

        Supply storage userSupply = supplies[msg.sender];
        require(userSupply.amount > 0, "No collateral supplied");

        uint256 borrowCapacity = (userSupply.amount * LTV_RATIO) / PRECISION;
        uint256 currentBorrowed = getTotalBorrowed(msg.sender);

        require(currentBorrowed + amount <= borrowCapacity, "Exceeds borrow capacity");

        borrows[msg.sender].push(Borrow({
            collateral: userSupply.amount,
            borrowed: amount,
            asset: asset,
            timestamp: block.timestamp,
            interestAccrued: 0,
            lastUpdateTime: block.timestamp
        }));

        totalBorrowedByAsset[asset] += amount;
        totalCollateral += userSupply.amount;

        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Borrowed(msg.sender, asset, amount, borrows[msg.sender].length - 1);
    }

    /**
     * @notice Repay borrowed amount
     * @param borrowIndex Index of the borrow to repay
     * @param amount Amount to repay
     */
    function repay(uint256 borrowIndex, uint256 amount) external nonReentrant {
        require(borrowIndex < borrows[msg.sender].length, "Invalid borrow index");

        Borrow storage userBorrow = borrows[msg.sender][borrowIndex];
        require(userBorrow.borrowed > 0, "Borrow already repaid");

        updateBorrowInterest(msg.sender, borrowIndex);

        uint256 totalOwed = userBorrow.borrowed + userBorrow.interestAccrued;
        require(amount <= totalOwed, "Amount exceeds debt");

        IERC20(userBorrow.asset).safeTransferFrom(msg.sender, address(this), amount);

        if (amount >= totalOwed) {
            totalBorrowedByAsset[userBorrow.asset] -= userBorrow.borrowed;
            totalCollateral -= userBorrow.collateral;
            userBorrow.borrowed = 0;
            userBorrow.interestAccrued = 0;
        } else {
            if (amount > userBorrow.interestAccrued) {
                uint256 principalRepay = amount - userBorrow.interestAccrued;
                userBorrow.borrowed -= principalRepay;
                userBorrow.interestAccrued = 0;
                totalBorrowedByAsset[userBorrow.asset] -= principalRepay;
            } else {
                userBorrow.interestAccrued -= amount;
            }
        }

        emit Repaid(msg.sender, borrowIndex, amount);
    }

    /**
     * @notice Liquidate unhealthy position
     * @param user User to liquidate
     * @param borrowIndex Borrow index to liquidate
     */
    function liquidate(address user, uint256 borrowIndex) external nonReentrant {
        require(borrowIndex < borrows[user].length, "Invalid borrow index");

        Borrow storage userBorrow = borrows[user][borrowIndex];
        require(userBorrow.borrowed > 0, "Position already closed");

        updateBorrowInterest(user, borrowIndex);

        uint256 healthFactor = calculateHealthFactor(user, borrowIndex);
        require(healthFactor < PRECISION, "Position is healthy");

        uint256 totalDebt = userBorrow.borrowed + userBorrow.interestAccrued;
        uint256 collateralToSeize = userBorrow.collateral;
        uint256 penalty = (collateralToSeize * LIQUIDATION_PENALTY) / PRECISION;

        IERC20(userBorrow.asset).safeTransferFrom(msg.sender, address(this), totalDebt);

        collateralToken.safeTransfer(msg.sender, collateralToSeize - penalty);
        collateralToken.safeTransfer(owner(), penalty);

        totalBorrowedByAsset[userBorrow.asset] -= userBorrow.borrowed;
        totalCollateral -= userBorrow.collateral;

        userBorrow.borrowed = 0;
        userBorrow.collateral = 0;

        emit Liquidated(user, borrowIndex, msg.sender);
    }

    /**
     * @notice Calculate health factor for a borrow
     */
    function calculateHealthFactor(address user, uint256 borrowIndex) public view returns (uint256) {
        if (borrowIndex >= borrows[user].length) return 0;

        Borrow memory userBorrow = borrows[user][borrowIndex];
        if (userBorrow.borrowed == 0) return type(uint256).max;

        uint256 collateralValue = (userBorrow.collateral * LIQUIDATION_THRESHOLD) / PRECISION;
        uint256 borrowValue = userBorrow.borrowed + userBorrow.interestAccrued;

        if (borrowValue == 0) return type(uint256).max;

        return (collateralValue * PRECISION) / borrowValue;
    }

    /**
     * @notice Get total borrowed amount for a user
     */
    function getTotalBorrowed(address user) public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < borrows[user].length; i++) {
            total += borrows[user][i].borrowed + borrows[user][i].interestAccrued;
        }
        return total;
    }

    /**
     * @notice Calculate utilization rate
     */
    function utilizationRate() public view returns (uint256) {
        if (totalSupplied == 0) return 0;
        uint256 totalBorrowed = getTotalBorrowedAll();
        return (totalBorrowed * PRECISION) / totalSupplied;
    }

    /**
     * @notice Calculate supply APY
     */
    function supplyAPY() public view returns (uint256) {
        uint256 utilization = utilizationRate();
        uint256 borrowApy = borrowAPY();
        return (borrowApy * utilization) / PRECISION;
    }

    /**
     * @notice Calculate borrow APY
     */
    function borrowAPY() public view returns (uint256) {
        uint256 utilization = utilizationRate();

        if (utilization <= OPTIMAL_UTILIZATION) {
            return BASE_RATE + (utilization * RATE_SLOPE_1) / OPTIMAL_UTILIZATION;
        } else {
            uint256 excessUtilization = utilization - OPTIMAL_UTILIZATION;
            return BASE_RATE + RATE_SLOPE_1 +
                (excessUtilization * RATE_SLOPE_2) / (PRECISION - OPTIMAL_UTILIZATION);
        }
    }

    /**
     * @notice Get all borrows for a user
     */
    function getUserBorrows(address user) external view returns (Borrow[] memory) {
        return borrows[user];
    }

    /**
     * @notice Add supported asset
     */
    function addSupportedAsset(address asset) external onlyOwner {
        require(asset != address(0), "Invalid asset");
        supportedAssets[asset] = true;
        emit AssetAdded(asset);
    }

    /**
     * @notice Remove supported asset
     */
    function removeSupportedAsset(address asset) external onlyOwner {
        supportedAssets[asset] = false;
        emit AssetRemoved(asset);
    }

    /**
     * @notice Update supply interest
     */
    function updateSupplyInterest(address user) internal {
        Supply storage userSupply = supplies[user];
        if (userSupply.amount == 0) return;

        uint256 timeElapsed = block.timestamp - userSupply.lastUpdateTime;
        uint256 apy = supplyAPY();
        uint256 interest = (userSupply.amount * apy * timeElapsed) / (365 days * 1e18);

        userSupply.interestEarned += interest;
        userSupply.lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Update borrow interest
     */
    function updateBorrowInterest(address user, uint256 borrowIndex) internal {
        Borrow storage userBorrow = borrows[user][borrowIndex];
        if (userBorrow.borrowed == 0) return;

        uint256 timeElapsed = block.timestamp - userBorrow.lastUpdateTime;
        uint256 apy = borrowAPY();
        uint256 interest = (userBorrow.borrowed * apy * timeElapsed) / (365 days * 1e18);

        userBorrow.interestAccrued += interest;
        userBorrow.lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Get total borrowed across all assets
     */
    function getTotalBorrowedAll() internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < borrows[msg.sender].length; i++) {
            total += borrows[msg.sender][i].borrowed;
        }
        return total;
    }
}
