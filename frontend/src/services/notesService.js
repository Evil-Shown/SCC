import api from "./api";

// Notes CRUD
export const createNote = async (noteData) => {
  const response = await api.post("/api/notes", noteData);
  return response.data;
};

export const getNotes = async (params = {}) => {
  const response = await api.get("/api/notes", { params });
  return response.data;
};

export const searchNotes = async (params = {}) => {
  const response = await api.get("/api/notes/search", { params });
  return response.data;
};

// Reactions
export const reactToNote = async ({ noteId, type }) => {
  const response = await api.post("/api/notes/react", { noteId, type });
  return response.data;
};

// Comments
export const addComment = async ({ noteId, commentText }) => {
  const response = await api.post("/api/notes/comment", { noteId, commentText });
  return response.data;
};

export const getComments = async (noteId, params = {}) => {
  const response = await api.get(`/api/notes/${noteId}/comments`, { params });
  return response.data;
};

export default {
  createNote,
  getNotes,
  searchNotes,
  reactToNote,
  addComment,
  getComments,
};
