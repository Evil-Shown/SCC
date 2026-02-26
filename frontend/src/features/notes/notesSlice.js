import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createNote,
  getNotes,
  searchNotes,
  reactToNote,
  addComment,
  getComments,
} from "../../services/notesService";

// Async thunks
export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await getNotes(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notes"
      );
    }
  }
);

export const searchNotesAction = createAsyncThunk(
  "notes/searchNotes",
  async (params, { rejectWithValue }) => {
    try {
      const data = await searchNotes(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search notes"
      );
    }
  }
);

export const createNoteAction = createAsyncThunk(
  "notes/createNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const data = await createNote(noteData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create note"
      );
    }
  }
);

export const reactToNoteAction = createAsyncThunk(
  "notes/reactToNote",
  async ({ noteId, type }, { rejectWithValue }) => {
    try {
      const data = await reactToNote({ noteId, type });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to react"
      );
    }
  }
);

export const addCommentAction = createAsyncThunk(
  "notes/addComment",
  async ({ noteId, commentText }, { rejectWithValue }) => {
    try {
      const data = await addComment({ noteId, commentText });
      return { ...data, noteId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
      );
    }
  }
);

export const fetchCommentsAction = createAsyncThunk(
  "notes/fetchComments",
  async ({ noteId, params = {} }, { rejectWithValue }) => {
    try {
      const data = await getComments(noteId, params);
      return { ...data, noteId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch comments"
      );
    }
  }
);

const notesSlice = createSlice({
  name: "notes",
  initialState: {
    notes: [],
    pagination: null,
    comments: {}, // keyed by noteId
    loading: false,
    commentsLoading: false,
    error: null,
    searchQuery: "",
    filters: {
      subject: "",
      year: "",
      tag: "",
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
      state.filters = { subject: "", year: "", tag: "" };
      state.searchQuery = "";
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    addNoteRealtime: (state, action) => {
      const note = action.payload;
      const exists = state.notes.find((n) => n._id === note._id);
      if (!exists) {
        state.notes.unshift(note);
      }
    },
    updateNoteReaction: (state, action) => {
      const { noteId, reactionsCount } = action.payload;
      const note = state.notes.find((n) => n._id === noteId);
      if (note) {
        note.reactionsCount = reactionsCount;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search notes
      .addCase(searchNotesAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchNotesAction.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
        state.searchQuery = action.payload.searchQuery || "";
      })
      .addCase(searchNotesAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create note
      .addCase(createNoteAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNoteAction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.notes.unshift(action.payload.data);
        }
      })
      .addCase(createNoteAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // React to note
      .addCase(reactToNoteAction.fulfilled, (state, action) => {
        if (action.payload.data) {
          const { noteId, reactionsCount } = action.payload.data;
          const note = state.notes.find((n) => n._id === noteId);
          if (note) {
            note.reactionsCount = reactionsCount;
            note._userReaction = action.payload.data.userReaction;
          }
        }
      })
      // Add comment
      .addCase(addCommentAction.fulfilled, (state, action) => {
        const { noteId } = action.payload;
        if (!state.comments[noteId]) {
          state.comments[noteId] = [];
        }
        if (action.payload.data) {
          state.comments[noteId].unshift(action.payload.data);
        }
        // Increment comment count
        const note = state.notes.find((n) => n._id === noteId);
        if (note) {
          note.commentsCount = (note.commentsCount || 0) + 1;
        }
      })
      // Fetch comments
      .addCase(fetchCommentsAction.pending, (state) => {
        state.commentsLoading = true;
      })
      .addCase(fetchCommentsAction.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { noteId } = action.payload;
        state.comments[noteId] = action.payload.data || [];
      })
      .addCase(fetchCommentsAction.rejected, (state) => {
        state.commentsLoading = false;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSearchQuery,
  addNoteRealtime,
  updateNoteReaction,
} = notesSlice.actions;

export default notesSlice.reducer;
