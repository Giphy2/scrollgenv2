const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  let sgtToken;
  let genesisBadge;
  let marketplace;
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

    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy(
      await genesisBadge.getAddress(),
      await sgtToken.getAddress()
    );
    await marketplace.waitForDeployment();
  });

  it("should deploy successfully", async function () {
    expect(await marketplace.genesisBadge()).to.equal(await genesisBadge.getAddress());
    expect(await marketplace.sgtToken()).to.equal(await sgtToken.getAddress());
  });

  it("should have correct initial fee", async function () {
    expect(await marketplace.marketplaceFee()).to.equal(250n); // 2.5%
  });

  it("should calculate fees correctly", async function () {
    const price = ethers.parseUnits("1000", 18);
    const fee = await marketplace.calculateFee(price);
    const expectedFee = ethers.parseUnits("25", 18); // 2.5% of 1000
    expect(fee).to.equal(expectedFee);
  });

  it("should allow owner to update fee", async function () {
    await marketplace.setMarketplaceFee(500); // 5%
    expect(await marketplace.marketplaceFee()).to.equal(500n);
  });

  it("should not allow fee higher than 10%", async function () {
    try {
      await marketplace.setMarketplaceFee(1001);
      expect.fail("Should have reverted");
    } catch (error) {
      expect(error.message).to.include("Fee too high");
    }
  });

  it("should start with zero fees collected", async function () {
    expect(await marketplace.feesCollected()).to.equal(0n);
  });
});
