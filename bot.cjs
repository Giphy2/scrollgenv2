require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Blockchain setup
const RPC_URL = process.env.SCROLL_SEPOLIA_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const FAUCET_ADDRESS = process.env.FAUCET_ADDRESS;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Faucet ABI (claim function)
const FAUCET_ABI = [
  "function claim(address user) external",
  "function hasUserClaimed(address user) view returns (bool)"
];

const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, wallet);

// Command: /claim <address>
bot.command('claim', async (ctx) => {
  try {
    const text = ctx.message.text;
    const parts = text.split(" ");
    if (parts.length !== 2) {
      return ctx.reply("Usage: /claim <your_address>");
    }

    const userAddress = parts[1];

    if (!ethers.isAddress(userAddress)) {
      return ctx.reply("Invalid Ethereum address!");
    }

    const alreadyClaimed = await faucet.hasUserClaimed(userAddress);
    if (alreadyClaimed) {
      return ctx.reply("Address has already claimed tokens.");
    }

    const tx = await faucet.claim(userAddress);
    await tx.wait();

    ctx.reply(`✅ Successfully claimed tokens for ${userAddress}\nTx: ${tx.hash}`);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Error claiming tokens: " + err.message);
  }
});

// Start the bot
bot.launch().then(() => {
  console.log("Telegram bot started!");
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
