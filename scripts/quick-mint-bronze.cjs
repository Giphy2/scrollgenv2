const { ethers } = require("hardhat");
const path = require("path");
const fs = require("fs");

const dotenv = require("dotenv");
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function main() {
  console.log("🎨 Quick Mint Bronze Badges for Marketplace Demo\n");
  console.log("⚡ This mints Bronze badges instantly (100 SGT, 1 day requirement)\n");

  const [signer] = await ethers.getSigners();
  console.log("Connected account:", signer.address);

  const addresses = {
    sgtToken: process.env.VITE_CONTRACT_ADDRESS,
    genesisBadge: process.env.VITE_GENESIS_BADGE_ADDRESS,
    staking: process.env.VITE_NFT_STAKING_ADDRESS,
  };

  const SGTToken = await ethers.getContractAt("ScrollGenToken", addresses.sgtToken);
  const NFTStaking = await ethers.getContractAt("NFTStaking", addresses.staking);
  const GenesisBadge = await ethers.getContractAt("GenesisBadge", addresses.genesisBadge);

  console.log("📊 Current Status:");
  const sgtBalance = await SGTToken.balanceOf(signer.address);
  console.log("Your SGT Balance:", ethers.formatUnits(sgtBalance, 18), "SGT");

  const badgeBalance = await GenesisBadge.balanceOf(signer.address);
  console.log("Your Current Badges:", badgeBalance.toString());

  const stakeInfo = await NFTStaking.getStakeInfo(signer.address);
  if (stakeInfo.amount > 0n) {
    console.log("\n⚠️  You have an active stake.");
    console.log("Staked amount:", ethers.formatUnits(stakeInfo.amount, 18), "SGT");

    const stakeAge = Date.now() / 1000 - Number(stakeInfo.startTime);
    const stakeAgeDays = stakeAge / 86400;
    console.log("Stake age:", stakeAgeDays.toFixed(2), "days");

    const canClaim = await NFTStaking.canClaimBadge(signer.address);
    if (canClaim.eligible && !stakeInfo.claimed) {
      console.log("\n✅ You're eligible to claim a badge!");
      const tierName = await GenesisBadge.getTierName(canClaim.tier);
      console.log("Tier:", tierName);

      console.log("\n📝 Claiming badge...");
      const claimTx = await NFTStaking.claimBadge();
      const receipt = await claimTx.wait();

      const badgeClaimedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'BadgeClaimed'
      );

      if (badgeClaimedEvent) {
        const tokenId = badgeClaimedEvent.args.tokenId;
        console.log(`✅ Badge claimed! Token ID: ${tokenId}`);
      }

      console.log("\n💡 You can now unstake your SGT and stake again for more badges.");
      console.log("Or list this badge on the marketplace!");
      return;
    } else if (stakeInfo.claimed) {
      console.log("\n⚠️  You already claimed a badge from this stake.");
      console.log("Unstake and stake again to mint more badges.");
      return;
    } else {
      console.log("\n⏳ Not eligible yet. Requirements:");
      console.log("   Bronze: 100 SGT for 1 day");
      console.log("   You need to wait", (86400 - stakeAge).toFixed(0), "more seconds");
      return;
    }
  }

  const howMany = parseInt(process.argv[2]) || 3;
  console.log(`\n🚀 Minting ${howMany} Bronze Badges...`);
  console.log("This will stake 100 SGT per badge (1 day requirement)\n");

  if (sgtBalance < ethers.parseUnits((100 * howMany).toString(), 18)) {
    console.error("❌ Insufficient SGT balance");
    console.error(`Need ${100 * howMany} SGT, have ${ethers.formatUnits(sgtBalance, 18)} SGT`);
    return;
  }

  for (let i = 0; i < howMany; i++) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎨 Minting Bronze Badge #${i + 1}/${howMany}`);
    console.log("=".repeat(60));

    const stakeAmount = ethers.parseUnits("100", 18);

    console.log("1️⃣  Approving 100 SGT...");
    const allowance = await SGTToken.allowance(signer.address, addresses.staking);
    if (allowance < stakeAmount) {
      const approveTx = await SGTToken.approve(addresses.staking, ethers.MaxUint256);
      await approveTx.wait();
      console.log("   ✅ Approved");
    } else {
      console.log("   ✅ Already approved");
    }

    console.log("2️⃣  Staking 100 SGT...");
    const stakeTx = await NFTStaking.stake(stakeAmount);
    await stakeTx.wait();
    console.log("   ✅ Staked");

    console.log("3️⃣  Waiting ~24 hours before claiming...");
    console.log("   ⏳ This is a live testnet - time manipulation not available");
    console.log("   💡 Check back in 24 hours to claim your badge!");
    console.log("   💡 Or use the UI 'Staking' tab to monitor progress");

    if (i < howMany - 1) {
      console.log("\n⚠️  Can't mint multiple badges immediately on live testnet");
      console.log("   Each badge requires 24 hour wait period");
      console.log("   Stopping after first stake...\n");
      break;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ STAKING COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n⏰ Come back in 24 hours to:");
  console.log("  1. Run this script again to claim your badge");
  console.log("  2. Or use the UI Staking tab");
  console.log("  3. Then list it on the marketplace!");
  console.log("\n💡 For instant testing, use a local Hardhat network instead.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
