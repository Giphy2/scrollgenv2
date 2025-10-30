// ScrollGen v2.0 Mainnet Configuration
// Network: Scroll Mainnet
// ChainID: 534352

export const SCROLL_MAINNET_CONFIG = {
  chainId: '0x82750', // 534352
  chainName: 'Scroll',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.scroll.io'],
  blockExplorerUrls: ['https://scrollscan.com'],
};

// Phase 1: Core Token
export const SGT_TOKEN_ADDRESS = import.meta.env.VITE_MAINNET_SGT_TOKEN_ADDRESS || "";

// Phase 2: NFT & Marketplace
export const GENESIS_BADGE_ADDRESS = import.meta.env.VITE_MAINNET_GENESIS_BADGE_ADDRESS || "";
export const NFT_MARKETPLACE_ADDRESS = import.meta.env.VITE_MAINNET_NFT_MARKETPLACE_ADDRESS || "";
export const NFT_STAKING_ADDRESS = import.meta.env.VITE_MAINNET_NFT_STAKING_ADDRESS || "";

// Phase 3: DeFi
export const STAKING_REWARDS_ADDRESS = import.meta.env.VITE_MAINNET_STAKING_REWARDS_ADDRESS || "";
export const LENDING_PROTOCOL_ADDRESS = import.meta.env.VITE_MAINNET_LENDING_PROTOCOL_ADDRESS || "";
export const BRIDGE_CONNECTOR_ADDRESS = import.meta.env.VITE_MAINNET_BRIDGE_CONNECTOR_ADDRESS || "";
export const ZK_VERIFIER_ADDRESS = import.meta.env.VITE_MAINNET_ZK_VERIFIER_ADDRESS || "";

// Phase 4: Advanced DeFi
export const SCROLLGEN_BRIDGE_ADDRESS = import.meta.env.VITE_MAINNET_SCROLLGEN_BRIDGE_ADDRESS || "";
export const DEX_AGGREGATOR_ADDRESS = import.meta.env.VITE_MAINNET_DEX_AGGREGATOR_ADDRESS || "";
export const SCROLLGEN_LRT_ADDRESS = import.meta.env.VITE_MAINNET_SCROLLGEN_LRT_ADDRESS || "";
export const API_GATEWAY_ADDRESS = import.meta.env.VITE_MAINNET_API_GATEWAY_ADDRESS || "";

// Phase 5: AI & Gamification
export const AI_YIELD_MANAGER_ADDRESS = import.meta.env.VITE_MAINNET_AI_YIELD_MANAGER_ADDRESS || "";
export const RESTAKE_HUB_ADDRESS = import.meta.env.VITE_MAINNET_RESTAKE_HUB_ADDRESS || "";
export const ZKID_VERIFIER_ADDRESS = import.meta.env.VITE_MAINNET_ZKID_VERIFIER_ADDRESS || "";
export const QUEST_SYSTEM_ADDRESS = import.meta.env.VITE_MAINNET_QUEST_SYSTEM_ADDRESS || "";

// Phase 6: Governance
export const GENESIS_GOVERNOR_ADDRESS = import.meta.env.VITE_MAINNET_GENESIS_GOVERNOR_ADDRESS || "";
export const TIMELOCK_CONTROLLER_ADDRESS = import.meta.env.VITE_MAINNET_TIMELOCK_ADDRESS || "";
export const DAO_TREASURY_ADDRESS = import.meta.env.VITE_MAINNET_DAO_TREASURY_ADDRESS || "";

// Network Detection
export const isMainnet = () => {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  return window.ethereum.chainId === SCROLL_MAINNET_CONFIG.chainId;
};

// Switch to Mainnet Helper
export const switchToMainnet = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed');

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SCROLL_MAINNET_CONFIG.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [SCROLL_MAINNET_CONFIG],
      });
    } else {
      throw switchError;
    }
  }
};

// Contract ABIs (imported from phase configs)
export { TOKEN_ABI } from './config';
export {
  GENESIS_BADGE_ABI,
  MARKETPLACE_ABI,
  NFT_STAKING_ABI
} from './config-phase2';
export {
  STAKING_REWARDS_ABI,
  LENDING_PROTOCOL_ABI,
  BRIDGE_CONNECTOR_ABI
} from './config-phase3';
export {
  AI_YIELD_MANAGER_ABI,
  RESTAKE_HUB_ABI,
  ZKID_VERIFIER_ABI,
  QUEST_SYSTEM_ABI
} from './config-phase5';

// Deployment Information
export const DEPLOYMENT_INFO = {
  version: "2.0.1",
  network: "Scroll Mainnet",
  deploymentDate: import.meta.env.VITE_MAINNET_DEPLOYMENT_DATE || "",
  blockNumber: import.meta.env.VITE_MAINNET_DEPLOYMENT_BLOCK || "",
  deployer: import.meta.env.VITE_MAINNET_DEPLOYER_ADDRESS || "",
  verified: true,
  audited: true,
  auditReport: "https://docs.scrollgen.xyz/audit",
};

// Feature Flags
export const FEATURES = {
  aiYieldManager: true,
  restaking: true,
  zkIdentity: true,
  quests: true,
  governance: true,
  bridge: true,
  lending: true,
  nftMarketplace: true,
};

// API Endpoints
export const API_ENDPOINTS = {
  analytics: `https://api.scrollgen.xyz/analytics`,
  oracle: `https://api.scrollgen.xyz/oracle`,
  ipfs: `https://ipfs.scrollgen.xyz`,
  docs: `https://docs.scrollgen.xyz`,
};

// Social Links
export const SOCIAL_LINKS = {
  website: "https://scrollgen.xyz",
  docs: "https://docs.scrollgen.xyz",
  twitter: "https://twitter.com/ScrollGenDeFi",
  discord: "https://discord.gg/scrollgen",
  github: "https://github.com/scrollgen/protocol",
  telegram: "https://t.me/scrollgen",
};

// Security Contacts
export const SECURITY = {
  bugBounty: "https://immunefi.com/bounty/scrollgen",
  email: "security@scrollgen.xyz",
  disclosure: "https://docs.scrollgen.xyz/security",
};

export default {
  SCROLL_MAINNET_CONFIG,
  SGT_TOKEN_ADDRESS,
  GENESIS_BADGE_ADDRESS,
  NFT_MARKETPLACE_ADDRESS,
  AI_YIELD_MANAGER_ADDRESS,
  RESTAKE_HUB_ADDRESS,
  ZKID_VERIFIER_ADDRESS,
  QUEST_SYSTEM_ADDRESS,
  GENESIS_GOVERNOR_ADDRESS,
  DEPLOYMENT_INFO,
  FEATURES,
  API_ENDPOINTS,
  SOCIAL_LINKS,
  SECURITY,
};
