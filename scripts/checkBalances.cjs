// checkBalances.cjs
const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const deployer = "0x15fAb9050d9Debc6F4675C0cC203d48E6f4D9b15"; // replace with your deployer

  // 1️⃣ Check ETH balance
  const ethBalance = await ethers.provider.getBalance(deployer);
  // ethers in this project uses the v6-style helpers attached to hre.ethers
  console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  // 2️⃣ Check SGT token balance
  const sgtAddress = "0x458beBB9b528De802341b6c689b7Db0f19a15625"; // your SGT token address
  const sgtABI = [
    "function balanceOf(address owner) view returns (uint256)"
  ];
  const sgtContract = new ethers.Contract(sgtAddress, sgtABI, ethers.provider);
  const sgtBalance = await sgtContract.balanceOf(deployer);
  console.log(`✅ New SGT Balance: ${ethers.formatUnits(sgtBalance, 18)} SGT`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
