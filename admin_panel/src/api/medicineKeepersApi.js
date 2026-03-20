import api from "./axios";

export async function fetchMedicineKeepers() {
  const response = await api.get("/admin/medicine-keepers");
  return response.data;
}

export async function createMedicineKeeper(payload) {
  const response = await api.post("/admin/medicine-keepers", payload);
  return response.data;
}

export async function updateMedicineKeeper(keeperId, payload) {
  const response = await api.put(`/admin/medicine-keepers/${keeperId}`, payload);
  return response.data;
}
