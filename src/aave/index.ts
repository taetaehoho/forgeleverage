import { ethers } from "ethers";
import { pool } from '../abis/aavepool';
import { WETHGateway } from "../abis/WETHGateway";
import { CONFIG } from "../constants/config";
import { sleep } from "../constants/sleep";
import dotenv from 'dotenv';
dotenv.config();

export async function borrowUSDCWithETHOnAAVE(ethAmount: bigint, usdcAmount: number) {
 // to do 
 /* 1. deposit ETH into Aave 
    2. Borrow USDC against it  
 */

    let RPC_URL;
    let usdcAddress: string = "";
    let poolAddress: string = "";
    let wrappedTokenAddress: string = "";

    if (process.env.NETWORK == "421613") { // arbygoerli
        RPC_URL = process.env.ARBYGOERLI_URL;
        usdcAddress = CONFIG.arbigoerli.usdcAddress!;
        poolAddress = CONFIG.arbigoerli.PoolProxy!;
        wrappedTokenAddress = CONFIG.arbigoerli.WrappedTokenGatewayV3!;
    } else if (process.env.NETWORK == "534351") { // scroll testnet
        RPC_URL = process.env.SCROLLTESTNET_URL;
        usdcAddress = CONFIG.scrolltestnet.usdcAddress;
        poolAddress = CONFIG.scrolltestnet.PoolProxy!;
        wrappedTokenAddress = CONFIG.scrolltestnet.WrappedTokenGatewayV3!;
    } else if (process.env.NETWORK == "80001") { // mumbai
        RPC_URL = process.env.MUMBAI_URL;
        usdcAddress = CONFIG.mumbai.usdcAddress!;
        poolAddress = CONFIG.mumbai.PoolProxy!;
        wrappedTokenAddress = CONFIG.mumbai.WrappedTokenGatewayV3!;
    } else if (process.env.NETWORK == "42161") { // arby mainnet
        RPC_URL = process.env.ARBITRUM_URL!;
        usdcAddress = CONFIG.arbitrum.usdcAddress!;
        poolAddress = CONFIG.arbitrum.PoolProxy!;
        wrappedTokenAddress = CONFIG.arbitrum.WrappedTokenGatewayV3!;
     } else if (process.env.NETWORK == "534351") { // scrolltestnet
        RPC_URL = process.env.SCROLLTESTNET_URL;
        usdcAddress = CONFIG.scrolltestnet.usdcAddress;
        poolAddress = CONFIG.scrolltestnet.PoolProxy!;
        wrappedTokenAddress = CONFIG.scrolltestnet.WrappedTokenGatewayV3!;
    } else if (process.env.NETWORK == "137") { // polygon mainnet
        RPC_URL = process.env.POLYGON_RPC_URL;
        usdcAddress = CONFIG.polygon.usdcAddress;
        poolAddress = CONFIG.polygon.PoolProxy!;
        wrappedTokenAddress = CONFIG.polygon.WrappedTokenGatewayV3!;
    } else if (process.env.NETWORK == "8453") { // base
        RPC_URL = process.env.BASE_RPC_URL;
        usdcAddress = CONFIG.base.usdcAddress;
        poolAddress = CONFIG.base.PoolProxy!;
        wrappedTokenAddress = CONFIG.base.WrappedTokenGatewayV3!;
    } else if (process.env.NETWORK == "42220") { // celo
        RPC_URL = process.env.CELO_RPC_URL!;
        usdcAddress = CONFIG.celo.usdcAddress;
        poolAddress = CONFIG.celo.PoolProxy!;
        wrappedTokenAddress = CONFIG.celo.WrappedTokenGatewayV3!;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const privateKey = process.env.PRIVATE_KEY!;
    const wallet = new ethers.Wallet(privateKey, provider);

    // poolContract
    const poolContract = new ethers.Contract(poolAddress, pool, wallet);

    // WrappedTokenGateway
    const WrappedTokenGatewayV3 = new ethers.Contract(wrappedTokenAddress, WETHGateway, wallet)

    // supply 
    const supplytx = await WrappedTokenGatewayV3.depositETH(poolAddress, wallet.address, 0, { value: ethAmount })
    console.log("waiting 6 blocks")
    const supplytxreceipt = await supplytx.wait(6);

    console.log(`ETH supplied to Aave with: `, supplytxreceipt)
    await sleep(2000)

    // borrow
    console.log(usdcAddress, usdcAmount, 2, 0, wallet.address);
    const borrowtx = await poolContract.borrow(usdcAddress, usdcAmount, 2, 0, wallet.address);
    const borrowtxreceipt = await borrowtx.wait(6);
    console.log(`${usdcAmount} borrowed on Aave at: `, borrowtxreceipt)

    return usdcAmount
}
