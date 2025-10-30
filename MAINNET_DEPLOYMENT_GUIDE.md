# ScrollGen v2.0.1 - Mainnet Deployment Guide

## 🎯 Quick Start

Deploy ScrollGen to Scroll Mainnet in 5 steps:

```bash
# 1. Compile contracts
npm run compile

# 2. Deploy to mainnet
npm run deploy:phase6

# 3. Bootstrap liquidity
npm run bootstrap:liquidity

# 4. Activate ecosystem
npm run postlaunch

# 5. Deploy documentation
npm run build:docs
```

---

## ⚠️ Pre-Deployment Requirements

### 1. Environment Setup

Create/update `.env` file:

```bash
# Mainnet RPC
SCROLL_MAINNET_RPC="https://rpc.scroll.io"

# Deployer private key (KEEP SECURE!)
PRIVATE_KEY="your-deployer-private-key"

# DAO Treasury address (Multi-sig recommended)
DAO_TREASURY_ADDRESS="0x..."

# Etherscan API key for verification
ETHERSCAN_API_KEY="your-api-key"
```

### 2. Wallet Requirements

**Deployer Wallet:**
- Minimum balance: 0.5 ETH
- Recommended: 1 ETH for safety margin
- Hardware wallet recommended for mainnet

**DAO Treasury:**
- Gnosis Safe multi-sig (3/5 or 5/7)
- Team members as signers
- Timelock contract for critical operations

### 3. Network Configuration

Update `hardhat.config.cjs`:

```javascript
networks: {
  scrollMainnet: {
    url: process.env.SCROLL_MAINNET_RPC || "https://rpc.scroll.io",
    chainId: 534352,
    accounts: [process.env.PRIVATE_KEY],
    gasPrice: "auto",
  }
}
```

---

## 📋 Deployment Checklist

### Phase 1: Pre-Flight Checks

- [ ] All tests passing locally
- [ ] Contracts compile without errors
- [ ] Environment variables configured
- [ ] Deployer wallet funded (>0.5 ETH)
- [ ] DAO treasury address confirmed
- [ ] Team coordination complete
- [ ] Backup plan documented

### Phase 2: Contract Deployment

- [ ] Run: `npm run deploy:phase6`
- [ ] Verify all 16 contracts deployed
- [ ] Save deployment log
- [ ] Copy contract addresses
- [ ] Update .env with mainnet addresses
- [ ] Take deployment snapshot

### Phase 3: Contract Verification

- [ ] Verify ScrollGenToken on Scrollscan
- [ ] Verify GenesisBadge
- [ ] Verify all marketplace contracts
- [ ] Verify DeFi contracts
- [ ] Verify AI & zkID contracts
- [ ] Confirm all verified on explorer

### Phase 4: Liquidity Bootstrap

- [ ] Run: `npm run bootstrap:liquidity`
- [ ] Confirm DAO treasury funded
- [ ] Verify staking rewards funded
- [ ] Check quest rewards allocated
- [ ] Verify restaking hub funded
- [ ] Add DEX liquidity (manual)
- [ ] Save transaction hashes

### Phase 5: Ecosystem Activation

- [ ] Run: `npm run postlaunch`
- [ ] Confirm genesis NFTs airdropped
- [ ] Verify launch quest active
- [ ] Check AI pools registered
- [ ] Verify ScrollPower enabled
- [ ] Test all critical functions

### Phase 6: Documentation & Launch

- [ ] Deploy docs site: `npm run build:docs`
- [ ] Update README with mainnet addresses
- [ ] Publish announcement article
- [ ] Tweet launch announcement
- [ ] Post in Discord
- [ ] Update website
- [ ] Enable analytics tracking

---

## 🔍 Verification Commands

After deployment, verify each contract:

```bash
# ScrollGenToken
npx hardhat verify --network scrollMainnet <SGT_ADDRESS>

# GenesisBadge
npx hardhat verify --network scrollMainnet <BADGE_ADDRESS>

# NFTMarketplace
npx hardhat verify --network scrollMainnet <MARKETPLACE_ADDRESS> <BADGE_ADDRESS> <SGT_ADDRESS>

# Continue for all contracts...
```

