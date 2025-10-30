const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying ScrollGen Phase 3 Contracts to Scroll Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const sgtTokenAddress = process.env.VITE_CONTRACT_ADDRESS;
  if (!sgtTokenAddress) {
    console.error("❌ Please set VITE_CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }

  console.log("📋 Phase 1 SGT Token:", sgtTokenAddress);
  console.log("\n" + "=".repeat(60) + "\n");

  console.log("1️⃣  Deploying StakingRewards...");
  const StakingRewards = await ethers.getContractFactory("StakingRewards");
  const initialRewardRate = ethers.parseUnits("0.1", 18);
  const stakingRewards = await StakingRewards.deploy(
    sgtTokenAddress,
    sgtTokenAddress,
    initialRewardRate
  );
  await stakingRewards.waitForDeployment();
  const stakingRewardsAddress = await stakingRewards.getAddress();
  console.log("✅ StakingRewards deployed:", stakingRewardsAddress);

  console.log("\n2️⃣  Deploying LendingProtocol...");
  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(sgtTokenAddress);
  await lendingProtocol.waitForDeployment();
  const lendingProtocolAddress = await lendingProtocol.getAddress();
  console.log("✅ LendingProtocol deployed:", lendingProtocolAddress);

  console.log("\n3️⃣  Configuring LendingProtocol assets...");
  const wethAddress = "0x5300000000000000000000000000000000000004";
  await lendingProtocol.addSupportedAsset(wethAddress);
  console.log("✅ Added WETH as supported asset");

  console.log("\n4️⃣  Deploying BridgeConnector...");
  const scrollMessenger = "0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A";
  const BridgeConnector = await ethers.getContractFactory("BridgeConnector");
  const bridgeConnector = await BridgeConnector.deploy(scrollMessenger);
  await bridgeConnector.waitForDeployment();
  const bridgeConnectorAddress = await bridgeConnector.getAddress();
  console.log("✅ BridgeConnector deployed:", bridgeConnectorAddress);

  console.log("\n5️⃣  Deploying ZKVerifier...");
  const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log("✅ ZKVerifier deployed:", zkVerifierAddress);

  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 Phase 3 Deployment Complete!\n");

  console.log("📝 Contract Addresses:");
  console.log("─".repeat(60));
  console.log("StakingRewards:        ", stakingRewardsAddress);
  console.log("LendingProtocol:       ", lendingProtocolAddress);
  console.log("BridgeConnector:       ", bridgeConnectorAddress);
  console.log("ZKVerifier:            ", zkVerifierAddress);
  console.log("─".repeat(60));

  console.log("\n📋 Next Steps:");
  console.log("1. Update .env with these addresses:");
  console.log(`   VITE_STAKING_REWARDS_ADDRESS=${stakingRewardsAddress}`);
  console.log(`   VITE_LENDING_PROTOCOL_ADDRESS=${lendingProtocolAddress}`);
  console.log(`   VITE_BRIDGE_CONNECTOR_ADDRESS=${bridgeConnectorAddress}`);
  console.log(`   VITE_ZK_VERIFIER_ADDRESS=${zkVerifierAddress}`);
  console.log("\n2. Update frontend/src/config-phase3.js");
  console.log("3. Verify contracts on Scroll Sepolia explorer");
  console.log("4. Fund StakingRewards with reward tokens");
  console.log("5. Test all contracts with interact-phase3.cjs");
  console.log("6. Deploy ZK verifier circuits\n");

  return {
    stakingRewards: stakingRewardsAddress,
    lendingProtocol: lendingProtocolAddress,
    bridgeConnector: bridgeConnectorAddress,
    zkVerifier: zkVerifierAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
