import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as groupService from "../../services/groupService";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchGroups = createAsyncThunk(
    "groups/fetchGroups",
    async (params = {}, { rejectWithValue }) => {
        try {
            return await groupService.getGroups(params);
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

export const updateGroupAction = createAsyncThunk(
    "groups/updateGroup",
    async ({ groupId, data }, { rejectWithValue }) => {
        try {
            const res = await groupService.updateGroup(groupId, data);
            return res.data || res;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update group");
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

export const changeMemberRoleAction = createAsyncThunk(
    "groups/changeMemberRole",
    async ({ groupId, memberId, role }, { rejectWithValue }) => {
        try {
            const data = await groupService.changeMemberRole(groupId, memberId, role);
            return { groupId, memberId, role, ...data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to change role");
        }
    }
);

// ── Formal invite thunks ──────────────────────────────────

export const sendInviteAction = createAsyncThunk(
    "groups/sendInvite",
    async ({ groupId, payload }, { rejectWithValue }) => {
        try {
            const data = await groupService.sendGroupInvite(groupId, payload);
            return { groupId, invite: data.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to send invite");
        }
    }
);

export const fetchGroupInvites = createAsyncThunk(
    "groups/fetchGroupInvites",
    async (groupId, { rejectWithValue }) => {
        try {
            const data = await groupService.getGroupInvites(groupId);
            return { groupId, invites: data.data || [] };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch invites");
        }
    }
);

export const revokeInviteAction = createAsyncThunk(
    "groups/revokeInvite",
    async ({ groupId, inviteId }, { rejectWithValue }) => {
        try {
            await groupService.revokeGroupInvite(groupId, inviteId);
            return { groupId, inviteId };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to revoke invite");
        }
    }
);

export const fetchMyInvites = createAsyncThunk(
    "groups/fetchMyInvites",
    async (_, { rejectWithValue }) => {
        try {
            const data = await groupService.getMyInvites();
            return data.data || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch invites");
        }
    }
);

export const acceptInviteAction = createAsyncThunk(
    "groups/acceptInvite",
    async (inviteId, { rejectWithValue }) => {
        try {
            const data = await groupService.acceptGroupInvite(inviteId);
            return { inviteId, ...data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to accept invite");
        }
    }
);

export const declineInviteAction = createAsyncThunk(
    "groups/declineInvite",
    async (inviteId, { rejectWithValue }) => {
        try {
            await groupService.declineGroupInvite(inviteId);
            return { inviteId };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to decline invite");
        }
    }
);

// ── Activity log thunks ───────────────────────────────────

export const fetchGroupActivity = createAsyncThunk(
    "groups/fetchActivity",
    async ({ groupId, page = 1, limit = 20 }, { rejectWithValue }) => {
        try {
            const data = await groupService.getGroupActivity(groupId, { page, limit });
            return { groupId, activities: data.data || [], pagination: data.pagination, page };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch activity");
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
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },

        // Invites
        groupInvites: {},    // { [groupId]: invite[] }
        myInvites: [],
        invitesLoading: false,

        // Activity
        activity: {},        // { [groupId]: { items: [], total, page } }
        activityLoading: false,
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
        // Real-time handlers (called from socket.js)
        updateGroupRealtime: (state, action) => {
            const updated = action.payload;
            const idx = state.groups.findIndex((g) => g._id === updated._id);
            if (idx >= 0) state.groups[idx] = updated;
            if (state.currentGroup?._id === updated._id) state.currentGroup = updated;
        },
        memberJoinedRealtime: (state, action) => {
            // Increment the counter optimistically; full data comes from next fetchGroupById
            const { groupId } = action.payload;
            if (state.currentGroup?._id === groupId) {
                state.currentGroup.__memberJoinedAt = Date.now(); // trigger re-fetch signal
            }
        },
        memberLeftRealtime: (state, action) => {
            const { groupId, userId } = action.payload;
            if (state.currentGroup?._id === groupId) {
                state.currentGroup.members = (state.currentGroup.members || []).filter(
                    (m) => (m.user?._id || m.user)?.toString() !== userId?.toString()
                );
            }
        },
        inviteReceivedRealtime: (state, action) => {
            const { invite } = action.payload;
            const alreadyExists = state.myInvites.some((i) => i._id === invite._id);
            if (!alreadyExists) state.myInvites.unshift(invite);
        },
        addActivityRealtime: (state, action) => {
            const { groupId, activity } = action.payload;
            if (!state.activity[groupId]) state.activity[groupId] = { items: [], total: 0 };
            state.activity[groupId].items.unshift(activity);
            state.activity[groupId].total += 1;
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
                const payload = action.payload;
                state.groups = Array.isArray(payload) ? payload : payload.data || [];
                if (payload.pagination) state.pagination = payload.pagination;
            })
            .addCase(fetchGroups.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // fetchGroupById
            .addCase(fetchGroupById.pending, (state) => { state.isLoading = true; })
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

            // updateGroupAction
            .addCase(updateGroupAction.fulfilled, (state, action) => {
                const updated = action.payload;
                if (!updated?._id) return;
                const idx = state.groups.findIndex((g) => g._id === updated._id);
                if (idx >= 0) state.groups[idx] = updated;
                if (state.currentGroup?._id === updated._id) state.currentGroup = updated;
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
            .addCase(joinGroup.rejected, (state, action) => { state.error = action.payload; })

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
            })

            // changeMemberRoleAction
            .addCase(changeMemberRoleAction.fulfilled, (state, action) => {
                const { memberId, role } = action.payload;
                if (state.currentGroup) {
                    const m = state.currentGroup.members.find(
                        (m) => (m.user?._id || m.user)?.toString() === memberId
                    );
                    if (m) m.role = role;
                }
            })

            // fetchGroupInvites (admin panel)
            .addCase(fetchGroupInvites.pending, (state) => { state.invitesLoading = true; })
            .addCase(fetchGroupInvites.fulfilled, (state, action) => {
                const { groupId, invites } = action.payload;
                state.invitesLoading = false;
                state.groupInvites[groupId] = invites;
            })
            .addCase(fetchGroupInvites.rejected, (state) => { state.invitesLoading = false; })

            // sendInvite
            .addCase(sendInviteAction.fulfilled, (state, action) => {
                const { groupId, invite } = action.payload;
                if (!state.groupInvites[groupId]) state.groupInvites[groupId] = [];
                state.groupInvites[groupId].unshift(invite);
            })

            // revokeInvite
            .addCase(revokeInviteAction.fulfilled, (state, action) => {
                const { groupId, inviteId } = action.payload;
                if (state.groupInvites[groupId]) {
                    state.groupInvites[groupId] = state.groupInvites[groupId].filter(
                        (i) => i._id !== inviteId
                    );
                }
            })

            // fetchMyInvites
            .addCase(fetchMyInvites.pending, (state) => { state.invitesLoading = true; })
            .addCase(fetchMyInvites.fulfilled, (state, action) => {
                state.invitesLoading = false;
                state.myInvites = action.payload;
            })
            .addCase(fetchMyInvites.rejected, (state) => { state.invitesLoading = false; })

            // acceptInvite
            .addCase(acceptInviteAction.fulfilled, (state, action) => {
                const { inviteId } = action.payload;
                state.myInvites = state.myInvites.filter((i) => i._id !== inviteId);
            })

            // declineInvite
            .addCase(declineInviteAction.fulfilled, (state, action) => {
                const { inviteId } = action.payload;
                state.myInvites = state.myInvites.filter((i) => i._id !== inviteId);
            })

            // fetchGroupActivity
            .addCase(fetchGroupActivity.pending, (state) => { state.activityLoading = true; })
            .addCase(fetchGroupActivity.fulfilled, (state, action) => {
                state.activityLoading = false;
                const { groupId, activities, pagination, page } = action.payload;
                if (!state.activity[groupId] || page === 1) {
                    state.activity[groupId] = { items: activities, total: pagination?.total || 0 };
                } else {
                    // Append for "load more"
                    state.activity[groupId].items.push(...activities);
                }
            })
            .addCase(fetchGroupActivity.rejected, (state) => { state.activityLoading = false; });
    },
});

export const {
    setFilters,
    clearError,
    clearCurrentGroup,
    updateGroupRealtime,
    memberJoinedRealtime,
    memberLeftRealtime,
    inviteReceivedRealtime,
    addActivityRealtime,
} = groupsSlice.actions;

// Selectors
export const selectGroups = (state) => state.groups.groups;
export const selectCurrentGroup = (state) => state.groups.currentGroup;
export const selectGroupsLoading = (state) => state.groups.isLoading;
export const selectGroupInvites = (groupId) => (state) => state.groups.groupInvites[groupId] || [];
export const selectMyInvites = (state) => state.groups.myInvites;
export const selectGroupActivity = (groupId) => (state) => state.groups.activity[groupId] || { items: [], total: 0 };
export const selectActivityLoading = (state) => state.groups.activityLoading;

export default groupsSlice.reducer;
