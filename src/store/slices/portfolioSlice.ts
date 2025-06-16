import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  weight: number;
  price: number;
  quantity: number;
  lastUpdated: string;
}

interface PortfolioState {
  assets: Asset[];
  totalValue: number;
  lastRebalanced: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  assets: [],
  totalValue: 0,
  lastRebalanced: null,
  isLoading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addAsset: (state, action: PayloadAction<Asset>) => {
      state.assets.push(action.payload);
      state.totalValue = state.assets.reduce(
        (sum, asset) => sum + asset.price * asset.quantity,
        0
      );
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      state.assets = state.assets.filter((asset) => asset.id !== action.payload);
      state.totalValue = state.assets.reduce(
        (sum, asset) => sum + asset.price * asset.quantity,
        0
      );
    },
    updateAsset: (state, action: PayloadAction<Asset>) => {
      const index = state.assets.findIndex((asset) => asset.id === action.payload.id);
      if (index !== -1) {
        state.assets[index] = action.payload;
        state.totalValue = state.assets.reduce(
          (sum, asset) => sum + asset.price * asset.quantity,
          0
        );
      }
    },
    setLastRebalanced: (state, action: PayloadAction<string>) => {
      state.lastRebalanced = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addAsset,
  removeAsset,
  updateAsset,
  setLastRebalanced,
  setLoading,
  setError,
} = portfolioSlice.actions;

export default portfolioSlice.reducer; 