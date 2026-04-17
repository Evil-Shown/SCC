import api from "./api";

export async function listModules({ year, semester, batchType } = {}) {
  const res = await api.get("/api/modules", { params: { year, semester, batchType } });
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to load modules");
  return res.data.data;
}

export async function createModule(body) {
  const res = await api.post("/api/modules", body);
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to create module");
  return res.data.data;
}

export async function updateModule(id, body) {
  const res = await api.patch(`/api/modules/${id}`, body);
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to update module");
  return res.data.data;
}

export async function deleteModule(id) {
  const res = await api.delete(`/api/modules/${id}`);
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to delete module");
  return res.data.data;
}

