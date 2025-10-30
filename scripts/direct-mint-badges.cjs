const { ethers } = require("hardhat");
const path = require("path");
const fs = require("fs");

const dotenv = require("dotenv");
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function main() {
  console.log("🎨 Direct Mint Genesis Badges (Owner Function)\n");

  const [signer] = await ethers.getSigners();
  console.log("Connected account:", signer.address);

  const genesisBadgeAddress = process.env.VITE_GENESIS_BADGE_ADDRESS;
  if (!genesisBadgeAddress) {
    console.error("❌ VITE_GENESIS_BADGE_ADDRESS not set in .env");
    process.exit(1);
  }

  const GenesisBadge = await ethers.getContractAt("GenesisBadge", genesisBadgeAddress);

  console.log("\n📊 Current Status:");
  console.log("=".repeat(60));

  const owner = await GenesisBadge.owner();
  console.log("Contract Owner:", owner);
  console.log("Your Address:  ", signer.address);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error("\n❌ You are not the owner of this contract!");
    console.error("Only the owner can mint badges directly.");
    console.error("\nAlternative: Use the staking method to earn badges.\n");
    process.exit(1);
  }

  const badgeBalance = await GenesisBadge.balanceOf(signer.address);
  const totalSupply = await GenesisBadge.totalSupply();
  console.log("Your Current Badges:", badgeBalance.toString());
  console.log("Total Minted:", totalSupply.toString(), "/ 10000");

  const tiers = [
    { name: "Bronze", id: 0, uri: "QmBronze" },
    { name: "Silver", id: 1, uri: "QmSilver" },
    { name: "Gold", id: 2, uri: "QmGold" },
    { name: "Platinum", id: 3, uri: "QmPlatinum" },
    { name: "Diamond", id: 4, uri: "QmDiamond" },
  ];

  const howMany = parseInt(process.argv[2]) || 5;
  console.log(`\n🚀 Minting ${howMany} Genesis Badges (one of each tier)...\n`);

  const badgesMinted = [];

  for (let i = 0; i < Math.min(howMany, tiers.length); i++) {
    const tier = tiers[i];

    console.log(`${"=".repeat(60)}`);
    console.log(`🎨 Minting ${tier.name} Badge (Tier ${tier.id})`);
    console.log("=".repeat(60));

    try {
      console.log("📝 Calling mint function...");
      const tx = await GenesisBadge.mint(
        signer.address,
        tier.id,
        tier.uri
      );

      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();

      const mintEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'BadgeMinted'
      );

      if (mintEvent) {
        const tokenId = mintEvent.args.tokenId;
        console.log(`✅ ${tier.name} Badge Minted! Token ID: ${tokenId}`);
        badgesMinted.push({ tier: tier.name, tokenId: tokenId.toString() });
      } else {
        console.log(`✅ ${tier.name} Badge Minted!`);
        badgesMinted.push({ tier: tier.name, tokenId: "Unknown" });
      }

      console.log("");
    } catch (error) {
      console.error(`❌ Failed to mint ${tier.name} badge:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 MINTING COMPLETE!");
  console.log("=".repeat(60));

  const finalBalance = await GenesisBadge.balanceOf(signer.address);
  console.log("\nTotal Badges Owned:", finalBalance.toString());

  if (badgesMinted.length > 0) {
    console.log("\n🏆 Badges Minted:");
    badgesMinted.forEach(badge => {
      console.log(`  • ${badge.tier} Badge (Token #${badge.tokenId})`);
    });
  }

  if (finalBalance > 0n) {
    console.log("\n📍 Your Badge Token IDs:");
    const tokens = await GenesisBadge.tokensOfOwner(signer.address);
    for (const tokenId of tokens) {
      const tier = await GenesisBadge.getTier(tokenId);
      const tierName = await GenesisBadge.getTierName(tier);
      console.log(`  Token #${tokenId}: ${tierName} Badge`);
    }
  }

  console.log("\n💡 Next Steps:");
  console.log("  1. Run: npm run dev");
  console.log("  2. Navigate to 'Marketplace' tab");
  console.log("  3. Go to 'My NFTs' view");
  console.log("  4. List badges for sale:");
  console.log("     • Bronze: 50-100 SGT");
  console.log("     • Silver: 150-250 SGT");
  console.log("     • Gold: 300-500 SGT");
  console.log("     • Platinum: 800-1500 SGT");
  console.log("     • Diamond: 2000-5000 SGT");
  console.log("  5. View your listings in 'Browse Marketplace'!");
  console.log("\n✅ Marketplace ready to showcase!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Minting failed:", error);
    process.exit(1);
  });
