const STORAGE_KEY = "doctor_selected_patient_code";
const QUEUE_ITEM_KEY = "doctor_selected_queue_item";

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
  localStorage.removeItem(QUEUE_ITEM_KEY);
}

export function getSelectedQueueItem() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_ITEM_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSelectedQueueItem(queueItem) {
  if (!queueItem) {
    localStorage.removeItem(QUEUE_ITEM_KEY);
    return;
  }

  localStorage.setItem(QUEUE_ITEM_KEY, JSON.stringify(queueItem));
}
