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
    let _debtRatio = Number(debtRatio)
    let currentRecursiveLeverageRatio = 0
    let totalLevrageRatio = 1
    // run fusion to convert usd to eth
    await bot.sendMessage(msg.chat.id, 'Approving Fusion to sell your USDC...');

    const usdcBalance = await getUsdcBalance();
    console.log(ethers.formatUnits(usdcBalance, 6))
    await approveUSDC(usdcBalance, _usdcAmount)

    for (let i = 0; i < _recursiveTime; i++) {
        await bot.sendMessage(msg.chat.id, 'Swapping USDC for ETH with 1inch Fusion... \nPlease wait while your limit order is being filled');
        console.log(_usdcAmount.toString(), usdcBalance)
        try {
            const ethAmount = await swapUSDCForETHWIthFusion(RPC_URL, usdcAddress, wethAddress, _usdcAmount.toString(), usdcBalance) 
            await bot.sendMessage(msg.chat.id, `Successsfully swapped ${ethers.formatUnits(_usdcAmount, 6)} USDC for ${ethers.formatEther(ethAmount)} ETH...`);

            await bot.sendMessage(msg.chat.id, 'Now borrowing USDC for ETH on Aave...');
    
            currentRecursiveLeverageRatio = Math.pow(_debtRatio, i + 1)
    
            // manual but okay
            const aaveUSDC = Number(ethers.formatEther(ethAmount)) * 2200 * currentRecursiveLeverageRatio * 1e6
            const usdcAave = await borrowUSDCWithETHOnAAVE(ethers.parseEther(ethAmount), aaveUSDC)
    
            await bot.sendMessage(msg.chat.id, `Successfully borrowed ${usdcAave} USDC for ETH on Aave...`);
    
            totalLevrageRatio += currentRecursiveLeverageRatio
            console.log(totalLevrageRatio)
            await bot.sendMessage(msg.chat.id, 'Your currenct leverage ratio is: ' + totalLevrageRatio.toFixed(2) + 'x');
        } catch (error:any) {
            if (error['response']['status'] == 400) {
                console.log("Bad request")
                bot.sendMessage(msg.chat.id, error['response']['data']['message'])
            }
        }
    }
    bot.sendMessage(msg.chat.id, 'Finished opening limited position');

});
