import api from "./axios";

export async function fetchKioskPatient(patientCode) {
  const response = await api.get(`/kiosk/patient/${patientCode}`);
  return response.data;
}

export async function fetchLatestKioskHealthRecord(patientCode) {
  const response = await api.get(`/kiosk/latest-health-record/${patientCode}`);
  return response.data;
}

export async function registerKioskPatient(payload) {
  const response = await api.post("/kiosk/register-basic", payload);
  return response.data;
}

export async function saveKioskHealthRecord(payload) {
  const response = await api.post("/kiosk/save-health-record", payload);
  return response.data;
}
