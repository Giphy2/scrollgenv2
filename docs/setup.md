# Setup Guide

This guide will walk you through setting up the ScrollGen development environment, deploying the smart contracts, and running the frontend application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **npm**: v9 or higher (comes with Node.js)
- **MetaMask**: Browser extension ([Install](https://metamask.io/))
- **Git**: Version control ([Download](https://git-scm.com/))

## Project Structure

```
scrollgen/
├── contracts/          # Solidity smart contracts
├── scripts/           # Deployment and interaction scripts
├── frontend/          # React web application
├── docs/             # Documentation
├── test/             # Contract tests
└── hardhat.config.js # Hardhat configuration
```

## Backend Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Hardhat and related tools
- OpenZeppelin contracts
- Ethers.js
- Development dependencies

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your private key:

```
PRIVATE_KEY=your_private_key_here
SCROLL_SEPOLIA_RPC=https://sepolia-rpc.scroll.io/
```

**⚠️ IMPORTANT**: Never commit your `.env` file. It's already in `.gitignore`.

### 3. Get Testnet ETH

You'll need Scroll Sepolia ETH to deploy contracts:

1. Get Sepolia ETH from a faucet:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Faucet](https://sepoliafaucet.com/)

2. Bridge to Scroll Sepolia:
   - Visit [Scroll Bridge](https://scroll.io/bridge)
   - Connect your wallet
   - Bridge your Sepolia ETH to Scroll Sepolia

### 4. Compile Contracts

```bash
npx hardhat compile
```

This compiles all Solidity contracts in the `contracts/` directory.

### 5. Run Tests (Optional)

```bash
npx hardhat test
```

### 6. Deploy to Scroll Sepolia

```bash
npx hardhat run scripts/deploy.js --network scrollSepolia
```

**Save the contract address** from the output. You'll need it for the frontend.

Example output:
```
✅ ScrollGenToken deployed successfully!
📍 Contract address: 0x1234567890abcdef1234567890abcdef12345678
```

### 7. Update Environment Variables

Add the contract address to your `.env` file:

```
VITE_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### 8. Verify Contract (Optional)

If you want to verify your contract on the block explorer:

```bash
npx hardhat run scripts/verify.js --network scrollSepolia
```

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Frontend Dependencies

```bash
npm install
```

This installs:
- React and React DOM
- Ethers.js
- Vite
- Lucide React (icons)

### 3. Configure Contract Address

Update `frontend/src/config.js` with your deployed contract address:

```javascript
export const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
```

Alternatively, create a `.env` file in the `frontend/` directory:

```
VITE_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### 4. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 5. Connect MetaMask

1. Click "Connect Wallet" in the application
2. MetaMask will prompt you to:
   - Connect your account
   - Switch to Scroll Sepolia network (or add it if not present)
3. Approve the connection

### 6. Test Token Transfer

1. View your token balance
2. Enter a recipient address
3. Enter an amount to transfer
4. Click "Send Tokens"
5. Confirm the transaction in MetaMask

## Network Configuration

### Scroll Sepolia Testnet

- **Chain ID**: 534351
- **RPC URL**: https://sepolia-rpc.scroll.io/
- **Block Explorer**: https://sepolia.scrollscan.com/
- **Currency**: ETH

### Add to MetaMask Manually

1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter the following details:
   - Network Name: Scroll Sepolia Testnet
   - RPC URL: https://sepolia-rpc.scroll.io/
   - Chain ID: 534351
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.scrollscan.com/

## Common Issues

### "Insufficient funds" Error

Make sure you have Scroll Sepolia ETH in your wallet. Bridge from Sepolia ETH using the Scroll Bridge.

### "Cannot connect to network" Error

Check that:
- You're connected to Scroll Sepolia in MetaMask
- The RPC URL is correct in `hardhat.config.js`
- Your internet connection is stable

### "Contract not deployed" Error

Ensure:
- You've deployed the contract successfully
- The contract address is correctly set in `frontend/src/config.js`
- You're connected to the same network where you deployed

### MetaMask Doesn't Prompt

Try:
- Refreshing the page
- Disconnecting and reconnecting wallet
- Clearing MetaMask's activity tab data

## Development Workflow

### Making Contract Changes

1. Edit contracts in `contracts/`
2. Compile: `npx hardhat compile`
3. Test: `npx hardhat test`
4. Deploy: `npx hardhat run scripts/deploy.js --network scrollSepolia`
5. Update contract address in frontend config

### Making Frontend Changes

1. Edit files in `frontend/src/`
2. Changes auto-reload in development
3. Build for production: `npm run build`

## Next Steps

- Review [Token Documentation](./token.md)
- Check the [Roadmap](./roadmap.md)
- Explore [Governance Plans](./governance.md)
- Learn about [DeFi Features](./defi.md)

## Support

If you encounter issues:
1. Check this documentation
2. Review the [changelog](./changelog.md)
3. Open an issue on GitHub
4. Ask in the Discord community

---

**Happy Building on Scroll! 🌀**
