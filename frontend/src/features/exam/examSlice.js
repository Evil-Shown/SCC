import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; //  axios instance 

// Send request to Backend API to create the Exam Plan
export const createExamPlan = createAsyncThunk(
    'exam/createExamPlan',
    async (formData, thunkAPI) => {
        try {
            const response = await api.post('/api/exams/setup', formData);

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
                // 💡 HEADER MUST
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
        upcomingExams: [],
        currentExam: null,
        currentPlan: null,
        studyMaterials: [], // අලුතින් එකතු කළ State (AI මගින් එන Quiz/Flashcards ආදිය)
        currentStudyMaterial: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentPlan: (state) => {
            state.currentPlan = null;
            state.currentExam = null;
            state.error = null;
        },
        clearCurrentStudyMaterial: (state) => {
            state.currentStudyMaterial = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Exam Plan Generation States
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
            })
            // Study Pilot Generation States
            .addCase(generateStudyMaterials.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentStudyMaterial = null;
            })
            .addCase(generateStudyMaterials.fulfilled, (state, action) => {
                state.loading = false;
                state.currentStudyMaterial = action.payload.data;
                state.studyMaterials.push(action.payload.data);
                state.error = null;
            })
            .addCase(generateStudyMaterials.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentPlan, clearCurrentStudyMaterial } = examSlice.actions;
export default examSlice.reducer;