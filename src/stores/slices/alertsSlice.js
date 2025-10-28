import { createSlice } from "@reduxjs/toolkit";

const alertsSlice = createSlice({
  name: "alerts",
  initialState: {
    isOpen: false,
  },
  reducers: {
    toggleAlerts: (state) => {
      state.isOpen = !state.isOpen;
    },
    openAlerts: (state) => {
      state.isOpen = true;
    },
    closeAlerts: (state) => {
      state.isOpen = false;
    },
  },
});

export const { toggleAlerts, openAlerts, closeAlerts } = alertsSlice.actions;
export default alertsSlice.reducer;
