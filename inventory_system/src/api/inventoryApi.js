import api from "./axios";

export async function loginInventoryKeeper(payload) {
  const response = await api.post("/inventory/login", payload);
  return response.data;
}

export async function fetchInventorySummary() {
  const response = await api.get("/inventory/dashboard-summary");
  return response.data;
}

export async function fetchInventoryPrescriptions() {
  const response = await api.get("/inventory/prescriptions");
  return response.data;
}

export async function updatePrescriptionStatus(prescriptionId, payload) {
  const response = await api.put(
    `/inventory/prescriptions/${prescriptionId}/status`,
    payload,
  );
  return response.data;
}

export async function fetchInventoryRequests() {
  const response = await api.get("/inventory/medicine-requests");
  return response.data;
}

export async function updateInventoryRequestStatus(requestId, payload) {
  const response = await api.put(
    `/inventory/medicine-requests/${requestId}/status`,
    payload,
  );
  return response.data;
}

export async function fetchInventoryAlerts() {
  const response = await api.get("/inventory/alerts");
  return response.data;
}

export async function fetchInventoryTransactions() {
  const response = await api.get("/inventory/transaction-history");
  return response.data;
}

export async function fetchInventoryMedicines() {
  const response = await api.get("/inventory/medicines");
  return response.data;
}

export async function createInventoryMedicine(payload) {
  const response = await api.post("/inventory/medicines", payload);
  return response.data;
}

export async function updateInventoryMedicine(medicineId, payload) {
  const response = await api.put(`/inventory/medicines/${medicineId}`, payload);
  return response.data;
}

export async function deleteInventoryMedicine(medicineId, keeperId) {
  const response = await api.delete(`/inventory/medicines/${medicineId}`, {
    params: { keeper_id: keeperId },
  });
  return response.data;
}

export async function fetchInventoryReportSummary() {
  const response = await api.get("/inventory/reports/summary");
  return response.data;
}

export async function fetchInventoryMedicineUsage() {
  const response = await api.get("/inventory/reports/medicine-usage");
  return response.data;
}

export async function fetchInventoryDailyDispensing() {
  const response = await api.get("/inventory/reports/daily-dispensing");
  return response.data;
}
