// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ScrollGenLRT (Liquid Restaked Token)
 * @notice Enables liquid staking derivatives - users restake SGT for yield-bearing sSGT
 * @dev sSGT represents staked SGT with accumulated yield, fully transferable
 */
contract ScrollGenLRT is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct RedemptionRequest {
        address user;
        uint256 sSGTAmount;
        uint256 sgtAmount;
        uint256 requestTime;
        bool processed;
    }

    IERC20 public immutable sgtToken;

    uint256 public totalStakedSGT;
    uint256 public totalYieldAccrued;
    uint256 public redemptionDelay = 7 days;
    uint256 public minRestakeAmount = 100 * 1e18;

    mapping(uint256 => RedemptionRequest) public redemptionRequests;
    uint256 public nextRequestId = 1;
    mapping(address => uint256[]) public userRequests;

    uint256 public constant PRECISION = 1e18;
    uint256 public yieldRate = 1e17;
    uint256 public lastYieldUpdate;

    event Restaked(address indexed user, uint256 sgtAmount, uint256 sSGTMinted);
    event RedemptionRequested(address indexed user, uint256 requestId, uint256 sSGTAmount);
    event RedemptionClaimed(address indexed user, uint256 requestId, uint256 sgtAmount);
    event YieldAccrued(uint256 amount, uint256 newExchangeRate);
    event YieldRateUpdated(uint256 newRate);

    constructor(address _sgtToken) ERC20("Staked ScrollGen Token", "sSGT") Ownable(msg.sender) {
        require(_sgtToken != address(0), "Invalid SGT address");
        sgtToken = IERC20(_sgtToken);
        lastYieldUpdate = block.timestamp;
    }

    /**
     * @notice Restake SGT to receive sSGT
     * @param amount Amount of SGT to restake
     * @return sSGTMinted Amount of sSGT minted
     */
    function restake(uint256 amount) external nonReentrant returns (uint256 sSGTMinted) {
        require(amount >= minRestakeAmount, "Amount below minimum");

        _accrueYield();

        sgtToken.safeTransferFrom(msg.sender, address(this), amount);

        sSGTMinted = (amount * PRECISION) / getExchangeRate();

        _mint(msg.sender, sSGTMinted);

        totalStakedSGT += amount;

        emit Restaked(msg.sender, amount, sSGTMinted);

        return sSGTMinted;
    }

    /**
     * @notice Request redemption of sSGT for SGT
     * @param sSGTAmount Amount of sSGT to redeem
     * @return requestId Redemption request ID
     */
    function requestRedeem(uint256 sSGTAmount) external nonReentrant returns (uint256 requestId) {
        require(sSGTAmount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= sSGTAmount, "Insufficient balance");

        _accrueYield();

        uint256 sgtAmount = (sSGTAmount * getExchangeRate()) / PRECISION;

        _burn(msg.sender, sSGTAmount);

        requestId = nextRequestId++;
        redemptionRequests[requestId] = RedemptionRequest({
            user: msg.sender,
            sSGTAmount: sSGTAmount,
            sgtAmount: sgtAmount,
            requestTime: block.timestamp,
            processed: false
        });

        userRequests[msg.sender].push(requestId);

        emit RedemptionRequested(msg.sender, requestId, sSGTAmount);

        return requestId;
    }

    /**
     * @notice Claim redeemed SGT after delay period
     * @param requestId Redemption request ID
     */
    function claimRedeem(uint256 requestId) external nonReentrant {
        RedemptionRequest storage request = redemptionRequests[requestId];

        require(request.user == msg.sender, "Not request owner");
        require(!request.processed, "Already processed");
        require(
            block.timestamp >= request.requestTime + redemptionDelay,
            "Delay not met"
        );

        request.processed = true;

        sgtToken.safeTransfer(msg.sender, request.sgtAmount);

        totalStakedSGT -= request.sgtAmount;

        emit RedemptionClaimed(msg.sender, requestId, request.sgtAmount);
    }

    /**
     * @notice Get current exchange rate (sSGT to SGT)
     * @return Exchange rate scaled by PRECISION
     */
    function getExchangeRate() public view returns (uint256) {
        uint256 totalsSGT = totalSupply();
        if (totalsSGT == 0) return PRECISION;

        uint256 totalValue = totalStakedSGT + totalYieldAccrued;
        return (totalValue * PRECISION) / totalsSGT;
    }

    /**
     * @notice Get total staked value in SGT
     */
    function getTotalStakedValue() external view returns (uint256) {
        return totalStakedSGT + totalYieldAccrued;
    }

    /**
     * @notice Convert sSGT amount to SGT
     * @param sSGTAmount Amount of sSGT
     */
    function convertToSGT(uint256 sSGTAmount) external view returns (uint256) {
        return (sSGTAmount * getExchangeRate()) / PRECISION;
    }

    /**
     * @notice Convert SGT amount to sSGT
     * @param sgtAmount Amount of SGT
     */
    function convertTosSGT(uint256 sgtAmount) external view returns (uint256) {
        return (sgtAmount * PRECISION) / getExchangeRate();
    }

    /**
     * @notice Get user's redemption requests
     * @param user User address
     */
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }

    /**
     * @notice Check if redemption is claimable
     * @param requestId Request ID
     */
    function isClaimable(uint256 requestId) external view returns (bool) {
        RedemptionRequest memory request = redemptionRequests[requestId];
        return !request.processed &&
               block.timestamp >= request.requestTime + redemptionDelay;
    }

    /**
     * @notice Get time until claimable
     * @param requestId Request ID
     */
    function getTimeUntilClaimable(uint256 requestId) external view returns (uint256) {
        RedemptionRequest memory request = redemptionRequests[requestId];
        if (request.processed) return 0;

        uint256 claimTime = request.requestTime + redemptionDelay;
        if (block.timestamp >= claimTime) return 0;

        return claimTime - block.timestamp;
    }

    /**
     * @notice Get estimated APY
     */
    function getEstimatedAPY() external view returns (uint256) {
        if (totalStakedSGT == 0) return 0;
        return (yieldRate * 365 days * 100) / PRECISION;
    }

    /**
     * @notice Accrue yield to increase exchange rate
     */
    function _accrueYield() internal {
        uint256 timeElapsed = block.timestamp - lastYieldUpdate;
        if (timeElapsed == 0 || totalStakedSGT == 0) return;

        uint256 yield = (totalStakedSGT * yieldRate * timeElapsed) / (365 days * PRECISION);

        totalYieldAccrued += yield;
        lastYieldUpdate = block.timestamp;

        emit YieldAccrued(yield, getExchangeRate());
    }

    /**
     * @notice Manually accrue yield (anyone can call)
     */
    function accrueYield() external {
        _accrueYield();
    }

    /**
     * @notice Set yield rate (owner only)
     * @param newRate New yield rate
     */
    function setYieldRate(uint256 newRate) external onlyOwner {
        _accrueYield();
        yieldRate = newRate;
        emit YieldRateUpdated(newRate);
    }

    /**
     * @notice Set redemption delay (owner only)
     * @param newDelay New delay in seconds
     */
    function setRedemptionDelay(uint256 newDelay) external onlyOwner {
        require(newDelay >= 1 days && newDelay <= 30 days, "Invalid delay");
        redemptionDelay = newDelay;
    }

    /**
     * @notice Set minimum restake amount (owner only)
     * @param newMin New minimum amount
     */
    function setMinRestakeAmount(uint256 newMin) external onlyOwner {
        minRestakeAmount = newMin;
    }

    /**
     * @notice Deposit yield from external source (owner only)
     * @param amount Yield amount
     */
    function depositYield(uint256 amount) external onlyOwner {
        sgtToken.safeTransferFrom(msg.sender, address(this), amount);
        totalYieldAccrued += amount;
        emit YieldAccrued(amount, getExchangeRate());
    }
}
