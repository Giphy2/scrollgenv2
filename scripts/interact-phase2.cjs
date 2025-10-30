const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔗 Interacting with ScrollGen Phase 2 Contracts...\n");

  const [signer] = await ethers.getSigners();
  console.log("Connected account:", signer.address);

  const addresses = {
    genesisBadge: process.env.VITE_GENESIS_BADGE_ADDRESS,
    staking: process.env.VITE_NFT_STAKING_ADDRESS,
    marketplace: process.env.VITE_MARKETPLACE_ADDRESS,
    votesToken: process.env.VITE_VOTES_TOKEN_ADDRESS,
    governor: process.env.VITE_GOVERNOR_ADDRESS,
  };

  for (const [name, address] of Object.entries(addresses)) {
    if (!address) {
      console.error(`❌ ${name} address not set in .env`);
      process.exit(1);
    }
  }

  const GenesisBadge = await ethers.getContractAt("GenesisBadge", addresses.genesisBadge);
  const NFTStaking = await ethers.getContractAt("NFTStaking", addresses.staking);
  const NFTMarketplace = await ethers.getContractAt("NFTMarketplace", addresses.marketplace);
  const ScrollGenVotesToken = await ethers.getContractAt("ScrollGenVotesToken", addresses.votesToken);
  const GenesisGovernor = await ethers.getContractAt("GenesisGovernor", addresses.governor);

  console.log("\n" + "=".repeat(60));
  console.log("📊 GENESIS BADGE NFT STATUS");
  console.log("=".repeat(60));

  const totalSupply = await GenesisBadge.totalSupply();
  const maxSupply = await GenesisBadge.MAX_SUPPLY();
  console.log("Total Minted:", totalSupply.toString(), "/", maxSupply.toString());

  const badgeBalance = await GenesisBadge.balanceOf(signer.address);
  console.log("Your Badges:", badgeBalance.toString());

  if (badgeBalance > 0n) {
    const tokens = await GenesisBadge.tokensOfOwner(signer.address);
    console.log("\nYour Badge Token IDs:");
    for (const tokenId of tokens) {
      const tier = await GenesisBadge.getTier(tokenId);
      const tierName = await GenesisBadge.getTierName(tier);
      const uri = await GenesisBadge.tokenURI(tokenId);
      console.log(`  Token #${tokenId}: ${tierName} Tier (URI: ${uri})`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎯 STAKING STATUS");
  console.log("=".repeat(60));

  const stakeInfo = await NFTStaking.getStakeInfo(signer.address);
  console.log("Staked Amount:", ethers.formatUnits(stakeInfo.amount, 18), "SGT");

  if (stakeInfo.amount > 0n) {
    console.log("Staking Duration:", (stakeInfo.duration / 86400n).toString(), "days");
    console.log("Badge Claimed:", stakeInfo.claimed);

    const canClaim = await NFTStaking.canClaimBadge(signer.address);
    if (canClaim.eligible) {
      const tierName = await GenesisBadge.getTierName(canClaim.tier);
      console.log("✅ Eligible for:", tierName, "Badge");
    } else {
      console.log("❌ Not eligible for badge yet");
    }

    console.log("\nTier Requirements:");
    for (let i = 0; i < 5; i++) {
      const req = await NFTStaking.getTierRequirements(i);
      const tierName = await GenesisBadge.getTierName(i);
      console.log(`  ${tierName}: ${ethers.formatUnits(req.minAmount, 18)} SGT for ${req.minDuration / 86400n} days`);
    }
  } else {
    console.log("No active stake");
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏪 MARKETPLACE STATUS");
  console.log("=".repeat(60));

  const marketplaceFee = await NFTMarketplace.marketplaceFee();
  console.log("Marketplace Fee:", (Number(marketplaceFee) / 100).toFixed(2), "%");

  const feesCollected = await NFTMarketplace.feesCollected();
  console.log("Fees Collected:", ethers.formatUnits(feesCollected, 18), "SGT");

  const myListings = await NFTMarketplace.getSellerListings(signer.address);
  console.log("Your Active Listings:", myListings.length);

  if (myListings.length > 0) {
    console.log("\nYour Listings:");
    for (const tokenId of myListings) {
      const listing = await NFTMarketplace.getListing(tokenId);
      console.log(`  Token #${tokenId}: ${ethers.formatUnits(listing.price, 18)} SGT`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏛️  GOVERNANCE STATUS");
  console.log("=".repeat(60));

  const votesBalance = await ScrollGenVotesToken.balanceOf(signer.address);
  console.log("Your SGT Balance:", ethers.formatUnits(votesBalance, 18), "SGT");

  const votingPower = await ScrollGenVotesToken.getVotes(signer.address);
  console.log("Your Voting Power:", ethers.formatUnits(votingPower, 18), "votes");

  const totalSupplyVotes = await ScrollGenVotesToken.totalSupply();
  console.log("Total Token Supply:", ethers.formatUnits(totalSupplyVotes, 18), "SGT");

  const proposalThreshold = await GenesisGovernor.proposalThreshold();
  console.log("Proposal Threshold:", ethers.formatUnits(proposalThreshold, 18), "SGT");

  const votingDelay = await GenesisGovernor.votingDelay();
  const votingPeriod = await GenesisGovernor.votingPeriod();
  console.log("Voting Delay:", votingDelay.toString(), "blocks");
  console.log("Voting Period:", votingPeriod.toString(), "blocks (~7 days)");

  const quorum = await GenesisGovernor.quorum(await ethers.provider.getBlockNumber() - 1);
  console.log("Quorum Required:", ethers.formatUnits(quorum, 18), "votes (4%)");

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Phase 2 Status Check Complete!");
  console.log("\n📋 Available Actions:");
  console.log("  • Stake SGT tokens to earn badges");
  console.log("  • Claim badge when eligible");
  console.log("  • List badges on marketplace");
  console.log("  • Buy badges from marketplace");
  console.log("  • Delegate voting power");
  console.log("  • Create governance proposals");
  console.log("  • Vote on active proposals\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });
