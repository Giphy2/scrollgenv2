const { run } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Please set VITE_CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }

  console.log("🔍 Verifying ScrollGenToken on Scroll Sepolia...\n");
  console.log("Contract address:", contractAddress);

  const initialSupply = 1000000; // Must match deployment parameter

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [initialSupply],
    });

    console.log("\n✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