---

## 🚨 Emergency Procedures

### If Deployment Fails

1. **Stop immediately** - Don't continue deployment
2. **Check error logs** - Identify the issue
3. **Verify network** - Confirm on correct network
4. **Check gas** - Ensure sufficient ETH
5. **Review state** - Check which contracts deployed
6. **Redeploy if needed** - Start from failed point

### Post-Deployment Issues

**Contract Bug Found:**
1. Pause affected contract (if pausable)
2. Notify community immediately
3. Prepare fix deployment
4. Test thoroughly on testnet
5. Deploy fix with migration path

**Oracle Failure:**
1. Switch to backup oracle
2. Investigate primary oracle
3. Update oracle address
4. Resume normal operations

**Security Incident:**
1. Activate emergency pause
2. Notify all stakeholders
3. Assess damage
4. Implement mitigation
5. Post-mortem analysis

---

## 📊 Monitoring Setup

### Block Explorers

**Scrollscan:** https://scrollscan.com
- Monitor contract interactions
- Track transaction volume
- Verify contract code
- View event logs

### Analytics Dashboards

**Dune Analytics:**
- Create custom dashboard
- Track TVL over time
- Monitor user growth
- Revenue analytics

**The Graph:**
- Deploy subgraph
- Index contract events
- Query protocol data
- Power frontend

### Alerts

**Discord Webhook:**
- Large transactions
- Error events
- Critical state changes
- Governance proposals

**Email Alerts:**
- Contract paused
- Low treasury balance
- Failed transactions
- Security incidents

---

## 🔐 Security Hardening

### Immediate Post-Launch (Week 1)

1. **Transfer Ownership**
```bash
# Transfer to multi-sig (3/5 Gnosis Safe)
contract.transferOwnership(GNOSIS_SAFE_ADDRESS);
```

2. **Deploy Timelock**
```bash
# 48-hour delay for critical operations
TimelockController.deploy(48 hours, proposers, executors);
```

3. **Enable Emergency Pause**
```bash
# Only for critical bugs
contract.pause(); // Multi-sig required
```

### Ongoing Security (Month 1+)

- Weekly security reviews
- Monitor all transactions
- Community bug reports
- External audit follow-up
- Bug bounty management

---

## 📈 Success Metrics

### Week 1 Targets

| Metric | Target | Status |
|--------|--------|--------|
| Contracts Deployed | 16 | ☐ |
| Verified on Explorer | 16 | ☐ |
| TVL | $100k+ | ☐ |
| Active Users | 100+ | ☐ |
| Zero Critical Bugs | ✓ | ☐ |

### Month 1 Targets

| Metric | Target | Status |
|--------|--------|--------|
| TVL | $1M+ | ☐ |
| Daily Active Users | 1,000+ | ☐ |
| NFTs Minted | 10,000+ | ☐ |
| Quests Completed | 5,000+ | ☐ |
| Governance Proposals | 10+ | ☐ |

---

## 🎉 Launch Announcement Template

### Twitter Thread

