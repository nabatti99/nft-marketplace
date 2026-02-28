# NFT Marketplace

An end-to-end NFT marketplace project with:

- Solidity smart contracts (Hardhat)
- NFT Marketplace UI (React + ethers v6 + MetaMask + HeroUI)

The marketplace contract supports listing, canceling, and buying ERC721 NFTs using XSGD token payments.

## Tech Stack

- Node.js
- Yarn (via Corepack)
- Hardhat 3 + Solidity
- React + Vite
- ethers v6
- MetaMask
- HeroUI

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
cp nft-marketplace-ui/example.env nft-marketplace-ui/.env
```

### Root `.env`

Required:

- `SEPOLIA_TESTNET_RPC_URL`
- `SEPOLIA_TESTNET_CHAIN_ID`

Optional:

- `ETHERSCAN_API_KEY` (only needed for contract verification)

Notes:

- `SEPOLIA_PRIVATE_KEY_DEPLOY_ACCOUNT` is loaded from Hardhat keystore, not plain-text `.env`.

### UI `.env` (`nft-marketplace-ui/.env`)

- `VITE_SEPOLIA_TESTNET_RPC_URL`
- `VITE_SEPOLIA_TESTNET_CHAIN_ID`
- `VITE_SEPOLIA_TESTNET_CHAIN_HEX`
- `VITE_SEPOLIA_TESTNET_CHAIN_NAME`
- `VITE_SEPOLIA_TESTNET_BLOCK_EXPLORER_URL`
- `VITE_MARKETPLACE_ADDRESS`
- `VITE_XSGD_ADDRESS`

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

After deployment, read contract addresses from:

- `ignition/deployments/xsgd-<network>/deployed_addresses.json` using key `XSGDModule#XSGD`
- `ignition/deployments/nft-marketplace-<network>/deployed_addresses.json` using key `NFTMarketplaceModule#NFTMarketplace`

Set these in `nft-marketplace-ui/.env`:

```bash
VITE_XSGD_ADDRESS=...
VITE_MARKETPLACE_ADDRESS=...
```

## Run NFT Marketplace UI

```bash
cd nft-marketplace-ui
yarn install
yarn dev
```

MetaMask must be connected to the same network configured in the UI `.env`.

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
- `scripts/local-setup.ts` is not in the primary flow because it depends on `AMOY_*` variables not included in current example env files.
- Yarn is the package manager for all commands (`corepack enable`, `yarn install`, `yarn hardhat`, `yarn dev`).
