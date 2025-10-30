const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Minting from address:", deployer.address);

  const sgtAddress = "0x458beBB9b528De802341b6c689b7Db0f19a15625"; // your deployed SGT
const mintAmount = ethers.parseUnits("1000000", 18); // correct

  const sgtABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address) view returns (uint256)"
  ];

  const sgt = new ethers.Contract(sgtAddress, sgtABI, deployer);

  console.log(`Minting ${ethers.formatUnits(mintAmount, 18)} SGT...`);
  const tx = await sgt.mint(deployer.address, mintAmount);
  await tx.wait();

const balance = await sgt.balanceOf(deployer.address);
console.log(`✅ New SGT Balance: ${ethers.formatUnits(balance, 18)} SGT`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Minting failed:", err);
    process.exit(1);
  });
