require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    scrollSepolia: {
      url: process.env.SCROLL_SEPOLIA_RPC || "https://sepolia-rpc.scroll.io/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 534351,
    },
    scrollMainnet: {
      url: process.env.SCROLL_MAINNET_RPC || "https://rpc.scroll.io/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 534352,
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      scrollSepolia: process.env.ETHERSCAN_API_KEY || "abc",
      scrollMainnet: process.env.ETHERSCAN_API_KEY || "abc",
    },
    customChains: [
      {
        network: "scrollSepolia",
        chainId: 534351,
        urls: {
          apiURL: "https://api-sepolia.scrollscan.com/api",
          browserURL: "https://sepolia.scrollscan.com/",
        },
      },
      {
        network: "scrollMainnet",
        chainId: 534352,
        urls: {
          apiURL: "https://api.scrollscan.com/api",
          browserURL: "https://scrollscan.com/",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
  },
};
