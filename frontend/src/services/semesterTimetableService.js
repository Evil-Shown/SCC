import api from "./api";

function toUserError(error, fallbackMessage) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;
  return new Error(message);
}

export async function generateSemesterTimetable({ year, semester, batchType, config } = {}) {
  try {
    const res = await api.post("/api/semester-timetables/generate", { year, semester, batchType, config });
    if (!res.data?.success) throw new Error(res.data?.message || "Failed to generate timetable");
    return res.data.data;
  } catch (error) {
    throw toUserError(error, "Failed to generate timetable");
  }
}

export async function searchSemesterTimetables({ year, semester, batchType } = {}) {
  try {
    const res = await api.get("/api/semester-timetables", { params: { year, semester, batchType } });
    if (!res.data?.success) throw new Error(res.data?.message || "Failed to search timetables");
    return res.data.data;
  } catch (error) {
    throw toUserError(error, "Failed to search timetables");
  }
}

export async function getSemesterTimetable(id) {
  try {
    const res = await api.get(`/api/semester-timetables/${id}`);
    if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch timetable");
    return res.data.data; // { timetable, slots }
  } catch (error) {
    throw toUserError(error, "Failed to fetch timetable");
  }
}

export async function deleteSemesterTimetable(id) {
  try {
    const res = await api.delete(`/api/semester-timetables/${id}`);
    if (!res.data?.success) throw new Error(res.data?.message || "Failed to delete timetable");
    return res.data.data;
  } catch (error) {
    throw toUserError(error, "Failed to delete timetable");
  }
}

export async function addSlot(timetableId, body) {
  try {
    const res = await api.post(`/api/semester-timetables/${timetableId}/slots`, body);
    if (!res.data?.success) throw new Error(res.data?.message || "Failed to add slot");
    return res.data.data;
  } catch (error) {
    throw toUserError(error, "Failed to add slot");
  }
}

export async function updateSlot(timetableId, slotId, body) {
  try {
    const res = await api.patch(`/api/semester-timetables/${timetableId}/slots/${slotId}`, body);
    if (!res.data?.success) throw new Error(res.data?.message || "Failed to update slot");
    return res.data.data;
  } catch (error) {
    throw toUserError(error, "Failed to update slot");
  }
}

export async function deleteSlot(timetableId, slotId) {
  try {
    const res = await api.delete(`/api/semester-timetables/${timetableId}/slots/${slotId}`);
    if (!res.data?.success) throw new Error(res.data?.message || "Failed to delete slot");
    return res.data.data;
  } catch (error) {
    throw toUserError(error, "Failed to delete slot");
  }
}

