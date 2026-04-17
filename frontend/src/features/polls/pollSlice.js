import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as pollService from "../../services/pollService";

export const fetchGroupPolls = createAsyncThunk(
    "polls/fetchGroupPolls",
    async (groupId, { rejectWithValue }) => {
        try {
            return await pollService.getGroupPolls(groupId);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch polls");
        }
    }
);

export const createPoll = createAsyncThunk(
    "polls/createPoll",
    async ({ groupId, payload }, { rejectWithValue }) => {
        try {
            return await pollService.createPoll(groupId, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create poll");
        }
    }
);

export const voteOnPoll = createAsyncThunk(
    "polls/voteOnPoll",
    async ({ pollId, optionIds }, { rejectWithValue }) => {
        try {
            return await pollService.votePoll(pollId, optionIds);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to vote");
        }
    }
);

export const updateExistingPoll = createAsyncThunk(
    "polls/updateExistingPoll",
    async ({ pollId, payload }, { rejectWithValue }) => {
        try {
            return await pollService.updatePoll(pollId, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update poll");
        }
    }
);

export const deleteExistingPoll = createAsyncThunk(
    "polls/deleteExistingPoll",
    async (pollId, { rejectWithValue }) => {
        try {
            await pollService.deletePoll(pollId);
            return pollId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete poll");
        }
    }
);

const pollSlice = createSlice({
    name: "polls",
    initialState: {
        byGroupId: {}, // { groupId: { items: [], loading: false, error: null } }
    },
    reducers: {
        pollCreatedRealtime(state, action) {
            const poll = action.payload;
            const groupData = state.byGroupId[poll.groupId] || { items: [] };
            if (!groupData.items.find((p) => p._id === poll._id)) {
                groupData.items.unshift(poll);
                state.byGroupId[poll.groupId] = groupData;
            }
        },
        pollUpdatedRealtime(state, action) {
            const updatedPoll = action.payload;
            const groupData = state.byGroupId[updatedPoll.groupId];
            if (groupData) {
                const idx = groupData.items.findIndex((p) => p._id === updatedPoll._id);
                if (idx !== -1) {
                    groupData.items[idx] = updatedPoll;
                }
            }
        },
        pollDeletedRealtime(state, action) {
            const { pollId, groupId } = action.payload;
            const groupData = state.byGroupId[groupId];
            if (groupData) {
                groupData.items = groupData.items.filter((p) => p._id !== pollId);
            }
        },
        pollVotedRealtime(state, action) {
            const updatedPoll = action.payload;
            const groupData = state.byGroupId[updatedPoll.groupId];
            if (groupData) {
                const idx = groupData.items.findIndex((p) => p._id === updatedPoll._id);
                if (idx !== -1) {
                    groupData.items[idx] = updatedPoll;
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGroupPolls.pending, (state, action) => {
                const groupId = action.meta.arg;
                if (!state.byGroupId[groupId]) {
                    state.byGroupId[groupId] = { items: [], loading: true, error: null };
                } else {
                    state.byGroupId[groupId].loading = true;
                }
            })
            .addCase(fetchGroupPolls.fulfilled, (state, action) => {
                const groupId = action.meta.arg;
                state.byGroupId[groupId].loading = false;
                state.byGroupId[groupId].items = action.payload;
                state.byGroupId[groupId].error = null;
            })
            .addCase(fetchGroupPolls.rejected, (state, action) => {
                const groupId = action.meta.arg;
                if (state.byGroupId[groupId]) {
                    state.byGroupId[groupId].loading = false;
                    state.byGroupId[groupId].error = action.payload;
                }
            })
        // create, vote, update usually handled by realtime, but optimistic update possible here
    }
});

export const { pollCreatedRealtime, pollUpdatedRealtime, pollDeletedRealtime, pollVotedRealtime } = pollSlice.actions;
export default pollSlice.reducer;
