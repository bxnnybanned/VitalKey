import api from "./axios";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getDashboardSummary = async () => {
  const response = await api.get("/admin/dashboard-summary", getAuthConfig());
  return response.data;
};
