ScrollGen Faucet Telegram Bot

This bot allows users to claim SGT tokens from the ScrollGen Faucet via Telegram.

1️⃣ Prerequisites

Node.js ≥ 18

Installed dependencies:

npm install telegraf ethers dotenv


.env file in project root with the following variables:

# Blockchain
PRIVATE_KEY="your_wallet_private_key_here"
SCROLL_SEPOLIA_RPC="https://sepolia-rpc.scroll.io"
FAUCET_ADDRESS="0x2ACBB2b325D2319A90748399039047b201b3c4Bb"

# SGT Token (optional if using mint mode)
SGT_TOKEN_ADDRESS="0x458beBB9b528De802341b6c689b7Db0f19a15625"

# Telegram bot
TELEGRAM_BOT_TOKEN="1234567890:ABCDefGhIJKlmnOPQRstUVwxyZ1234567890"


⚠️ Never commit .env to GitHub. The PRIVATE_KEY and TELEGRAM_BOT_TOKEN must remain secret.

2️⃣ Start the Bot
node bot.js


The bot will start and connect to the Scroll Sepolia network.

You should see:

Telegram bot started!

3️⃣ Usage

Command: /claim <your_wallet_address>

Example:

/claim 0xYourWalletAddressHere


The bot will:

Check if the address has already claimed tokens.

If not, call the faucet’s claim() function.

Respond with the transaction hash or an error message.

4️⃣ Notes & Best Practices

Make sure the faucet has enough SGT tokens to distribute if useMint = false.

Only the first claim per address will succeed; repeated claims will return an error.

Consider adding rate-limiting to prevent spam.

Keep your .env secure; leaking PRIVATE_KEY or TELEGRAM_BOT_TOKEN allows full control over the faucet and bot.