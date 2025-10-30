const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying ScrollGenToken to Scroll Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const initialSupply = 1000000; // 1 million SGT tokens

  console.log("Deploying ScrollGenToken...");
  const Token = await ethers.getContractFactory("ScrollGenToken");
  const token = await Token.deploy(initialSupply);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("\n✅ ScrollGenToken deployed successfully!");
  console.log("📍 Contract address:", tokenAddress);
  console.log("💰 Initial supply:", initialSupply, "SGT");
  console.log("👤 Owner:", deployer.address);

  console.log("\n📝 Next steps:");
  console.log("1. Update .env file with: VITE_CONTRACT_ADDRESS=" + tokenAddress);
  console.log("2. Verify contract (optional): npx hardhat run scripts/verify.js --network scrollSepolia");
  console.log("3. Update frontend/src/config.js with the contract address");
  console.log("4. Test interactions: npx hardhat run scripts/interactions.js --network scrollSepolia");

  return tokenAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
