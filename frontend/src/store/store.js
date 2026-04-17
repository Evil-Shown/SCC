import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import groupReducer from "../features/groups/groupSlice";
import chatReducer from "../features/chat/chatSlice";
import notesReducer from "../features/notes/notesSlice";
import kuppiReducer from "../features/kuppi/kuppiSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import meetupReducer from "../features/meetups/meetupSlice";
import examReducer from "../features/exam/examSlice"; //Mithun's exam mode features



export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupReducer,
    chat: chatReducer,
    notes: notesReducer,
    kuppi: kuppiReducer,
    notifications: notificationsReducer,
    exam: examReducer,
    meetups: meetupReducer,
    polls: pollReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/** Lets `api.js` read the token without importing the store (avoids circular deps with authService → api). */
if (typeof window !== "undefined") {
  window.__SCC_STORE__ = store;
}

export default store;
