import api from "./api";

export async function listResources() {
  const res = await api.get("/api/resources");
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to load resources");
  return res.data.data;
}

export async function createResource(body) {
  const res = await api.post("/api/resources", body);
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to create resource");
  return res.data.data;
}

export async function updateResource(id, body) {
  const res = await api.patch(`/api/resources/${id}`, body);
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to update resource");
  return res.data.data;
}

export async function deleteResource(id) {
  const res = await api.delete(`/api/resources/${id}`);
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to delete resource");
  return res.data.data;
}

export async function deleteAllResources() {
  const res = await api.delete("/api/resources/all");
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to delete all resources");
  return res.data.data;
}

export async function importResourcesFromFile({ file }) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/api/resources/import", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  if (!res.data?.success) throw new Error(res.data?.message || "Failed to import resources");
  return res.data.data; // { created, resources, extractedTextPreview }
}

