import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as meetupService from "../../services/meetupService.js";

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchGroupMeetups = createAsyncThunk(
    "meetups/fetchGroupMeetups",
    async (groupId, { rejectWithValue }) => {
        try {
            const res = await meetupService.getGroupMeetups(groupId);
            return { groupId, meetups: res.data.data.meetups };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to fetch meetups");
        }
    }
);

export const createGroupMeetup = createAsyncThunk(
    "meetups/createGroupMeetup",
    async ({ groupId, payload }, { rejectWithValue }) => {
        try {
            const res = await meetupService.createGroupMeetup(groupId, payload);
            return { groupId, meetup: res.data.data.meetup };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to create meetup");
        }
    }
);

export const activateMeetup = createAsyncThunk(
    "meetups/activateMeetup",
    async ({ meetupId, groupId }, { rejectWithValue }) => {
        try {
            const res = await meetupService.activateMeetup(meetupId);
            return { groupId, meetup: res.data.data.meetup };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to activate meetup");
        }
    }
);

export const voteOnMeetup = createAsyncThunk(
    "meetups/voteOnMeetup",
    async ({ meetupId, groupId, response }, { rejectWithValue }) => {
        try {
            const res = await meetupService.voteOnMeetup(meetupId, response);
            return { groupId, meetup: res.data.data.meetup };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to cast vote");
        }
    }
);

export const completeMeetup = createAsyncThunk(
    "meetups/completeMeetup",
    async ({ meetupId, groupId }, { rejectWithValue }) => {
        try {
            const res = await meetupService.completeMeetup(meetupId);
            return { groupId, meetup: res.data.data.meetup };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to complete meetup");
        }
    }
);

// ─── Helper to update a meetup in both byId and byGroupId ────────────────────

const upsertMeetup = (state, groupId, meetup) => {
    if (!meetup || !meetup._id) return;
    state.byId[meetup._id] = meetup;
    if (state.byGroupId[groupId]) {
        const idx = state.byGroupId[groupId].items.findIndex((m) => m._id === meetup._id);
        if (idx >= 0) {
            state.byGroupId[groupId].items[idx] = meetup;
        } else {
            state.byGroupId[groupId].items.unshift(meetup);
        }
    }
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const meetupSlice = createSlice({
    name: "meetups",
    initialState: {
        byGroupId: {},  // { [groupId]: { items: [], loading, error } }
        byId: {},       // { [meetupId]: meetup }
        error: null,
    },
    reducers: {
        // Real-time socket event handlers
        meetupCreatedRealtime(state, action) {
            const { meetup } = action.payload;
            if (!meetup) return;
            const gid = meetup.groupId?._id || meetup.groupId;
            state.byId[meetup._id] = meetup;
            if (state.byGroupId[gid]) {
                const exists = state.byGroupId[gid].items.some((m) => m._id === meetup._id);
                if (!exists) state.byGroupId[gid].items.unshift(meetup);
            }
        },
        meetupUpdatedRealtime(state, action) {
            const { meetup } = action.payload;
            if (!meetup) return;
            const gid = meetup.groupId?._id || meetup.groupId;
            upsertMeetup(state, gid, meetup);
        },
        meetupStatusChangedRealtime(state, action) {
            const { meetupId, status, meetup } = action.payload;
            if (state.byId[meetupId]) state.byId[meetupId].status = status;
            if (meetup) {
                const gid = meetup.groupId?._id || meetup.groupId;
                upsertMeetup(state, gid, meetup);
            }
        },
        meetupVotedRealtime(state, action) {
            const { meetupId, yesCount, noCount, votes, status } = action.payload;
            if (state.byId[meetupId]) {
                state.byId[meetupId].yesCount = yesCount;
                state.byId[meetupId].noCount = noCount;
                state.byId[meetupId].votes = votes;
                state.byId[meetupId].status = status;
            }
            // Update in byGroupId
            for (const gid in state.byGroupId) {
                const idx = state.byGroupId[gid].items.findIndex((m) => m._id === meetupId);
                if (idx >= 0) {
                    state.byGroupId[gid].items[idx] = {
                        ...state.byGroupId[gid].items[idx],
                        yesCount, noCount, votes, status,
                    };
                }
            }
        },
        clearMeetupError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // fetchGroupMeetups
        builder
            .addCase(fetchGroupMeetups.pending, (state, action) => {
                const gid = action.meta.arg;
                if (!state.byGroupId[gid]) state.byGroupId[gid] = { items: [], loading: true, error: null };
                else state.byGroupId[gid].loading = true;
            })
            .addCase(fetchGroupMeetups.fulfilled, (state, action) => {
                const { groupId, meetups } = action.payload;
                state.byGroupId[groupId] = { items: meetups, loading: false, error: null };
                meetups.forEach((m) => { state.byId[m._id] = m; });
            })
            .addCase(fetchGroupMeetups.rejected, (state, action) => {
                const gid = action.meta.arg;
                if (state.byGroupId[gid]) state.byGroupId[gid].loading = false;
                state.error = action.payload;
            });

        // createGroupMeetup
        builder
            .addCase(createGroupMeetup.fulfilled, (state, action) => {
                const { groupId, meetup } = action.payload;
                state.byId[meetup._id] = meetup;
                if (state.byGroupId[groupId]) {
                    state.byGroupId[groupId].items.unshift(meetup);
                }
            })
            .addCase(createGroupMeetup.rejected, (state, action) => {
                state.error = action.payload;
            });

        // activateMeetup, voteOnMeetup, completeMeetup — all update the meetup
        for (const thunk of [activateMeetup, voteOnMeetup, completeMeetup]) {
            builder
                .addCase(thunk.fulfilled, (state, action) => {
                    const { groupId, meetup } = action.payload;
                    upsertMeetup(state, groupId, meetup);
                })
                .addCase(thunk.rejected, (state, action) => {
                    state.error = action.payload;
                });
        }
    },
});

export const {
    meetupCreatedRealtime,
    meetupUpdatedRealtime,
    meetupStatusChangedRealtime,
    meetupVotedRealtime,
    clearMeetupError,
} = meetupSlice.actions;

export default meetupSlice.reducer;
