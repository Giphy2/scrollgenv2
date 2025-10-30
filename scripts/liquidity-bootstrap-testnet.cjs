const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Read network from CLI or environment
const NETWORK = hre.network.name; // e.g., "scrollTestnet" or "scrollMainnet"
console.log(`\n🌐 Running liquidity bootstrap for network: ${NETWORK}\n`);

// Bootstrap configuration
const BOOTSTRAP_CONFIG = {
  // Initial liquidity amounts
  sgtForLiquidity: hre.ethers.parseEther("500000"),
  ethForLiquidity: hre.ethers.parseEther("10"),

  // DAO Treasury funding
  daoTreasuryAmount: hre.ethers.parseEther("2000000"),

  // Reward pool seeding
  stakingRewardsPool: hre.ethers.parseEther("1000000"),
  questRewardsPool: hre.ethers.parseEther("500000"),
  restakingRewardsPool: hre.ethers.parseEther("500000"),

  // Uniswap V2 Router (update per network)
  uniswapRouter: "0x0000000000000000000000000000000000000000",

  // DAO Treasury wallet
  daoTreasury: process.env.DAO_TREASURY_ADDRESS || "",
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔐 Bootstrapping with account:", deployer.address);

  // Determine deployment log path dynamically
  let deployLogPath;
  if (NETWORK.toLowerCase().includes("mainnet")) {
    deployLogPath = path.join(__dirname, "..", "deployments", "mainnet-deploy-log.json");
  } else {
    deployLogPath = path.join(__dirname, "..", "deployments", "testnet-phase6-deploy-log.json");
  }

  if (!fs.existsSync(deployLogPath)) {
    throw new Error(`❌ Deployment log not found: ${deployLogPath}. Run deploy-phase6 for this network first.`);
  }

  const deployLog = JSON.parse(fs.readFileSync(deployLogPath, "utf8"));
  const { contracts } = deployLog;

  console.log("\n📦 Loading Contracts");
  const sgtToken = await hre.ethers.getContractAt("ScrollGenToken", contracts.sgtToken);
  const stakingRewards = await hre.ethers.getContractAt("StakingRewards", contracts.stakingRewards);
  const restakeHub = await hre.ethers.getContractAt("RestakeHub", contracts.restakeHub);
  const questSystem = await hre.ethers.getContractAt("QuestSystem", contracts.questSystem);
  console.log("   ✅ Contracts loaded");

  const liquidityLog = { timestamp: new Date().toISOString(), network: NETWORK, transactions: [] };

  // 1. Fund DAO Treasury
  if (BOOTSTRAP_CONFIG.daoTreasury) {
    console.log(`\n💰 Funding DAO Treasury: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.daoTreasuryAmount)} SGT`);
    const tx1 = await sgtToken.transfer(BOOTSTRAP_CONFIG.daoTreasury, BOOTSTRAP_CONFIG.daoTreasuryAmount);
    const receipt1 = await tx1.wait();
    liquidityLog.transactions.push({ step: "DAO Treasury Funding", txHash: receipt1.hash });
    console.log("   ✅ DAO Treasury funded:", receipt1.hash);
  } else {
    console.log("\n⚠️ DAO Treasury address not set. Skipping...");
  }

  // 2. Seed Staking Rewards Pool
  console.log(`\n📈 Seeding Staking Rewards Pool: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.stakingRewardsPool)} SGT`);
  const tx2 = await sgtToken.transfer(contracts.stakingRewards, BOOTSTRAP_CONFIG.stakingRewardsPool);
  await tx2.wait();
  liquidityLog.transactions.push({ step: "Staking Rewards Pool", txHash: tx2.hash });

  const rewardRate = hre.ethers.parseEther("100"); // 100 SGT/block
  const tx2b = await stakingRewards.setRewardRate(rewardRate);
  await tx2b.wait();
  console.log("   ✅ Reward rate set to 100 SGT/block");

  // 3. Fund Quest Rewards
  console.log(`\n🎮 Funding Quest Rewards Pool: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.questRewardsPool)} SGT`);
  const tx3 = await sgtToken.transfer(contracts.questSystem, BOOTSTRAP_CONFIG.questRewardsPool);
  await tx3.wait();
  liquidityLog.transactions.push({ step: "Quest Rewards Pool", txHash: tx3.hash });

  // 4. Fund Restaking Hub
  console.log(`\n🔄 Funding Restaking Hub: ${hre.ethers.formatEther(BOOTSTRAP_CONFIG.restakingRewardsPool)} SGT`);
  const tx4 = await sgtToken.transfer(contracts.restakeHub, BOOTSTRAP_CONFIG.restakingRewardsPool);
  await tx4.wait();
  liquidityLog.transactions.push({ step: "Restaking Rewards Pool", txHash: tx4.hash });

  // 5. DEX Liquidity
  console.log("\n💧 DEX Liquidity Initialization");
  if (BOOTSTRAP_CONFIG.uniswapRouter === "0x0000000000000000000000000000000000000000") {
    console.log("   ⚠️ Manual liquidity steps required");
  }

  // 6. Protocol Health Check
  const totalSupply = await sgtToken.totalSupply();
  const deployerBalance = await sgtToken.balanceOf(deployer.address);
  console.log(`\n🔍 Protocol Health Check\n   Total Supply: ${hre.ethers.formatEther(totalSupply)} SGT\n   Deployer Balance: ${hre.ethers.formatEther(deployerBalance)} SGT`);

  // Save liquidity log
  const logFileName = NETWORK.toLowerCase().includes("mainnet") ? "liquidity-log.json" : "liquidity-log-testnet.json";
  const logPath = path.join(__dirname, "..", "deployments", logFileName);
  fs.writeFileSync(logPath, JSON.stringify(liquidityLog, null, 2));
  console.log("💾 Liquidity log saved:", logPath);

  console.log("\n✅ Liquidity Bootstrap Complete\n");
  return liquidityLog;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
