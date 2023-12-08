import { FusionSDK, NetworkEnum, PrivateKeyProviderConnector } from '@1inch/fusion-sdk';
import dotenv from 'dotenv';
import { ethers } from "ethers";
import Web3 from 'web3';
import { WETHabi } from '../abis/WETH';
import { CONFIG } from '../constants/config';
import { sleep } from '../constants/sleep';

dotenv.config();

export async function swapUSDCForETHWIthFusion(nodeUrl: string, _fromTokenAddress: string, _toTokenAddress: string, _amount: string, usdcBalance: number) {

    const makerPrivateKey = process.env.PRIVATE_KEY!
    const makerAddress = process.env.ADDRESS!
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

}