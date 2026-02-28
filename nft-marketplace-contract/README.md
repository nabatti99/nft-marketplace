# NFT Marketplace Contract

This repository contains the Solidity smart contracts for an NFT marketplace project. The marketplace supports listing, canceling, and buying ERC721 NFTs using XSGD token payments.

## Tech Stack

- Node.js
- Yarn (via Corepack)
- Hardhat 3 + Solidity
- ethers v6

## Repository Layout

- `/contracts` - Solidity contracts
- `/scripts` - deployment and helper scripts
- `/test` - Hardhat tests
- `/ignition` - Hardhat Ignition modules and deployment outputs
- `/nft-marketplace-ui` - React frontend

## Prerequisites

Run from the repository root unless stated otherwise.

```bash
corepack enable
yarn install
```

## Environment Setup

Copy example env files:

```bash
cp example.env .env
```

### Root `.env`

Required:

- `SEPOLIA_TESTNET_RPC_URL`
- `SEPOLIA_TESTNET_CHAIN_ID`

Optional:

- `ETHERSCAN_API_KEY` (only needed for contract verification)

Notes:

- `SEPOLIA_PRIVATE_KEY_DEPLOY_ACCOUNT` is loaded from Hardhat keystore, not plain-text `.env`.

## Hardhat Commands

### General

```bash
yarn hardhat compile
yarn hardhat test
yarn hardhat node
```

### Local Deployment Flow

Start local node in terminal #1:

```bash
yarn hardhat node
```

Run deployments in terminal #2:

```bash
yarn hardhat run scripts/deploy-xsgd.ts --network localhost
yarn hardhat run scripts/deploy-nft-marketplace.ts --network localhost
yarn hardhat run scripts/deploy-test-erc721.ts --network localhost
yarn hardhat run scripts/mint-nft.ts --network localhost
```

### Sepolia Deployment Flow (Optional)

```bash
yarn hardhat keystore set SEPOLIA_PRIVATE_KEY_DEPLOY_ACCOUNT
yarn hardhat run scripts/deploy-xsgd.ts --network SepoliaTestnet
yarn hardhat run scripts/deploy-nft-marketplace.ts --network SepoliaTestnet
yarn hardhat run scripts/deploy-test-erc721.ts --network SepoliaTestnet
```

## Wiring Contract Addresses to UI

After deployment, go to `../nft-marketplace-ui` and continue working with the UI setup instructions there.

## Quick End-to-End (Local)

1. Start local chain: `yarn hardhat node`
2. Deploy contracts to `localhost`
3. Copy deployed contract addresses into `nft-marketplace-ui/.env`
4. Start frontend with `yarn dev` (inside `nft-marketplace-ui`)
5. Connect MetaMask and test listing/buying flow

## Validation Checklist

1. Confirm commands run: `compile`, `test`, `node`, and deployment scripts.
2. Confirm network names match config exactly: `localhost`, `SepoliaTestnet`.
3. Confirm env variable names match code usage.
4. Confirm deployment address keys:
   - `XSGDModule#XSGD`
   - `NFTMarketplaceModule#NFTMarketplace`
5. Verify the quick-start flow works from a clean clone.

## Notes

- This is a documentation-only update.
- Yarn is the package manager for all commands (`corepack enable`, `yarn install`, `yarn hardhat`, `yarn dev`).
