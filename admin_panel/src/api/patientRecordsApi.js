import api from "./axios";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getPatients = async (search = "") => {
  const response = await api.get("/admin/patients", {
    ...getAuthConfig(),
    params: { search },
  });

  return response.data;
};

export const getPatientRecord = async (patientCode) => {
  const response = await api.get(
    `/admin/patients/${patientCode}`,
    getAuthConfig(),
  );

  return response.data;
};
