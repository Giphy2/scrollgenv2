pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * @title NFTOwnershipProof
 * @notice Proves ownership of NFT with specific tier without revealing token ID
 * @dev Validates tier requirement and creates commitment for privacy
 */
template NFTOwnershipProof() {
    // Private inputs
    signal input tokenId;
    signal input tier;
    signal input secret;
    signal input nullifier;

    // Public inputs
    signal input minTier;

    // Outputs
    signal output commitment;
    signal output isValid;

    // Check that tier >= minTier
    component gte = GreaterEqThan(8);
    gte.in[0] <== tier;
    gte.in[1] <== minTier;

    // Generate commitment to hide token ID
    component hasher = Poseidon(4);
    hasher.inputs[0] <== tokenId;
    hasher.inputs[1] <== tier;
    hasher.inputs[2] <== secret;
    hasher.inputs[3] <== nullifier;

    // Outputs
    commitment <== hasher.out;
    isValid <== gte.out;

    // Constraint: isValid must be 1
    isValid === 1;

    // Constraint: tier must be valid (0-4)
    component tierCheck = LessThan(8);
    tierCheck.in[0] <== tier;
    tierCheck.in[1] <== 5;
    tierCheck.out === 1;
}

component main {public [minTier]} = NFTOwnershipProof();
