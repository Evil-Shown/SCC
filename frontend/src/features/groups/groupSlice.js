import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as groupService from "../../services/groupService";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchGroups = createAsyncThunk(
    "groups/fetchGroups",
    async (params = {}, { rejectWithValue }) => {
        try {
            const data = await groupService.getGroups(params);
            return data.data || data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch groups");
        }
    }
);

export const fetchGroupById = createAsyncThunk(
    "groups/fetchGroupById",
    async (groupId, { rejectWithValue }) => {
        try {
            const data = await groupService.getGroup(groupId);
            return data.data || data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch group");
        }
    }
);

export const createGroup = createAsyncThunk(
    "groups/createGroup",
    async (groupData, { rejectWithValue }) => {
        try {
            const data = await groupService.createGroup(groupData);
            return data.data || data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create group");
        }
    }
);

export const joinGroup = createAsyncThunk(
    "groups/joinGroup",
    async (groupId, { rejectWithValue }) => {
        try {
            const data = await groupService.joinGroup(groupId);
            return data.data || data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to join group");
        }
    }
);

export const leaveGroupAction = createAsyncThunk(
    "groups/leaveGroup",
    async (groupId, { rejectWithValue }) => {
        try {
            const data = await groupService.leaveGroup(groupId);
            return { groupId, ...data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to leave group");
        }
    }
);

export const removeMember = createAsyncThunk(
    "groups/removeMember",
    async ({ groupId, memberId }, { rejectWithValue }) => {
        try {
            const data = await groupService.removeMember(groupId, memberId);
            return { groupId, memberId, ...data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to remove member");
        }
    }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const groupsSlice = createSlice({
    name: "groups",
    initialState: {
        groups: [],
        currentGroup: null,
        isLoading: false,
        error: null,
        filters: { search: "", myGroups: false },
    },
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentGroup: (state) => {
            state.currentGroup = null;
        },
        updateGroupRealtime: (state, action) => {
            const updated = action.payload;
            const idx = state.groups.findIndex((g) => g._id === updated._id);
            if (idx >= 0) state.groups[idx] = updated;
            if (state.currentGroup?._id === updated._id) state.currentGroup = updated;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchGroups
            .addCase(fetchGroups.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchGroups.fulfilled, (state, action) => {
                state.isLoading = false;
                state.groups = Array.isArray(action.payload) ? action.payload : action.payload.groups || [];
            })
            .addCase(fetchGroups.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // fetchGroupById
            .addCase(fetchGroupById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchGroupById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentGroup = action.payload;
            })
            .addCase(fetchGroupById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // createGroup
            .addCase(createGroup.fulfilled, (state, action) => {
                state.groups.unshift(action.payload);
            })
            .addCase(createGroup.rejected, (state, action) => {
                state.error = action.payload;
            })

            // joinGroup
            .addCase(joinGroup.fulfilled, (state, action) => {
                const updated = action.payload;
                if (updated?._id) {
                    const idx = state.groups.findIndex((g) => g._id === updated._id);
                    if (idx >= 0) state.groups[idx] = updated;
                    else state.groups.unshift(updated);
                }
            })
            .addCase(joinGroup.rejected, (state, action) => {
                state.error = action.payload;
            })

            // leaveGroupAction
            .addCase(leaveGroupAction.fulfilled, (state, action) => {
                const { groupId } = action.payload;
                state.groups = state.groups.filter((g) => g._id !== groupId);
                if (state.currentGroup?._id === groupId) state.currentGroup = null;
            })

            // removeMember
            .addCase(removeMember.fulfilled, (state, action) => {
                const { memberId } = action.payload;
                if (state.currentGroup) {
                    state.currentGroup.members = state.currentGroup.members.filter(
                        (m) => (m.user?._id || m.user) !== memberId
                    );
                }
            });
    },
});

export const { setFilters, clearError, clearCurrentGroup, updateGroupRealtime } =
    groupsSlice.actions;

export default groupsSlice.reducer;
