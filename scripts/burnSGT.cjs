const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function resolveSGTAddress() {
  // Priority: SGT_ADDRESS env var -> DEPLOY_LOG_PATH -> testnet/mainnet deploy logs
  if (process.env.SGT_ADDRESS) return process.env.SGT_ADDRESS;

  const deploymentDir = path.join(__dirname, '..', 'deployments');
  const envPath = process.env.DEPLOY_LOG_PATH;
  if (envPath) {
    const resolved = path.isAbsolute(envPath) ? envPath : path.join(deploymentDir, envPath);
    if (fs.existsSync(resolved)) {
      const dl = JSON.parse(fs.readFileSync(resolved, 'utf8'));
      if (dl?.contracts?.sgtToken) return dl.contracts.sgtToken;
    }
  }

  const testnet = path.join(deploymentDir, 'testnet-phase6-deploy-log.json');
  const mainnet = path.join(deploymentDir, 'mainnet-deploy-log.json');

  if (fs.existsSync(testnet)) {
    const dl = JSON.parse(fs.readFileSync(testnet, 'utf8'));
    if (dl?.contracts?.sgtToken) return dl.contracts.sgtToken;
  }
  if (fs.existsSync(mainnet)) {
    const dl = JSON.parse(fs.readFileSync(mainnet, 'utf8'));
    if (dl?.contracts?.sgtToken) return dl.contracts.sgtToken;
  }

  return null;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n🔥 Burn SGT script\n");
  console.log("Deployer:", deployer.address);

  const SGT_ADDRESS = await resolveSGTAddress();
  if (!SGT_ADDRESS) {
    console.error("❌ SGT token address not found. Set SGT_ADDRESS env var or provide a deploy log containing 'sgtToken'.");
    process.exit(1);
  }

  console.log("Using SGT token at:", SGT_ADDRESS);

  // Use the ScrollGenToken contract name from contracts/ScrollGenToken.sol
  // Create contract connected to provider, then connect signer to avoid provider.resolveName issues
  const SGT = await hre.ethers.getContractAt("ScrollGenToken", SGT_ADDRESS);

  // Amount to burn (whole tokens). Can be set via BURN_AMOUNT env var or defaults to 500000
  const amountToBurn = process.env.BURN_AMOUNT || "500000";

  console.log(`\n🔥 Burning ${amountToBurn} SGT from ${deployer.address}...`);

  try {
  // Connect the deployer signer before sending transaction
  const tx = await SGT.connect(deployer).burn(amountToBurn);
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log("✅ Burn confirmed on-chain!", receipt.transactionHash);

    const newBalance = await SGT.balanceOf(deployer.address);
    console.log(`💰 New balance: ${hre.ethers.formatEther(newBalance)} SGT`);
  } catch (err) {
    console.error("❌ Burn failed:", err);
    process.exit(1);
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
