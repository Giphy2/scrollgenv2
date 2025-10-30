// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ScrollGenBridge
 * @notice Cross-chain bridge for SGT tokens between Scroll and Ethereum
 * @dev Implements lock/mint/burn/release pattern for secure cross-chain transfers
 */
contract ScrollGenBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum BridgeStatus {
        Initiated,
        Relaying,
        Completed,
        Claimed,
        Failed
    }

    struct BridgeTransaction {
        address sender;
        address recipient;
        uint256 amount;
        uint256 sourceChain;
        uint256 destinationChain;
        uint256 timestamp;
        bytes32 txHash;
        BridgeStatus status;
        uint256 fee;
    }

    IERC20 public immutable sgtToken;

    uint256 public constant SCROLL_CHAIN_ID = 534351;
    uint256 public constant ETHEREUM_CHAIN_ID = 11155111;

    uint256 public bridgeFee = 0.001 ether;
    uint256 public maxBridgeAmount = 10000 * 1e18;
    uint256 public dailyLimit = 100000 * 1e18;
    uint256 public bridgeDelay = 15 minutes;

    mapping(bytes32 => BridgeTransaction) public transactions;
    mapping(address => bytes32[]) public userTransactions;
    mapping(uint256 => uint256) public dailyVolume;
    mapping(address => bool) public relayers;

    uint256 public totalBridged;
    uint256 public totalFees;
    bool public paused;

    event BridgeInitiated(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChain,
        uint256 destinationChain,
        bytes32 indexed txHash
    );

    event BridgeRelayed(bytes32 indexed txHash, address indexed relayer);

    event BridgeCompleted(
        address indexed recipient,
        uint256 amount,
        bytes32 indexed txHash
    );

    event BridgeClaimed(
        address indexed recipient,
        uint256 amount,
        bytes32 indexed txHash
    );

    event BridgeFailed(bytes32 indexed txHash, string reason);

    event RelayerUpdated(address indexed relayer, bool status);

    event BridgePaused(bool status);

    modifier onlyRelayer() {
        require(relayers[msg.sender] || msg.sender == owner(), "Not authorized relayer");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Bridge is paused");
        _;
    }

    constructor(address _sgtToken) Ownable(msg.sender) {
        require(_sgtToken != address(0), "Invalid SGT address");
        sgtToken = IERC20(_sgtToken);
        relayers[msg.sender] = true;
    }

    /**
     * @notice Lock SGT on source chain to bridge to destination
     * @param amount Amount of SGT to bridge
     * @param destinationChain Destination chain ID
     * @param recipient Recipient address on destination chain
     */
    function lockSGT(
        uint256 amount,
        uint256 destinationChain,
        address recipient
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(amount > 0 && amount <= maxBridgeAmount, "Invalid amount");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        require(recipient != address(0), "Invalid recipient");
        require(
            destinationChain == SCROLL_CHAIN_ID || destinationChain == ETHEREUM_CHAIN_ID,
            "Invalid destination chain"
        );

        uint256 today = block.timestamp / 1 days;
        require(dailyVolume[today] + amount <= dailyLimit, "Daily limit exceeded");

        sgtToken.safeTransferFrom(msg.sender, address(this), amount);

        bytes32 txHash = keccak256(
            abi.encodePacked(msg.sender, recipient, amount, block.timestamp, block.chainid)
        );

        transactions[txHash] = BridgeTransaction({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            sourceChain: block.chainid,
            destinationChain: destinationChain,
            timestamp: block.timestamp,
            txHash: txHash,
            status: BridgeStatus.Initiated,
            fee: msg.value
        });

        userTransactions[msg.sender].push(txHash);
        dailyVolume[today] += amount;
        totalBridged += amount;
        totalFees += msg.value;

        emit BridgeInitiated(
            msg.sender,
            recipient,
            amount,
            block.chainid,
            destinationChain,
            txHash
        );

        return txHash;
    }

    /**
     * @notice Mint bridged SGT on destination chain (relayer only)
     * @param recipient Recipient address
     * @param amount Amount to mint
     * @param sourceTxHash Transaction hash from source chain
     */
    function mintBridgedSGT(
        address recipient,
        uint256 amount,
        bytes32 sourceTxHash
    ) external onlyRelayer nonReentrant whenNotPaused {
        BridgeTransaction storage txn = transactions[sourceTxHash];

        require(txn.status == BridgeStatus.Initiated || txn.status == BridgeStatus.Relaying, "Invalid status");
        require(block.timestamp >= txn.timestamp + bridgeDelay, "Bridge delay not met");

        txn.status = BridgeStatus.Completed;

        sgtToken.safeTransfer(recipient, amount);

        emit BridgeCompleted(recipient, amount, sourceTxHash);
    }

    /**
     * @notice Release SGT on source chain after burn on destination
     * @param recipient Recipient address
     * @param amount Amount to release
     * @param burnTxHash Burn transaction hash from destination
     */
    function releaseSGT(
        address recipient,
        uint256 amount,
        bytes32 burnTxHash
    ) external onlyRelayer nonReentrant whenNotPaused {
        BridgeTransaction storage txn = transactions[burnTxHash];

        require(txn.status == BridgeStatus.Completed, "Not completed");
        require(block.timestamp >= txn.timestamp + bridgeDelay, "Delay not met");

        txn.status = BridgeStatus.Claimed;

        sgtToken.safeTransfer(recipient, amount);

        emit BridgeClaimed(recipient, amount, burnTxHash);
    }

    /**
     * @notice Update bridge transaction status (relayer only)
     * @param txHash Transaction hash
     * @param newStatus New status
     */
    function updateBridgeStatus(
        bytes32 txHash,
        BridgeStatus newStatus
    ) external onlyRelayer {
        BridgeTransaction storage txn = transactions[txHash];
        require(txn.amount > 0, "Transaction not found");

        txn.status = newStatus;

        emit BridgeRelayed(txHash, msg.sender);
    }

    /**
     * @notice Get bridge transaction details
     * @param txHash Transaction hash
     */
    function getBridgeTransaction(bytes32 txHash)
        external
        view
        returns (BridgeTransaction memory)
    {
        return transactions[txHash];
    }

    /**
     * @notice Get user's bridge transactions
     * @param user User address
     */
    function getUserTransactions(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return userTransactions[user];
    }

    /**
     * @notice Get estimated bridge time
     * @param amount Bridge amount
     */
    function getEstimatedBridgeTime(uint256 amount)
        external
        view
        returns (uint256)
    {
        if (amount < 1000 * 1e18) return bridgeDelay;
        if (amount < 5000 * 1e18) return bridgeDelay + 5 minutes;
        return bridgeDelay + 10 minutes;
    }

    /**
     * @notice Calculate bridge fee
     * @param amount Bridge amount
     */
    function calculateBridgeFee(uint256 amount)
        external
        view
        returns (uint256)
    {
        if (amount < 1000 * 1e18) return bridgeFee;
        if (amount < 5000 * 1e18) return bridgeFee * 95 / 100;
        return bridgeFee * 90 / 100;
    }

    /**
     * @notice Update relayer status (owner only)
     * @param relayer Relayer address
     * @param status Authorized status
     */
    function setRelayer(address relayer, bool status) external onlyOwner {
        relayers[relayer] = status;
        emit RelayerUpdated(relayer, status);
    }

    /**
     * @notice Update bridge parameters (owner only)
     * @param newFee New bridge fee
     * @param newMaxAmount New max bridge amount
     * @param newDailyLimit New daily limit
     */
    function updateBridgeParams(
        uint256 newFee,
        uint256 newMaxAmount,
        uint256 newDailyLimit
    ) external onlyOwner {
        bridgeFee = newFee;
        maxBridgeAmount = newMaxAmount;
        dailyLimit = newDailyLimit;
    }

    /**
     * @notice Pause/unpause bridge (owner only)
     * @param _paused Pause status
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit BridgePaused(_paused);
    }

    /**
     * @notice Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @notice Emergency withdraw tokens (owner only)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    receive() external payable {}
}
