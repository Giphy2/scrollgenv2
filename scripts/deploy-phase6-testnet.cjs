const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Helper to print gas stats
async function printGasStats(instance, name) {
  const deployTxHash = instance.deploymentTransaction().hash;
  const receipt = await hre.ethers.provider.getTransactionReceipt(deployTxHash);
  const address = await instance.getAddress();
  console.log(`   🛢️ Gas used for ${name} (${address}):`, receipt.gasUsed.toString());
}

async function main() {
  console.log("========================================");
  console.log("  ScrollGen Phase 6 - TESTNET Deployment");
  console.log("  Network: Scroll Sepolia");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("🔐 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.05")) {
    throw new Error("❌ Insufficient balance. Need at least 0.05 ETH for testnet deployment");
  }

  const deployments = {};
  const startBlock = await hre.ethers.provider.getBlockNumber();
  const deploymentTimestamp = new Date().toISOString();

  // Use existing Phase 1-3 contracts
  deployments.sgtToken = process.env.VITE_CONTRACT_ADDRESS;
  deployments.genesisBadge = process.env.VITE_GENESIS_BADGE_ADDRESS;
  deployments.marketplace = process.env.VITE_MARKETPLACE_ADDRESS;
  deployments.nftStaking = process.env.VITE_NFT_STAKING_ADDRESS;
  deployments.stakingRewards = process.env.VITE_STAKING_REWARDS_ADDRESS;
  deployments.lending = process.env.VITE_LENDING_PROTOCOL_ADDRESS;
  deployments.bridge = process.env.VITE_BRIDGE_CONNECTOR_ADDRESS;
  deployments.zkVerifier = process.env.VITE_ZK_VERIFIER_ADDRESS;

  console.log("📦 Using Existing Contracts:");
  console.log("   SGT Token:", deployments.sgtToken);
  console.log("   Genesis Badge:", deployments.genesisBadge);
  console.log("   Staking Rewards:", deployments.stakingRewards);

  // ========================================
  // PHASE 4: Advanced DeFi (if not deployed)
  // ========================================
  console.log("\n🚀 PHASE 4: Deploying Advanced DeFi");
  console.log("-----------------------------------");

  console.log("1. Deploying ScrollGenBridge...");
  const ScrollGenBridge = await hre.ethers.getContractFactory("ScrollGenBridge");
  const scrollBridge = await ScrollGenBridge.deploy(deployments.sgtToken);
  await scrollBridge.waitForDeployment();
  deployments.scrollBridge = await scrollBridge.getAddress();
  console.log("   ✅ ScrollGenBridge:", deployments.scrollBridge);
  await printGasStats(scrollBridge, "ScrollGenBridge");

  console.log("2. Deploying DEX Aggregator...");
  const DEXAggregator = await hre.ethers.getContractFactory("ScrollGenDEXAggregator");
  const dexAgg = await DEXAggregator.deploy(deployer.address); // Fee collector = deployer
  await dexAgg.waitForDeployment();
  deployments.dexAggregator = await dexAgg.getAddress();
  console.log("   ✅ DEX Aggregator:", deployments.dexAggregator);
  await printGasStats(dexAgg, "ScrollGenDEXAggregator");

  console.log("3. Deploying Liquid Restaking Token (LRT)...");
  const LRT = await hre.ethers.getContractFactory("ScrollGenLRT");
  const lrt = await LRT.deploy(deployments.sgtToken);
  await lrt.waitForDeployment();
  deployments.lrt = await lrt.getAddress();
  console.log("   ✅ ScrollGen LRT:", deployments.lrt);
  await printGasStats(lrt, "ScrollGenLRT");

  console.log("4. Deploying API Gateway...");
  const APIGateway = await hre.ethers.getContractFactory("APIGateway");
  const apiGateway = await APIGateway.deploy(); // No constructor params
  await apiGateway.waitForDeployment();
  deployments.apiGateway = await apiGateway.getAddress();
  console.log("   ✅ API Gateway:", deployments.apiGateway);
  await printGasStats(apiGateway, "APIGateway");

  console.log("5. Registering contracts in API Gateway...");
  console.log("Registering with addresses:", {
  sgtToken: deployments.sgtToken,
  stakingRewards: deployments.stakingRewards,
  lending: deployments.lending,
  bridge: deployments.bridge,
  lrt: deployments.lrt,
  daoTreasury: deployments.daoTreasury,
});
  let txReg = await apiGateway.registerContracts(
    deployments.sgtToken,
    deployments.stakingRewards,
    deployments.lending,
    deployments.bridge,
    deployments.lrt,
    deployments.daoTreasury || deployer.address
  );
  await txReg.wait();
  console.log("   ✅ Contracts registered");

  // ========================================
  // PHASE 5: AI & Gamification
  // ========================================
  console.log("\n🤖 PHASE 5: Deploying AI & Gamification");
  console.log("-----------------------------------");

  console.log("1. Deploying AI Yield Manager...");
  const AIYieldManager = await hre.ethers.getContractFactory("AIYieldManager");
  const aiYieldManager = await AIYieldManager.deploy();
  await aiYieldManager.waitForDeployment();
  deployments.aiYieldManager = await aiYieldManager.getAddress();
  console.log("   ✅ AI Yield Manager:", deployments.aiYieldManager);
  await printGasStats(aiYieldManager, "AIYieldManager");

  console.log("2. Deploying Restake Hub...");
  const RestakeHub = await hre.ethers.getContractFactory("RestakeHub");
  const restakeHub = await RestakeHub.deploy(deployments.sgtToken, deployments.sgtToken);
  await restakeHub.waitForDeployment();
  deployments.restakeHub = await restakeHub.getAddress();
  console.log("   ✅ Restake Hub:", deployments.restakeHub);
  await printGasStats(restakeHub, "RestakeHub");

  console.log("3. Deploying zkID Verifier...");
  const zkIDVerifier = await hre.ethers.getContractFactory("zkIDVerifier");
  const zkid = await zkIDVerifier.deploy(deployer.address);
  await zkid.waitForDeployment();
  deployments.zkidVerifier = await zkid.getAddress();
  console.log("   ✅ zkID Verifier:", deployments.zkidVerifier);
  await printGasStats(zkid, "zkIDVerifier");

  console.log("4. Deploying Quest System...");
  const QuestSystem = await hre.ethers.getContractFactory("QuestSystem");
  const questSystem = await QuestSystem.deploy();
  await questSystem.waitForDeployment();
  deployments.questSystem = await questSystem.getAddress();
  console.log("   ✅ Quest System:", deployments.questSystem);
  await printGasStats(questSystem, "QuestSystem");

  // ========================================
  // Contract Initialization
  // ========================================
  console.log("\n⚙️  Initializing Contracts");
  console.log("-----------------------------------");

  console.log("1. Setting AI rebalancing fee...");
  let tx = await aiYieldManager.setRebalanceFee(10); // 0.1%
  await tx.wait();
  console.log("   ✅ Fee set to 0.1%");

  console.log("2. Setting restaking minimum...");
  tx = await restakeHub.setMinRestakeAmount(hre.ethers.parseEther("100"));
  await tx.wait();
  console.log("   ✅ Min restake: 100 tokens");

  console.log("3. Creating initial quests...");
  tx = await questSystem.createQuest(
    "First Steps",
    "Complete your first stake on ScrollGen",
    1,
    0,
    50
  );
  await tx.wait();
  console.log("   ✅ Quest created: First Steps");

  tx = await questSystem.createQuest(
    "Active Trader",
    "Complete 5 NFT marketplace trades",
    5,
    0,
    100
  );
  await tx.wait();
  console.log("   ✅ Quest created: Active Trader");

  tx = await questSystem.createQuest(
    "Yield Farmer",
    "Earn 100 SGT from staking rewards",
    100,
    1,
    50
  );
  await tx.wait();
  console.log("   ✅ Quest created: Yield Farmer");

  const endBlock = await hre.ethers.provider.getBlockNumber();

  // ========================================
  // Save Deployment Artifacts
  // ========================================
  console.log("\n💾 Saving Deployment Artifacts");
  console.log("-----------------------------------");

  const deploymentLog = {
    version: "2.0.1",
    network: "Scroll Sepolia Testnet",
    chainId: 534351,
    deployer: deployer.address,
    timestamp: deploymentTimestamp,
    startBlock,
    endBlock,
    contracts: deployments,
    newDeployments: {
      phase4: [
        deployments.scrollBridge,
        deployments.dexAggregator,
        deployments.lrt,
        deployments.apiGateway,
      ],
      phase5: [
        deployments.aiYieldManager,
        deployments.restakeHub,
        deployments.zkidVerifier,
        deployments.questSystem,
      ],
    },
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const logPath = path.join(deploymentsDir, 'testnet-phase6-deploy-log.json');
  fs.writeFileSync(logPath, JSON.stringify(deploymentLog, null, 2));
  console.log("   ✅ Deployment log saved:", logPath);

  // ========================================
  // Generate .env entries
  // ========================================
  console.log("\n📝 Environment Variables for .env:");
  console.log("-----------------------------------\n");

  const envVars = [
    `# Phase 4 Advanced DeFi`,
    `VITE_SCROLLGEN_BRIDGE_ADDRESS="${deployments.scrollBridge}"`,
    `VITE_DEX_AGGREGATOR_ADDRESS="${deployments.dexAggregator}"`,
    `VITE_SCROLLGEN_LRT_ADDRESS="${deployments.lrt}"`,
    `VITE_API_GATEWAY_ADDRESS="${deployments.apiGateway}"`,
    ``,
    `# Phase 5 AI & Gamification`,
    `VITE_AI_YIELD_MANAGER_ADDRESS="${deployments.aiYieldManager}"`,
    `VITE_RESTAKE_HUB_ADDRESS="${deployments.restakeHub}"`,
    `VITE_ZKID_VERIFIER_ADDRESS="${deployments.zkidVerifier}"`,
    `VITE_QUEST_SYSTEM_ADDRESS="${deployments.questSystem}"`,
  ];

  envVars.forEach(line => console.log(line));

  // Save env template
  const envPath = path.join(deploymentsDir, 'testnet-phase6.env');
  fs.writeFileSync(envPath, envVars.join('\n'));
  console.log("\n   ✅ Environment template saved:", envPath);

  // ========================================
  // Summary
  // ========================================
  console.log("\n========================================");
  console.log("  ✅ TESTNET DEPLOYMENT COMPLETE");
  console.log("========================================\n");

  console.log("📊 Deployment Summary:");
  console.log(`   New Contracts Deployed: 8`);
  console.log(`   Phase 4 Contracts: 4`);
  console.log(`   Phase 5 Contracts: 4`);
  console.log(`   Start Block: ${startBlock}`);
  console.log(`   End Block: ${endBlock}`);
  console.log(`   Deployer: ${deployer.address}`);

  console.log("\n📋 Next Steps:");
  console.log("1. Update .env with new addresses (see above)");
  console.log("2. Verify contracts on Scrollscan");
  console.log("3. Test interactions: npm run interact:phase5");
  console.log("4. Test frontend with new features");
  console.log("5. Once stable, deploy to mainnet");

  console.log("\n🎉 ScrollGen Phase 6 Testnet Deployment Complete!\n");

  return deploymentLog;
}

main()
  .then(() => {
    console.log("✅ Deployment completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
