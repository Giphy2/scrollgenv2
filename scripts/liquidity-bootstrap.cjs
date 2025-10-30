const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Bootstrap configuration
const BOOTSTRAP_CONFIG = {
  // Initial liquidity amounts
  sgtForLiquidity: hre.ethers.parseEther("500000"), // 500k SGT
  ethForLiquidity: hre.ethers.parseEther("10"), // 10 ETH

  // DAO Treasury funding
  daoTreasuryAmount: hre.ethers.parseEther("2000000"), // 2M SGT

  // Reward pool seeding
  stakingRewardsPool: hre.ethers.parseEther("1000000"), // 1M SGT
  questRewardsPool: hre.ethers.parseEther("500000"), // 500k SGT
  restakingRewardsPool: hre.ethers.parseEther("500000"), // 500k SGT

  // Uniswap V2 Router (Scroll Mainnet)
  uniswapRouter: "0x0000000000000000000000000000000000000000", // Update with actual router

  // DAO Treasury wallet
  daoTreasury: process.env.DAO_TREASURY_ADDRESS || "",
};

async function main() {
  console.log("========================================");
  console.log("  ScrollGen Liquidity Bootstrap");
  console.log("  Mainnet Initialization");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("🔐 Bootstrapping with account:", deployer.address);

  // Load deployment log
  const deployLogPath = path.join(__dirname, '..', 'deployments', 'mainnet-deploy-log.json');
  if (!fs.existsSync(deployLogPath)) {
    throw new Error("❌ Deployment log not found. Run deploy-phase6 first.");
  }

  const deployLog = JSON.parse(fs.readFileSync(deployLogPath, 'utf8'));
  const { contracts } = deployLog;

  console.log("\n📦 Loading Contracts");
  console.log("-----------------------------------");

  const sgtToken = await hre.ethers.getContractAt("contracts/ScrollGenToken.sol:ScrollGenToken", contracts.sgtToken);
  const stakingRewards = await hre.ethers.getContractAt("StakingRewards", contracts.stakingRewards);
  const restakeHub = await hre.ethers.getContractAt("RestakeHub", contracts.restakeHub);
  const questSystem = await hre.ethers.getContractAt("QuestSystem", contracts.questSystem);

  console.log("   ✅ Contracts loaded");

  const liquidityLog = {
    timestamp: new Date().toISOString(),
    network: "Scroll Mainnet",
    transactions: [],
  };

  // ========================================
  // 1. Fund DAO Treasury
  // ========================================
  console.log("\n💰 Step 1: Funding DAO Treasury");
  console.log("-----------------------------------");

  if (!BOOTSTRAP_CONFIG.daoTreasury) {
    console.log("   ⚠️  DAO Treasury address not set. Skipping...");
  } else {
    console.log(`   Transferring ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.daoTreasuryAmount)} SGT to treasury...`);
    const tx1 = await sgtToken.transfer(BOOTSTRAP_CONFIG.daoTreasury, BOOTSTRAP_CONFIG.daoTreasuryAmount);
    const receipt1 = await tx1.wait();

    liquidityLog.transactions.push({
      step: "DAO Treasury Funding",
      txHash: receipt1.hash,
      amount: hre.ethers.formatEther(BOOTSTRAP_CONFIG.daoTreasuryAmount) + " SGT",
      recipient: BOOTSTRAP_CONFIG.daoTreasury,
    });

    console.log("   ✅ DAO Treasury funded");
    console.log("   📝 Tx:", receipt1.hash);
  }

  // ========================================
  // 2. Seed Staking Rewards Pool
  // ========================================
  console.log("\n📈 Step 2: Seeding Staking Rewards Pool");
  console.log("-----------------------------------");

  console.log(`   Transferring ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.stakingRewardsPool)} SGT...`);
  const tx2 = await sgtToken.transfer(contracts.stakingRewards, BOOTSTRAP_CONFIG.stakingRewardsPool);
  const receipt2 = await tx2.wait();

  liquidityLog.transactions.push({
    step: "Staking Rewards Pool",
    txHash: receipt2.hash,
    amount: hre.ethers.formatEther(BOOTSTRAP_CONFIG.stakingRewardsPool) + " SGT",
    contract: contracts.stakingRewards,
  });

  console.log("   ✅ Staking rewards pool funded");
  console.log("   📝 Tx:", receipt2.hash);

  // Initialize staking rewards
  console.log("   Initializing reward rate...");
  const rewardRate = hre.ethers.parseEther("100"); // 100 SGT per block
  const tx2b = await stakingRewards.setRewardRate(rewardRate);
  await tx2b.wait();
  console.log("   ✅ Reward rate set to 100 SGT/block");

  // ========================================
  // 3. Fund Quest Rewards
  // ========================================
  console.log("\n🎮 Step 3: Funding Quest System Rewards");
  console.log("-----------------------------------");

  console.log(`   Transferring ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.questRewardsPool)} SGT...`);
  const tx3 = await sgtToken.transfer(contracts.questSystem, BOOTSTRAP_CONFIG.questRewardsPool);
  const receipt3 = await tx3.wait();

  liquidityLog.transactions.push({
    step: "Quest Rewards Pool",
    txHash: receipt3.hash,
    amount: hre.ethers.formatEther(BOOTSTRAP_CONFIG.questRewardsPool) + " SGT",
    contract: contracts.questSystem,
  });

  console.log("   ✅ Quest rewards funded");
  console.log("   📝 Tx:", receipt3.hash);

  // ========================================
  // 4. Fund Restaking Hub
  // ========================================
  console.log("\n🔄 Step 4: Funding Restaking Hub");
  console.log("-----------------------------------");

  console.log(`   Transferring ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.restakingRewardsPool)} SGT...`);
  const tx4 = await sgtToken.transfer(contracts.restakeHub, BOOTSTRAP_CONFIG.restakingRewardsPool);
  const receipt4 = await tx4.wait();

  liquidityLog.transactions.push({
    step: "Restaking Rewards Pool",
    txHash: receipt4.hash,
    amount: hre.ethers.formatEther(BOOTSTRAP_CONFIG.restakingRewardsPool) + " SGT",
    contract: contracts.restakeHub,
  });

  console.log("   ✅ Restaking hub funded");
  console.log("   📝 Tx:", receipt4.hash);

  // ========================================
  // 5. Initialize Liquidity Pool (DEX)
  // ========================================
  console.log("\n💧 Step 5: Initializing DEX Liquidity");
  console.log("-----------------------------------");

  if (BOOTSTRAP_CONFIG.uniswapRouter === "0x0000000000000000000000000000000000000000") {
    console.log("   ⚠️  Uniswap router not configured. Skipping DEX liquidity...");
    console.log("   📝 Manual steps required:");
    console.log(`   1. Approve ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.sgtForLiquidity)} SGT to router`);
    console.log(`   2. Add liquidity: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.sgtForLiquidity)} SGT + ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.ethForLiquidity)} ETH`);
    console.log(`   3. Initial price: 1 ETH = ${Number(BOOTSTRAP_CONFIG.sgtForLiquidity) / Number(BOOTSTRAP_CONFIG.ethForLiquidity)} SGT`);
  } else {
    // In production, implement actual Uniswap V2 liquidity addition
    console.log("   💡 DEX liquidity initialization:");
    console.log(`   - SGT Amount: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.sgtForLiquidity)}`);
    console.log(`   - ETH Amount: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.ethForLiquidity)}`);
    console.log(`   - Initial Price: 1 ETH = 50,000 SGT`);
    console.log("   ⚠️  Run manual liquidity addition on DEX interface");
  }

  // ========================================
  // 6. Protocol Initialization Checks
  // ========================================
  console.log("\n🔍 Step 6: Protocol Health Check");
  console.log("-----------------------------------");

  const totalSupply = await sgtToken.totalSupply();
  const deployerBalance = await sgtToken.balanceOf(deployer.address);
  const stakingBalance = await sgtToken.balanceOf(contracts.stakingRewards);
  const questBalance = await sgtToken.balanceOf(contracts.questSystem);
  const restakeBalance = await sgtToken.balanceOf(contracts.restakeHub);

  console.log("\n   Token Distribution:");
  console.log(`   Total Supply: ${hre.ethers.formatEther(totalSupply)} SGT`);
  console.log(`   Deployer: ${hre.ethers.formatEther(deployerBalance)} SGT`);
  console.log(`   Staking Rewards: ${hre.ethers.formatEther(stakingBalance)} SGT`);
  console.log(`   Quest System: ${hre.ethers.formatEther(questBalance)} SGT`);
  console.log(`   Restake Hub: ${hre.ethers.formatEther(restakeBalance)} SGT`);

  // ========================================
  // Save Liquidity Log
  // ========================================
  console.log("\n💾 Saving Liquidity Log");
  console.log("-----------------------------------");

  liquidityLog.summary = {
    totalDistributed: hre.ethers.formatEther(
      BOOTSTRAP_CONFIG.stakingRewardsPool +
      BOOTSTRAP_CONFIG.questRewardsPool +
      BOOTSTRAP_CONFIG.restakingRewardsPool +
      (BOOTSTRAP_CONFIG.daoTreasury ? BOOTSTRAP_CONFIG.daoTreasuryAmount : 0n)
    ) + " SGT",
    tokenDistribution: {
      deployer: hre.ethers.formatEther(deployerBalance) + " SGT",
      stakingRewards: hre.ethers.formatEther(stakingBalance) + " SGT",
      questSystem: hre.ethers.formatEther(questBalance) + " SGT",
      restakeHub: hre.ethers.formatEther(restakeBalance) + " SGT",
    },
  };

  const logPath = path.join(__dirname, '..', 'deployments', 'liquidity-log.json');
  fs.writeFileSync(logPath, JSON.stringify(liquidityLog, null, 2));
  console.log("   ✅ Liquidity log saved:", logPath);

  // ========================================
  // Summary
  // ========================================
  console.log("\n========================================");
  console.log("  ✅ LIQUIDITY BOOTSTRAP COMPLETE");
  console.log("========================================\n");

  console.log("📊 Bootstrap Summary:");
  console.log(`   Staking Rewards: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.stakingRewardsPool)} SGT`);
  console.log(`   Quest Rewards: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.questRewardsPool)} SGT`);
  console.log(`   Restaking Rewards: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.restakingRewardsPool)} SGT`);
  if (BOOTSTRAP_CONFIG.daoTreasury) {
    console.log(`   DAO Treasury: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.daoTreasuryAmount)} SGT`);
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Add DEX liquidity manually (if not automated)");
  console.log("2. Run post-launch activation: npm run postlaunch");
  console.log("3. Monitor protocol metrics");
  console.log("4. Enable governance proposals");

  console.log("\n💰 Protocol is funded and ready for users!\n");

  return liquidityLog;
}

main()
  .then(() => {
    console.log("✅ Bootstrap completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Bootstrap failed:");
    console.error(error);
    process.exit(1);
  });
