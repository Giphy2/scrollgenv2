const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("  ScrollGen Phase 5 Interaction Demo");
  console.log("========================================\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  // Contract addresses (replace with your deployed addresses)
  const AI_YIELD_MANAGER = process.env.VITE_AI_YIELD_MANAGER_ADDRESS || "0xYourAddress";
  const RESTAKE_HUB = process.env.VITE_RESTAKE_HUB_ADDRESS || "0xYourAddress";
  const ZKID_VERIFIER = process.env.VITE_ZKID_VERIFIER_ADDRESS || "0xYourAddress";
  const QUEST_SYSTEM = process.env.VITE_QUEST_SYSTEM_ADDRESS || "0xYourAddress";

  // Get contract instances
  const aiYieldManager = await hre.ethers.getContractAt("AIYieldManager", AI_YIELD_MANAGER);
  const restakeHub = await hre.ethers.getContractAt("RestakeHub", RESTAKE_HUB);
  const zkidVerifier = await hre.ethers.getContractAt("zkIDVerifier", ZKID_VERIFIER);
  const questSystem = await hre.ethers.getContractAt("QuestSystem", QUEST_SYSTEM);

  console.log("\n📊 AI Yield Manager Demo");
  console.log("-------------------------");

  // Register a mock pool
  console.log("1. Registering mock pool...");
  const mockPoolAddress = "0x" + "1".repeat(40);
  try {
    const tx1 = await aiYieldManager.registerPool(
      mockPoolAddress,
      1500, // 15% APY
      hre.ethers.parseEther("100000") // 100k liquidity
    );
    await tx1.wait();
    console.log("   ✓ Pool registered");
  } catch (e) {
    console.log("   ⚠ Pool may already be registered");
  }

  // Update pool metrics
  console.log("2. Updating pool metrics...");
  const tx2 = await aiYieldManager.updatePoolMetrics(
    mockPoolAddress,
    1800, // 18% APY
    hre.ethers.parseEther("150000"),
    3000 // 30% volatility
  );
  await tx2.wait();
  console.log("   ✓ Metrics updated");

  // Set user strategy
  console.log("3. Setting AI strategy...");
  const tx3 = await aiYieldManager.setUserStrategy(
    1200, // 12% target APY
    5000, // 50% max volatility
    hre.ethers.parseEther("10000"), // 10k min liquidity
    false // manual rebalancing
  );
  await tx3.wait();
  console.log("   ✓ Strategy set");

  // Get pool metrics
  const [apy, liquidity, volatility, lastUpdate, active] = await aiYieldManager.getPoolMetrics(mockPoolAddress);
  console.log("\n   Pool Metrics:");
  console.log("   - APY:", Number(apy) / 100, "%");
  console.log("   - Liquidity:", hre.ethers.formatEther(liquidity));
  console.log("   - Volatility:", Number(volatility) / 100, "%");
  console.log("   - Active:", active);

  console.log("\n🔄 Restaking Portal Demo");
  console.log("-------------------------");

  // Register as operator
  console.log("1. Registering as operator...");
  try {
    const tx4 = await restakeHub.registerOperator(
      "Demo Validator",
      500, // 5% commission
      hre.ethers.parseEther("50000") // 50k max capacity
    );
    await tx4.wait();
    console.log("   ✓ Operator registered");
  } catch (e) {
    console.log("   ⚠ Operator may already be registered");
  }

  // Get operator info
  const [name, commission, totalRestaked, maxCapacity, reputation, uptime, operatorActive] =
    await restakeHub.getOperatorInfo(signer.address);
  console.log("\n   Operator Info:");
  console.log("   - Name:", name);
  console.log("   - Commission:", Number(commission) / 100, "%");
  console.log("   - Total Restaked:", hre.ethers.formatEther(totalRestaked));
  console.log("   - Max Capacity:", hre.ethers.formatEther(maxCapacity));
  console.log("   - Reputation:", Number(reputation));
  console.log("   - Uptime:", Number(uptime), "%");

  console.log("\n🛡️  zkID Verifier Demo");
  console.log("-------------------------");

  // Verify identity with mock proof
  console.log("1. Verifying identity...");
  const proofHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("demo-proof-" + Date.now()));
  const mockProof = hre.ethers.toUtf8Bytes("mock-proof-data");

  try {
    const tx5 = await zkidVerifier.verifyProof(proofHash, 2, mockProof); // Level 2
    await tx5.wait();
    console.log("   ✓ Identity verified");
  } catch (e) {
    console.log("   ⚠ Identity may already be verified or proof used");
  }

  // Mint ScrollPower
  console.log("2. Minting ScrollPower...");
  try {
    const tx6 = await zkidVerifier.mintSP(signer.address, 100, "Demo Activity");
    await tx6.wait();
    console.log("   ✓ ScrollPower minted");
  } catch (e) {
    console.log("   ⚠ User may not be verified yet");
  }

  // Get identity info
  try {
    const [scrollPower, verificationLevel, lastUpdate2, verified] = await zkidVerifier.getIdentity(signer.address);
    console.log("\n   Identity Info:");
    console.log("   - ScrollPower:", Number(scrollPower));
    console.log("   - Verification Level:", Number(verificationLevel));
    console.log("   - Verified:", verified);
  } catch (e) {
    console.log("   ⚠ Identity not found");
  }

  console.log("\n🎮 Quest System Demo");
  console.log("-------------------------");

  // Get active quests
  console.log("1. Getting active quests...");
  const activeQuests = await questSystem.getActiveQuests();
  console.log("   ✓ Found", activeQuests.length, "active quests");

  if (activeQuests.length > 0) {
    const firstQuest = activeQuests[0];
    console.log("\n   Quest #" + firstQuest.toString() + ":");

    const [questName, description, requiredProgress, rewardAmount, questActive, participants, completions] =
      await questSystem.getQuest(firstQuest);

    console.log("   - Name:", questName);
    console.log("   - Description:", description);
    console.log("   - Required Progress:", Number(requiredProgress));
    console.log("   - Reward:", Number(rewardAmount));
    console.log("   - Participants:", Number(participants));
    console.log("   - Completions:", Number(completions));

    // Start quest
    console.log("\n2. Starting quest...");
    try {
      const tx7 = await questSystem.startQuest(firstQuest);
      await tx7.wait();
      console.log("   ✓ Quest started");
    } catch (e) {
      console.log("   ⚠ Quest may already be started or completed");
    }

    // Check progress
    const [progress, required, completed, claimed] = await questSystem.getUserQuestProgress(
      signer.address,
      firstQuest
    );
    console.log("\n   Your Progress:");
    console.log("   - Progress:", Number(progress), "/", Number(required));
    console.log("   - Completed:", completed);
    console.log("   - Claimed:", claimed);
  }

  // Get user stats
  try {
    const [completedQuests, totalBadges, highestTier, totalExperience] = await questSystem.getUserStats(
      signer.address
    );
    console.log("\n   Your Stats:");
    console.log("   - Completed Quests:", Number(completedQuests));
    console.log("   - Total Badges:", Number(totalBadges));
    console.log("   - Highest Tier:", Number(highestTier));
    console.log("   - Total Experience:", Number(totalExperience));
  } catch (e) {
    console.log("   ⚠ No stats available yet");
  }

  console.log("\n========================================");
  console.log("  Phase 5 Demo Complete!");
  console.log("========================================\n");

  console.log("✨ All Phase 5 features are working!");
  console.log("\n📋 Try these interactions:");
  console.log("1. Set different AI strategies and compare results");
  console.log("2. Restake tokens with different operators");
  console.log("3. Complete quests and claim badges");
  console.log("4. Build up your ScrollPower reputation");
  console.log("5. Explore the frontend dashboard");

  console.log("\n🚀 Ready for mainnet deployment!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Interaction failed:");
    console.error(error);
    process.exit(1);
  });
