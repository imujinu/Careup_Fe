import { createSlice } from "@reduxjs/toolkit";

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState: {
    isOpen: true,
  },
  reducers: {
    toggleChatbot: (state) => {
      state.isOpen = !state.isOpen;
    },
    openChatbot: (state) => {
      state.isOpen = true;
    },
    closeChatbot: (state) => {
      state.isOpen = false;
    },
  },
});

export const { toggleChatbot, openChatbot, closeChatbot } =
  chatbotSlice.actions;
export default chatbotSlice.reducer;
