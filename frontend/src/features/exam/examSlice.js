import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // ✅ Use the existing interceptor (adjust path if needed)
import {
    createExam,
    deleteExam,
    generateAiStudyAssistant,
    generateStudyRoadmap,
    getExamOverview,
    getUserExams,
    updateExam,
    updateExamPreparation,
    updateRoadmapDayStatus,
} from '../../services/examService';

export const fetchExamOverview = createAsyncThunk(
    'exam/fetchExamOverview',
    async (_, thunkAPI) => {
        try {
            return await getExamOverview();
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to load exam overview');
        }
    }
);

export const fetchUserExams = createAsyncThunk(
    'exam/fetchUserExams',
    async (_, thunkAPI) => {
        try {
            return await getUserExams();
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to load exams');
        }
    }
);

export const createUserExam = createAsyncThunk(
    'exam/createUserExam',
    async (payload, thunkAPI) => {
        try {
            return await createExam(payload);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to create exam');
        }
    }
);

export const removeUserExam = createAsyncThunk(
    'exam/removeUserExam',
    async (examId, thunkAPI) => {
        try {
            await deleteExam(examId);
            return examId;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to delete exam');
        }
    }
);

export const savePreparationTracker = createAsyncThunk(
    'exam/savePreparationTracker',
    async ({ examId, payload }, thunkAPI) => {
        try {
            return await updateExamPreparation(examId, payload);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to update tracker');
        }
    }
);

export const updateUserExam = createAsyncThunk(
    'exam/updateUserExam',
    async ({ examId, payload }, thunkAPI) => {
        try {
            return await updateExam(examId, payload);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to update exam');
        }
    }
);

export const saveRoadmapDayStatus = createAsyncThunk(
    'exam/saveRoadmapDayStatus',
    async ({ examId, payload }, thunkAPI) => {
        try {
            return await updateRoadmapDayStatus(examId, payload);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to update roadmap day status');
        }
    }
);

export const buildStudyRoadmap = createAsyncThunk(
    'exam/buildStudyRoadmap',
    async (payload, thunkAPI) => {
        try {
            return await generateStudyRoadmap(payload);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to build roadmap');
        }
    }
);

export const buildAiStudyAssistant = createAsyncThunk(
    'exam/buildAiStudyAssistant',
    async (formData, thunkAPI) => {
        try {
            return await generateAiStudyAssistant(formData);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to generate AI study content');
        }
    }
);

// Send request to Backend API to create the Exam Plan
export const createExamPlan = createAsyncThunk(
    'exam/createExamPlan',
    async (formData, thunkAPI) => {
        try {
            const response = await api.post('/api/exams/setup', formData, {
                // 💡 අනිවාර්යයෙන්ම මෙම Header එක තිබිය යුතුයි
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || "Something went wrong");
        }
    }
);

// Study Pilot - Generate Quizzes, Flashcards, Summaries, Mindmaps
export const generateStudyMaterials = createAsyncThunk(
    'exam/generateStudyMaterials',
    async (formData, thunkAPI) => {
        try {
            const response = await api.post('/api/study-pilot/generate', formData, {
                // 💡 අනිවාර්යයෙන්ම මෙම Header එක තිබිය යුතුයි
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || { message: "Network Error - Unable to connect to the server." }
            );
        }
    }
);

const examSlice = createSlice({
    name: 'exam',
    initialState: {
        exams: [],
        overview: null,
        roadmap: null,
        aiAssistant: null,
        upcomingExams: [],
        currentExam: null,
        currentPlan: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentPlan: (state) => {
            state.currentPlan = null;
            state.currentExam = null;
            state.error = null;
        },
        clearAiAssistant: (state) => {
            state.aiAssistant = null;
        },
        clearRoadmap: (state) => {
            state.roadmap = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchExamOverview.fulfilled, (state, action) => {
                state.overview = action.payload;
            })
            .addCase(fetchUserExams.fulfilled, (state, action) => {
                state.exams = action.payload;
            })
            .addCase(createUserExam.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUserExam.fulfilled, (state, action) => {
                state.loading = false;
                state.exams = [...state.exams, action.payload].sort(
                    (a, b) => new Date(a.examDate) - new Date(b.examDate)
                );
            })
            .addCase(createUserExam.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(removeUserExam.fulfilled, (state, action) => {
                state.exams = state.exams.filter((exam) => exam._id !== action.payload);
            })
            .addCase(savePreparationTracker.fulfilled, (state, action) => {
                const idx = state.exams.findIndex((exam) => exam._id === action.payload._id);
                if (idx >= 0) {
                    state.exams[idx] = action.payload;
                }
                if (state.currentExam?._id === action.payload._id) {
                    state.currentExam = action.payload;
                }
            })
            .addCase(updateUserExam.fulfilled, (state, action) => {
                const idx = state.exams.findIndex((exam) => exam._id === action.payload._id);
                if (idx >= 0) {
                    state.exams[idx] = action.payload;
                }
                if (state.currentExam?._id === action.payload._id) {
                    state.currentExam = action.payload;
                }
            })
            .addCase(saveRoadmapDayStatus.fulfilled, (state, action) => {
                const idx = state.exams.findIndex((exam) => exam._id === action.payload._id);
                if (idx >= 0) {
                    state.exams[idx] = action.payload;
                }
                if (state.currentExam?._id === action.payload._id) {
                    state.currentExam = action.payload;
                }
            })
            .addCase(buildStudyRoadmap.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(buildStudyRoadmap.fulfilled, (state, action) => {
                state.loading = false;
                state.roadmap = action.payload;
            })
            .addCase(buildStudyRoadmap.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(buildAiStudyAssistant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(buildAiStudyAssistant.fulfilled, (state, action) => {
                state.loading = false;
                state.aiAssistant = action.payload;
            })
            .addCase(buildAiStudyAssistant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createExamPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createExamPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload.data; 
                state.error = null;
            })
            .addCase(createExamPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentPlan, clearAiAssistant, clearRoadmap } = examSlice.actions;
export default examSlice.reducer;