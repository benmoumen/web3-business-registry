# Web3 Business Registry Smart Contracts

This project offers a Smart Contract development toolkit for the Web3 Business Registry decentralized business registration, issuing ownership and governance tokens, and ultimately facilitating business management through decentralized autonomous organizations (DAO).

## Features

![](https://cdn.jsdelivr.net/gh/Readme-Workflows/Readme-Icons@main/icons/octicons/IssueClosed.svg) Ensure secure and immutable record-keeping on the blockchain.

![](https://cdn.jsdelivr.net/gh/Readme-Workflows/Readme-Icons@main/icons/octicons/IssueClosed.svg) Register companies and issue unique tokens representing ownership and governance rights.

![](https://cdn.jsdelivr.net/gh/Readme-Workflows/Readme-Icons@main/icons/octicons/IssueDrafted.svg) Enable token holders to suggest and vote on proposals through a web platform.

## Technology

### Blockchain

[`Ethereum Polygon Testnet`](https://amoy.polygonscan.com): Fast and gas-efficient, ideal for development and testing.

[`MATIC Token`](https://polygon.technology/matic-token): Used for paying transaction fees on the Polygon network.

### Token standard

[`ERC1155`](https://eips.ethereum.org/EIPS/eip-1155): A multi-token standard that provides greater flexibility and efficiency in managing multiple token types, perfect for our ownership and governance tokens.

### Wallet

[`MetaMask`](https://metamask.io/download/): An easy-to-use browser extension wallet for managing digital assets and interacting with the blockchain.

### Development Tools

[`Hardhat`](http://hardhat.org): A powerful development environment for compiling, deploying, testing, and debugging Ethereum smart contracts.

[`Chai`](https://www.chaijs.com): An assertion library used with Hardhat for writing and running tests.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Hardhat](https://hardhat.org/)

### Installation

Clone the repository and install the dependencies:

```
git clone https://github.com/benmoumen/web3-business-registry.git
cd web3-business-registry
npm install
```

### Testing

```
npm run test
```

### Contract Deployment

```
npx hardhat ignition deploy ./ignition/modules/deploy-company-shares-as-tokens.ts --network polygonAmoy --deployment-id upgradeableCoTo
```

#### Deployed Addresses

- ProxyModule#CompanySharesAsTokens: `0x1d0819057758961E57d7cB023513B926B3cFAC91`
  https://amoy.polygonscan.com/address/0x1d0819057758961e57d7cb023513b926b3cfac91

- CompanySharesAsTokensModule#CompanySharesAsTokens: `0xe4c7bE043298aa5C7B9b0F48f545fadEd67bA272`
  https://amoy.polygonscan.com/address/0xe4c7be043298aa5c7b9b0f48f545faded67ba272

### Contract Verification

```
npx hardhat ignition verify upgradeableCoTo --include-unrelated-contracts
```

### Directory Structure

- `contracts/`: Contains the smart contract code.
- `test/`: Contains the test files for the smart contracts.
- `ignition/modules/`: Contains the Hardhat Ignition module for deploying the contracts.
