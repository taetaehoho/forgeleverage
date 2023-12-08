import { ethers } from "ethers";
import { pool } from '../abis/aavepool';
import { WETHGateway } from "../abis/WETHGateway";
import { CONFIG } from "../constants/config";
import { sleep } from "../constants/sleep";
import dotenv from 'dotenv';
dotenv.config();