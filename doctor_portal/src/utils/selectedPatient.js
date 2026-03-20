const STORAGE_KEY = "doctor_selected_patient_code";

export function getSelectedPatientCode() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setSelectedPatientCode(patientCode) {
  if (!patientCode) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, patientCode);
}

export function clearSelectedPatientCode() {
  localStorage.removeItem(STORAGE_KEY);
}