```
🚀 MAJOR ANNOUNCEMENT 🚀

ScrollGen v2.0 is LIVE on @Scroll_ZKP Mainnet!

The future of intelligent DeFi is here:
🤖 AI-powered yield optimization
🔄 Restaking infrastructure
🛡️ Zero-knowledge identity
🎮 Gamified quests & achievements

Thread 🧵👇

1/ What is ScrollGen?

ScrollGen is a comprehensive DeFi ecosystem built on Scroll, combining cutting-edge technology with user-friendly design.

Our mission: Make DeFi accessible, profitable, and fun for everyone.

2/ Core Features:

💰 SGT Token - Governance & utility
🎨 NFT Ecosystem - Trade, stake, collect
💎 DeFi Suite - Stake, lend, bridge
🤖 AI Copilot - Optimized yields
🛡️ zkID - Privacy-preserving reputation
🎮 Quests - Earn while you learn

3/ Why ScrollGen on Scroll?

✅ zkEVM security
✅ Low gas fees
✅ Fast finality
✅ Ethereum compatibility
✅ Growing ecosystem

Perfect for next-gen DeFi!

4/ Get Started:

1️⃣ Visit https://scrollgen.xyz
2️⃣ Connect wallet to Scroll
3️⃣ Complete first quest
4️⃣ Earn rewards immediately

Docs: https://docs.scrollgen.xyz

5/ Launch Incentives:

🎁 First 1,000 users get "Pioneer" badge
🎁 Early stakers earn bonus APY
🎁 Genesis NFT holders get 2x rewards
🎁 Quest completers earn $SGT

6/ Security First:

✅ Audited by [Auditor]
✅ Bug bounty: $100k
✅ Multi-sig governance
✅ Timelock controls
✅ Open source

Your funds are safe.

7/ Join the Community:

🌐 Website: https://scrollgen.xyz
📚 Docs: https://docs.scrollgen.xyz
💬 Discord: [link]
🐦 Twitter: @ScrollGenDeFi
💻 GitHub: [link]

LFG! 🚀🚀🚀

#ScrollGen #Scroll #DeFi #zkEVM
```

### Discord Announcement

```
@everyone

🎉 **SCROLLGEN V2.0 IS LIVE ON MAINNET!** 🎉

We're excited to announce that ScrollGen is now live on Scroll Mainnet!

**🔗 Links:**
• Website: https://scrollgen.xyz
• Documentation: https://docs.scrollgen.xyz
• Contract Addresses: [See pinned message]

**🎁 Launch Rewards:**
• First 1,000 users get "Pioneer" NFT badge
• 20% bonus APY for early stakers
• 1,000 $SGT for completing launch quest

**✅ What You Can Do Now:**
1. Connect wallet to Scroll Mainnet
2. Acquire $SGT tokens
3. Complete your zkID verification
4. Start your first quest
5. Stake for rewards

**🛡️ Security:**
• All contracts audited and verified
• Multi-sig governance active
• Bug bounty program live
• Emergency procedures in place

**📋 Contract Addresses:**
• SGT Token: `0x...`
• NFT Marketplace: `0x...`
• [See full list in #contract-addresses]

**Need Help?**
• Read docs: https://docs.scrollgen.xyz
• Ask in #support
• Open ticket: #create-ticket

Let's make history together! 🚀

— The ScrollGen Team
```

---

## 📞 Support & Resources

### Emergency Contacts

**Critical Issues:** security@scrollgen.xyz
**Technical Support:** support@scrollgen.xyz
**Team Lead:** [Lead contact]

### Community Channels

**Discord:** https://discord.gg/scrollgen (24/7 support)
**Telegram:** https://t.me/scrollgen (Community chat)
**Twitter:** @ScrollGenDeFi (Official updates)

### Developer Resources

**Documentation:** https://docs.scrollgen.xyz
**GitHub:** https://github.com/scrollgen/protocol
**Bug Reports:** GitHub Issues or security@scrollgen.xyz

---

## ✅ Final Pre-Launch Checklist

**T-minus 24 hours:**
- [ ] Final testnet deployment test
- [ ] All team members briefed
- [ ] Emergency contacts confirmed
- [ ] Monitoring systems active
- [ ] Announcement materials ready

**T-minus 1 hour:**
- [ ] Deployer wallet confirmed
- [ ] Network configuration verified
- [ ] Team on standby
- [ ] Communication channels ready

**Launch:**
- [ ] Execute deployment sequence
- [ ] Verify all contracts
- [ ] Bootstrap liquidity
- [ ] Activate ecosystem
- [ ] Publish announcements

**T-plus 1 hour:**
- [ ] Monitor all systems
- [ ] Respond to community
- [ ] Track metrics
- [ ] Address any issues

---

**ScrollGen v2.0.1 - Ready for Scroll Mainnet! 🚀**

*Good luck with the deployment!*
