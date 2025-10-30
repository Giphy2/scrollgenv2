const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deployment configuration
const MAINNET_CONFIG = {
  network: "scrollMainnet",
  chainId: 534352,
  explorer: "https://scrollscan.com",
  explorerApi: "https://api.scrollscan.com/api",
};

async function main() {
  console.log("========================================");
  console.log("  ScrollGen v2.0 - MAINNET DEPLOYMENT");
  console.log("  Phase 6: Production Launch");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("🔐 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance < hre.ethers.parseEther("0.1")) {
    throw new Error("❌ Insufficient balance for deployment. Need at least 0.1 ETH");
  }

  console.log("\n⚠️  WARNING: You are deploying to MAINNET");
  console.log("⚠️  Network:", MAINNET_CONFIG.network);
  console.log("⚠️  ChainID:", MAINNET_CONFIG.chainId);
  console.log("\n⏳ Starting deployment in 5 seconds...\n");

  await new Promise(resolve => setTimeout(resolve, 5000));

  const deployments = {};
  const startBlock = await hre.ethers.provider.getBlockNumber();
  const deploymentTimestamp = new Date().toISOString();

  // ========================================
  // PHASE 1: Core Token
  // ========================================
  console.log("\n📦 PHASE 1: Deploying Core Token");
  console.log("-----------------------------------");

  console.log("1. Deploying ScrollGenToken (SGT)...");
  const ScrollGenToken = await hre.ethers.getContractFactory("ScrollGenToken");
  const sgtToken = await ScrollGenToken.deploy();
  await sgtToken.waitForDeployment();
  deployments.sgtToken = await sgtToken.getAddress();
  console.log("   ✅ SGT Token:", deployments.sgtToken);

  // ========================================
  // PHASE 2: NFT & Marketplace
  // ========================================
  console.log("\n🎨 PHASE 2: Deploying NFT Ecosystem");
  console.log("-----------------------------------");

  console.log("1. Deploying GenesisBadge NFT...");
  const GenesisBadge = await hre.ethers.getContractFactory("GenesisBadge");
  const genesisBadge = await GenesisBadge.deploy();
  await genesisBadge.waitForDeployment();
  deployments.genesisBadge = await genesisBadge.getAddress();
  console.log("   ✅ GenesisBadge:", deployments.genesisBadge);

  console.log("2. Deploying NFT Marketplace...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(deployments.genesisBadge, deployments.sgtToken);
  await marketplace.waitForDeployment();
  deployments.marketplace = await marketplace.getAddress();
  console.log("   ✅ NFT Marketplace:", deployments.marketplace);

  console.log("3. Deploying NFT Staking...");
  const NFTStaking = await hre.ethers.getContractFactory("NFTStaking");
  const nftStaking = await NFTStaking.deploy(deployments.genesisBadge, deployments.sgtToken);
  await nftStaking.waitForDeployment();
  deployments.nftStaking = await nftStaking.getAddress();
  console.log("   ✅ NFT Staking:", deployments.nftStaking);

  // ========================================
  // PHASE 3: DeFi Core
  // ========================================
  console.log("\n💎 PHASE 3: Deploying DeFi Infrastructure");
  console.log("-----------------------------------");

  console.log("1. Deploying Staking Rewards...");
  const StakingRewards = await hre.ethers.getContractFactory("StakingRewards");
  const stakingRewards = await StakingRewards.deploy(deployments.sgtToken);
  await stakingRewards.waitForDeployment();
  deployments.stakingRewards = await stakingRewards.getAddress();
  console.log("   ✅ Staking Rewards:", deployments.stakingRewards);

  console.log("2. Deploying Lending Protocol...");
  const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
  const lending = await LendingProtocol.deploy(deployments.sgtToken);
  await lending.waitForDeployment();
  deployments.lending = await lending.getAddress();
  console.log("   ✅ Lending Protocol:", deployments.lending);

  console.log("3. Deploying Bridge Connector...");
  const BridgeConnector = await hre.ethers.getContractFactory("BridgeConnector");
  const bridge = await BridgeConnector.deploy(deployments.sgtToken);
  await bridge.waitForDeployment();
  deployments.bridge = await bridge.getAddress();
  console.log("   ✅ Bridge Connector:", deployments.bridge);

  console.log("4. Deploying ZK Verifier...");
  const ZKVerifier = await hre.ethers.getContractFactory("ZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  deployments.zkVerifier = await zkVerifier.getAddress();
  console.log("   ✅ ZK Verifier:", deployments.zkVerifier);

  // ========================================
  // PHASE 4: Advanced DeFi
  // ========================================
  console.log("\n🚀 PHASE 4: Deploying Advanced DeFi");
  console.log("-----------------------------------");

  console.log("1. Deploying ScrollGenBridge...");
  const ScrollGenBridge = await hre.ethers.getContractFactory("ScrollGenBridge");
  const scrollBridge = await ScrollGenBridge.deploy(deployments.sgtToken);
  await scrollBridge.waitForDeployment();
  deployments.scrollBridge = await scrollBridge.getAddress();
  console.log("   ✅ ScrollGenBridge:", deployments.scrollBridge);

  console.log("2. Deploying DEX Aggregator...");
  const DEXAggregator = await hre.ethers.getContractFactory("ScrollGenDEXAggregator");
  const dexAgg = await DEXAggregator.deploy(deployer.address); // Fee collector = deployer
  await dexAgg.waitForDeployment();
  deployments.dexAggregator = await dexAgg.getAddress();
  console.log("   ✅ DEX Aggregator:", deployments.dexAggregator);

  console.log("3. Deploying Liquid Restaking Token (LRT)...");
  const LRT = await hre.ethers.getContractFactory("ScrollGenLRT");
  const lrt = await LRT.deploy(deployments.sgtToken);
  await lrt.waitForDeployment();
  deployments.lrt = await lrt.getAddress();
  console.log("   ✅ ScrollGen LRT:", deployments.lrt);

  console.log("4. Deploying API Gateway...");
  const APIGateway = await hre.ethers.getContractFactory("APIGateway");
  const apiGateway = await APIGateway.deploy(); // No constructor params
  await apiGateway.waitForDeployment();
  deployments.apiGateway = await apiGateway.getAddress();
  console.log("   ✅ API Gateway:", deployments.apiGateway);

  console.log("5. Registering contracts in API Gateway...");
  let txReg = await apiGateway.registerContracts(
    deployments.sgtToken,
    deployments.stakingRewards,
    deployments.lending,
    deployments.bridge,
    deployments.lrt
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

  console.log("2. Deploying Restake Hub...");
  const RestakeHub = await hre.ethers.getContractFactory("RestakeHub");
  const restakeHub = await RestakeHub.deploy(deployments.sgtToken, deployments.sgtToken);
  await restakeHub.waitForDeployment();
  deployments.restakeHub = await restakeHub.getAddress();
  console.log("   ✅ Restake Hub:", deployments.restakeHub);

  console.log("3. Deploying zkID Verifier...");
  const zkIDVerifier = await hre.ethers.getContractFactory("zkIDVerifier");
  const zkid = await zkIDVerifier.deploy(deployer.address);
  await zkid.waitForDeployment();
  deployments.zkidVerifier = await zkid.getAddress();
  console.log("   ✅ zkID Verifier:", deployments.zkidVerifier);

  console.log("4. Deploying Quest System...");
  const QuestSystem = await hre.ethers.getContractFactory("QuestSystem");
  const questSystem = await QuestSystem.deploy();
  await questSystem.waitForDeployment();
  deployments.questSystem = await questSystem.getAddress();
  console.log("   ✅ Quest System:", deployments.questSystem);

  // ========================================
  // Contract Initialization
  // ========================================
  console.log("\n⚙️  Initializing Contracts");
  console.log("-----------------------------------");

  console.log("1. Funding Staking Rewards pool...");
  const fundAmount = hre.ethers.parseEther("1000000"); // 1M tokens
  let tx = await sgtToken.transfer(deployments.stakingRewards, fundAmount);
  await tx.wait();
  console.log("   ✅ Funded with 1,000,000 SGT");

  console.log("2. Setting up marketplace approval...");
  tx = await genesisBadge.setApprovalForAll(deployments.marketplace, true);
  await tx.wait();
  console.log("   ✅ Marketplace approved");

  console.log("3. Initializing quest system...");
  tx = await questSystem.createQuest(
    "ScrollGen Launch Pioneer",
    "Be among the first 1000 users on mainnet",
    1,
    0,
    1000
  );
  await tx.wait();
  console.log("   ✅ Launch quest created");

  const endBlock = await hre.ethers.provider.getBlockNumber();

  // ========================================
  // Save Deployment Artifacts
  // ========================================
  console.log("\n💾 Saving Deployment Artifacts");
  console.log("-----------------------------------");

  const deploymentLog = {
    version: "2.0.1",
    network: "Scroll Mainnet",
    chainId: MAINNET_CONFIG.chainId,
    deployer: deployer.address,
    timestamp: deploymentTimestamp,
    startBlock,
    endBlock,
    contracts: deployments,
    verificationUrls: Object.entries(deployments).reduce((acc, [name, address]) => {
      acc[name] = `${MAINNET_CONFIG.explorer}/address/${address}#code`;
      return acc;
    }, {}),
    gasUsed: "TBD", // Will be calculated post-deployment
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const logPath = path.join(deploymentsDir, 'mainnet-deploy-log.json');
  fs.writeFileSync(logPath, JSON.stringify(deploymentLog, null, 2));
  console.log("   ✅ Deployment log saved:", logPath);

  // ========================================
  // Generate .env entries
  // ========================================
  console.log("\n📝 Environment Variables");
  console.log("-----------------------------------");
  console.log("Add these to your .env file:\n");

  const envVars = [
    `VITE_MAINNET_SGT_TOKEN_ADDRESS="${deployments.sgtToken}"`,
    `VITE_MAINNET_GENESIS_BADGE_ADDRESS="${deployments.genesisBadge}"`,
    `VITE_MAINNET_NFT_MARKETPLACE_ADDRESS="${deployments.marketplace}"`,
    `VITE_MAINNET_NFT_STAKING_ADDRESS="${deployments.nftStaking}"`,
    `VITE_MAINNET_STAKING_REWARDS_ADDRESS="${deployments.stakingRewards}"`,
    `VITE_MAINNET_LENDING_PROTOCOL_ADDRESS="${deployments.lending}"`,
    `VITE_MAINNET_BRIDGE_CONNECTOR_ADDRESS="${deployments.bridge}"`,
    `VITE_MAINNET_ZK_VERIFIER_ADDRESS="${deployments.zkVerifier}"`,
    `VITE_MAINNET_SCROLLGEN_BRIDGE_ADDRESS="${deployments.scrollBridge}"`,
    `VITE_MAINNET_DEX_AGGREGATOR_ADDRESS="${deployments.dexAggregator}"`,
    `VITE_MAINNET_SCROLLGEN_LRT_ADDRESS="${deployments.lrt}"`,
    `VITE_MAINNET_API_GATEWAY_ADDRESS="${deployments.apiGateway}"`,
    `VITE_MAINNET_AI_YIELD_MANAGER_ADDRESS="${deployments.aiYieldManager}"`,
    `VITE_MAINNET_RESTAKE_HUB_ADDRESS="${deployments.restakeHub}"`,
    `VITE_MAINNET_ZKID_VERIFIER_ADDRESS="${deployments.zkidVerifier}"`,
    `VITE_MAINNET_QUEST_SYSTEM_ADDRESS="${deployments.questSystem}"`,
    `VITE_MAINNET_DEPLOYMENT_DATE="${deploymentTimestamp}"`,
    `VITE_MAINNET_DEPLOYMENT_BLOCK="${endBlock}"`,
    `VITE_MAINNET_DEPLOYER_ADDRESS="${deployer.address}"`,
  ];

  envVars.forEach(line => console.log(line));

  // Save env template
  const envPath = path.join(deploymentsDir, 'mainnet.env');
  fs.writeFileSync(envPath, envVars.join('\n'));
  console.log("\n   ✅ Environment template saved:", envPath);

  // ========================================
  // Verification Instructions
  // ========================================
  console.log("\n🔍 Contract Verification");
  console.log("-----------------------------------");
  console.log("Run these commands to verify on Scrollscan:\n");

  Object.entries(deployments).forEach(([name, address]) => {
    console.log(`npx hardhat verify --network scrollMainnet ${address}`);
  });

  // ========================================
  // Summary
  // ========================================
  console.log("\n========================================");
  console.log("  ✅ MAINNET DEPLOYMENT COMPLETE");
  console.log("========================================\n");

  console.log("📊 Deployment Summary:");
  console.log(`   Contracts Deployed: ${Object.keys(deployments).length}`);
  console.log(`   Start Block: ${startBlock}`);
  console.log(`   End Block: ${endBlock}`);
  console.log(`   Blocks Used: ${endBlock - startBlock}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Timestamp: ${deploymentTimestamp}`);

  console.log("\n📋 Next Steps:");
  console.log("1. Update .env with mainnet addresses");
  console.log("2. Verify all contracts on Scrollscan");
  console.log("3. Run liquidity bootstrap: npm run bootstrap:liquidity");
  console.log("4. Run post-launch script: npm run postlaunch");
  console.log("5. Deploy documentation site");
  console.log("6. Announce mainnet launch 🚀");

  console.log("\n🎉 ScrollGen v2.0 is LIVE on Mainnet!\n");

  return deploymentLog;
}

main()
  .then((log) => {
    console.log("\n✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
