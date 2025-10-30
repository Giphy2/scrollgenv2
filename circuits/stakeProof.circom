pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * @title StakeProof
 * @notice Proves stake amount exceeds threshold without revealing exact amount
 * @dev Uses Poseidon hash for commitment and comparison for threshold check
 */
template StakeProof() {
    // Private inputs (not revealed)
    signal input stakeAmount;
    signal input nullifier;
    signal input secret;

    // Public inputs (visible on-chain)
    signal input threshold;

    // Outputs
    signal output commitment;
    signal output isValid;

    // Check that stake amount >= threshold
    component gte = GreaterEqThan(252);
    gte.in[0] <== stakeAmount;
    gte.in[1] <== threshold;

    // Generate commitment to hide actual stake amount
    component hasher = Poseidon(3);
    hasher.inputs[0] <== stakeAmount;
    hasher.inputs[1] <== nullifier;
    hasher.inputs[2] <== secret;

    // Outputs
    commitment <== hasher.out;
    isValid <== gte.out;

    // Constraint: isValid must be 1
    isValid === 1;
}

component main {public [threshold]} = StakeProof();
