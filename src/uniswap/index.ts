
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { UNISWAP_ADDRESS } from '../constants/config';
import { WETHabi } from '../abis/WETH';
import { usdcAbi } from '../abis/usdc';
import { UNISWAP_V3_ROUTER_ABI } from '../abis/uniswap';

dotenv.config();
let RPC_URL: string = "";
let UNISWAP_V3_ROUTER_ADDRESS: string = "";
let USDC_TOKEN_ADDRESS: string = "";
let WETH_ADDRESS: string = "";
if (process.env.NETWORK == "421613") {
    RPC_URL = process.env.ARBYGOERLI_URL!;
    UNISWAP_V3_ROUTER_ADDRESS = UNISWAP_ADDRESS.arbigoerli.UNISWAP_V3_ROUTER_ADDRESS!;
    USDC_TOKEN_ADDRESS = UNISWAP_ADDRESS.arbigoerli.USDC_TOKEN_ADDRESS!;
    WETH_ADDRESS = UNISWAP_ADDRESS.arbitrum.WETH_ADDRESS!;
} else if (process.env.NETWORK == "534351") {
    RPC_URL = process.env.SCROLLTESTNET_URL!;
    UNISWAP_V3_ROUTER_ADDRESS = UNISWAP_ADDRESS.scrolltestnet.UNISWAP_V3_ROUTER_ADDRESS;
    USDC_TOKEN_ADDRESS = UNISWAP_ADDRESS.scrolltestnet.USDC_TOKEN_ADDRESS!;
    WETH_ADDRESS = UNISWAP_ADDRESS.arbitrum.WETH_ADDRESS!;
} else if (process.env.NETWORK == "80001") {
    RPC_URL = process.env.MUMBAI_URL!;
    UNISWAP_V3_ROUTER_ADDRESS = UNISWAP_ADDRESS.mumbai.UNISWAP_V3_ROUTER_ADDRESS!;
    USDC_TOKEN_ADDRESS = UNISWAP_ADDRESS.mumbai.USDC_TOKEN_ADDRESS!;
    WETH_ADDRESS = UNISWAP_ADDRESS.arbitrum.WETH_ADDRESS!;
} else if (process.env.NETWORK == "42161") {
    RPC_URL = process.env.ARBITRUM_URL!;
    UNISWAP_V3_ROUTER_ADDRESS = UNISWAP_ADDRESS.arbitrum.UNISWAP_V3_ROUTER_ADDRESS!;
    USDC_TOKEN_ADDRESS = UNISWAP_ADDRESS.arbitrum.USDC_TOKEN_ADDRESS!;
    WETH_ADDRESS = UNISWAP_ADDRESS.arbitrum.WETH_ADDRESS!;
} else if (process.env.NETWORK == "5") {
    RPC_URL = process.env.GOERLI_URL!;
    UNISWAP_V3_ROUTER_ADDRESS = UNISWAP_ADDRESS.goerli.UNISWAP_V3_ROUTER_ADDRESS!;
    USDC_TOKEN_ADDRESS = UNISWAP_ADDRESS.goerli.USDC_TOKEN_ADDRESS!;
    WETH_ADDRESS = UNISWAP_ADDRESS.goerli.WETH_ADDRESS!;
}
async function checkAndApproveAllowance(
    wallet: ethers.Wallet,
    tokenContract: ethers.Contract,
    spenderAddress: string,
    amount: ethers.BigNumberish
): Promise<void> {
    // Check current allowance
    const allowance: ethers.BigNumberish = await tokenContract.allowance(wallet.address, spenderAddress);
    // If allowance is less than the amount, approve it
    if (allowance < amount) {
        console.log('Approving tokens...')
        const approveTx = await tokenContract.approve(spenderAddress, amount);
        await approveTx.wait();
        console.log('Allowance approved');
    }
}

export async function tradeUSDCForETH(usdcAmount: number) {

    // Connect to the Ethereum network
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Set up your Ethereum wallet
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

    // Uniswap V3 Router and USDC Contract Setup
    const uniswapV3RouterAddress: string = UNISWAP_V3_ROUTER_ADDRESS;
    const uniswapV3RouterABI: any[] = UNISWAP_V3_ROUTER_ABI
    const usdcAddress: string = USDC_TOKEN_ADDRESS;
    const usdcABI: any[] = usdcAbi
    const router = new ethers.Contract(uniswapV3RouterAddress, uniswapV3RouterABI, wallet);
    const usdcContract = new ethers.Contract(usdcAddress, usdcABI, wallet);
    // Check and approve USDC allowance
    const amountIn: ethers.BigNumberish = usdcAmount; // USDC has 6 decimals
    // const allowance = await usdcContract.allowance(wallet.address, uniswapV3RouterAddress);
    // console.log('allowance: ', allowance)
    await checkAndApproveAllowance(wallet, usdcContract, uniswapV3RouterAddress, amountIn);
    console.log('successfully checked and approved allowance')
    // Trade parameters
    const deadline: number = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    const wethAddress: string = WETH_ADDRESS;
    const wethContract = new ethers.Contract(wethAddress, WETHabi, wallet)
    // Encoding the addresses and fee


    // Execute trade: USDC to ETH
    const tx = await router.exactInputSingle([
        usdcAddress,//tokenIn
        wethAddress,//tokenOut
        3000, // Fee
        wallet.address, // recipient
        deadline,
        amountIn,
        0, // amountOutMinimum
        0 // sqrtPriceLimitX96
    ]);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log('Trade executed successfully!', receipt);
    let wethBalance = await wethContract.balanceOf(wallet.address);
    const wethtx = await wethContract.withdraw(wethBalance);
    await wethtx.wait(6);
    // console.log("wethBalance: ", wethBalance.toString())
    return wethBalance

}

// Check if the script is being run directly
if (require.main === module) {
    tradeUSDCForETH(100).catch(console.error);
}

// export { tradeUSDCForETH };
