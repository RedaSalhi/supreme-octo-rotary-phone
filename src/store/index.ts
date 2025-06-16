import { configureStore } from '@reduxjs/toolkit';
import portfolioReducer from './slices/portfolioSlice';
import settingsReducer from './slices/settingsSlice';
import riskDataReducer from './slices/riskDataSlice';

export const store = configureStore({
  reducer: {
    portfolio: portfolioReducer,
    settings: settingsReducer,
    riskData: riskDataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 