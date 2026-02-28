/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEPOLIA_TESTNET_RPC_URL?: string;
  readonly VITE_SEPOLIA_TESTNET_CHAIN_ID?: string;
  readonly VITE_SEPOLIA_TESTNET_CHAIN_HEX?: string;
  readonly VITE_SEPOLIA_TESTNET_CHAIN_NAME?: string;
  readonly VITE_SEPOLIA_TESTNET_BLOCK_EXPLORER_URL?: string;
  readonly VITE_MARKETPLACE_ADDRESS?: string;
  readonly VITE_XSGD_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
