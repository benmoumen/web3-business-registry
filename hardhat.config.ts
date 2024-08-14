import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "MATIC",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report-matic.txt",
    noColors: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  networks: {
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY as string],
      chainId: 80002,
    },
  },
  sourcify: {
    enabled: true
  }
};

export default config;
