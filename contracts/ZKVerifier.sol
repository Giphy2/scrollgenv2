// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZKVerifier
 * @notice Verifies zero-knowledge proofs for private operations
 * @dev Integrates with Groth16 verifier contracts for different proof types
 */
contract ZKVerifier is Ownable {
    enum ProofType {
        StakeProof,
        NFTOwnership,
        VoteProof,
        TransferProof
    }

    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    mapping(bytes32 => bool) public nullifiersUsed;
    mapping(ProofType => address) public verifierContracts;
    mapping(address => uint256) public proofCount;

    event ProofVerified(
        address indexed user,
        ProofType indexed proofType,
        bytes32 nullifier,
        uint256 timestamp
    );

    event VerifierUpdated(
        ProofType indexed proofType,
        address indexed verifier
    );

    event NullifierUsed(bytes32 indexed nullifier);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Verify stake amount proof
     * @param proof The ZK proof components
     * @param publicInputs Public inputs for verification
     * @param nullifier Unique nullifier to prevent reuse
     */
    function verifyStakeProof(
        Proof calldata proof,
        uint256[] calldata publicInputs,
        bytes32 nullifier
    ) external returns (bool) {
        require(!nullifiersUsed[nullifier], "Nullifier already used");
        require(publicInputs.length > 0, "Missing public inputs");

        address verifier = verifierContracts[ProofType.StakeProof];
        require(verifier != address(0), "Verifier not set");

        bool isValid = _callVerifier(verifier, proof, publicInputs);
        require(isValid, "Invalid proof");

        nullifiersUsed[nullifier] = true;
        proofCount[msg.sender]++;

        emit ProofVerified(msg.sender, ProofType.StakeProof, nullifier, block.timestamp);
        emit NullifierUsed(nullifier);

        return true;
    }

    /**
     * @notice Verify NFT ownership proof
     * @param proof The ZK proof components
     * @param publicInputs Public inputs for verification
     * @param nullifier Unique nullifier
     */
    function verifyNFTOwnership(
        Proof calldata proof,
        uint256[] calldata publicInputs,
        bytes32 nullifier
    ) external returns (bool) {
        require(!nullifiersUsed[nullifier], "Nullifier already used");
        require(publicInputs.length > 0, "Missing public inputs");

        address verifier = verifierContracts[ProofType.NFTOwnership];
        require(verifier != address(0), "Verifier not set");

        bool isValid = _callVerifier(verifier, proof, publicInputs);
        require(isValid, "Invalid proof");

        nullifiersUsed[nullifier] = true;
        proofCount[msg.sender]++;

        emit ProofVerified(msg.sender, ProofType.NFTOwnership, nullifier, block.timestamp);
        emit NullifierUsed(nullifier);

        return true;
    }

    /**
     * @notice Verify vote proof for governance
     * @param proof The ZK proof components
     * @param publicInputs Public inputs for verification
     * @param nullifier Unique vote nullifier
     */
    function verifyVoteProof(
        Proof calldata proof,
        uint256[] calldata publicInputs,
        bytes32 nullifier
    ) external returns (bool) {
        require(!nullifiersUsed[nullifier], "Vote already cast");
        require(publicInputs.length > 0, "Missing public inputs");

        address verifier = verifierContracts[ProofType.VoteProof];
        require(verifier != address(0), "Verifier not set");

        bool isValid = _callVerifier(verifier, proof, publicInputs);
        require(isValid, "Invalid proof");

        nullifiersUsed[nullifier] = true;
        proofCount[msg.sender]++;

        emit ProofVerified(msg.sender, ProofType.VoteProof, nullifier, block.timestamp);
        emit NullifierUsed(nullifier);

        return true;
    }

    /**
     * @notice Verify transfer proof
     * @param proof The ZK proof components
     * @param publicInputs Public inputs for verification
     * @param nullifier Unique transfer nullifier
     */
    function verifyTransferProof(
        Proof calldata proof,
        uint256[] calldata publicInputs,
        bytes32 nullifier
    ) external returns (bool) {
        require(!nullifiersUsed[nullifier], "Nullifier already used");
        require(publicInputs.length > 0, "Missing public inputs");

        address verifier = verifierContracts[ProofType.TransferProof];
        require(verifier != address(0), "Verifier not set");

        bool isValid = _callVerifier(verifier, proof, publicInputs);
        require(isValid, "Invalid proof");

        nullifiersUsed[nullifier] = true;
        proofCount[msg.sender]++;

        emit ProofVerified(msg.sender, ProofType.TransferProof, nullifier, block.timestamp);
        emit NullifierUsed(nullifier);

        return true;
    }

    /**
     * @notice Check if nullifier has been used
     * @param nullifier Nullifier to check
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifiersUsed[nullifier];
    }

    /**
     * @notice Get user's total proof count
     * @param user User address
     */
    function getUserProofCount(address user) external view returns (uint256) {
        return proofCount[user];
    }

    /**
     * @notice Set verifier contract for a proof type
     * @param proofType Type of proof
     * @param verifier Verifier contract address
     */
    function setVerifier(
        ProofType proofType,
        address verifier
    ) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");
        verifierContracts[proofType] = verifier;
        emit VerifierUpdated(proofType, verifier);
    }

    /**
     * @notice Internal function to call verifier contract
     * @param verifier Verifier contract address
     * @param proof Proof components
     * @param publicInputs Public inputs
     */
    function _callVerifier(
        address verifier,
        Proof calldata proof,
        uint256[] calldata publicInputs
    ) internal view returns (bool) {
        bytes memory callData = abi.encodeWithSignature(
            "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[])",
            proof.a,
            proof.b,
            proof.c,
            publicInputs
        );

        (bool success, bytes memory result) = verifier.staticcall(callData);

        if (!success) return false;
        return abi.decode(result, (bool));
    }

    /**
     * @notice Batch verify multiple proofs
     * @param proofs Array of proofs
     * @param publicInputsArray Array of public inputs
     * @param nullifiers Array of nullifiers
     * @param proofTypes Array of proof types
     */
    function batchVerify(
        Proof[] calldata proofs,
        uint256[][] calldata publicInputsArray,
        bytes32[] calldata nullifiers,
        ProofType[] calldata proofTypes
    ) external returns (bool[] memory) {
        require(
            proofs.length == publicInputsArray.length &&
            proofs.length == nullifiers.length &&
            proofs.length == proofTypes.length,
            "Array length mismatch"
        );

        bool[] memory results = new bool[](proofs.length);

        for (uint256 i = 0; i < proofs.length; i++) {
            if (nullifiersUsed[nullifiers[i]]) {
                results[i] = false;
                continue;
            }

            address verifier = verifierContracts[proofTypes[i]];
            if (verifier == address(0)) {
                results[i] = false;
                continue;
            }

            bool isValid = _callVerifier(verifier, proofs[i], publicInputsArray[i]);

            if (isValid) {
                nullifiersUsed[nullifiers[i]] = true;
                proofCount[msg.sender]++;
                emit ProofVerified(msg.sender, proofTypes[i], nullifiers[i], block.timestamp);
            }

            results[i] = isValid;
        }

        return results;
    }
}
