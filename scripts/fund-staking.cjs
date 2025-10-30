const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("💰 Funding StakingRewards with reward tokens...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  const sgtAddress = process.env.VITE_CONTRACT_ADDRESS;
  const stakingAddress = process.env.VITE_STAKING_REWARDS_ADDRESS;

  const sgtToken = await ethers.getContractAt("ScrollGenToken", sgtAddress);
  const stakingRewards = await ethers.getContractAt("StakingRewards", stakingAddress);

  const fundAmount = ethers.parseUnits("100000", 18);
  console.log(`Transferring ${ethers.formatUnits(fundAmount, 18)} SGT to StakingRewards...`);

  const tx = await sgtToken.transfer(stakingAddress, fundAmount);
  await tx.wait();

  const balance = await sgtToken.balanceOf(stakingAddress);
  console.log(`✅ StakingRewards balance: ${ethers.formatUnits(balance, 18)} SGT\n`);

  const rewardRate = await stakingRewards.rewardRate();
  console.log(`Reward Rate: ${ethers.formatUnits(rewardRate, 18)} SGT per block`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
