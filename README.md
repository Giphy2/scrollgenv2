# 🌀 ScrollGen

> **Modular zkEVM-native protocol built on Scroll network**

ScrollGen is a phased decentralized ecosystem that evolves from a simple ERC-20 token to a comprehensive DeFi protocol with NFTs, DAO governance, and advanced financial primitives.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Scroll](https://img.shields.io/badge/Network-Scroll%20zkEVM-orange)](https://scroll.io/)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.24-blue)](https://soliditylang.org/)

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MetaMask browser extension
- Scroll Sepolia testnet ETH

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your private key

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Scroll Sepolia
npm run deploy:sepolia
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` and connect your MetaMask wallet!

---

## 📋 Project Structure

```
scrollgen/
├── contracts/          # Solidity smart contracts
│   ├── ScrollGenToken.sol
│   ├── future/        # Phase 2+ contracts
│   └── README.md
├── scripts/           # Deployment & interaction
│   ├── deploy.js
│   ├── verify.js
│   └── interactions.js
├── frontend/          # React web application
│   ├── src/
│   │   ├── components/
│   │   ├── styles/
│   │   └── App.jsx
│   └── package.json
├── docs/             # Documentation
│   ├── overview.md
│   ├── setup.md
│   ├── token.md
│   ├── roadmap.md
│   ├── governance.md
│   └── defi.md
├── test/            # Contract tests
├── hardhat.config.js
└── package.json
```

---

## 🎯 Current Phase: Token Launch

### ScrollGen Token (SGT)

**ERC-20 token with extended functionality:**

- ✅ Standard ERC-20 operations
- ✅ Owner-controlled minting
- ✅ User-controlled burning
- ✅ Event emissions for tracking
- ✅ Built with OpenZeppelin

**Token Details:**
- **Name:** ScrollGen Token
- **Symbol:** SGT
- **Decimals:** 18
- **Initial Supply:** 1,000,000 SGT
- **Network:** Scroll Sepolia Testnet

### Web Interface

**Features:**
- 🔗 MetaMask wallet connection
- 💰 Real-time balance display
- 📤 Token transfer interface
- 🔄 Transaction status tracking
- 📱 Fully responsive design

---

## 🗺️ Roadmap

### Phase 1: Token Launch ✅ (Current)
- ERC-20 token deployment
- Web interface with wallet integration
- Documentation and branding

### Phase 2: NFT Layer 🔜 (Q2 2024)
- Dynamic NFT collection
- Staking mechanisms
- Marketplace integration

### Phase 3: DAO Governance 📅 (Q3 2024)
- On-chain voting system
- Proposal creation
- Treasury management
- Community ownership

### Phase 4: DeFi Integration 🎯 (Q4 2024)
- Liquidity pools (AMM)
- Staking and yield farming
- Lending protocol
- Flash loans

[**View Full Roadmap →**](docs/roadmap.md)

---

## 🛠️ Technology Stack

### Backend
- **Solidity 0.8.24** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries
- **Ethers.js** - Blockchain interactions

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Ethers.js** - Web3 provider
- **Lucide React** - Icon library

### Network
- **Scroll zkEVM** - Layer 2 scaling solution
- **Zero-Knowledge Rollups** - Security and scalability
- **EVM Compatible** - Full Ethereum compatibility

---

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Overview](docs/overview.md)** - Project vision and architecture
- **[Setup Guide](docs/setup.md)** - Complete installation instructions
- **[Token Docs](docs/token.md)** - SGT token specification
- **[Roadmap](docs/roadmap.md)** - Phase-by-phase development plan
- **[Governance](docs/governance.md)** - Future DAO framework
- **[DeFi](docs/defi.md)** - Planned DeFi features
- **[Changelog](docs/changelog.md)** - Version history

---

## 🔧 Development

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Scroll Sepolia

```bash
# Update .env with your private key
npx hardhat run scripts/deploy.js --network scrollSepolia
```

### Verify Contract

```bash
# Add contract address to .env as VITE_CONTRACT_ADDRESS
npx hardhat run scripts/verify.js --network scrollSepolia
```

### Interact with Contract

```bash
npx hardhat run scripts/interactions.js --network scrollSepolia
```

---

## 🔐 Security

### Current Status
- Built with OpenZeppelin audited libraries
- Comprehensive test coverage
- Internal security review complete

### Future Plans
- External security audits (Phase 2+)
- Bug bounty program
- Ongoing security monitoring

**Report vulnerabilities:** security@scrollgen.io (placeholder)

---

## 🌐 Network Information

### Scroll Sepolia Testnet

| Property | Value |
|----------|-------|
| Chain ID | 534351 |
| RPC URL | https://sepolia-rpc.scroll.io/ |
| Currency | ETH |
| Explorer | https://sepolia.scrollscan.com/ |

### Get Testnet ETH

1. Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
2. Bridge to Scroll Sepolia at [Scroll Bridge](https://scroll.io/bridge)

---

## 🤝 Contributing

We welcome contributions from the community!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Keep commits atomic and well-described

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website:** [Coming Soon]
- **Documentation:** [/docs](docs/)
- **Twitter:** [Coming Soon]
- **Discord:** [Coming Soon]
- **GitHub:** [This Repository]

---

## 💡 Vision

ScrollGen aims to become the premier modular protocol on Scroll zkEVM, demonstrating the power of zero-knowledge rollups for building scalable, secure, and composable DeFi applications.

By taking a phased approach, we ensure:
- ✓ Solid foundation before adding complexity
- ✓ Community feedback guides development
- ✓ Security and testing at every phase
- ✓ Sustainable, organic growth

---

## ⭐ Show Your Support

If you find ScrollGen interesting, please give us a star on GitHub! It helps us reach more developers and grow the community.

---

## 🙏 Acknowledgments

- **Scroll Team** - For building an incredible zkEVM L2
- **OpenZeppelin** - For battle-tested smart contract libraries
- **Hardhat** - For the best Ethereum development environment
- **Community** - For early feedback and support

---

## 📞 Contact

- **Email:** contact@scrollgen.io (placeholder)
- **Discord:** [Join our server] (coming soon)
- **Twitter:** [@ScrollGen] (coming soon)

---

**Built with ❤️ on Scroll zkEVM**

*ScrollGen - Empowering the next generation of builders on Layer 2*
