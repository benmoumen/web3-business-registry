import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-verify";
import "hardhat-contract-sizer";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "MATIC",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report-matic.txt",
    noColors: true,
  },
  etherscan: {
    //apiKey: process.env.ETHERSCAN_API_KEY,
    apiKey: {
      polygonAmoy: process.env.POLYGON_AMOY_API_KEY as string,
      //polygonAmoy: process.env.OK_LINK_API_KEY as string,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
          //apiURL: "https://www.oklink.com/api/explorer/v1/contract/verify/async/api/polygonAmoy",
          //browserURL: "https://www.oklink.com/polygonAmoy",
        },
      },
    ],
  },
  networks: {
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL as string,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY as string],
      chainId: 80002,
      gasPrice: "auto",
    },
  },
  sourcify: {
    enabled: true,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [":TokenizedBusinessRegistry$"],
  },
};

export default config;
