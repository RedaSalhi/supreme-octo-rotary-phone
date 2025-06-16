import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RiskMetrics {
  var: number;
  cvar: number;
  volatility: number;
  sharpeRatio: number;
  beta: number;
  correlation: number;
  lastUpdated: string;
}

interface RiskDataState {
  metrics: RiskMetrics | null;
  confidenceLevel: number;
  timeHorizon: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: RiskDataState = {
  metrics: null,
  confidenceLevel: 0.95,
  timeHorizon: 1, // in days
  isLoading: false,
  error: null,
};

const riskDataSlice = createSlice({
  name: 'riskData',
  initialState,
  reducers: {
    setRiskMetrics: (state, action: PayloadAction<RiskMetrics>) => {
      state.metrics = action.payload;
    },
    setConfidenceLevel: (state, action: PayloadAction<number>) => {
      state.confidenceLevel = action.payload;
    },
    setTimeHorizon: (state, action: PayloadAction<number>) => {
      state.timeHorizon = action.payload;
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
  setRiskMetrics,
  setConfidenceLevel,
  setTimeHorizon,
  setLoading,
  setError,
} = riskDataSlice.actions;

export default riskDataSlice.reducer; 