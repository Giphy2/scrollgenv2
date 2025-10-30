const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const SGT_ADDRESS = process.env.SGT_ADDRESS || process.argv[2];
  if (!SGT_ADDRESS) {
    throw new Error("Please provide SGT token contract address via SGT_ADDRESS env or as argument");
  }

  const useMint = process.env.FAUCET_USE_MINT === "true" || false;

  const [deployer] = await ethers.getSigners();
  console.log("Deploying SGTFaucet with admin:", deployer.address);
  console.log("Using SGT token:", SGT_ADDRESS);
  console.log("useMint:", useMint);

  const Faucet = await ethers.getContractFactory("SGTFaucet");
  const faucet = await Faucet.deploy(SGT_ADDRESS, useMint);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();

  console.log("\n✅ SGTFaucet deployed!");
  console.log("Faucet address:", faucetAddress);
  console.log("\n📝 Next steps:");
  console.log("1. If using transfer, fund the faucet with SGT tokens.");
  console.log("2. Give the faucet minter role if using mint mode.");
  console.log("3. Use the claim() function from your Telegram bot!");
  return faucetAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
