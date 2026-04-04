import { io } from "socket.io-client";
import { store } from "../store/store.js";
import { addNotificationRealtime } from "../features/notifications/notificationsSlice.js";
import {
  meetupCreatedRealtime,
  meetupUpdatedRealtime,
  meetupStatusChangedRealtime,
  meetupVotedRealtime,
} from "../features/meetups/meetupSlice.js";
import {
  updateGroupRealtime,
  memberJoinedRealtime,
  memberLeftRealtime,
  inviteReceivedRealtime,
  addActivityRealtime,
} from "../features/groups/groupSlice.js";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

/**
 * Initialize socket connection and register all event listeners.
 */
export const initSocket = (userId) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, { auth: { userId } });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    if (userId) socket.emit("join-room", userId);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  // ── Notifications ─────────────────────────────────────────
  socket.on("notification:new", (notification) => {
    store.dispatch(addNotificationRealtime(notification));
  });

  // ── Meetup real-time events ───────────────────────────────
  socket.on("group-meetup:created", (payload) => {
    store.dispatch(meetupCreatedRealtime(payload));
  });

  socket.on("group-meetup:updated", (payload) => {
    store.dispatch(meetupUpdatedRealtime(payload));
  });

  socket.on("group-meetup:status-changed", (payload) => {
    store.dispatch(meetupStatusChangedRealtime(payload));
  });

  socket.on("group-meetup:voted", (payload) => {
    store.dispatch(meetupVotedRealtime(payload));
  });

  // ── Group real-time events ────────────────────────────────

  /** Group info changed (name, desc, settings…) */
  socket.on("group:updated", (payload) => {
    if (payload?.group) store.dispatch(updateGroupRealtime(payload.group));
  });

  /** A new member joined a group room */
  socket.on("group:memberJoined", (payload) => {
    store.dispatch(memberJoinedRealtime(payload));
  });

  /** A member left a group */
  socket.on("group:memberLeft", (payload) => {
    store.dispatch(memberLeftRealtime(payload));
  });

  /** Current user received a group invite */
  socket.on("group:inviteReceived", (payload) => {
    store.dispatch(inviteReceivedRealtime(payload));
  });

  /** Activity log event arrived for a group the user is viewing */
  socket.on("group:activity", (payload) => {
    store.dispatch(addActivityRealtime(payload));
  });

  return socket;
};

/**
 * Get current socket instance.
 */
export const getSocket = () => socket;

/**
 * Disconnect and destroy socket.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a group room (for chat + meetup + group real-time).
 */
export const joinGroup = (groupId) => {
  if (socket) socket.emit("join-group", groupId);
};

/**
 * Leave a group room.
 */
export const leaveGroup = (groupId) => {
  if (socket) socket.emit("leave-group", groupId);
};

export default { initSocket, getSocket, disconnectSocket, joinGroup, leaveGroup };
