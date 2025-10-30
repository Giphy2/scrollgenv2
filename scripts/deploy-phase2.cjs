const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying ScrollGen Phase 2 Contracts to Scroll Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const sgtTokenAddress = process.env.VITE_CONTRACT_ADDRESS;
  if (!sgtTokenAddress) {
    console.error("❌ Please set VITE_CONTRACT_ADDRESS in .env file (Phase 1 token)");
    process.exit(1);
  }

  console.log("📋 Phase 1 SGT Token:", sgtTokenAddress);
  console.log("\n" + "=".repeat(60) + "\n");

  console.log("1️⃣  Deploying GenesisBadge NFT...");
  const GenesisBadge = await ethers.getContractFactory("GenesisBadge");
  const genesisBadge = await GenesisBadge.deploy();
  await genesisBadge.waitForDeployment();
  const badgeAddress = await genesisBadge.getAddress();
  console.log("✅ GenesisBadge deployed:", badgeAddress);

  console.log("\n2️⃣  Deploying NFTStaking...");
  const NFTStaking = await ethers.getContractFactory("NFTStaking");
  const staking = await NFTStaking.deploy(sgtTokenAddress, badgeAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ NFTStaking deployed:", stakingAddress);

  console.log("\n3️⃣  Setting staking contract as minter...");
  const tx1 = await genesisBadge.setMinter(stakingAddress);
  await tx1.wait();
  console.log("✅ Minter set successfully");

  console.log("\n4️⃣  Setting default metadata URIs for tiers...");
  const defaultURIs = [
    "QmBronzeBadgeMetadataHash",
    "QmSilverBadgeMetadataHash",
    "QmGoldBadgeMetadataHash",
    "QmPlatinumBadgeMetadataHash",
    "QmDiamondBadgeMetadataHash"
  ];

  for (let i = 0; i < defaultURIs.length; i++) {
    const tx = await staking.setDefaultMetadataURI(i, defaultURIs[i]);
    await tx.wait();
    console.log(`✅ Set ${["Bronze", "Silver", "Gold", "Platinum", "Diamond"][i]} tier metadata`);
  }

  console.log("\n5️⃣  Deploying NFTMarketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(badgeAddress, sgtTokenAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ NFTMarketplace deployed:", marketplaceAddress);

  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 Phase 2 Core Deployment Complete!\n");

  console.log("📝 Contract Addresses:");
  console.log("─".repeat(60));
  console.log("GenesisBadge NFT:      ", badgeAddress);
  console.log("NFTStaking:            ", stakingAddress);
  console.log("NFTMarketplace:        ", marketplaceAddress);
  console.log("─".repeat(60));

  console.log("\n📋 Next Steps:");
  console.log("1. Update .env with these addresses:");
  console.log(`   VITE_GENESIS_BADGE_ADDRESS=${badgeAddress}`);
  console.log(`   VITE_NFT_STAKING_ADDRESS=${stakingAddress}`);
  console.log(`   VITE_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log("\n2. Update frontend/src/config-phase2.js");
  console.log("3. Verify contracts on Scroll Sepolia explorer:");
  console.log(`   https://sepolia.scrollscan.com/address/${badgeAddress}`);
  console.log(`   https://sepolia.scrollscan.com/address/${stakingAddress}`);
  console.log(`   https://sepolia.scrollscan.com/address/${marketplaceAddress}`);
  console.log("\n4. Upload NFT metadata to IPFS");
  console.log("5. Update metadata URIs in staking contract");
  console.log("6. Test staking and marketplace functionality\n");

  console.log("ℹ️  Note: Governance contracts (Timelock, Governor) will be deployed in Phase 2.1");
  console.log("   after OpenZeppelin v5 compatibility updates are complete.\n");

  return {
    genesisBadge: badgeAddress,
    staking: stakingAddress,
    marketplace: marketplaceAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
