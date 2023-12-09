import dotenv from 'dotenv';
import { ethers } from "ethers";
import { CONFIG } from '../constants/config';
import { usdcAbi } from '../abis/usdc';
import { sleep } from '../constants/sleep';
dotenv.config();

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

const provider = new ethers.JsonRpcProvider(RPC_URL);
const privateKey = process.env.PRIVATE_KEY!;
const wallet = new ethers.Wallet(privateKey, provider);

const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, wallet)

export async function approveUSDC(usdcBalance:number, usdcAmount:number) {

    const USDCMAX = 10000 * 1e6;

    // approve say 50000usdc if approvals not met
    if (await usdcContract.balanceOf(wallet.address) < usdcAmount) {
        await usdcContract.approve(oneinchrouter, USDCMAX)
    }
}

export async function getUsdcBalance() {
    const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, wallet)
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    return usdcBalance;
}