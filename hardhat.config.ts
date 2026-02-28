import type { HardhatUserConfig } from "hardhat/config";

import dotenv from "dotenv";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";

dotenv.config({ quiet: true });

const config: HardhatUserConfig = {
    plugins: [hardhatToolboxMochaEthersPlugin],
    solidity: {
        profiles: {
            default: {
                version: "0.8.32",
            },
            production: {
                version: "0.8.32",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        },
    },
    networks: {
        node: {
            type: "edr-simulated",
            chainType: "l1",
            mining: {
                auto: false,
                interval: 1000, // milliseconds
            },
        },
        localhost: {
            type: "http",
            chainType: "l1",
            url: "http://localhost:8545",
            chainId: 31337,
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
            }
        },
        SepoliaTestnet: {
            type: "http",
            chainType: "l1",
            url: process.env.SEPOLIA_TESTNET_RPC_URL!,
            chainId: Number(process.env.SEPOLIA_TESTNET_CHAIN_ID!),
            accounts: [configVariable("SEPOLIA_PRIVATE_KEY_DEPLOY_ACCOUNT")],
        },
    },
    verify: {
        etherscan: {
            apiKey: process.env.ETHERSCAN_API_KEY,
        },
        sourcify: {
            enabled: true,
            apiUrl: process.env.SOURCIFY_API_URL,
        },
    },
};

export default config;
