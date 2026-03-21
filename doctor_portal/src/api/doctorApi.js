import api from "./axios";

export async function loginDoctor(payload) {
  const response = await api.post("/doctor/login", payload);
  return response.data;
}

export async function fetchTodayPatients(doctorId) {
  const response = await api.get(`/doctor/today-patients/${doctorId}`);
  return response.data;
}

export async function fetchPatientDetails(patientCode) {
  const response = await api.get(`/doctor/patient-details/${patientCode}`);
  return response.data;
}

export async function saveConsultation(payload) {
  const response = await api.post("/doctor/save-consultation", payload);
  return response.data;
}

export async function completeConsultation(payload) {
  const response = await api.post("/doctor/complete-consultation", payload);
  return response.data;
}

export async function fetchMedicines() {
  const response = await api.get("/medicines");
  return response.data;
}

export async function createPrescription(payload) {
  const response = await api.post("/doctor/create-prescription", payload);
  return response.data;
}
