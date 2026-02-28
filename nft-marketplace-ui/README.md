# NFT Marketplace UI

React frontend for the NFT Marketplace dApp.  
This UI connects to `NFTMarketplace` and `XSGD` contracts with ethers v6 and MetaMask.

## What This UI Supports

- Browse active NFT listings from the marketplace contract
- Buy listed NFTs with XSGD (with allowance flow)
- List NFTs by collection address, token ID, and price
- Cancel your own active listings
- Connect wallet with MetaMask and switch to supported network
- Read listings in read-only mode (without wallet connection)

## Tech Stack

- React + Vite + TypeScript
- ethers v6
- Redux Toolkit
- HeroUI
- React Router

## Prerequisites

- Node.js
- Yarn (via Corepack)
- MetaMask browser extension
- Deployed `XSGD` and `NFTMarketplace` contract addresses

## Installation

Run from `nft-marketplace-ui`:

```bash
corepack enable
yarn install
```

## Environment Setup

Create the UI env file:

```bash
cp example.env .env
```

### Required Variables

- `VITE_SEPOLIA_TESTNET_RPC_URL`
- `VITE_SEPOLIA_TESTNET_CHAIN_ID`
- `VITE_SEPOLIA_TESTNET_CHAIN_HEX`
- `VITE_SEPOLIA_TESTNET_CHAIN_NAME`
- `VITE_SEPOLIA_TESTNET_BLOCK_EXPLORER_URL`
- `VITE_MARKETPLACE_ADDRESS`
- `VITE_XSGD_ADDRESS`

### Localhost Example

The variable names use `SEPOLIA` but you can point them to localhost for local development:

```env
VITE_SEPOLIA_TESTNET_RPC_URL=http://127.0.0.1:8545
VITE_SEPOLIA_TESTNET_CHAIN_ID=31337
VITE_SEPOLIA_TESTNET_CHAIN_HEX=0x7a69
VITE_SEPOLIA_TESTNET_CHAIN_NAME=Hardhat Localhost
VITE_SEPOLIA_TESTNET_BLOCK_EXPLORER_URL=http://127.0.0.1:8545
VITE_MARKETPLACE_ADDRESS=0x...
VITE_XSGD_ADDRESS=0x...
```

## Contract Address Wiring

If you deploy from the root Hardhat project:

- Read XSGD address from `../ignition/deployments/xsgd-<network>/deployed_addresses.json`
  using key `XSGDModule#XSGD`
- Read marketplace address from
  `../ignition/deployments/nft-marketplace-<network>/deployed_addresses.json`
  using key `NFTMarketplaceModule#NFTMarketplace`

Then set:

- `VITE_XSGD_ADDRESS=<xsgd_address>`
- `VITE_MARKETPLACE_ADDRESS=<marketplace_address>`

## Run the App

```bash
yarn dev
```

Default Vite URL is typically `http://localhost:5173`.

## Available Scripts

- `yarn dev` - start development server
- `yarn build` - type-check and build production bundle
- `yarn preview` - preview production build locally
- `yarn type-check` - run TypeScript checks only
- `yarn format` - format `src` files with Prettier
- `yarn analyze` - build with analyze mode

## Quick Local End-to-End

1. In project root, run `yarn hardhat node`
2. In project root (new terminal), deploy contracts:
   - `yarn hardhat run scripts/deploy-xsgd.ts --network localhost`
   - `yarn hardhat run scripts/deploy-nft-marketplace.ts --network localhost`
   - `yarn hardhat run scripts/deploy-test-erc721.ts --network localhost`
3. Copy deployed addresses into `nft-marketplace-ui/.env`
4. In `nft-marketplace-ui`, run `yarn dev`
5. Connect MetaMask and switch to the configured chain

## Troubleshooting

- `Missing or invalid VITE_MARKETPLACE_ADDRESS`:
  check `VITE_MARKETPLACE_ADDRESS` is set and is a valid address.
- `Missing or invalid VITE_XSGD_ADDRESS`:
  check `VITE_XSGD_ADDRESS` is set and is a valid address.
- Wallet on wrong network:
  click the navbar switch button or update chain values in `.env`.
- MetaMask not detected:
  install/enable MetaMask and reload the page.
