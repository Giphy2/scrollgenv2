const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔗 Interacting with ScrollGenToken...\n");

  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Please set VITE_CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  console.log("Connected account:", signer.address);

  const Token = await ethers.getContractFactory("ScrollGenToken");
  const token = Token.attach(contractAddress);

  console.log("\n📊 Token Information:");
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();

  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals.toString());
  console.log("Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);

  console.log("\n💰 Balance Check:");
  const balance = await token.balanceOf(signer.address);
  console.log("Your balance:", ethers.formatUnits(balance, decimals), symbol);

  // Example transfer (uncomment and modify to use)
  /*
  console.log("\n📤 Transferring tokens...");
  const recipientAddress = "0x..."; // Replace with actual address
  const amount = ethers.parseUnits("100", decimals);

  const tx = await token.transfer(recipientAddress, amount);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✅ Transfer complete!");

  const newBalance = await token.balanceOf(signer.address);
  console.log("New balance:", ethers.formatUnits(newBalance, decimals), symbol);
  */

  console.log("\n✅ Interaction complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });
