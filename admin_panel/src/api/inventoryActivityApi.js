import api from "./axios";

export async function fetchInventoryActivity(params = {}) {
  const response = await api.get("/admin/inventory-activity", { params });
  return response.data;
}
