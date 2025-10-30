const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenesisBadge", function () {
  let genesisBadge;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const GenesisBadge = await ethers.getContractFactory("GenesisBadge");
    genesisBadge = await GenesisBadge.deploy();
    await genesisBadge.waitForDeployment();
  });

  it("should deploy successfully", async function () {
    expect(await genesisBadge.name()).to.equal("ScrollGen Genesis Badge");
    expect(await genesisBadge.symbol()).to.equal("GENESIS");
  });

  it("should have correct max supply", async function () {
    expect(await genesisBadge.MAX_SUPPLY()).to.equal(10000n);
  });

  it("should start with zero total supply", async function () {
    expect(await genesisBadge.totalSupply()).to.equal(0n);
  });

  it("should allow owner to set minter", async function () {
    await genesisBadge.setMinter(addr1.address);
    expect(await genesisBadge.minter()).to.equal(addr1.address);
  });

  it("should allow owner to mint badge", async function () {
    const tx = await genesisBadge.mint(addr1.address, 0, "QmTestHash");
    await tx.wait();

    expect(await genesisBadge.totalSupply()).to.equal(1n);
    expect(await genesisBadge.balanceOf(addr1.address)).to.equal(1n);
    expect(await genesisBadge.getTier(0)).to.equal(0n);
  });

  it("should get correct tier name", async function () {
    expect(await genesisBadge.getTierName(0)).to.equal("Bronze");
    expect(await genesisBadge.getTierName(1)).to.equal("Silver");
    expect(await genesisBadge.getTierName(2)).to.equal("Gold");
    expect(await genesisBadge.getTierName(3)).to.equal("Platinum");
    expect(await genesisBadge.getTierName(4)).to.equal("Diamond");
  });
});
