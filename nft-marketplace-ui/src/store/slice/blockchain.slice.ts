import { TransactionData, TransactionList } from "@/services/blockchain/blockchain";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { ethers } from "ethers";

export interface BlockchainState {
  provider: ethers.BrowserProvider | null;
  walletAddress: string | null;
  lastRequestTimestamp: number;
  transactions: TransactionList;
}

const savedTransactions = localStorage.getItem("transactions");
const transactions: TransactionList = savedTransactions ? JSON.parse(savedTransactions) : {};

const initialState: BlockchainState = {
  provider: null,
  walletAddress: null,
  lastRequestTimestamp: Date.now(),
  transactions,
};

const blockchainSlice = createSlice({
  name: "Blockchain",
  initialState,
  reducers: {
    connectBlockchain: (state, action: PayloadAction<{ provider: ethers.BrowserProvider; walletAddress: string }>) => {
      state.provider = action.payload.provider;
      state.walletAddress = action.payload.walletAddress;
      localStorage.setItem("walletAddress", action.payload.walletAddress);
    },
    disconnectBlockchain: state => {
      state.provider = null;
      state.walletAddress = null;
      localStorage.removeItem("walletAddress");
    },
    invalidateRequests: state => {
      state.lastRequestTimestamp = Date.now();
    },
    addTransaction: (state, action: PayloadAction<{ key: string; data: TransactionData }>) => {
      state.transactions[action.payload.key] = action.payload.data;
      localStorage.setItem("transactions", JSON.stringify(state.transactions));
    },
    updateTransaction: (state, action: PayloadAction<{ key: string; data: Partial<TransactionData> }>) => {
      state.transactions[action.payload.key] = {
        ...state.transactions[action.payload.key],
        ...action.payload.data,
      };
      localStorage.setItem("transactions", JSON.stringify(state.transactions));
    },
  },
});

// Action creators are generated for each case reducer function
export const { connectBlockchain, disconnectBlockchain, invalidateRequests, addTransaction, updateTransaction } =
  blockchainSlice.actions;

export default blockchainSlice.reducer;
