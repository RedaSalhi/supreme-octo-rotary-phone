import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY';
export type UpdateFrequency = 'realtime' | '1min' | '5min' | '15min' | '1hour';

interface SettingsState {
  theme: Theme;
  currency: Currency;
  updateFrequency: UpdateFrequency;
  notifications: boolean;
  language: string;
  dataSource: string;
}

const initialState: SettingsState = {
  theme: 'system',
  currency: 'USD',
  updateFrequency: '5min',
  notifications: true,
  language: 'en',
  dataSource: 'default',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setCurrency: (state, action: PayloadAction<Currency>) => {
      state.currency = action.payload;
    },
    setUpdateFrequency: (state, action: PayloadAction<UpdateFrequency>) => {
      state.updateFrequency = action.payload;
    },
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setDataSource: (state, action: PayloadAction<string>) => {
      state.dataSource = action.payload;
    },
  },
});

export const {
  setTheme,
  setCurrency,
  setUpdateFrequency,
  setNotifications,
  setLanguage,
  setDataSource,
} = settingsSlice.actions;

export default settingsSlice.reducer; 