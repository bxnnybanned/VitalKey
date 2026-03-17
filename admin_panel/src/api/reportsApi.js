import api from "./axios";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getPatientVisitsReport = async () => {
  const response = await api.get(
    "/admin/reports/patient-visits",
    getAuthConfig(),
  );

  return response.data;
};

export const getDailyPatientVisitsReport = async () => {
  const response = await api.get(
    "/admin/reports/patient-visits/daily",
    getAuthConfig(),
  );

  return response.data;
};

export const getWeeklyPatientVisitsReport = async () => {
  const response = await api.get(
    "/admin/reports/patient-visits/weekly",
    getAuthConfig(),
  );

  return response.data;
};

export const getMonthlyPatientVisitsReport = async () => {
  const response = await api.get(
    "/admin/reports/patient-visits/monthly",
    getAuthConfig(),
  );

  return response.data;
};

export const getMedicineUsageReport = async () => {
  const response = await api.get(
    "/admin/reports/medicine-usage",
    getAuthConfig(),
  );

  return response.data;
};

export const getReportsSummary = async () => {
  const response = await api.get("/admin/reports/summary", getAuthConfig());

  return response.data;
};
