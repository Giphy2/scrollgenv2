// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BridgeConnector
 * @notice Connector for Scroll bridge operations and transaction tracking
 * @dev Tracks cross-chain transactions and provides status information
 */
contract BridgeConnector is Ownable, ReentrancyGuard {
    enum BridgeStatus {
        Pending,
        Confirmed,
        Batched,
        Finalized,
        ReadyToClaim,
        Completed,
        Failed
    }

    enum BridgeDirection {
        Deposit,
        Withdrawal
    }

    struct BridgeTransaction {
        address user;
        uint256 amount;
        address token;
        uint256 timestamp;
        bytes32 l1TxHash;
        bytes32 l2TxHash;
        BridgeDirection direction;
        BridgeStatus status;
        uint256 claimableAt;
    }

    mapping(bytes32 => BridgeTransaction) public transactions;
    mapping(address => bytes32[]) public userTransactions;

    address public scrollMessenger;
    uint256 public constant WITHDRAWAL_DELAY = 7 days;
    uint256 public depositFee;
    uint256 public withdrawalFee;

    event DepositInitiated(
        address indexed user,
        uint256 amount,
        address token,
        bytes32 indexed txHash
    );

    event WithdrawalInitiated(
        address indexed user,
        uint256 amount,
        address token,
        bytes32 indexed txHash
    );

    event TransactionStatusUpdated(
        bytes32 indexed txHash,
        BridgeStatus oldStatus,
        BridgeStatus newStatus
    );

    event WithdrawalClaimed(
        address indexed user,
        bytes32 indexed txHash,
        uint256 amount
    );

    event FeeUpdated(uint256 depositFee, uint256 withdrawalFee);

    constructor(address _scrollMessenger) Ownable(msg.sender) {
        require(_scrollMessenger != address(0), "Invalid messenger");
        scrollMessenger = _scrollMessenger;
        depositFee = 0;
        withdrawalFee = 0;
    }

    /**
     * @notice Initiate a deposit from L1 to L2
     * @param amount Amount to deposit
     * @param token Token address
     * @param l1TxHash Transaction hash from L1
     */
    function initiateDeposit(
        uint256 amount,
        address token,
        bytes32 l1TxHash
    ) external payable nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(token != address(0), "Invalid token");
        require(msg.value >= depositFee, "Insufficient fee");

        BridgeTransaction storage txn = transactions[l1TxHash];
        require(txn.user == address(0), "Transaction already exists");

        txn.user = msg.sender;
        txn.amount = amount;
        txn.token = token;
        txn.timestamp = block.timestamp;
        txn.l1TxHash = l1TxHash;
        txn.direction = BridgeDirection.Deposit;
        txn.status = BridgeStatus.Pending;

        userTransactions[msg.sender].push(l1TxHash);

        emit DepositInitiated(msg.sender, amount, token, l1TxHash);
    }

    /**
     * @notice Initiate a withdrawal from L2 to L1
     * @param amount Amount to withdraw
     * @param token Token address
     * @param l2TxHash Transaction hash from L2
     */
    function initiateWithdrawal(
        uint256 amount,
        address token,
        bytes32 l2TxHash
    ) external payable nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(token != address(0), "Invalid token");
        require(msg.value >= withdrawalFee, "Insufficient fee");

        BridgeTransaction storage txn = transactions[l2TxHash];
        require(txn.user == address(0), "Transaction already exists");

        txn.user = msg.sender;
        txn.amount = amount;
        txn.token = token;
        txn.timestamp = block.timestamp;
        txn.l2TxHash = l2TxHash;
        txn.direction = BridgeDirection.Withdrawal;
        txn.status = BridgeStatus.Pending;
        txn.claimableAt = block.timestamp + WITHDRAWAL_DELAY;

        userTransactions[msg.sender].push(l2TxHash);

        emit WithdrawalInitiated(msg.sender, amount, token, l2TxHash);
    }

    /**
     * @notice Update transaction status
     * @param txHash Transaction hash
     * @param newStatus New status
     */
    function updateTransactionStatus(
        bytes32 txHash,
        BridgeStatus newStatus
    ) external onlyOwner {
        BridgeTransaction storage txn = transactions[txHash];
        require(txn.user != address(0), "Transaction not found");

        BridgeStatus oldStatus = txn.status;
        txn.status = newStatus;

        emit TransactionStatusUpdated(txHash, oldStatus, newStatus);
    }

    /**
     * @notice Claim completed withdrawal
     * @param txHash Transaction hash
     */
    function claimWithdrawal(bytes32 txHash) external nonReentrant {
        BridgeTransaction storage txn = transactions[txHash];
        require(txn.user == msg.sender, "Not transaction owner");
        require(txn.direction == BridgeDirection.Withdrawal, "Not a withdrawal");
        require(txn.status == BridgeStatus.ReadyToClaim, "Not ready to claim");
        require(block.timestamp >= txn.claimableAt, "Still in challenge period");

        txn.status = BridgeStatus.Completed;

        emit WithdrawalClaimed(msg.sender, txHash, txn.amount);
    }

    /**
     * @notice Get transaction details
     * @param txHash Transaction hash
     */
    function getTransaction(bytes32 txHash) external view returns (BridgeTransaction memory) {
        return transactions[txHash];
    }

    /**
     * @notice Get all user transactions
     * @param user User address
     */
    function getUserTransactions(address user) external view returns (bytes32[] memory) {
        return userTransactions[user];
    }

    /**
     * @notice Get transaction status
     * @param txHash Transaction hash
     */
    function getTransactionStatus(bytes32 txHash) external view returns (BridgeStatus) {
        return transactions[txHash].status;
    }

    /**
     * @notice Check if withdrawal is claimable
     * @param txHash Transaction hash
     */
    function isClaimable(bytes32 txHash) external view returns (bool) {
        BridgeTransaction memory txn = transactions[txHash];
        return txn.status == BridgeStatus.ReadyToClaim &&
               block.timestamp >= txn.claimableAt;
    }

    /**
     * @notice Get time remaining until claimable
     * @param txHash Transaction hash
     */
    function getTimeUntilClaimable(bytes32 txHash) external view returns (uint256) {
        BridgeTransaction memory txn = transactions[txHash];
        if (block.timestamp >= txn.claimableAt) return 0;
        return txn.claimableAt - block.timestamp;
    }

    /**
     * @notice Update bridge fees
     * @param _depositFee New deposit fee
     * @param _withdrawalFee New withdrawal fee
     */
    function updateFees(uint256 _depositFee, uint256 _withdrawalFee) external onlyOwner {
        depositFee = _depositFee;
        withdrawalFee = _withdrawalFee;
        emit FeeUpdated(_depositFee, _withdrawalFee);
    }

    /**
     * @notice Update scroll messenger address
     * @param _scrollMessenger New messenger address
     */
    function updateScrollMessenger(address _scrollMessenger) external onlyOwner {
        require(_scrollMessenger != address(0), "Invalid messenger");
        scrollMessenger = _scrollMessenger;
    }

    /**
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
