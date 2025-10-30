const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTStaking", function () {
  let sgtToken;
  let genesisBadge;
  let nftStaking;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const ScrollGenToken = await ethers.getContractFactory("ScrollGenToken");
    sgtToken = await ScrollGenToken.deploy(1000000);
    await sgtToken.waitForDeployment();

    const GenesisBadge = await ethers.getContractFactory("GenesisBadge");
    genesisBadge = await GenesisBadge.deploy();
    await genesisBadge.waitForDeployment();

    const NFTStaking = await ethers.getContractFactory("NFTStaking");
    nftStaking = await NFTStaking.deploy(
      await sgtToken.getAddress(),
      await genesisBadge.getAddress()
    );
    await nftStaking.waitForDeployment();

    await genesisBadge.setMinter(await nftStaking.getAddress());
  });

  it("should deploy successfully", async function () {
    expect(await nftStaking.sgtToken()).to.equal(await sgtToken.getAddress());
    expect(await nftStaking.genesisBadge()).to.equal(await genesisBadge.getAddress());
  });

  it("should have correct tier requirements", async function () {
    const bronze = await nftStaking.getTierRequirements(0);
    expect(bronze.minAmount).to.equal(ethers.parseUnits("100", 18));
    expect(bronze.minDuration).to.equal(86400n); // 1 day

    const diamond = await nftStaking.getTierRequirements(4);
    expect(diamond.minAmount).to.equal(ethers.parseUnits("10000", 18));
    expect(diamond.minDuration).to.equal(86400n * 180n); // 180 days
  });

  it("should allow staking tokens", async function () {
    const amount = ethers.parseUnits("100", 18);

    await sgtToken.approve(await nftStaking.getAddress(), amount);
    await nftStaking.stake(amount);

    const stakeInfo = await nftStaking.getStakeInfo(owner.address);
    expect(stakeInfo.amount).to.equal(amount);
    expect(stakeInfo.claimed).to.equal(false);
  });

  it("should track total staked amount", async function () {
    const amount = ethers.parseUnits("100", 18);

    await sgtToken.approve(await nftStaking.getAddress(), amount);
    await nftStaking.stake(amount);

    expect(await nftStaking.totalStaked()).to.equal(amount);
  });
});
