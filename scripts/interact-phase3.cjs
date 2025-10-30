const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔧 Interacting with Phase 3 Contracts...\n");

  const [user] = await ethers.getSigners();
  console.log("User address:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("User balance:", ethers.formatEther(balance), "ETH\n");

  const sgtAddress = process.env.VITE_CONTRACT_ADDRESS;
  const stakingAddress = process.env.VITE_STAKING_REWARDS_ADDRESS;
  const lendingAddress = process.env.VITE_LENDING_PROTOCOL_ADDRESS;
  const bridgeAddress = process.env.VITE_BRIDGE_CONNECTOR_ADDRESS;

  if (!sgtAddress || !stakingAddress || !lendingAddress || !bridgeAddress) {
    console.error("❌ Please set all Phase 3 contract addresses in .env");
    process.exit(1);
  }

  const sgtToken = await ethers.getContractAt("ScrollGenToken", sgtAddress);
  const staking = await ethers.getContractAt("StakingRewards", stakingAddress);
  const lending = await ethers.getContractAt("LendingProtocol", lendingAddress);
  const bridge = await ethers.getContractAt("BridgeConnector", bridgeAddress);

  console.log("=".repeat(60));
  console.log("\n📊 Contract Balances & Stats\n");

  const sgtBalance = await sgtToken.balanceOf(user.address);
  console.log("Your SGT Balance:", ethers.formatUnits(sgtBalance, 18), "SGT");

  const totalStaked = await staking.totalStaked();
  console.log("Total Staked:", ethers.formatUnits(totalStaked, 18), "SGT");

  const totalSupplied = await lending.totalSupplied();
  console.log("Total Supplied:", ethers.formatUnits(totalSupplied, 18), "SGT");

  const rewardRate = await staking.rewardRate();
  console.log("Staking Reward Rate:", ethers.formatUnits(rewardRate, 18), "per block");

  console.log("\n" + "=".repeat(60));
  console.log("\n🎯 Available Operations:\n");

  console.log("1. STAKING");
  console.log("   - stake(amount, lockDuration, autoCompound)");
  console.log("   - unstake(stakeIndex)");
  console.log("   - claimRewards()");
  console.log("   - compound(stakeIndex)");

  console.log("\n2. LENDING");
  console.log("   - supply(amount)");
  console.log("   - withdraw(amount)");
  console.log("   - borrow(asset, amount)");
  console.log("   - repay(borrowIndex, amount)");

  console.log("\n3. BRIDGE");
  console.log("   - initiateDeposit(amount, token, l1TxHash)");
  console.log("   - initiateWithdrawal(amount, token, l2TxHash)");
  console.log("   - claimWithdrawal(txHash)");

  console.log("\n" + "=".repeat(60));
  console.log("\n📝 Example Interactions:\n");

  console.log("// Stake 1000 SGT for 90 days with auto-compound");
  console.log("const amount = ethers.parseUnits('1000', 18);");
  console.log("await sgtToken.approve(stakingAddress, amount);");
  console.log("await staking.stake(amount, 90 * 24 * 60 * 60, true);");

  console.log("\n// Supply 500 SGT to lending");
  console.log("const supplyAmount = ethers.parseUnits('500', 18);");
  console.log("await sgtToken.approve(lendingAddress, supplyAmount);");
  console.log("await lending.supply(supplyAmount);");

  console.log("\n// Borrow 0.1 ETH against collateral");
  console.log("const borrowAmount = ethers.parseUnits('0.1', 18);");
  console.log("await lending.borrow(wethAddress, borrowAmount);");

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Interaction script complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
