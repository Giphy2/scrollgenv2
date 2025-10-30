// scripts/activateScrollPower.cjs
const hre = require("hardhat");
const ethers = hre.ethers;
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

async function getVerifierAddress() {
  // Priority order:
  // 1. ZKID_VERIFIER_ADDRESS environment variable
  // 2. testnet-phase6-deploy-log.json
  // 3. mainnet-deploy-log.json
  
  if (process.env.ZKID_VERIFIER_ADDRESS) {
    console.log("📝 Using verifier address from environment variable");
    return process.env.ZKID_VERIFIER_ADDRESS;
  }

  const deploymentDir = path.join(__dirname, '..', 'deployments');
  const testnetLog = path.join(deploymentDir, 'testnet-phase6-deploy-log.json');
  const mainnetLog = path.join(deploymentDir, 'mainnet-deploy-log.json');

  let deployLog;
  let network;

  if (fs.existsSync(testnetLog)) {
    deployLog = JSON.parse(fs.readFileSync(testnetLog, 'utf8'));
    network = 'testnet';
  } else if (fs.existsSync(mainnetLog)) {
    deployLog = JSON.parse(fs.readFileSync(mainnetLog, 'utf8'));
    network = 'mainnet';
  }

  if (deployLog?.contracts?.zkVerifier) {
    console.log(`📝 Using verifier address from ${network} deployment log: ${deployLog.contracts.zkVerifier}`);
    return deployLog.contracts.zkVerifier;
  }

  throw new Error(
    "❌ ZKVerifier address not found! Please either:\n" +
    "1. Set ZKID_VERIFIER_ADDRESS environment variable\n" +
    "2. Ensure deployment logs exist in deployments/ folder with zkVerifier contract\n" +
    "3. Run deploy-phase6.cjs first"
  );
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🚀 Activating ScrollPower with deployer: ${deployer.address}`);

  const verifierAddress = await getVerifierAddress();
  
  // Validate address
  if (!ethers.isAddress(verifierAddress)) {
    throw new Error(`Invalid verifier address: ${verifierAddress}`);
  }
  if (verifierAddress === ethers.ZeroAddress) {
    throw new Error("Verifier address cannot be zero address");
  }

  // ABI for ZKVerifier based on actual contract
  const VERIFIER_ABI = [
    // Core verification functions
    "function verifyStakeProof(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicInputs, bytes32 nullifier) external returns (bool)",
    "function verifyNFTOwnership(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicInputs, bytes32 nullifier) external returns (bool)",
    // State tracking
    "function nullifiersUsed(bytes32) external view returns (bool)",
    "function proofCount(address) external view returns (uint256)",
    // Verifier contract management
    "function verifierContracts(uint8) external view returns (address)",
    "function setVerifier(uint8 proofType, address verifierAddress) external",
    "function owner() external view returns (address)",
    // Events
    "event ProofVerified(address indexed user, uint8 indexed proofType, bytes32 nullifier, uint256 timestamp)",
    "event VerifierUpdated(uint8 indexed proofType, address indexed verifier)"
  ];

  const verifier = new ethers.Contract(
    verifierAddress,
    VERIFIER_ABI,
    deployer
  );

  // Check if deployer is the owner (needed for setup)
  console.log("\n🔍 Checking contract setup...");
  const owner = await verifier.owner();
  const isOwner = owner.toLowerCase() === deployer.address.toLowerCase();
  console.log(`Contract owner: ${owner}`);
  console.log(`Deployer is${isOwner ? '' : ' not'} the owner`);

  // Check if verifiers are set up
  const STAKE_PROOF_TYPE = 0; // Enum index for StakeProof
  const stakeVerifier = await verifier.verifierContracts(STAKE_PROOF_TYPE);
  console.log(`Stake verifier address: ${stakeVerifier}`);

  if (stakeVerifier === ethers.ZeroAddress) {
    if (!isOwner) {
      throw new Error("Stake verifier not set and deployer is not the owner. Please contact the contract owner.");
    }
    
    console.log("\n⚙️ Setting up stake verifier...");
    // For testing, we'll set the ZKVerifier contract itself as the verifier
    // In production, this should be your actual Groth16 verifier contract
    const tx = await verifier.setVerifier(STAKE_PROOF_TYPE, verifierAddress);
    await tx.wait();
    console.log("✅ Stake verifier configured");
  }

  // Check proof history
  console.log("\n🔍 Checking proof history...");
  const previousProofs = await verifier.proofCount(deployer.address);
  console.log(`Previous proofs submitted: ${previousProofs}`);

  // Generate ZK proof inputs
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = ethers.hexlify(ethers.randomBytes(32));
  
  // Circuit inputs based on stakeProof.circom
  const circuitInputs = {
    stakeAmount: "1000000000000000000", // 1 ETH in wei
    nullifier: ethers.toBigInt(
      ethers.keccak256(
        ethers.solidityPacked(
          ["address", "uint256", "string"],
          [deployer.address, timestamp, "activation"]
        )
      )
    ).toString(),
    secret: ethers.toBigInt(secret).toString(),
    threshold: "100000000000000000" // 0.1 ETH threshold
  };

  console.log("\n🔐 Generating ZK proof...");
  
  // Load proving key and verification key
  const wasmPath = path.join(__dirname, "..", "circuits", "stakeProof.wasm");
  const zkeyPath = path.join(__dirname, "..", "circuits", "stakeProof.zkey");
  
  if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
    throw new Error(
      "❌ Circuit artifacts not found! Please compile circuits first:\n" +
      "1. cd circuits\n" +
      "2. npm run compile # or equivalent command to compile circuits"
    );
  }

  // Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmPath,
    zkeyPath
  );

  // Convert proof to contract format
  const solidityProof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
    c: [proof.pi_c[0], proof.pi_c[1]]
  };

  console.log("\n🛡️ Activating ScrollPower system...");
  try {
    // Verify proof locally first
    const vkeyPath = path.join(__dirname, "..", "circuits", "stakeProof.vkey.json");
    if (!fs.existsSync(vkeyPath)) {
      console.log("⚠️  Verification key not found, skipping local verification");
    } else {
      const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"));
      const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
      if (!isValid) {
        throw new Error("Local proof verification failed");
      }
      console.log("✅ Local proof verification passed");
    }

    // Submit proof to contract
    console.log("📤 Submitting proof to contract...");
    const tx = await verifier.verifyStakeProof(
      solidityProof,
      publicSignals,
      circuitInputs.nullifier
    );
    await tx.wait();
    console.log("✅ ScrollPower system activated!");
    
    // Save proof details for reference
    const proofPath = path.join(__dirname, "..", "deployments", `activation-proof-${timestamp}.json`);
    fs.writeFileSync(proofPath, JSON.stringify({
      proof,
      publicSignals,
      inputs: circuitInputs,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`\n📝 Proof details saved to: ${proofPath}`);

  } catch (error) {
    if (error.message.includes("nullifier")) {
      console.error("❌ Error: Nullifier already used. Try again (new nullifier will be generated).");
    } else if (error.message.includes("proof")) {
      console.error("❌ Error: Invalid proof. This could mean:");
      console.error("   1. Circuit artifacts (.wasm/.zkey) don't match deployed verifier");
      console.error("   2. Proof inputs don't meet circuit constraints");
      console.error("   3. Verifier contract needs proper setup");
    } else {
      console.error("❌ Activation failed:", error.message);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
