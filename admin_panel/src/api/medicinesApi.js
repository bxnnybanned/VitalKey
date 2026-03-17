import api from "./axios";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getMedicines = async () => {
  const response = await api.get("/admin/medicines", getAuthConfig());
  return response.data;
};

export const createMedicine = async (medicineData) => {
  const response = await api.post(
    "/admin/medicines",
    medicineData,
    getAuthConfig(),
  );

  return response.data;
};

export const updateMedicine = async (medicineId, medicineData) => {
  const response = await api.put(
    `/admin/medicines/${medicineId}`,
    medicineData,
    getAuthConfig(),
  );

  return response.data;
};
