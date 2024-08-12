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
git clone https://github.com/[unctad]/web3-business-registry.git
cd web3-business-registry
npm install
```
### Running Tasks
Try running some of the following tasks:

```
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/BusinessRegistry.ts
```
### Directory Structure
- `contracts/`: Contains the smart contract code.
- `test/`: Contains the test files for the smart contracts.
- `ignition/modules/`: Contains the Hardhat Ignition module for deploying the contracts.