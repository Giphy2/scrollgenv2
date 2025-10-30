const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function resolveSGTAddress() {
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
  console.log("\n🔎 Check SGT supply\n");
  const SGT_ADDRESS = await resolveSGTAddress();
  if (!SGT_ADDRESS) {
    console.error("❌ SGT token address not found. Set SGT_ADDRESS env var or provide a deploy log containing 'sgtToken'.");
    process.exit(1);
  }
  console.log("Using SGT token at:", SGT_ADDRESS);
  const SGT = await hre.ethers.getContractAt("ScrollGenToken", SGT_ADDRESS);
  const totalSupply = await SGT.totalSupply();
  const deployerBalance = await SGT.balanceOf(deployer.address);
  console.log(`Total Supply: ${hre.ethers.formatEther(totalSupply)} SGT`);
  console.log(`Deployer (${deployer.address}) balance: ${hre.ethers.formatEther(deployerBalance)} SGT`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
