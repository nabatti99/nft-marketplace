import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

export type AppTheme = "light" | "dark";
export type AppRole = "buyer" | "seller";

export interface GlobalState {
  theme?: AppTheme;
}

const initialState: GlobalState = {
  theme: (localStorage.getItem("theme") as AppTheme) || "light",
};

const globalSlice = createSlice({
  name: "Global",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<AppTheme | undefined>) => {
      state.theme = action.payload;

      if (action.payload) {
        localStorage.setItem("theme", action.payload);
      } else {
        localStorage.removeItem("theme");
      }
    },
  },
});

// Action creators are generated for each case reducer function
export const { setTheme } = globalSlice.actions;

export default globalSlice.reducer;
