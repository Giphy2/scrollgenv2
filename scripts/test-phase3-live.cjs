const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 Testing Phase 3 Contracts on Scroll Sepolia...\n");

  const [user] = await ethers.getSigners();
  console.log("Testing with account:", user.address);

  const balance = await ethers.provider.getBalance(user.address);
  console.log("ETH Balance:", ethers.formatEther(balance), "ETH\n");

  const sgtAddress = process.env.VITE_CONTRACT_ADDRESS;
  const stakingAddress = process.env.VITE_STAKING_REWARDS_ADDRESS;
  const lendingAddress = process.env.VITE_LENDING_PROTOCOL_ADDRESS;
  const bridgeAddress = process.env.VITE_BRIDGE_CONNECTOR_ADDRESS;

  console.log("📋 Contract Addresses:");
  console.log("SGT Token:", sgtAddress);
  console.log("StakingRewards:", stakingAddress);
  console.log("LendingProtocol:", lendingAddress);
  console.log("BridgeConnector:", bridgeAddress);
  console.log("\n" + "=".repeat(60) + "\n");

  const sgtToken = await ethers.getContractAt("ScrollGenToken", sgtAddress);
  const stakingRewards = await ethers.getContractAt("StakingRewards", stakingAddress);
  const lendingProtocol = await ethers.getContractAt("LendingProtocol", lendingAddress);
  const bridgeConnector = await ethers.getContractAt("BridgeConnector", bridgeAddress);

  console.log("💰 1. TESTING STAKING\n");

  const sgtBalance = await sgtToken.balanceOf(user.address);
  console.log("Your SGT Balance:", ethers.formatUnits(sgtBalance, 18), "SGT");

  const totalStaked = await stakingRewards.totalStaked();
  console.log("Total Staked:", ethers.formatUnits(totalStaked, 18), "SGT");

  const rewardRate = await stakingRewards.rewardRate();
  console.log("Reward Rate:", ethers.formatUnits(rewardRate, 18), "SGT per block");

  console.log("\n📝 Staking 1000 SGT for 90 days...");
  const stakeAmount = ethers.parseUnits("1000", 18);
  const lockDuration = 90 * 24 * 60 * 60;

  try {
    const approveTx = await sgtToken.approve(stakingAddress, stakeAmount);
    console.log("Approving... TX:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ Approved");

    const stakeTx = await stakingRewards.stake(stakeAmount, lockDuration, false);
    console.log("Staking... TX:", stakeTx.hash);
    await stakeTx.wait();
    console.log("✅ Staked successfully!");

    const userStakes = await stakingRewards.getUserStakes(user.address);
    console.log("Your stakes count:", userStakes.length);
    if (userStakes.length > 0) {
      console.log("Latest stake amount:", ethers.formatUnits(userStakes[userStakes.length - 1].amount, 18), "SGT");
      console.log("Multiplier:", Number(userStakes[userStakes.length - 1].multiplier) / 10 + "x");
    }
  } catch (error) {
    console.log("❌ Staking error:", error.message);
  }

  console.log("\n" + "=".repeat(60) + "\n");

  console.log("🏦 2. TESTING LENDING\n");

  const totalSupplied = await lendingProtocol.totalSupplied();
  console.log("Total Supplied:", ethers.formatUnits(totalSupplied, 18), "SGT");

  const supplyAPY = await lendingProtocol.supplyAPY();
  console.log("Supply APY:", Number(supplyAPY) / 1e16 + "%");

  const borrowAPY = await lendingProtocol.borrowAPY();
  console.log("Borrow APY:", Number(borrowAPY) / 1e16 + "%");

  console.log("\n📝 Supplying 500 SGT...");
  const supplyAmount = ethers.parseUnits("500", 18);

  try {
    const approveTx = await sgtToken.approve(lendingAddress, supplyAmount);
    console.log("Approving... TX:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ Approved");

    const supplyTx = await lendingProtocol.supply(supplyAmount);
    console.log("Supplying... TX:", supplyTx.hash);
    await supplyTx.wait();
    console.log("✅ Supplied successfully!");

    const supply = await lendingProtocol.supplies(user.address);
    console.log("Your supplied amount:", ethers.formatUnits(supply.amount, 18), "SGT");
  } catch (error) {
    console.log("❌ Lending error:", error.message);
  }

  console.log("\n" + "=".repeat(60) + "\n");

  console.log("🌉 3. TESTING BRIDGE\n");

  const userTxs = await bridgeConnector.getUserTransactions(user.address);
  console.log("Your bridge transactions:", userTxs.length);

  console.log("\n📝 Initiating test deposit...");
  const depositAmount = ethers.parseUnits("0.1", 18);
  const testTxHash = ethers.id("test-tx-" + Date.now());

  try {
    const depositTx = await bridgeConnector.initiateDeposit(
      depositAmount,
      sgtAddress,
      testTxHash,
      { value: 0 }
    );
    console.log("Initiating deposit... TX:", depositTx.hash);
    await depositTx.wait();
    console.log("✅ Deposit initiated!");

    const txStatus = await bridgeConnector.getTransactionStatus(testTxHash);
    console.log("Transaction status:", Number(txStatus));
  } catch (error) {
    console.log("❌ Bridge error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Phase 3 Testing Complete!\n");

  console.log("🔗 View your transactions on Scroll Sepolia:");
  console.log("https://sepolia.scrollscan.com/address/" + user.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
