const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("  ScrollGen Phase 5 Deployment");
  console.log("  Network: Scroll Sepolia Testnet");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get existing contract addresses
  const SGT_TOKEN_ADDRESS = process.env.SGT_TOKEN_ADDRESS || "0xYourSGTTokenAddress";
  console.log("Using SGT Token at:", SGT_TOKEN_ADDRESS);

  let aiYieldManager, restakeHub, zkidVerifier, questSystem;

  // Deploy AI Yield Manager
  console.log("\n📊 Deploying AIYieldManager...");
  const AIYieldManager = await hre.ethers.getContractFactory("AIYieldManager");
  aiYieldManager = await AIYieldManager.deploy();
  await aiYieldManager.waitForDeployment();
  const aiYieldManagerAddress = await aiYieldManager.getAddress();
  console.log("✅ AIYieldManager deployed to:", aiYieldManagerAddress);

  // Deploy Restake Hub
  console.log("\n🔄 Deploying RestakeHub...");
  const RestakeHub = await hre.ethers.getContractFactory("RestakeHub");
  restakeHub = await RestakeHub.deploy(SGT_TOKEN_ADDRESS, SGT_TOKEN_ADDRESS);
  await restakeHub.waitForDeployment();
  const restakeHubAddress = await restakeHub.getAddress();
  console.log("✅ RestakeHub deployed to:", restakeHubAddress);

  // Deploy zkID Verifier
  console.log("\n🛡️  Deploying zkIDVerifier...");
  const zkIDVerifier = await hre.ethers.getContractFactory("zkIDVerifier");
  zkidVerifier = await zkIDVerifier.deploy(deployer.address);
  await zkidVerifier.waitForDeployment();
  const zkidVerifierAddress = await zkidVerifier.getAddress();
  console.log("✅ zkIDVerifier deployed to:", zkidVerifierAddress);

  // Deploy Quest System
  console.log("\n🎮 Deploying QuestSystem...");
  const QuestSystem = await hre.ethers.getContractFactory("QuestSystem");
  questSystem = await QuestSystem.deploy();
  await questSystem.waitForDeployment();
  const questSystemAddress = await questSystem.getAddress();
  console.log("✅ QuestSystem deployed to:", questSystemAddress);

  console.log("\n========================================");
  console.log("  Phase 5 Deployment Complete!");
  console.log("========================================\n");

  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("AIYieldManager:", aiYieldManagerAddress);
  console.log("RestakeHub:", restakeHubAddress);
  console.log("zkIDVerifier:", zkidVerifierAddress);
  console.log("QuestSystem:", questSystemAddress);

  console.log("\n📝 Environment Variables for .env:");
  console.log("-----------------------------------");
  console.log(`VITE_AI_YIELD_MANAGER_ADDRESS="${aiYieldManagerAddress}"`);
  console.log(`VITE_RESTAKE_HUB_ADDRESS="${restakeHubAddress}"`);
  console.log(`VITE_ZKID_VERIFIER_ADDRESS="${zkidVerifierAddress}"`);
  console.log(`VITE_QUEST_SYSTEM_ADDRESS="${questSystemAddress}"`);

  // Initialize contracts
  console.log("\n🔧 Initializing contracts...");

  // Initialize AI Yield Manager
  console.log("\n1. Setting up AIYieldManager...");
  const tx1 = await aiYieldManager.setRebalanceFee(10); // 0.1%
  await tx1.wait();
  console.log("   ✓ Set rebalancing fee to 0.1%");

  // Initialize Quest System with starter quests
  console.log("\n2. Creating starter quests...");

  const quest1 = await questSystem.createQuest(
    "First Steps",
    "Complete your first stake on ScrollGen",
    1,
    0, // Badge reward
    50 // 50 SP reward
  );
  await quest1.wait();
  console.log("   ✓ Created quest: First Steps");

  const quest2 = await questSystem.createQuest(
    "Active Trader",
    "Complete 5 NFT marketplace trades",
    5,
    0,
    100
  );
  await quest2.wait();
  console.log("   ✓ Created quest: Active Trader");

  const quest3 = await questSystem.createQuest(
    "Governance Participant",
    "Vote on 10 DAO proposals",
    10,
    0,
    250
  );
  await quest3.wait();
  console.log("   ✓ Created quest: Governance Participant");

  const quest4 = await questSystem.createQuest(
    "Yield Farmer",
    "Earn 100 SGT from staking rewards",
    100,
    1, // Token reward
    50
  );
  await quest4.wait();
  console.log("   ✓ Created quest: Yield Farmer");

  const quest5 = await questSystem.createQuest(
    "Diamond Hands",
    "Maintain stake for 30 days",
    30,
    0,
    500
  );
  await quest5.wait();
  console.log("   ✓ Created quest: Diamond Hands");

  console.log("\n3. Setting up RestakeHub...");
  const tx2 = await restakeHub.setMinRestakeAmount(hre.ethers.parseEther("100"));
  await tx2.wait();
  console.log("   ✓ Set minimum restake amount to 100 tokens");

  console.log("\n========================================");
  console.log("  Initialization Complete!");
  console.log("========================================\n");

  console.log("📋 Next Steps:");
  console.log("1. Update .env file with the addresses above");
  console.log("2. Register pools in AIYieldManager");
  console.log("3. Register operators in RestakeHub");
  console.log("4. Verify contracts on Scrollscan");
  console.log("5. Test all functionality");
  console.log("6. Deploy frontend with updated config");

  console.log("\n🎉 ScrollGen v2.0 is ready for testing!\n");

  // Save deployment info
  const deploymentInfo = {
    network: "scrollSepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      aiYieldManager: aiYieldManagerAddress,
      restakeHub: restakeHubAddress,
      zkidVerifier: zkidVerifierAddress,
      questSystem: questSystemAddress,
    },
    initialConfig: {
      rebalanceFee: "0.1%",
      minRestakeAmount: "100 tokens",
      questsCreated: 5,
    },
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
