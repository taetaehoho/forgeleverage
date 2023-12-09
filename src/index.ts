// 1. Import Telegram Bot Library
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { swapUSDCForETHWIthFusion } from './fusion';
import { borrowUSDCWithETHOnAAVE } from './aave';
import { CONFIG } from "./constants/config";
import { ethers } from 'ethers';
import { approveUSDC, getUsdcBalance } from './usdc';


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
    bot.sendMessage(msg.chat.id, "Welcome to the FusionLeverage_Bot\nHere are the available Commands:\n1.OpenPosition [usdcAmount] [NumTimesLevered] [DebtRatio]");
});

bot.onText(/\/open_position/, async function onOpenPosition(msg) {
    const params = msg.text?.split(' ')
    let usdcAmount = params?.[1]
    let recursiveTime = params?.[2]
    let debtRatio = params?.[3]
    if (!usdcAmount || !recursiveTime || !debtRatio) {
        bot.sendMessage(msg.chat.id, "Please enter the correct params [usdcAmount] [NumTimesLevered] [DebtRatio]");
        return
    }

    bot.sendMessage(msg.chat.id, 'Opening position...');
    let _usdcAmount = Number(usdcAmount) * 1e6 // convert to 6decimals
    let _recursiveTime = Number(recursiveTime)
    let _leverageRatio = Number(debtRatio)
    let currentRecursiveLeverageRatio = 0
    let totalLevrageRatio = 1
    // run fusion to convert usd to eth
    await bot.sendMessage(msg.chat.id, 'Approving Fusion to sell your USDC...');

    const usdcBalance = await getUsdcBalance();
    console.log(ethers.formatUnits(usdcBalance, 6))
    await approveUSDC(usdcBalance, _usdcAmount)

    // TO DO
    // 1. LOOP Over num recursion times 
    // 2. each time sell USDC using fusion 
    // 3. then borrow the debt amount on aave 
    // 4. log the total leverage ratio and report that to the end user
});
