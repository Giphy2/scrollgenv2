const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LendingProtocol", function () {
  let lendingProtocol;
  let collateralToken;
  let borrowAsset;
  let owner;
  let user1;
  let user2;

  const SUPPLY_AMOUNT = ethers.parseUnits("1000", 18);
  const BORROW_AMOUNT = ethers.parseUnits("500", 18);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ScrollGenToken");
    collateralToken = await Token.deploy(1000000);
    await collateralToken.waitForDeployment();

    borrowAsset = await Token.deploy(1000000);
    await borrowAsset.waitForDeployment();

    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    lendingProtocol = await LendingProtocol.deploy(await collateralToken.getAddress());
    await lendingProtocol.waitForDeployment();

    await lendingProtocol.addSupportedAsset(await borrowAsset.getAddress());

    await collateralToken.transfer(user1.address, ethers.parseUnits("10000", 18));
    await collateralToken.transfer(user2.address, ethers.parseUnits("10000", 18));

    await borrowAsset.transfer(await lendingProtocol.getAddress(), ethers.parseUnits("100000", 18));
  });

  describe("Deployment", function () {
    it("Should set the correct collateral token", async function () {
      expect(await lendingProtocol.collateralToken()).to.equal(await collateralToken.getAddress());
    });

    it("Should add supported assets", async function () {
      expect(await lendingProtocol.supportedAssets(await borrowAsset.getAddress())).to.be.true;
    });
  });

  describe("Supply", function () {
    it("Should allow users to supply collateral", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).supply(SUPPLY_AMOUNT);

      const supply = await lendingProtocol.supplies(user1.address);
      expect(supply.amount).to.equal(SUPPLY_AMOUNT);
    });

    it("Should update total supplied", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).supply(SUPPLY_AMOUNT);

      expect(await lendingProtocol.totalSupplied()).to.equal(SUPPLY_AMOUNT);
    });

    it("Should reject zero amount supply", async function () {
      await expect(
        lendingProtocol.connect(user1).supply(0)
      ).to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).supply(SUPPLY_AMOUNT);
    });

    it("Should allow users to withdraw supplied collateral", async function () {
      await lendingProtocol.connect(user1).withdraw(SUPPLY_AMOUNT);

      const supply = await lendingProtocol.supplies(user1.address);
      expect(supply.amount).to.equal(0);
    });

    it("Should reject withdrawal of more than supplied", async function () {
      await expect(
        lendingProtocol.connect(user1).withdraw(SUPPLY_AMOUNT * 2n)
      ).to.be.revertedWith("Insufficient supply");
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).supply(SUPPLY_AMOUNT);
    });

    it("Should allow users to borrow against collateral", async function () {
      await lendingProtocol.connect(user1).borrow(await borrowAsset.getAddress(), BORROW_AMOUNT);

      const borrows = await lendingProtocol.getUserBorrows(user1.address);
      expect(borrows.length).to.equal(1);
      expect(Number(borrows[0].borrowed)).to.be.greaterThan(0);
    });

    it("Should respect LTV ratio", async function () {
      const maxBorrow = (SUPPLY_AMOUNT * 66n) / 100n;

      await expect(
        lendingProtocol.connect(user1).borrow(await borrowAsset.getAddress(), maxBorrow + 1n)
      ).to.be.revertedWith("Exceeds borrow capacity");
    });

    it("Should reject borrowing unsupported assets", async function () {
      const unsupportedAsset = ethers.Wallet.createRandom().address;

      await expect(
        lendingProtocol.connect(user1).borrow(unsupportedAsset, BORROW_AMOUNT)
      ).to.be.revertedWith("Asset not supported");
    });

    it("Should reject borrowing without collateral", async function () {
      await expect(
        lendingProtocol.connect(user2).borrow(await borrowAsset.getAddress(), BORROW_AMOUNT)
      ).to.be.revertedWith("No collateral supplied");
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).supply(SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).borrow(await borrowAsset.getAddress(), BORROW_AMOUNT);
    });

    it("Should allow users to repay borrowed amount", async function () {
      await borrowAsset.connect(user1).approve(await lendingProtocol.getAddress(), BORROW_AMOUNT);
      await lendingProtocol.connect(user1).repay(0, BORROW_AMOUNT);

      const borrows = await lendingProtocol.getUserBorrows(user1.address);
      expect(borrows[0].borrowed).to.equal(0);
    });

    it("Should reject repayment of invalid borrow", async function () {
      await expect(
        lendingProtocol.connect(user1).repay(999, BORROW_AMOUNT)
      ).to.be.revertedWith("Invalid borrow index");
    });
  });

  describe("Health Factor", function () {
    beforeEach(async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).supply(SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).borrow(await borrowAsset.getAddress(), BORROW_AMOUNT);
    });

    it("Should calculate health factor correctly", async function () {
      const healthFactor = await lendingProtocol.calculateHealthFactor(user1.address, 0);
      expect(healthFactor).to.be.gt(100);
    });

    it("Should indicate healthy position", async function () {
      const healthFactor = await lendingProtocol.calculateHealthFactor(user1.address, 0);
      expect(healthFactor).to.be.gte(100);
    });
  });

  describe("Interest Rates", function () {
    it("Should calculate utilization rate", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), SUPPLY_AMOUNT);
      await lendingProtocol.connect(user1).supply(SUPPLY_AMOUNT);

      const utilizationBefore = await lendingProtocol.utilizationRate();
      expect(Number(utilizationBefore)).to.equal(0);

      await lendingProtocol.connect(user1).borrow(await borrowAsset.getAddress(), BORROW_AMOUNT);

      const utilizationAfter = await lendingProtocol.utilizationRate();
      expect(utilizationAfter).to.be.greaterThan(0n);
    });

    it("Should calculate borrow APY", async function () {
      const apy = await lendingProtocol.borrowAPY();
      expect(apy).to.be.greaterThanOrEqual(0n);
    });

    it("Should calculate supply APY", async function () {
      const apy = await lendingProtocol.supplyAPY();
      expect(apy).to.be.greaterThanOrEqual(0n);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to add supported assets", async function () {
      const newAsset = ethers.Wallet.createRandom().address;
      await lendingProtocol.addSupportedAsset(newAsset);

      expect(await lendingProtocol.supportedAssets(newAsset)).to.be.true;
    });

    it("Should prevent non-owner from adding assets", async function () {
      const newAsset = ethers.Wallet.createRandom().address;

      await expect(
        lendingProtocol.connect(user1).addSupportedAsset(newAsset)
      ).to.be.revertedWithCustomError(lendingProtocol, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to remove supported assets", async function () {
      await lendingProtocol.removeSupportedAsset(await borrowAsset.getAddress());

      expect(await lendingProtocol.supportedAssets(await borrowAsset.getAddress())).to.be.false;
    });
  });
});
