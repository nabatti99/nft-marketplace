import { ethers } from "ethers";
import {
  NFTMarketplace,
  NFTMarketplace__factory,
  TestERC721,
  TestERC721__factory,
  XSGD,
  XSGD__factory,
} from "./ethers-contracts/index.js";

export const MARKETPLACE_CONFIG = {
  chainId: Number(import.meta.env.VITE_SEPOLIA_TESTNET_CHAIN_ID),
  chainHex: import.meta.env.VITE_SEPOLIA_TESTNET_CHAIN_HEX!,
  chainName: import.meta.env.VITE_SEPOLIA_TESTNET_CHAIN_NAME!,
  rpcUrl: import.meta.env.VITE_SEPOLIA_TESTNET_RPC_URL!,
  blockExplorerUrl: import.meta.env.VITE_SEPOLIA_TESTNET_BLOCK_EXPLORER_URL!,
  marketplaceAddress: import.meta.env.VITE_MARKETPLACE_ADDRESS!,
  xsgdAddress: import.meta.env.VITE_XSGD_ADDRESS!,
};

export type TxAction = "approve_xsgd" | "approve_nft" | "list_nft" | "buy_nft" | "cancel_listing";

export type TransactionData = {
  action: TxAction;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
};

export type TransactionList = Record<string, TransactionData>;

export type MarketplaceListing = {
  key: string;
  nftContract: string;
  tokenId: bigint;
  seller: string;
  price: bigint;
};

export type AppProvider = ethers.BrowserProvider | ethers.JsonRpcProvider;

export function getMarketplaceAddress(): string {
  if (!ethers.isAddress(MARKETPLACE_CONFIG.marketplaceAddress)) {
    throw new Error("Missing or invalid VITE_MARKETPLACE_ADDRESS.");
  }
  return MARKETPLACE_CONFIG.marketplaceAddress;
}

export function getXsgdAddress(): string {
  if (!ethers.isAddress(MARKETPLACE_CONFIG.xsgdAddress)) {
    throw new Error("Missing or invalid VITE_XSGD_ADDRESS.");
  }
  return MARKETPLACE_CONFIG.xsgdAddress;
}

export function getReadOnlyProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(MARKETPLACE_CONFIG.rpcUrl, MARKETPLACE_CONFIG.chainId);
}

export async function connectMetamask(): Promise<ethers.BrowserProvider> {
  if ((window as { ethereum?: unknown }).ethereum == null) {
    throw new Error("Please install MetaMask.");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  await ensureSupportedNetwork(provider);
  return provider;
}

export async function ensureSupportedNetwork(provider: ethers.BrowserProvider): Promise<void> {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== MARKETPLACE_CONFIG.chainId) {
    await switchNetwork(provider);
  }
}

async function switchNetwork(provider: ethers.BrowserProvider): Promise<void> {
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: MARKETPLACE_CONFIG.chainHex }]);
  } catch (error: unknown) {
    const switchError = error as { error: { code?: number } };
    if (switchError.error.code === 4902) {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: MARKETPLACE_CONFIG.chainHex,
          chainName: MARKETPLACE_CONFIG.chainName,
          nativeCurrency: {
            name: "Sepolia Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: [MARKETPLACE_CONFIG.rpcUrl],
          blockExplorerUrls: [MARKETPLACE_CONFIG.blockExplorerUrl],
        },
      ]);
      return;
    }

    throw error;
  }
}

export function createExplorerLink(data?: string, type?: "tx" | "address"): string {
  switch (type) {
    case "tx":
      return `${MARKETPLACE_CONFIG.blockExplorerUrl}/tx/${data}`;
    case "address":
      return `${MARKETPLACE_CONFIG.blockExplorerUrl}/address/${data}`;
    default:
      return MARKETPLACE_CONFIG.blockExplorerUrl;
  }
}

export function compareAddress(addr1: string, addr2: string): boolean {
  return addr1.toLowerCase() === addr2.toLowerCase();
}

export function displayAddress(addr: string, type: "short" | "long" | "full" = "short"): string {
  switch (type) {
    case "short":
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    case "long":
      return `${addr.slice(0, 15)}...${addr.slice(-4)}`;
    case "full":
      return addr;
    default:
      return addr;
  }
}

export function buildListingKey(nftContract: string, tokenId: bigint): string {
  return `${nftContract.toLowerCase()}:${tokenId.toString()}`;
}

export function getMarketplaceContract(
  runner: ethers.ContractRunner,
  marketplaceAddress = getMarketplaceAddress()
): NFTMarketplace {
  return NFTMarketplace__factory.connect(marketplaceAddress, runner);
}

