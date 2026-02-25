import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createKuppiPost,
  getKuppiPosts,
  updateKuppiPost,
  addMeetingLink,
  applyToKuppi,
  getKuppiApplicants,
} from "../../services/kuppiService";

export const fetchKuppiPosts = createAsyncThunk(
  "kuppi/fetchPosts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await getKuppiPosts(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch kuppi posts"
      );
    }
  }
);

export const createKuppiAction = createAsyncThunk(
  "kuppi/createPost",
  async (postData, { rejectWithValue }) => {
    try {
      const data = await createKuppiPost(postData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create kuppi post"
      );
    }
  }
);

export const updateKuppiAction = createAsyncThunk(
  "kuppi/updatePost",
  async ({ postId, postData }, { rejectWithValue }) => {
    try {
      const data = await updateKuppiPost(postId, postData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update kuppi post"
      );
    }
  }
);

export const addMeetingLinkAction = createAsyncThunk(
  "kuppi/addMeetingLink",
  async ({ postId, meetingLink }, { rejectWithValue }) => {
    try {
      const data = await addMeetingLink(postId, meetingLink);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add meeting link"
      );
    }
  }
);

export const applyToKuppiAction = createAsyncThunk(
  "kuppi/apply",
  async (postId, { rejectWithValue }) => {
    try {
      const data = await applyToKuppi(postId);
      return { ...data, postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to apply"
      );
    }
  }
);

export const fetchApplicantsAction = createAsyncThunk(
  "kuppi/fetchApplicants",
  async (postId, { rejectWithValue }) => {
    try {
      const data = await getKuppiApplicants(postId);
      return { ...data, postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch applicants"
      );
    }
  }
);

const kuppiSlice = createSlice({
  name: "kuppi",
  initialState: {
    posts: [],
    pagination: null,
    applicants: {}, // keyed by postId
    loading: false,
    applicantsLoading: false,
    error: null,
    filters: {
      status: "",
      ownerId: "",
    },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { status: "", ownerId: "" };
    },
    addKuppiRealtime: (state, action) => {
      const post = action.payload;
      const exists = state.posts.find((p) => p._id === post._id);
      if (!exists) {
        state.posts.unshift(post);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchKuppiPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKuppiPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchKuppiPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create post
      .addCase(createKuppiAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createKuppiAction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.posts.unshift(action.payload.data);
        }
      })
      .addCase(createKuppiAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update post
      .addCase(updateKuppiAction.fulfilled, (state, action) => {
        if (action.payload.data) {
          const idx = state.posts.findIndex(
            (p) => p._id === action.payload.data._id
          );
          if (idx !== -1) {
            state.posts[idx] = action.payload.data;
          }
        }
      })
      // Add meeting link
      .addCase(addMeetingLinkAction.fulfilled, (state, action) => {
        if (action.payload.data) {
          const idx = state.posts.findIndex(
            (p) => p._id === action.payload.data._id
          );
          if (idx !== -1) {
            state.posts[idx] = action.payload.data;
          }
        }
      })
      // Apply
      .addCase(applyToKuppiAction.fulfilled, (state, action) => {
        const { postId } = action.payload;
        const post = state.posts.find((p) => p._id === postId);
        if (post) {
          post.applicantsCount = (post.applicantsCount || 0) + 1;
          post._hasApplied = true;
        }
      })
      .addCase(applyToKuppiAction.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch applicants
      .addCase(fetchApplicantsAction.pending, (state) => {
        state.applicantsLoading = true;
      })
      .addCase(fetchApplicantsAction.fulfilled, (state, action) => {
        state.applicantsLoading = false;
        const { postId } = action.payload;
        state.applicants[postId] = action.payload.data || [];
      })
      .addCase(fetchApplicantsAction.rejected, (state) => {
        state.applicantsLoading = false;
      });
  },
});

export const { clearError, setFilters, clearFilters, addKuppiRealtime } =
  kuppiSlice.actions;

export default kuppiSlice.reducer;
