// 1. Import Telegram Bot Library
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { swapUSDCForETHWIthFusion } from './fusion';
import { borrowUSDCWithETHOnAAVE } from './aave';
import { CONFIG } from "./constants/config";
import { ethers } from 'ethers';


config();
// console.log('private key', process.env.PRIVATE_KEY)
// 2. Initialize Bot with Token
const token = process.env.TELEGRAM_BOT_API_KEY || '';
const bot = new TelegramBot(token, { polling: true });

let RPC_URL: string = "";
let usdcAddress: string = "";
let wethAddress: string = "";
let oneinchrouter: string = "";
if (process.env.NETWORK == "421613") {
    RPC_URL = process.env.ARBYGOERLI_URL!;
    usdcAddress = CONFIG.arbigoerli.usdcAddress!;
    wethAddress = CONFIG.arbigoerli.WETHAddress!;
    oneinchrouter = CONFIG.arbitrum.oneinchrouter!;
} else if (process.env.NETWORK == "534351") {
    RPC_URL = process.env.SCROLLTESTNET_URL!;
    usdcAddress = CONFIG.scrolltestnet.usdcAddress;
    wethAddress = CONFIG.scrolltestnet.WETHAddress!;
    oneinchrouter = CONFIG.arbitrum.oneinchrouter!;
} else if (process.env.NETWORK == "80001") {
    RPC_URL = process.env.MUMBAI_URL!;
    usdcAddress = CONFIG.mumbai.usdcAddress!;
    wethAddress = CONFIG.mumbai.WETHAddress!;
    oneinchrouter = CONFIG.arbitrum.oneinchrouter!;
} else if (process.env.NETWORK == "42161") {
    RPC_URL = process.env.ARBITRUM_URL!;
    usdcAddress = CONFIG.arbitrum.usdcAddress!;
    wethAddress = CONFIG.arbitrum.WETHAddress!;
    oneinchrouter = CONFIG.arbitrum.oneinchrouter!;
}

// 4. Define Custom Commands (e.g., /start)
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome to the bot!");
});

bot.onText(/\/open_position/, async function onOpenPosition(msg) {
});
