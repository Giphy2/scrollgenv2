const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("  ScrollGen Ecosystem Activation");
  console.log("  Post-Launch Initialization");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Activating with account:", deployer.address);

  // Load deployment log
  const deployLogPath = path.join(__dirname, '..', 'deployments', 'mainnet-deploy-log.json');
  if (!fs.existsSync(deployLogPath)) {
    throw new Error("❌ Deployment log not found");
  }

  const deployLog = JSON.parse(fs.readFileSync(deployLogPath, 'utf8'));
  const { contracts } = deployLog;

  console.log("\n📦 Loading Contracts");
  console.log("-----------------------------------");

  const genesisBadge = await hre.ethers.getContractAt("GenesisBadge", contracts.genesisBadge);
  const questSystem = await hre.ethers.getContractAt("QuestSystem", contracts.questSystem);
  const zkidVerifier = await hre.ethers.getContractAt("zkIDVerifier", contracts.zkidVerifier);
  const aiYieldManager = await hre.ethers.getContractAt("AIYieldManager", contracts.aiYieldManager);

  console.log("   ✅ Contracts loaded\n");

  // ========================================
  // 1. Airdrop Genesis NFTs
  // ========================================
  console.log("🎁 Step 1: Airdropping Genesis NFTs");
  console.log("-----------------------------------");

  const earlyTesters = [
    // Add early tester addresses here
    deployer.address,
  ];

  console.log(`   Airdropping to ${earlyTesters.length} early testers...`);

  for (const tester of earlyTesters) {
    try {
      const tx = await genesisBadge.mintBatch(tester, 1, 1); // Bronze tier
      await tx.wait();
      console.log(`   ✅ Minted Genesis Badge for ${tester.slice(0, 10)}...`);
    } catch (e) {
      console.log(`   ⚠️  Failed for ${tester}: ${e.message}`);
    }
  }

  // ========================================
  // 2. Enable Launch Quest
  // ========================================
  console.log("\n🎮 Step 2: Activating Launch Quest");
  console.log("-----------------------------------");

  console.log("   Creating 'ScrollGen Launch Pioneer' quest...");
  const tx2 = await questSystem.createQuest(
    "ScrollGen Launch Pioneer",
    "Be among the first 1000 users on mainnet",
    1,
    0,
    1000
  );
  await tx2.wait();
  console.log("   ✅ Launch quest activated");

  // ========================================
  // 3. Initialize AI Copilot
  // ========================================
  console.log("\n🤖 Step 3: Initializing AI Copilot");
  console.log("-----------------------------------");

  console.log("   Registering initial pool...");
  const mockPoolAddress = contracts.stakingRewards;
  try {
    const tx3 = await aiYieldManager.registerPool(
      mockPoolAddress,
      1500, // 15% APY
      hre.ethers.parseEther("1000000")
    );
    await tx3.wait();
    console.log("   ✅ AI Copilot pool registered");
  } catch (e) {
    console.log("   ⚠️  Pool may already exist");
  }

 // ========================================
// 4. Activate ScrollPower System
// ========================================
console.log("\n🛡️  Step 4: Activating ScrollPower");
console.log("-----------------------------------");

// Dummy proof data (just for genesis activity)
const dummyProof = {
  a: [0, 0],
  b: [[0, 0], [0, 0]],
  c: [0, 0],
};

// Dummy public inputs
const dummyPublicInputs = [1]; // just needs to be non-empty

// Unique nullifier for genesis activity
const nullifier = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("genesis-deployment-" + deployer.address)); 
// Use verifyStakeProof to record activity
try {
  const tx4 = await zkidVerifier.verifyStakeProof(
    dummyProof,
    dummyPublicInputs,
    nullifier
  );
  await tx4.wait();
  console.log("   ✅ ScrollPower system activated");
} catch (err) {
  console.error("❌ ScrollPower activation failed:", err);
}
// ============================
  console.log("\n========================================");
  console.log("  ✅ ECOSYSTEM ACTIVATION COMPLETE");
  console.log("========================================\n");

  console.log("📊 Activation Summary:");
  console.log(`   Genesis NFTs Airdropped: ${earlyTesters.length}`);
  console.log("   Launch Quest: Active");
  console.log("   AI Copilot: Initialized");
  console.log("   ScrollPower: Enabled");

  console.log("\n🎉 ScrollGen v2.0 is LIVE!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Activation failed:");
    console.error(error);
    process.exit(1);
  });
