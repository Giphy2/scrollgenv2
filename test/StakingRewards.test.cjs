const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StakingRewards", function () {
  let stakingRewards;
  let stakingToken;
  let rewardToken;
  let owner;
  let user1;
  let user2;

  const INITIAL_REWARD_RATE = ethers.parseUnits("0.1", 18);
  const STAKE_AMOUNT = ethers.parseUnits("1000", 18);
  const MIN_STAKE = ethers.parseUnits("100", 18);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ScrollGenToken");
    stakingToken = await Token.deploy(1000000);
    await stakingToken.waitForDeployment();

    rewardToken = stakingToken;

    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await StakingRewards.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      INITIAL_REWARD_RATE
    );
    await stakingRewards.waitForDeployment();

    await stakingToken.transfer(user1.address, ethers.parseUnits("10000", 18));
    await stakingToken.transfer(user2.address, ethers.parseUnits("10000", 18));

    await stakingToken.connect(owner).transfer(
      await stakingRewards.getAddress(),
      ethers.parseUnits("100000", 18)
    );
  });

  describe("Deployment", function () {
    it("Should set the correct staking token", async function () {
      expect(await stakingRewards.stakingToken()).to.equal(await stakingToken.getAddress());
    });

    it("Should set the correct reward token", async function () {
      expect(await stakingRewards.rewardToken()).to.equal(await rewardToken.getAddress());
    });

    it("Should set the initial reward rate", async function () {
      expect(await stakingRewards.rewardRate()).to.equal(INITIAL_REWARD_RATE);
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);
      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 0, false);

      expect(await stakingRewards.totalStaked()).to.equal(STAKE_AMOUNT);
    });

    it("Should reject stakes below minimum", async function () {
      const lowAmount = ethers.parseUnits("50", 18);
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), lowAmount);

      await expect(
        stakingRewards.connect(user1).stake(lowAmount, 0, false)
      ).to.be.revertedWithCustomError(stakingRewards, "Error").or.to.be.reverted;
    });

    it("Should apply correct multiplier for lock duration", async function () {
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);
      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 90 * 24 * 60 * 60, false);

      const stakes = await stakingRewards.getUserStakes(user1.address);
      expect(Number(stakes[0].multiplier)).to.equal(20);
    });

    it("Should reject invalid lock durations", async function () {
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);

      await expect(
        stakingRewards.connect(user1).stake(STAKE_AMOUNT, 45 * 24 * 60 * 60, false)
      ).to.be.revertedWithCustomError(stakingRewards, "Error").or.to.be.reverted;
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);
      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 0, false);
    });

    it("Should allow unstaking after lock period", async function () {
      await stakingRewards.connect(user1).unstake(0);

      const stakes = await stakingRewards.getUserStakes(user1.address);
      expect(Number(stakes[0].amount)).to.equal(0);
    });

    it("Should prevent unstaking before lock period ends", async function () {
      await stakingToken.connect(user2).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);
      await stakingRewards.connect(user2).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60, false);

      await expect(
        stakingRewards.connect(user2).unstake(0)
      ).to.be.revertedWithCustomError(stakingRewards, "Error").or.to.be.reverted;
    });

    it("Should allow unstaking after lock period expires", async function () {
      await stakingToken.connect(user2).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);
      await stakingRewards.connect(user2).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60, false);

      await time.increase(31 * 24 * 60 * 60);

      await stakingRewards.connect(user2).unstake(0);
      const stakes = await stakingRewards.getUserStakes(user2.address);
      expect(Number(stakes[0].amount)).to.equal(0);
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);
      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 0, false);
    });

    it("Should calculate rewards over time", async function () {
      await time.increase(24 * 60 * 60);

      const earned = await stakingRewards.earned(user1.address);
      expect(earned).to.be.greaterThan(0n);
    });

    it("Should apply multiplier to rewards", async function () {
      await stakingToken.connect(user2).approve(await stakingRewards.getAddress(), STAKE_AMOUNT);
      await stakingRewards.connect(user2).stake(STAKE_AMOUNT, 365 * 24 * 60 * 60, false);

      await time.increase(24 * 60 * 60);

      const earned1 = await stakingRewards.calculateStakeReward(user1.address, 0);
      const earned2 = await stakingRewards.calculateStakeReward(user2.address, 0);

      expect(earned2).to.be.greaterThan(earned1);
    });

    it("Should allow claiming rewards", async function () {
      await time.increase(24 * 60 * 60);

      const balanceBefore = await rewardToken.balanceOf(user1.address);
      await stakingRewards.connect(user1).claimRewards();
      const balanceAfter = await rewardToken.balanceOf(user1.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update reward rate", async function () {
      const newRate = ethers.parseUnits("0.2", 18);
      await stakingRewards.setRewardRate(newRate);

      expect(await stakingRewards.rewardRate()).to.equal(newRate);
    });

    it("Should prevent non-owner from updating reward rate", async function () {
      const newRate = ethers.parseUnits("0.2", 18);

      await expect(
        stakingRewards.connect(user1).setRewardRate(newRate)
      ).to.be.revertedWithCustomError(stakingRewards, "OwnableUnauthorizedAccount");
    });
  });

  describe("Multiple Stakes", function () {
    it("Should allow multiple stakes from same user", async function () {
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), STAKE_AMOUNT * 2n);

      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 0, false);
      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 90 * 24 * 60 * 60, true);

      const stakes = await stakingRewards.getUserStakes(user1.address);
      expect(stakes.length).to.equal(2);
    });

    it("Should calculate total user staked correctly", async function () {
      await stakingToken.connect(user1).approve(await stakingRewards.getAddress(), STAKE_AMOUNT * 2n);

      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 0, false);
      await stakingRewards.connect(user1).stake(STAKE_AMOUNT, 0, false);

      const totalStaked = await stakingRewards.getUserTotalStaked(user1.address);
      expect(totalStaked).to.equal(STAKE_AMOUNT * 2n);
    });
  });
});