export function getXsgdContract(runner: ethers.ContractRunner, xsgdAddress = getXsgdAddress()): XSGD {
  return XSGD__factory.connect(xsgdAddress, runner);
}

export function getErc721LikeContract(address: string, runner: ethers.ContractRunner): TestERC721 {
  if (!ethers.isAddress(address)) {
    throw new Error("Invalid NFT contract address.");
  }
  return TestERC721__factory.connect(address, runner);
}

export async function fetchActiveListings(
  provider: AppProvider,
  marketplaceAddress = getMarketplaceAddress()
): Promise<Array<MarketplaceListing>> {
  const marketplace = getMarketplaceContract(provider, marketplaceAddress);
  const listedContracts = await marketplace.getListedContracts();

  const activeListings: Array<MarketplaceListing> = [];

  for (const nftContract of listedContracts) {
    const [tokenIds, listings] = await marketplace.getListingsByContract(nftContract);

    const pairs = tokenIds
      .map((tokenId, index) => ({
        tokenId,
        listing: listings[index],
      }))
      .filter(({ listing }) => listing.isActive)
      .sort((a, b) => (a.tokenId > b.tokenId ? -1 : a.tokenId < b.tokenId ? 1 : 0));

    for (const { tokenId, listing } of pairs) {
      activeListings.push({
        key: buildListingKey(nftContract, tokenId),
        nftContract,
        tokenId,
        seller: listing.seller,
        price: listing.price,
      });
    }
  }

  return activeListings;
}

export async function isNftApprovedForMarketplace(
  provider: ethers.BrowserProvider,
  nftContractAddress: string,
  tokenId: bigint,
  marketplaceAddress = getMarketplaceAddress()
): Promise<boolean> {
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  const nftContract = getErc721LikeContract(nftContractAddress, signer);

  const approvedAddress = await nftContract.getApproved(tokenId);
  if (compareAddress(approvedAddress, marketplaceAddress)) {
    return true;
  }

  return nftContract.isApprovedForAll(signerAddress, marketplaceAddress);
}

export async function approveNftForMarketplace(
  provider: ethers.BrowserProvider,
  nftContractAddress: string,
  tokenId: bigint,
  marketplaceAddress = getMarketplaceAddress()
): Promise<ethers.ContractTransactionResponse> {
  const signer = await provider.getSigner();
  const nftContract = getErc721LikeContract(nftContractAddress, signer);
  return nftContract.approve(marketplaceAddress, tokenId);
}

export async function listNft(
  provider: ethers.BrowserProvider,
  nftContractAddress: string,
  tokenId: bigint,
  price: bigint,
  marketplaceAddress = getMarketplaceAddress()
): Promise<ethers.ContractTransactionResponse> {
  const signer = await provider.getSigner();
  const marketplace = getMarketplaceContract(signer, marketplaceAddress);
  return marketplace.listNFT(nftContractAddress, tokenId, price);
}

export async function approveXsgd(
  provider: ethers.BrowserProvider,
  amount: bigint,
  xsgdAddress = getXsgdAddress(),
  marketplaceAddress = getMarketplaceAddress()
): Promise<ethers.ContractTransactionResponse> {
  const signer = await provider.getSigner();
  const xsgd = getXsgdContract(signer, xsgdAddress);
  return xsgd.approve(marketplaceAddress, amount);
}

export async function buyNft(
  provider: ethers.BrowserProvider,
  nftContractAddress: string,
  tokenId: bigint,
  marketplaceAddress = getMarketplaceAddress()
): Promise<ethers.ContractTransactionResponse> {
  const signer = await provider.getSigner();
  const marketplace = getMarketplaceContract(signer, marketplaceAddress);
  return marketplace.buyNFT(nftContractAddress, tokenId);
}

export async function cancelListing(
  provider: ethers.BrowserProvider,
  nftContractAddress: string,
  tokenId: bigint,
  marketplaceAddress = getMarketplaceAddress()
): Promise<ethers.ContractTransactionResponse> {
  const signer = await provider.getSigner();
  const marketplace = getMarketplaceContract(signer, marketplaceAddress);
  return marketplace.cancelListing(nftContractAddress, tokenId);
}

export async function getXsgdAllowance(
  provider: ethers.BrowserProvider,
  ownerAddress: string,
  xsgdAddress = getXsgdAddress(),
  marketplaceAddress = getMarketplaceAddress()
): Promise<bigint> {
  const signer = await provider.getSigner();
  const xsgd = getXsgdContract(signer, xsgdAddress);
  return xsgd.allowance(ownerAddress, marketplaceAddress);
}
