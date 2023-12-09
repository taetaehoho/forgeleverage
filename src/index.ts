// 1. Import Telegram Bot Library
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { swapUSDCForETHWIthFusion } from './fusion';
import { approveUSDC, getUsdcBalance } from './usdc';
import { borrowUSDCWithETHOnAAVE } from './aave';
import { CONFIG } from "./constants/config";
import { ethers } from 'ethers';
import { tradeUSDCForETH } from './uniswap';
import { sleep } from "./constants/sleep";


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
} else if (process.env.NETWORK == "137") { // polygon mainnet
    RPC_URL = process.env.POLYGON_RPC_URL!;
    usdcAddress = CONFIG.polygon.usdcAddress;
    wethAddress = CONFIG.polygon.WETHAddress!;
    oneinchrouter = CONFIG.polygon.WrappedTokenGatewayV3!;
} else if (process.env.NETWORK == "8453") { // base
    RPC_URL = process.env.BASE_RPC_URL!;
    usdcAddress = CONFIG.base.usdcAddress;
    wethAddress = CONFIG.base.WETHAddress!;
} else if (process.env.NETWORK == "42220") { // celo
    RPC_URL = process.env.CELO_RPC_URL!;
    usdcAddress = CONFIG.celo.usdcAddress;
    wethAddress = CONFIG.celo.WETHAddress!;
}
// 3. Set up Message Handlers
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;

//     // Echo the message text back
//     bot.sendMessage(chatId, `Echo: ${msg.text}`);
// });


// 4. Define Custom Commands (e.g., /start)
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome to the bot!");
});

bot.onText(/\/open_position/, async function onOpenPosition(msg) {
    const params = msg.text?.split(' ')
    let usdcAmount = params?.[1]
    let recursiveTime = params?.[2]
    let leverageRatio = params?.[3]
    if (!usdcAmount || !recursiveTime || !leverageRatio) {
        bot.sendMessage(msg.chat.id, "Please enter the correct params {usdcamount} {recursiveTimes} {leverageRatio}");
        return
    }
    bot.sendMessage(msg.chat.id, 'Opening position...');
    let _usdcAmount = Number(usdcAmount) * 1e6 // convert to 6decimals
    let _recursiveTime = Number(recursiveTime)
    let _leverageRatio = Number(leverageRatio)
    let currentRecursiveLeverageRatio = 0
    let totalLevrageRatio = 1
    // run fusion to convert usd to eth
    await bot.sendMessage(msg.chat.id, 'Approving USDC for Selling with Fusion...');

    //need conversion for decimal
    const usdcBalance = await getUsdcBalance();
    console.log(ethers.formatUnits(usdcBalance, 6))
    await approveUSDC(usdcBalance, _usdcAmount)
    for (let i = 0; i < _recursiveTime; i++) {

        await bot.sendMessage(msg.chat.id, 'Swapping USDC for ETH with 1inch Fusion... \nPlease wait while your limit order is being filled');
        console.log(_usdcAmount.toString(), usdcBalance)
        const ethAmount = await swapUSDCForETHWIthFusion(RPC_URL, usdcAddress, wethAddress, _usdcAmount.toString(), usdcBalance)
        await bot.sendMessage(msg.chat.id, `Successsfully swapped ${ethers.formatUnits(_usdcAmount, 6)} USDC for ${ethers.formatEther(ethAmount)} ETH...`);

        await bot.sendMessage(msg.chat.id, 'Now borrowing USDC for ETH on Aave...');

        // !!! issue is with here - cannot * 1500 bigints and numbers - also have to figure out better way to do this
        currentRecursiveLeverageRatio = Math.pow(_leverageRatio, i + 1)

        console.log(ethAmount)

        const aaveUSDC = Math.round(Number(ethers.formatEther(ethAmount)) * 1500 * currentRecursiveLeverageRatio * 1e6)
        const usdcAave = await borrowUSDCWithETHOnAAVE(ethAmount, aaveUSDC)

        await bot.sendMessage(msg.chat.id, `Successfully borrowed ${ethers.formatUnits(usdcAave, 6)} USDC for ETH on Aave...`);

        totalLevrageRatio += currentRecursiveLeverageRatio
        console.log(totalLevrageRatio)
        await bot.sendMessage(msg.chat.id, 'Your currenct leverage ratio is: ' + totalLevrageRatio.toFixed(2) + 'x');
    }

    bot.sendMessage(msg.chat.id, 'Finished opening position');
});

bot.onText(/\/uniswap_open_position/, async function onOpenPosition(msg) {
    console.log(msg.text)
    const params = msg.text?.split(' ')
    let usdcAmount = params?.[1]
    let recursiveTime = params?.[2]
    let leverageRatio = params?.[3]
    if (!usdcAmount || !recursiveTime || !leverageRatio) {
        bot.sendMessage(msg.chat.id, "Please enter the correct params {usdcamount} {recursiveTimes} {leverageRatio}");
        return
    }
    bot.sendMessage(msg.chat.id, 'Opening position...');
    // console.log(usdcAmount);
    let _usdcAmount = Number(usdcAmount) * 1e6 // convert to 6decimals
    let _recursiveTime = Number(recursiveTime)
    let _leverageRatio = Number(leverageRatio)
    let currentRecursiveLeverageRatio = 0
    let totalLevrageRatio = 1
    // run fusion to convert usd to eth
    await bot.sendMessage(msg.chat.id, 'Approving USDC for Selling with UniswapV3...');

    //need conversion for decimal
    const usdcBalance = await getUsdcBalance();
    // console.log(ethers.formatUnits(usdcBalance, 6))
    await approveUSDC(usdcBalance, _usdcAmount)
    for (let i = 0; i < _recursiveTime; i++) {

        await bot.sendMessage(msg.chat.id, 'Swapping USDC for ETH with UniswapV3... \nPlease wait while your order is filled');
        // console.log(_usdcAmount.toString(), usdcBalance)
        const ethAmount = await tradeUSDCForETH(_usdcAmount)
        console.log('ethAmount: ', ethAmount)
        await bot.sendMessage(msg.chat.id, `Successsfully swapped ${ethers.formatUnits(_usdcAmount, 6)} USDC for ${ethers.formatEther(ethAmount)} ETH...`);

        await bot.sendMessage(msg.chat.id, 'Now borrowing USDC for ETH on Aave...');

        // !!! issue is with here - cannot * 1500 bigints and numbers - also have to figure out better way to do this
        currentRecursiveLeverageRatio = Math.pow(_leverageRatio, i + 1)

        await sleep(5000);

        const aaveUSDC = Math.round(Number(ethers.formatEther(ethAmount)) * 1500 * currentRecursiveLeverageRatio * 1e6)
        const usdcAave = await borrowUSDCWithETHOnAAVE(ethAmount, aaveUSDC)        // console.log(aaveUSDC)

        await bot.sendMessage(msg.chat.id, `Successfully borrowed ${usdcAave} USDC for ETH on Aave...`);

        totalLevrageRatio += currentRecursiveLeverageRatio
        console.log(totalLevrageRatio)
        await bot.sendMessage(msg.chat.id, 'Your currenct leverage ratio is: ' + totalLevrageRatio.toFixed(2) + 'x');
    }

    bot.sendMessage(msg.chat.id, 'Finish opening limited position');
});

