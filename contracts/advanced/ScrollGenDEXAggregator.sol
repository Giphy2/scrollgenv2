// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ScrollGenDEXAggregator
 * @notice DEX aggregator for optimal swap routing across multiple liquidity sources
 * @dev Simplified Uniswap V2-style router with fee governance
 */
contract ScrollGenDEXAggregator is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 fee;
        bool active;
    }

    struct SwapRoute {
        address[] path;
        uint256[] poolIndices;
        uint256 expectedOutput;
        uint256 priceImpact;
    }

    mapping(bytes32 => Pool) public pools;
    bytes32[] public poolIds;

    uint256 public baseFeeRate = 30;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_FEE = 100;

    address public governance;
    address public feeCollector;

    uint256 public totalSwapVolume;
    uint256 public totalFeesCollected;

    event PoolAdded(bytes32 indexed poolId, address tokenA, address tokenB);
    event PoolUpdated(bytes32 indexed poolId, uint256 reserveA, uint256 reserveB);
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address[] path
    );
    event FeeRateUpdated(uint256 newRate);
    event GovernanceUpdated(address indexed newGovernance);

    modifier onlyGovernance() {
        require(msg.sender == governance || msg.sender == owner(), "Not governance");
        _;
    }

    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        governance = msg.sender;
    }

    /**
     * @notice Add liquidity pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param reserveA Initial reserve of tokenA
     * @param reserveB Initial reserve of tokenB
     */
    function addPool(
        address tokenA,
        address tokenB,
        uint256 reserveA,
        uint256 reserveB
    ) external onlyOwner returns (bytes32) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");

        bytes32 poolId = keccak256(abi.encodePacked(tokenA, tokenB));

        pools[poolId] = Pool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: reserveA,
            reserveB: reserveB,
            fee: baseFeeRate,
            active: true
        });

        poolIds.push(poolId);

        emit PoolAdded(poolId, tokenA, tokenB);
        return poolId;
    }

    /**
     * @notice Execute token swap
     * @param amountIn Input amount
     * @param amountOutMin Minimum output amount (slippage protection)
     * @param path Swap path (token addresses)
     * @param to Recipient address
     * @param deadline Transaction deadline
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Expired");
        require(path.length >= 2, "Invalid path");
        require(amountIn > 0, "Zero amount");

        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output");

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        _swap(amounts, path, to);

        totalSwapVolume += amountIn;

        emit Swap(msg.sender, path[0], path[path.length - 1], amountIn, amounts[amounts.length - 1], path);

        return amounts;
    }

    /**
     * @notice Internal swap execution
     * @param amounts Calculated swap amounts
     * @param path Swap path
     * @param to Recipient
     */
    function _swap(
        uint256[] memory amounts,
        address[] calldata path,
        address to
    ) internal {
        for (uint256 i = 0; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            uint256 amountOut = amounts[i + 1];

            bytes32 poolId = keccak256(abi.encodePacked(input, output));
            Pool storage pool = pools[poolId];

            if (!pool.active) {
                poolId = keccak256(abi.encodePacked(output, input));
                pool = pools[poolId];
            }

            require(pool.active, "Pool not active");

            uint256 feeAmount = (amountOut * pool.fee) / FEE_DENOMINATOR;
            uint256 amountAfterFee = amountOut - feeAmount;

            if (i == path.length - 2) {
                IERC20(output).safeTransfer(to, amountAfterFee);
            }

            if (feeAmount > 0) {
                IERC20(output).safeTransfer(feeCollector, feeAmount);
                totalFeesCollected += feeAmount;
            }

            _updatePoolReserves(poolId, input, output, amounts[i], amountOut);
        }
    }

    /**
     * @notice Calculate output amounts for swap path
     * @param amountIn Input amount
     * @param path Swap path
     */
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        public
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "Invalid path");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /**
     * @notice Calculate output amount for single hop
     * @param amountIn Input amount
     * @param reserveIn Input token reserve
     * @param reserveOut Output token reserve
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public view returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - baseFeeRate);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Get pool reserves
     * @param tokenA Token A address
     * @param tokenB Token B address
     */
    function getReserves(address tokenA, address tokenB)
        public
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        bytes32 poolId = keccak256(abi.encodePacked(tokenA, tokenB));
        Pool memory pool = pools[poolId];

        if (pool.active) {
            return (pool.reserveA, pool.reserveB);
        }

        poolId = keccak256(abi.encodePacked(tokenB, tokenA));
        pool = pools[poolId];

        require(pool.active, "Pool not found");
        return (pool.reserveB, pool.reserveA);
    }

    /**
     * @notice Find best swap route
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     */
    function findBestRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (SwapRoute memory) {
        address[] memory directPath = new address[](2);
        directPath[0] = tokenIn;
        directPath[1] = tokenOut;

        uint256[] memory directAmounts = _getAmountsOutMemory(amountIn, directPath);
        uint256 directOutput = directAmounts[directAmounts.length - 1];

        return SwapRoute({
            path: directPath,
            poolIndices: new uint256[](1),
            expectedOutput: directOutput,
            priceImpact: calculatePriceImpact(amountIn, directOutput)
        });
    }

    /**
     * @notice Internal helper for memory path arrays
     */
    function _getAmountsOutMemory(uint256 amountIn, address[] memory path)
        internal
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "Invalid path");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /**
     * @notice Calculate price impact
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function calculatePriceImpact(uint256 amountIn, uint256 amountOut)
        public
        pure
        returns (uint256)
    {
        if (amountIn == 0 || amountOut == 0) return 0;
        uint256 ratio = (amountOut * 10000) / amountIn;
        if (ratio >= 10000) return 0;
        return 10000 - ratio;
    }

    /**
     * @notice Update pool reserves after swap
     * @param poolId Pool identifier
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function _updatePoolReserves(
        bytes32 poolId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) internal {
        Pool storage pool = pools[poolId];

        if (pool.tokenA == tokenIn) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        emit PoolUpdated(poolId, pool.reserveA, pool.reserveB);
    }

    /**
     * @notice Set base fee rate (governance only)
     * @param newRate New fee rate (in basis points)
     */
    function setFeeRate(uint256 newRate) external onlyGovernance {
        require(newRate <= MAX_FEE, "Fee too high");
        baseFeeRate = newRate;
        emit FeeRateUpdated(newRate);
    }

    /**
     * @notice Update governance address
     * @param newGovernance New governance address
     */
    function setGovernance(address newGovernance) external onlyOwner {
        require(newGovernance != address(0), "Invalid address");
        governance = newGovernance;
        emit GovernanceUpdated(newGovernance);
    }

    /**
     * @notice Update pool status
     * @param poolId Pool identifier
     * @param active Active status
     */
    function setPoolStatus(bytes32 poolId, bool active) external onlyOwner {
        pools[poolId].active = active;
    }

    /**
     * @notice Get all active pools
     */
    function getActivePools() external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < poolIds.length; i++) {
            if (pools[poolIds[i]].active) count++;
        }

        bytes32[] memory activePools = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < poolIds.length; i++) {
            if (pools[poolIds[i]].active) {
                activePools[index] = poolIds[i];
                index++;
            }
        }

        return activePools;
    }
}
