import { api } from "@/services/api";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider, useSelector, type TypedUseSelectorHook } from "react-redux";

// ======== Slices ======== //
import globalSlice from "@/store/slice/global.slice";
import blockchainSlice from "./slice/blockchain.slice.js";

/**
 * Combine all slices into one
 */
const rootReducer = combineReducers({
  // add your reducers here ..
  global: globalSlice,
  blockchain: blockchainSlice,

  //App service reducer
  [api.reducerPath]: api.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(api.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector<RootState>;
export const useAppDispatch = () => store.dispatch;

export const ReduxProvider = Provider;
